<template>
  <div class="msgMenuRoot">
    <div @click="addToFavorite" v-if="display.favorite">
      <Plus></Plus>
      <p>添加到表情</p>
    </div>
    <div @click="copyMsg" v-if="display.copy">
      <DocumentCopy></DocumentCopy>
      <p>复制</p>
    </div>
    <div @click="deleteMsg" v-if="display.delete">
      <Delete></Delete>
      <p>删除</p>
    </div>
    <div @click="forwardMsg" v-if="display.forward">
      <Share></Share>
      <p>转发</p>
    </div>
    <div @click="revokeMsg" v-if="display.revoke">
      <CircleClose></CircleClose>
      <p>撤回</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    message: Object,
    admins: Object,
  },

  data() {
    return {
      display: {
        favorite: false,
        copy: false,
        delete: false,
        forward: false,
        revoke: false,
      }
    }
  },

  methods: {
    async getFavoriteDB() {
      this.DB = await this.$store.state.favoriteDB()
    },

    // 收藏图片，图片的base64加入DB
    async addToFavorite() {
      if (!this.DB) {
        await this.getFavoriteDB()
      }

      this.DB.add('Image', {
        time: Date.now(),
        payload: this.message.payload.content
      })

      ElMessage.success("添加成功")
    },

    base64ToBlob(base64, fileType) {
      fileType = fileType || "application/octet-stream"

      const bytes = atob(base64.split(',')[1])
      const byteNumbers = new Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) {
        byteNumbers[i] = bytes.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: fileType })
      return blob
    },

    // 根据消息类型显示不同的菜单选项
    option() {
      const displayMapping = {
        text: { favorite: false, copy: true, delete: true, forward: true, revoke: this.checkPermissions },
        system: { favorite: false, copy: false, delete: true, forward: false, revoke: false },
        image: { favorite: true, copy: true, delete: true, forward: true, revoke: this.checkPermissions },
        file: { favorite: false, copy: false, delete: true, forward: true, revoke: this.checkPermissions },
        revoke: { favorite: false, copy: false, delete: true, forward: false, revoke: false },
        audio: { favorite: false, copy: false, delete: true, forward: false, revoke: this.checkPermissions },
      }
      this.display = displayMapping[this.message.type] || displayMapping.file
    },

    copyMsg() {
      const cb = navigator.clipboard
      if (!cb) {
        ElMessage({
          message: "复制仅在HTTPS下可用",
          duration: 6000,
          type: "error",
        })
        return
      }

      if (this.message.type === 'text') {
        cb.writeText(this.message.payload.content)
      }
      if (this.message.type === 'image') {
        const blob = this.base64ToBlob(this.message.payload.content, "image/png")
        cb.write([new ClipboardItem({ "image/png": blob })])
      }
      ElMessage.success("复制成功")
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
      const account = this.$store.state.account

      // 自己发的
      if (this.message.uuid === account) {
        return true
      }
      // 群主
      if (this.admins.owner[account]) {
        return true
      }
      // 管理员 但不能是群主发的
      if (this.admins.admin[account] && !this.admins.owner[this.message.uuid]) {
        return true
      }
      return false
    }
  },

  mounted() {
    this.option()
  },

}
</script>

<style scoped>
.msgMenuRoot {
  display: flex;
  flex-direction: column;
  width: 144px;
  padding: 8px;
  border-radius: 8px;
  background: var(--messageMenu-msgMenuRoot-bgcolor);
  z-index: 10000;
  opacity: 0.93;
}

.msgMenuRoot div {
  display: flex;
  align-items: center;
  width: 100%;
  height: 36px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}

.msgMenuRoot div svg {
  height: 1.2rem;
  color: var(--messageMenu-item-textcolor);
}

.msgMenuRoot div p {
  margin-left: 8px;
  color: var(--messageMenu-item-textcolor);
}

.msgMenuRoot div:hover {
  background: var(--messageMenu-item-hover-bgcolor);
}
</style>