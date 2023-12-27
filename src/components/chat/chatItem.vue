<template>
  <div>
    <message v-for="msg in messageList"
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
  },
  data() {
    return {
      page: 0,
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

    async getHistory(start, limit) {
      return await this.DB.queryRange('History', start, limit)
    },

    putHistory(message) {
      this.DB.add('History', message)
    },

    async makeConnection() {
      this.$store.dispatch('wsConnect', {
        "groupID": this.group,
        "uuid": this.$store.state["account"]
      })
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
          this.messageList.push(newVal)
          const storage = {
            time: newVal["time"],
            type: newVal["type"],
            senderID: newVal["senderID"],
            snederKey: newVal["senderKey"],
            payload: newVal["payload"],
          }
          this.putHistory(storage)
        }
      }
    }
  },

  async mounted() {
    await this.buildOrGetDB()
    const history = await this.getHistory(0, 5)
    console.log(history)
    history.forEach(async (msg) => {
      const x = await queryInfo("Account", msg["senderKey"], msg["senderID"])
      this.messageList.push({...x, ...msg}) 
    })
    await this.makeConnection()
  },
  components: {
    message
  }
}
</script>

<style></style>