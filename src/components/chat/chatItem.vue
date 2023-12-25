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
import message from './message.vue'

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
      messageList: []
    }
  },

  methods: {
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
        }
      }
    }
  },

  async mounted() {
    await this.makeConnection()
  },
  components: {
    message
  }
}
</script>

<style></style>