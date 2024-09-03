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
    available: Boolean,
  },

  data() {
    return {
      lock: false,  // 防止onScroll同一时间反复触发getHistory
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
      const db = new Dexie(this.$store.state.account + '-' + this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DB = new dbCRUD(db)
      this.$store.dispatch("buildGroupDB", {
        group: this.group,
        db: this.DB,
      })
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
      this.lock = false
      this.page += 1
    },

    // 快滚动到顶时，获取更早的历史记录
    async onScroll() {
      const threshold = 50
      if (this.$refs.messageView.scrollTop <= threshold && !this.lock) {
        this.lock = true
        await this.getHistory()
      }
    },

    // 建立这个群的ws连接
    async makeConnection() {
      const uuid = this.$store.state.account
      this.$store.dispatch('wsConnect', {
        groupID: this.group,
        uuid: uuid,
        admin: this.admins.owner[uuid] || this.admins.admin[uuid] ? true : false,
      })
    },

    // 新增一条历史记录(本地)
    putHistory(message) {
      this.DB.add('History', message)
    },

    // 删除一条历史记录(本地)
    deleteMsg(time) {
      this.DB.delete("History", "time", time)
      const idx = this.messageList.findIndex(i => i.time === time)
      this.messageList.splice(idx, 1)
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

    // 其他用户撤回了一条消息，修改历史记录
    async newRevokeHandler(message) {
      const revokeID = message.payload.content
      const revokeMsg = await this.DB.query('History', { time: revokeID })
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
      if (atList && atList.includes(account)) {
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
    // 从Vuex中获取该群最新消息，加入messageList并存储
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
        
        // 如果是自己发的，自动滚动到底
        if (message.uuid === this.$store.state.account) {
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              this.$refs.messageView.scrollTop = this.$refs.messageView.scrollHeight
            })
          })
        }
      }
    },

    // 更新本群最后一条消息，groupItem.vue要用
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

  },

  async mounted() {
    this.buildOrGetDB()
    await this.getHistory()
    if (this.available) {
      await this.makeConnection()
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