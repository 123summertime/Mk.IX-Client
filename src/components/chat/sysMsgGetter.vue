<template></template>

<script>
export default {
  emits: [
    'newJoinRequest',
    'newFriendRequest',
    "joined",
  ],

  methods: {
    // 获取系统消息(群验证等)
    sysMessageHandler(msg) {
      console.log(msg)
      const { time, type, target, targetKey, state, senderID, senderKey, payload } = msg
      const mapping = {
        // fail类型，如上传的图片过大等不符合服务器限制的错误
        fail: () => {
          ElMessage({
            message: payload,
            duration: 6000,
            type: "error",
          })
        },
        // 成功，无需多言
        success: () => { ElMessage.success(payload) },
        // 有新的入群申请
        join: () => { this.$emit('newJoinRequest', msg) },
        // 你已加入了新群
        joined: () => {
          ElMessage.success(`你已成功加入 ${payload}`)
          this.$emit('joined', msg)
        },
        // 新的好友申请
        friend: () => { this.$emit('newFriendRequest', msg) },
        // 好友申请通过
        friended: () => {
          ElMessage.success(`你已成功加入 ${payload}`)
          this.$emit('joined', msg)
        }
      }

      mapping[type]()
    }
  },

  computed: {
    getLastSysMessage() {
      return this.$store.state.systemMessage
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