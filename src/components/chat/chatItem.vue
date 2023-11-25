<template>
    <div>{{ groupID }}</div>
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

    }
  },
  methods: {
    wsSend() {
      this.$store.state.wsConnections[this.groupID].send(JSON.stringify({
        "group": this.groupID,
        "payload": "原神,启动!",
      }))
    }
  },
  mounted() {

  }
}
</script>

<style>

</style>