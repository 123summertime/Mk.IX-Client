<template></template>

<script>
export default {
  emits: [
    'newJoinRequest', 
    "joined",
  ],

  methods: {
    // 获取系统消息(群验证等)
    sysMessageHandler(msg) {
      console.log(msg)
      const { time, type, group, groupKey, state, senderID, senderKey, payload } = msg

      // file类型，如上传的图片过大等不符合服务器限制的错误
      if (type == 'fail') {
        ElMessage({
          message: payload,
          duration: 6000,
          type: "error",
        })
        return
      }
      // 成功，无需多言
      if (type == 'success') {
        ElMessage.success(payload)
        return
      }
      // 有新的入群申请
      if (type == 'join') {
        this.$emit('newJoinRequest', msg)
        return
      }
      // 你已加入了新群
      if (type == "joined") {
        ElMessage.success(`你已成功加入 ${payload}`)
        this.$emit('joined', msg)
        return
      }

    }
  },

  computed: {
    getLastSysMessage() {
      return this.$store.state.sysMsg
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