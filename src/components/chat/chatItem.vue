<template>
  <div @scroll="onScroll" ref="messageView">
    <message v-for="msg in messageList" :key="msg.time"
      :group="group"
      :message="msg"
      :admins="admins"
      @deleteMsg="deleteMsg"
      @revokeMsg="revokeMsg"></message>
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
  },
  data() {
    return {
      switch: false,  // 防止onScroll同一时间反复触发getHistory
      page: 0,
      step: 10,
      messageList: []
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

    async onScroll() {
      if (this.$refs.messageView.scrollTop <= 50 && !this.switch) {
        this.switch = true
        await this.getHistory()
      }
    },

    async makeConnection() {
      this.$store.dispatch('wsConnect', {
        "groupID": this.group,
        "uuid": this.$store.state["account"]
      })
    },

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

    putHistory(message) {
      this.DB.add('History', message)
    },

    deleteMsg(time) {
      const idx = this.messageList.findIndex(i => i.time === time)
      this.DB.delete("History", "time", time)
      this.messageList.splice(idx, 1)
    },

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

    revokeMsg(time) {
      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        "type": 'revoke',
        "payload": {
          name: null,
          size: null,
          content: time,
        },
      }))
    },

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

    isAtMeHandler(message) {
      const account = this.$store.state.account
      const atList = message.payload.meta ? message.payload.meta.at : []
      if (atList.includes(account)) {
        this.$store.dispatch("getGroupAttention", {
          type: "at",
          group: this.group,
        })
      }
    },

  },

  computed: {
    newMessage() {
      return this.$store.state[this.group]
    },
  },

  watch: {
    newMessage: {
      async handler(message) {
        if (!message) { return }

        if (message.type === 'revoke') {
          this.newRevokeHandler(message)
          return
        }

        this.isAtMeHandler(message)

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

    messageList: {
      deep: true,
      handler() {
        this.$store.dispatch('lastMessage', {
          group: this.group,
          payload: this.messageList.slice(-1)[0]
        })
      }
    },

    active: {
      handler() {
        this.$nextTick(function () {
          this.$refs.messageView.scrollTop = this.$refs.messageView.scrollHeight
        })
      }
    },

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
    await this.makeConnection()
    this.getGroupRequests()
  },

  components: {
    message
  }
}
</script>

<style></style>