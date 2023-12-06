<template>
  <div>{{ groupID }}</div>
  <div>{{ messageList }}</div>
  <div></div>
  <button @click="wsSend">sent</button>
</template>

<script>
export default {
  props: {
    groupID: String
  },
  data() {
    return {
      messageList: []
    }
  },

  methods: {
    wsSend() {
      this.$store.state.wsConnections[this.groupID].send(JSON.stringify({
        "group": this.groupID,
        "payload": "启动",
      }))
    }
  },

  computed: {
    newMessage() {
      return this.$store.state[this.groupID]
    }
  },

  watch: {
    // newMessage: {
    //   immediate: false,
    //   handler(nval, oval) {
    //     if (nval != oval) {
    //       this.messageList.push(JSON.parse(nval))
    //     }
    //   }
    // }
  },

  mounted() {

  }
}
</script>

<style></style>