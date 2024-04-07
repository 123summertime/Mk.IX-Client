<template>
  <div></div>
</template>

<script>
export default {
  methods: {
    sysMessageHandler(msg) {
      console.log(msg)
      const { time, type, payload } = msg
      
      if (type == 'error') {
        ElMessage({
          message: payload,
          duration: 6000,
          type: "error",
        })
      } else if (type == 'success') {
        ElMessage.success(payload)
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