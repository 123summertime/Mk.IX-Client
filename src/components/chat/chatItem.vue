<template>
  <div>
    <message v-for="msg in messageList" :time="msg['time']" :type="msg['type']" :avatar="msg['avatar']"
      :uuid="msg['uuid']" :userName="msg['userName']" :payload="msg['payload']"></message>
  </div>
</template>

<script>
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
        this.messageList.push(newVal)
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