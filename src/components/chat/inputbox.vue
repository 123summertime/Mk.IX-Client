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
      <div class="barItem" title="语音">
        <el-popover
          :visible="recorder.recording"
          placement="top"
          :width="200"
          trigger="click"
          :hide-after="40"
          :content="`录音中, 再次点击结束录音\n已录制 ${recorder.time}s`">
          <template #reference>
            <Microphone class="icon" @click="audioRecorder"></Microphone>
          </template>
        </el-popover>
      </div>
      <div class="barItem" title="发送(Shift+Enter)" @click="sendingText()">
        <Promotion class="icon" :style="{ color: input ? 'black' : 'gray' }" />
      </div>
    </div>

    <div class="main">
      <textarea v-model=input @keydown="onKeyDown" v-on:paste="pasteImg"></textarea>
      <favorite class="favorite" v-if="favorite" @sendFavoriteImg="sendFavoriteImg"></favorite>
    </div>


    <!-- 确认遮罩层 -->
    <el-dialog v-model="visible" title="发送确认" width="30%" :show-close=false>
      <img class="previewImg" :src="payload.content" v-if="payload.type === 'image'" />
      <p class="previewFile" v-else>{{ payload.name.split(".").slice(-1)[0] + "文件" }}</p>
      <template #footer>
        <span class="footer">
          <div class="fileInfo">
            <div class="msgName" :title="payload.name">{{ payload.name }}</div>
            <div class="msgSize" :title="fileSize">{{ fileSize }}</div>
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
import axios from 'axios'

import favorite from './favorite.vue'

export default {
  props: {
    group: String,
  },

  data() {
    return {
      input: "",
      payload: {
        type: "",
        size: "",
        name: "",
        content: ""
      },
      recorder: {
        time: 0,
        timer: null,
        recording: false,
      },
      visible: false,
      favorite: false,
    }
  },

  methods: {
    sendingText() {
      if (!this.input) { return }

      // 文字类型消息格式: {"type": "text", "payload": 消息内容}  通过WS
      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        "type": "text",
        "payload": this.input,
      }))
      this.input = ""
    },

    sendingImage() {
      if (!this.payload.content) { return }

      // 图片类型消息格式: {"type": "image", "payload": 图片base64}  通过WS
      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        "type": "image",
        "payload": this.payload.content,
      }))
    },

    sendingFile() {
      // 文件类型消息格式: FormData  payload.content: File  通过HTTP
      const FD = new FormData()
      FD.append('file', this.payload.content)
      FD.append('fileType', this.payload.type)
      console.log(this.payload.content)

      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/upload`
      axios.post(URL, FD, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).catch(err => {
        ElMessage({
          message: `上传文件失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    onKeyDown(event) {
      if (!this.input) { return }

      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault()
        this.sendingText()
      }
    },

    fileUpload(event) {
      const file = event.target.files[0]

      if (file) {
        this.payload.name = file.name
        const reader = new FileReader()

        reader.onload = () => {
          this.payload.size = file.size
          this.payload.type = file.type.toLowerCase().split('/')[0] === "image" ? "image" : "file"

          if (this.payload.type === "image") {
            this.toWebpBase64(reader.result)
          } else {
            this.payload.content = file
            this.beforeSending()
          }
          event.target.value = ""
        }
        reader.readAsDataURL(file)
      }
    },

    toWebpBase64(base64) {
      if (base64.includes('data:image/gif') || base64.includes('data:image/webp')) {
        this.payload.content = base64
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
          this.payload.size = webpBlob.size

          let readerWebp = new FileReader()
          readerWebp.onload = (event) => {
            this.payload.content = event.target.result
            this.beforeSending()
          }
          readerWebp.readAsDataURL(webpBlob)
        }, 'image/webp')
      }
    },

    pasteImg(event) {
      let items = (event.clipboardData || event.originalEvent.clipboardData).items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          this.payload.type = 'image'

          let reader = new FileReader()
          reader.onload = (event) => {
            this.toWebpBase64(event.target.result)
          }

          let blob = items[i].getAsFile()
          reader.readAsDataURL(blob)
        }
      }
    },

    async recorderBuilder() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.recorder.recorder = new MediaRecorder(stream)
    },

    async audioRecorder() {
      this.recorder.recorder.ondataavailable = event => {
        this.payload.content.push(event.data)
      }

      this.recorder.recorder.onstop = () => {
        this.payload.name = '录音.mp3'
        const blob = new File(this.payload.content, this.payload.name, { type: 'audio/mp3' })
        this.payload.size = blob.size
        this.payload.content = blob
        clearInterval(this.recorder.timer)
        this.beforeSending()
      }

      if (this.recorder.recording) {
        this.recorder.recording = false
        this.recorder.recorder.stop()
        return
      }

      this.payload.type = 'audio'
      this.payload.content = []
      this.recorder.time = 0
      this.recorder.recording = true
      this.recorder.recorder.start()

      this.recorder.timer = setInterval(() => {
        if (this.recorder.time === 50 && this.recorder.recording) {
          this.recorder.recording = false
          this.recorder.recorder.stop()
        }
        this.recorder.time += 1
      }, 1000)
    },

    beforeSending() {
      this.visible = true
    },

    confirmedSending() {
      this.visible = false
      const callFunction = {
        "text": this.sendingText,
        "image": this.sendingImage,
        "audio": this.sendingFile,
        "file": this.sendingFile,
      }
      callFunction[this.payload.type]()
    },

    canceledSending() {
      this.visible = false
    },

    sendFavoriteImg(img) {
      this.favorite = false
      this.payload.type = 'image'
      this.payload.content = img

      const isWebp = img.substring(0, 30).indexOf('UklGR') >= 0
      if (!isWebp) {
        this.toWebpBase64(img)
      }

      this.confirmedSending()
    },
  },

  computed: {
    fileSize() {
      const mb = 2 ** 20
      const kb = 2 ** 10
      if (this.payload.size >= mb) {
        return (this.payload.size / mb).toFixed(2) + "MB"
      }
      if (this.payload.size >= kb) {
        return (this.payload.size / kb).toFixed(2) + "KB"
      }
      return this.payload.size + "B"
    },

  },

  components: {
    favorite
  },

  async mounted() {
    await this.recorderBuilder()
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
  outline: none;
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