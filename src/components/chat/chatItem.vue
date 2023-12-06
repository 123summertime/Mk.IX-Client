<template>
  <div>
    <div>{{ name }}</div>
    <div>
      <message v-for="msg in messageList" :time="msg['time']" :type="msg['type']" :avatar="msg['avatar']"
        :uuid="msg['uuid']" :userName="msg['userName']" :payload="msg['payload']"></message>
    </div>
  </div>
</template>

<script>
import { queryInfo } from '../../assets/queryDB.js'
import message from './message.vue'

export default {
  props: {
    avatar: String,
		group: String,
		name: String,
  },
  data() {
    return {
      messageList: []
    }
  },

  methods: {
    wsSend() {
      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        "group": this.group,
        "payload": "启动",
      }))
    }
  },

  computed: {
    newMessage() {
      return this.$store.state[this.group]
    },
  },

  watch: {
    newMessage: {
      immediate: false,
      async handler(newVal) {
        const data = JSON.parse(newVal)
        const fullData = await queryInfo("Account", data["senderKey"], data["senderID"])
        fullData["time"] = data["time"]
        fullData["type"] = data["type"]
        fullData["payload"] = data["payload"]
        console.log(fullData)
        this.messageList.push(fullData)
      }
    }
  },

  mounted() {

  },
  components: {
    message
  }
}
</script>

<style></style>