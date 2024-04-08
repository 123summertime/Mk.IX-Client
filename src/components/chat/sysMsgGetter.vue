<template></template>

<script>
export default {
  emits: [
    'newJoinRequest'
  ],

  methods: {
    sysMessageHandler(msg) {
      console.log(msg)
      const { time, type, group, groupKey, state, senderID, senderKey, payload } = msg

      if (type == 'fail') {
        ElMessage({
          message: payload,
          duration: 6000,
          type: "error",
        })
        return
      }
      if (type == 'success') {
        ElMessage.success(payload)
        return
      }
      if (type == 'join') {
        this.$emit('newJoinRequest', msg)
        return
      }

    }
  },

  computed: {
    getLastSysMessage() {
      return this.$store.state['sysMsg']
    }
  },

  watch: {
    getLastSysMessage: {
      deep: true,
      handler(newVal) {
        if (newVal) {
          this.sysMessageHandler(newVal)
        }
      }
    },
  }
}
</script>

<style scoped></style>