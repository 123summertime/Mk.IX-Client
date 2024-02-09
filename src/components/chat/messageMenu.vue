<template>
  <div class="msgMenuRoot">
    <div @click="addToFavorite" v-if="type === 'image'">
      <Plus></Plus>
      <p>添加到表情</p>
    </div>
    <div @click="copyMsg" v-if="['text', 'image'].includes(type)">
      <DocumentCopy></DocumentCopy>
      <p>复制</p>
    </div>
    <div @click="deleteMsg">
      <Delete></Delete>
      <p>删除</p>
    </div>
    <div @click="forwardMsg" v-if="!['revoke'].includes(type)">
      <Share></Share>
      <p>转发</p>
    </div>
    <div @click="revokeMsg" v-if="!['revoke'].includes(type) && checkPermissions">
      <CircleClose></CircleClose>
      <p>撤回</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: String,
    uuid: String,
    owner: Object,
    admin: Map,
  },

  methods: {
    addToFavorite() {
      this.$emit('addToFavorite')
    },

    copyMsg() {
      this.$emit('copyMsg')
    },

    deleteMsg() {
      this.$emit('deleteMsg')
    },

    forwardMsg() {
      this.$emit('forwardMsg')
    },

    revokeMsg() {
      this.$emit('revokeMsg')
    }
  },

  computed: {
    checkPermissions() {
      const account = this.$store.state["account"]

      // 自己发的
      if (this.uuid === account) {
        return true
      }
      // 群主
      if (this.owner.has(account)) {
        return true
      }
      // 管理员 但不能是群主发的
      if (this.admin.has(account) && !this.owner.has(this.uuid)) {
        return true
      }
      return false
    }
  }
}
</script>

<style scoped>
.msgMenuRoot {
  display: flex;
  flex-direction: column;
  width: 144px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(245, 245, 245, 0.5);
  backdrop-filter: blur(20px);
  z-index: 10000;
}

.msgMenuRoot div {
  display: flex;
  width: 100%;
  height: 24px;
  margin: 4px 0;
  padding: 0 4px;
  cursor: pointer;
}

.msgMenuRoot div svg {
  width: 16px;
  height: 100%;
}

.msgMenuRoot div p {
  height: 100%;
  line-height: 24px;
  margin-left: 8px;
}

.msgMenuRoot div:hover {
  border-radius: 8px;
  background-color: rgba(96, 96, 96, 0.5);
  backdrop-filter: blur(20px);
}
</style>