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
      :admin="admin"></message>
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
      const db = new Dexie(this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DB = new dbCRUD(db)
    },

    async getHistory() {
      const history = await this.DB.queryRange('History', this.page * this.step, this.step)
      history.forEach(async (msg) => {
        const info = await queryInfo("Account", msg["senderKey"], msg["uuid"])
        const { senderID: _1, senderKey: _2, group: _3, ...message } = { ...info, ...msg }  // 排除某些属性
        this.messageList.unshift(message)
      })
      this.page += 1
    },

    async onScroll() {
      if (this.$refs.messageView.scrollTop <= 30) {
        this.getHistory()
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
          // 排除某些属性
          const { senderID: _1, senderKey: _2, group: _3, ...message } = newVal
          const { avatar: _a, userName: _b, group: _c, senderID: _d, ...storage } = newVal
          this.messageList.push(message)
          this.putHistory(storage)
          // this.$nextTick(function () {
          //   this.$refs.messageView.scrollTop = this.$refs.messageView.scrollHeight
          // })
        }
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