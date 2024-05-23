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
    type: String,
    content: String,
    uuid: String,
    owner: Object,
    admin: Map,
  },

  data() {
    return {
      display: {
        "favorite": false,
        "copy": false,
        "delete": false,
        "forward": false,
        "revoke": false,
      }
    }
  },

  methods: {
    async getFavoriteDB() {
      this.DB = await this.$store.state["favoriteDB"]
    },

    async addToFavorite() {
      if (!this.DB) {
        await this.getFavoriteDB()
      }

      this.DB.add('Image', {
        time: Date.now(),
        payload: this.content
      })
    },

    base64ToBlob(base64, fileType) {
      fileType = fileType || "application/octet-stream"

      const bytes = atob(base64.split(',')[1])
      const byteNumbers = new Array(bytes.length)
      for (var i = 0; i < bytes.length; i++) {
        byteNumbers[i] = bytes.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: fileType })
      return blob
    },

    copyMsg() {
      const cb = navigator.clipboard
      if (this.type === 'text') {
        cb.writeText(this.content)
      }
      if (this.type === 'image') {
        const blob = this.base64ToBlob(this.content, "image/png")
        cb.write([new ClipboardItem({ "image/png": blob })])
      }
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
  },

  mounted() {
    const displayMap = {
      "text": { "favorite": false, "copy": true, "delete": true, "forward": true, "revoke": this.checkPermissions },
      "image": { "favorite": true, "copy": true, "delete": true, "forward": true, "revoke": this.checkPermissions },
      "file": { "favorite": false, "copy": false, "delete": true, "forward": true, "revoke": this.checkPermissions },
      "revoke": { "favorite": false, "copy": false, "delete": true, "forward": false, "revoke": false },
    }
    this.display = displayMap[this.type] || displayMap["file"]
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