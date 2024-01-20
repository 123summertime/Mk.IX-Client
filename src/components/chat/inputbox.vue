<template>
  <div class="inputBoxRoot">
    <div class="bar">
      <div>
        <label class="fileLabel" for="fileUpload">
          <FolderAdd class="icon" />
        </label>
        <input type="file" id="fileUpload" @change="fileUpload">
      </div>
      <el-button class="send" type="primary" @click="sending('text', message)"
        :disabled="message ? false : true">发送</el-button>
    </div>
    <textarea v-model=message @keydown="onKeyDown" v-on:paste="pasteImg"></textarea>

    <!-- 确认遮罩层 -->
    <el-dialog v-model="visible" title="发送确认" width="30%" :show-close=false>
      <img class="previewImg" :src="msgPayload" v-if="msgType === 'image'" />
      <p class="previewFile" v-else>{{ msgName.split(".").slice(-1)[0] + "文件" }}</p>
      <template #footer>
        <span class="footer">
          <div class="fileInfo">
            <div class="msgName">{{ msgName }}</div>
            <div class="msgSize">{{ fileSize }}</div>
          </div>
          <div class="buttons">
            <el-button type="primary" @click="confirmed">确认</el-button>
            <el-button @click="canceled">取消</el-button>
          </div>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
export default {
  props: {
    currGroup: String
  },

  data() {
    return {
      message: "",
      msgType: "",
      msgSize: "",
      msgName: "",
      msgPayload: "",
      visible: false,
    }
  },

  methods: {
    sending(type, payload) {
      this.$store.state.wsConnections[this.currGroup].send(JSON.stringify({
        "group": this.currGroup,
        "type": type,
        "payload": payload,
      }))

      if (type == "text") {
        this.message = ""
      }
    },

    onKeyDown(event) {
      if (!this.message) { return }
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault()
        this.sending("text", this.message)
      }
    },

    fileUpload(event) {
      const file = event.target.files[0]

      if (file) {
        this.msgName = file.name
        const reader = new FileReader()

        reader.onload = () => {
          const base64 = reader.result
          this.msgType = file.type.toLowerCase().split('/')[0] || "application"
          if (this.msgType === "text") {
            this.msgType = "textFile"
          }

          if (this.msgType === "image") {
            this.toWebpBase64(base64)
            this.beforeSending()
          } else {
            this.msgPayload = base64
            this.msgSize = file.size
            this.beforeSending()
          }
        }
        reader.readAsDataURL(file)
      }
    },

    toWebpBase64(base64) {
      let img = new Image();
      img.src = base64;

      img.onload = () => {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((webpBlob) => {
          this.msgSize = webpBlob.size
          let readerWebP = new FileReader()
          readerWebP.onload = (eventWebP) => {
            this.msgPayload = eventWebP.target.result
          }
          readerWebP.readAsDataURL(webpBlob)
        }, 'image/webp')
      }
    },

    pasteImg(event) {
      let items = (event.clipboardData || event.originalEvent.clipboardData).items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          let blob = items[i].getAsFile()
          this.msgName = blob.name
          this.msgType = 'image'

          let reader = new FileReader()
          reader.onload = (event) => {
            this.toWebpBase64(event.target.result)
            this.beforeSending()
          }

          reader.readAsDataURL(blob)
        }
      }
    },

    beforeSending() {
      this.msgPayload = btoa(JSON.stringify({
        "fileName": Array.from(new TextEncoder().encode(this.msgName)), // btoa不支持中文 进行UTF-8编码
        "fileSize": this.fileSize,
        "content": this.msgPayload
      }))
      this.visible = true
    },

    confirmed() {
      this.visible = false
      this.sending(this.msgType, this.msgPayload)
    },

    canceled() {
      this.visible = false
    },
  },

  computed: {
    fileSize() {
      const mb = 2 ** 20
      const kb = 2 ** 10
      if (this.msgSize >= mb) {
        return (this.msgSize / mb).toFixed(2) + "MB"
      }
      if (this.msgSize >= kb) {
        return (this.msgSize / kb).toFixed(2) + "KB"
      }
      return this.msgSize + "B"
    }
  }
}
</script>

<style scoped>
.inputBoxRoot {
  display: flex;
  flex-direction: column;
  background-color: lightsalmon;
}

.bar {
  display: flex;
  width: 100%;
  height: 32px;
  background-color: brown;
}

input[type="file"] {
  display: none;
}

.fileLabel {
  display: block;
  width: 64px;
  height: 100%;
  cursor: pointer;
  background-color: #3498db;
  color: black;
}

.icon {
  display: block;
  height: 100%;
  margin: 0 auto;
}

textarea {
  width: 100%;
  flex-grow: 1;
  padding: 16px;
  font-size: 1.2rem;
  font-family: Microsoft Yahei;
  resize: none;
  border: none;
  outline: none;
  background-color: transparent;
}

textarea::-webkit-scrollbar {
  display: none;
}

/* mask */
.previewImg {
  display: block;
  max-width: 100%;
  max-height: 40vh;
  margin: 0 auto;
}

.previewFile {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  margin: 0 auto;
}

.footer,
.imgInfo,
.buttons {
  display: flex;
  justify-content: space-between;
  line-height: 32px;
}

.footer {
  max-width: 100%;
}

.fileInfo {
  display: flex;
  justify-content: left;
  flex-grow: 1;
  margin-right: 16px;
  text-align: left;
  overflow: hidden;
}

.msgName {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msgSize {
  flex-grow: 1;
  margin-left: 16px;
}

.buttons button:nth-child(2) {
  margin-left: 16px;
}
</style>