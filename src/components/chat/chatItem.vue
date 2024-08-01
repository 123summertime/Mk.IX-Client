<template>
  <div class="chatItemRoot" @scroll="onScroll" ref="messageView">
    <div>
      <message v-for="msg in messageList" :key="msg.time" ref='MessageList'
        :group="group"
        :message="msg"
        :admins="admins"
        @deleteMsg="deleteMsg"
        @revokeMsg="revokeMsg"></message>
    </div>
    <div class="attentionButton" v-if="attentionVisible" @click="gotoAttention">
      <p>{{ attentionContent }}</p>
    </div>
  </div>
</template>

<script>
import Dexie from 'dexie'
import axios from 'axios'

import message from './message.vue'

import { dbCRUD } from '../../assets/dbCRUD.js'
import { queryInfo } from '../../assets/queryDB.js'

export default {
  props: {
    avatar: String,
    group: String,
    name: String,
    admins: Object,
    active: Boolean,
    deleted: Boolean,
    available: Boolean,
  },
  data() {
    return {
      switch: false,  // 防止onScroll同一时间反复触发getHistory
      page: 0,
      step: 10,
      messageList: [],
      attentionVisible: false,
      attentionTarget: "",
      attentionContent: "",
    }
  },

  methods: {
    buildOrGetDB() {
      const db = new Dexie(this.$store.state['account'] + '-' + this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DBroot = db
      this.DB = new dbCRUD(db)
    },

    async getHistory() {
      const history = await this.DB.queryRange('History', this.page * this.step, this.step, true)
      for (const msg of history) {
        const info = await queryInfo("Account", null, msg.uuid)
        const message = {
          time: msg.time,
          type: msg.type,
          uuid: msg.uuid,
          payload: msg.payload,
          avatar: info.avatar,
          userName: info.userName,
        }
        this.messageList.unshift(message)
      }
      this.switch = false
      this.page += 1
    },

    // 快滚动到顶时，获取更早的历史记录
    async onScroll() {
      if (this.$refs.messageView.scrollTop <= 50 && !this.switch) {
        this.switch = true
        await this.getHistory()
      }
    },

    // 建立ws连接
    async makeConnection() {
      this.$store.dispatch('wsConnect', {
        groupID: this.group,
        uuid: this.$store.state.account
      })
    },

    // 获取群验证，仅作用于群主和管理员
    getGroupRequests() {
      const account = this.$store.state.account
      if (!(this.admins.owner[account] || this.admins.admin[account])) { return }

      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/verify/request`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        // 结果会通过wsSys发送 sysMsgGetter.vue将对其作处理
      }).catch(err => {
        ElMessage({
          message: `在获取${this.name}的群验证时发送错误 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 新增历史记录
    putHistory(message) {
      this.DB.add('History', message)
    },

    // 删除一条消息(本地)
    deleteMsg(time) {
      const idx = this.messageList.findIndex(i => i.time === time)
      this.DB.delete("History", "time", time)
      this.messageList.splice(idx, 1)
    },

    // 删除所有消息(本地)
    deleteAll() {
      this.DBroot.delete().then(() => {
        this.messageList = []
        ElMessage.success("清空聊天记录成功")
      }).catch(err => {
        ElMessage({
          message: '删除失败',
          duration: 6000,
          type: "error",
        })
      })
    },

    // 撤回一条消息
    revokeMsg(time) {
      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        type: 'revoke',
        payload: {
          name: null,
          size: null,
          content: time,
        },
      }))
    },

    // 其他用户撤回了一条消息
    async newRevokeHandler(message) {
      const revokeID = message.payload.content
      const revokeMsg = await this.DB.query('History', { "time": revokeID })
      const newPayload = {
        name: null,
        size: null,
        content: `${message.userName} 撤回了一条${revokeMsg.uuid === message.uuid ? '' : '成员'}消息`,
        meta: null,
      }

      revokeMsg.type = 'revoke'
      revokeMsg.payload = newPayload
      await this.DB.update('History', revokeMsg)

      const idx = this.messageList.findIndex(i => i.time === revokeID)
      if (idx != -1) {
        this.messageList[idx].type = 'revoke'
        this.messageList[idx].payload = newPayload
      }
    },

    // 其他用户@你
    newAttentionHandler(message) {
      const account = this.$store.state.account
      const atList = message.payload.meta ? message.payload.meta.at : []
      if (atList.includes(account)) {
        this.attentionVisible = true,
        this.attentionTarget = message.time
        this.attentionContent = "有人@你"
        this.$store.dispatch("getGroupAttention", {
          type: "at",
          group: this.group,
        })
      }
    },

    // 点击"有人@你"后, 滚动到该消息处
    async gotoAttention() {
      this.attentionVisible = false
      const ref = this.$refs.MessageList
      const idx = ref.findIndex(i => i.message.time === this.attentionTarget)

      if (idx == -1) { return }

      if (this.attentionTarget === this.messageList[0].time) {
        // 如果滚动到的是messageList的第一条消息，onScroll会触发getHistory导致滚动不准确
        // 所以在滚动前先getHistory一次
        await this.getHistory() 
      }

      const element = ref[idx].$el
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      element.classList.add('flash')  // 闪烁动画
      setTimeout(() => {
        element.classList.remove('flash')
      }, 2000)
    }

  },

  computed: {
    newMessage() {
      return this.$store.state[this.group]
    },
  },

  watch: {
    // 获取该群最新消息
    newMessage: {
      async handler(message) {
        if (!message) { return }

        if (message.type === 'revoke') {
          this.newRevokeHandler(message)
          return
        }

        this.newAttentionHandler(message)

        const storage = {
          time: message.time,
          type: message.type,
          uuid: message.uuid,
          payload: JSON.parse(JSON.stringify(message.payload))
        }
        this.messageList.push(message)
        this.putHistory(storage)

        if (message.uuid === this.$store.state.account) {
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              this.$refs.messageView.scrollTop = this.$refs.messageView.scrollHeight
            })
          })
        }
      }
    },

    // 更新本群最后一条消息，groupItem要用
    messageList: {
      deep: true,
      handler() {
        this.$store.dispatch('lastMessage', {
          group: this.group,
          payload: this.messageList.slice(-1)[0]
        })
      }
    },

    // 切换群后，自动滚动到最底部
    active: {
      handler() {
        this.$nextTick(function () {
          this.$refs.messageView.scrollTop = this.$refs.messageView.scrollHeight
        })
      }
    },

    // 清除历史记录
    deleted: {
      handler(newVal) {
        if (newVal) {
          this.deleteAll()
        }
      }
    }
  },

  async mounted() {
    this.buildOrGetDB()
    await this.getHistory()
    if (this.available) {
      await this.makeConnection()
      this.getGroupRequests()
    }
  },

  components: {
    message
  }
}
</script>

<style>
.chatItemRoot {
  overflow: scroll;
}

.chatItemRoot::-webkit-scrollbar {
  display: none;
}

.attentionButton {
  position: fixed;
  top: 25%;
  right: 0px;
  height: 48px;
  padding: 8px 20px 8px 32px;
  border-top-left-radius: 24px;
  border-bottom-left-radius: 24px;
  background-color: aliceblue;
  cursor: pointer;
}

.attentionButton p {
  height: 100%;
  font-size: 1.25rem;
  line-height: 32px;
}

@keyframes flash {
  0% {
    background-color: transparent;
  }

  50% {
    background-color: #8b658f;
  }

  100% {
    background-color: transparent;
  }
}

.flash {
  animation: flash 0.6s ease-in-out 2;
}
</style>