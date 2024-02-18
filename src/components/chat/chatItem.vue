<template>
  <div @scroll="onScroll" ref="messageView">
    <message v-for="msg in messageList" :key="msg['time']"
      :time="msg['time']"
      :type="msg['type']"
      :avatar="msg['avatar']"
      :uuid="msg['uuid']"
      :userName="msg['userName']"
      :payload="msg['payload']"
      :owner="owner"
      :admin="admin"
      @deleteMsg="deleteMsg"
      @forwardMsg="forwardMsg"
      @revokeMsg="revokeMsg"></message>
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
    owner: Object,
    admin: Map,
    active: Boolean,
  },
  data() {
    return {
      page: 0,
      step: 10,
      messageList: []
    }
  },

  methods: {
    async buildOrGetDB() {
      const db = new Dexie(this.$store.state['account'] + '-' + this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DB = new dbCRUD(db)
    },

    async getHistory() {
      const history = await this.DB.queryRange('History', this.page * this.step, this.step, true)
      for (const msg of history) {
        const info = await queryInfo("Account", msg["senderKey"], msg["uuid"])
        const { senderID: _1, senderKey: _2, group: _3, ...message } = { ...info, ...msg }  // 排除某些属性
        this.messageList.unshift(message)
      }
      this.page += 1
    },

    async onScroll() {
      if (this.$refs.messageView.scrollTop <= 50) {
        await this.getHistory()
      }
    },

    async makeConnection() {
      this.$store.dispatch('wsConnect', {
        "groupID": this.group,
        "uuid": this.$store.state["account"]
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

    forwardMsg(payload) {
      this.$emit('forwardMsg', payload)
    },

    revokeMsg(time) {
      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        "group": this.group,
        "type": 'revoke',
        "payload": time,
      }))
    },

  },

  computed: {
    newMessage() {
      return this.$store.state[this.group]
    },
  },

  watch: {
    newMessage: {
      async handler(newVal) {
        if (newVal) {
          localStorage.setItem('lastMessage', newVal["time"])

          if (newVal['type'] === 'revoke') {
            const revokeID = newVal['payload']
            const revokeMsg = await this.DB.query('History', { "time": revokeID })
            const revokePayload = `${newVal['userName']} 撤回了一条${revokeMsg['uuid'] === newVal['uuid'] ? '' : '成员'}消息`

            revokeMsg['type'] = 'revoke'
            revokeMsg['payload'] = revokePayload
            await this.DB.update('History', revokeMsg)

            const idx = this.messageList.findIndex(i => i.time === revokeID)
            if (idx != -1) {
              this.messageList[idx]['type'] = 'revoke'
              this.messageList[idx]['payload'] = revokePayload
            }
            return
          }

          // 排除某些属性
          const { senderID: _1, senderKey: _2, group: _3, ...message } = newVal
          const { avatar: _a, userName: _b, group: _c, senderID: _d, ...storage } = newVal

          this.messageList.push(message)
          this.putHistory(storage)

          if (newVal["uuid"] === this.$store.state["account"] && newVal['type'] != 'revoke') {
            this.$nextTick(() => {
              requestAnimationFrame(() => {
                this.$refs.messageView.scrollTop = this.$refs.messageView.scrollHeight
              })
            })
          }

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
  },

  async mounted() {
    await this.buildOrGetDB()
    await this.getHistory()
    await this.makeConnection()
  },

  components: {
    message
  }
}
</script>

<style></style>