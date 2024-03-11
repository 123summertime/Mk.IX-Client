<template>
  <div class="inputBoxRoot">
    <div class="bar">
      <div class="barItem" title="上传">
        <label for="fileUpload">
          <FolderAdd class="icon" />
        </label>
        <input type="file" id="fileUpload" @change="fileUpload">
      </div>
      <div class="barItem" title="图片" @click="favorite = !favorite">
        <Picture class="icon"></Picture>
      </div>
      <div class="barItem" title="发送(Shift+Enter)" @click="sending('text', message)">
        <Promotion class="icon" :style="{ color: message ? 'black' : 'gray' }" />
      </div>
    </div>

    <div class="main">
      <textarea v-model=message @keydown="onKeyDown" v-on:paste="pasteImg"></textarea>
      <favorite class="favorite" v-if="favorite" @sendFavoriteImg="sendFavoriteImg"></favorite>
    </div>
    
    
    <!-- 确认遮罩层 -->
    <el-dialog v-model="visible" title="发送确认" width="30%" :show-close=false>
      <img class="previewImg" :src="msgPayload" v-if="msgType === 'image'" ref="preview" />
      <p class="previewFile" v-else>{{ msgName.split(".").slice(-1)[0] + "文件" }}</p>
      <template #footer>
        <span class="footer">
          <div class="fileInfo">
            <div class="msgName">{{ msgName }}</div>
            <div class="msgSize">{{ fileSize }}</div>
          </div>
          <div class="buttons">
            <el-button type="primary" @click="confirmedSending">确认</el-button>
            <el-button @click="canceledSending">取消</el-button>
          </div>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import favorite from './favorite.vue'

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
      favorite: false,
    }
  },

  methods: {
    sending(type, payload) {
      if (!payload) { return }

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
          } else if (this.msgType === "image") {
            this.msgSize = file.size
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
      if (base64.includes('data:image/gif') || base64.includes('data:image/webp')) {
        this.msgPayload = base64
        return
      }

      let img = new Image()
      img.src = base64

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

    encode() {
      this.sendingPayload = btoa(JSON.stringify({
        "fileName": Array.from(new TextEncoder().encode(this.msgName)), // btoa不支持中文 进行UTF-8编码
        "fileSize": this.fileSize,
        "content": this.msgPayload
      }))
    },  

    beforeSending() {
      this.encode()
      this.visible = true
    },

    confirmedSending() {
      this.visible = false
      this.sending(this.msgType, this.sendingPayload)
    },

    canceledSending() {
      this.visible = false
    },
    
    sendFavoriteImg(img) {
      this.favorite = false
      this.msgType = 'image'
      this.msgPayload = img

      const isWebp = img.substring(0, 30).indexOf('UklGR') >= 0
      if (!isWebp) {
        this.toWebpBase64(this.msgPayload)
      }

      this.encode()
      this.confirmedSending()
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
    },

  },

  components: {
    favorite
  }
}
</script>

<style scoped>
.inputBoxRoot {
  background-color: lightsalmon;
}

/* bar */

.bar {
  display: flex;
  width: 100%;
  height: 32px;
  background-color: brown;
}

input[type="file"] {
  display: none;
}

.barItem {
  width: 64px;
  height: 100%;
  cursor: pointer;
  background-color: transparent;
  color: black;
}

.barItem label {
  cursor: pointer;
}

.icon {
  display: block;
  height: 100%;
  margin: 0 auto;
}

/* main */

.main {
  position: relative;
  width: 100%;
  height: calc(100% - 32px);
}

textarea {
  display: block;
  width: 100%;
  height: 100%;
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

.favorite {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

/* check layer */
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