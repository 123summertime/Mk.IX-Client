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
      <div :class="['barItem', input ? '' : 'barItemDisabled']" title="发送(Shift+Enter)" @click="sendingText()">
        <Promotion class='icon' />
      </div>
    </div>

    <div class="main">
      <atBar class="atBar" :atList="atList" @deleteAt="deleteAt"></atBar>
      <textarea v-model=input @keydown="onKeyDown" v-on:paste="pasteImg" :disabled="!available"></textarea>
      <favorite class="favorite" v-if="favorite" @sendFavoriteImg="sendFavoriteImg"></favorite>
    </div>


    <!-- 确认遮罩层 -->
    <el-dialog v-model="visible" title="发送确认" width="30%" :show-close="false" :destroy-on-close="true">
      <img class="previewImg" :src="payload.content" v-if="payload.type === 'image'" />
      <audioMsg class="previewAudio" v-else-if="payload.type === 'audio'" :group="group" :message="audioMessagePreview">
      </audioMsg>
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

import atBar from './atBar.vue'
import favorite from './favorite.vue'
import audioMsg from './messageType/audioMsg.vue'

export default {
  props: {
    group: String,
    available: Boolean,
  },

  data() {
    return {
      input: "",
      payload: {
        type: "text",
        size: null,
        name: null,
        content: null,
      },
      recorder: {
        time: 0,
        timer: null,
        recording: false,
      },
      visible: false,
      favorite: false,
      atList: new Set(),  // 存储@其他人的JSON字符串，包含属性uuid, userName
    }
  },

  methods: {
    // 发送text类型消息
    sendingText() {
      if (!this.input) { return }

      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        type: "text",
        payload: {
          name: null,
          size: null,
          content: this.input,
          meta: {
            at: Array.from(this.atList).map(i => JSON.parse(i).uuid)
          }
        }
      }))
      this.input = ""
      this.atList = new Set()
    },

    // 发送图片类型消息，以base64的形式
    sendingImage() {
      if (!this.payload.content) { return }

      this.$store.state.wsConnections[this.group].send(JSON.stringify({
        type: this.payload.type,
        payload: {
          name: this.payload.name,
          size: this.payload.size,
          content: this.payload.content,
        }
      }))
      this.payload.content = ""
    },

    // 发送文件类型消息
    sendingFile() {
      const FD = new FormData()
      FD.append('file', this.payload.content)
      FD.append('fileType', this.payload.type)

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

    // shift + enter也可以发送
    onKeyDown(event) {
      if (!this.input) { return }

      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault()
        this.sendingText()
      }
    },

    // 用户选择了要上传的文件，如果是图片，改为webp再发送
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

    // 图片改为webp，gif或已经是webp的跳过
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

    // 粘贴图片到输入框，尝试改为webp再发送
    pasteImg(event) {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          this.payload.name = 'Image'
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

    // 录音时，有最大时长限制
    async audioRecorder() {
      if (!this.recorder.recorder) {
        await this.recorderBuilder()
      }

      this.recorder.recorder.ondataavailable = event => {
        this.payload.content.push(event.data)
      }

      this.recorder.recorder.onstop = () => {
        this.payload.name = 'record.mp3'
        const blob = new File(this.payload.content, this.payload.name, { type: 'audio/mp3' })
        this.payload.size = blob.size
        this.payload.content = blob
        clearInterval(this.recorder.timer)
        this.beforeSending()
        this.recorder.recorder = null
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
        if (this.recorder.time === 50 - 1 && this.recorder.recording) {
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
        text: this.sendingText,
        image: this.sendingImage,
        audio: this.sendingFile,
        file: this.sendingFile,
      }
      callFunction[this.payload.type]()
    },

    canceledSending() {
      this.visible = false
    },

    // 发送收藏的表情包，尝试改为webp后发送
    sendFavoriteImg(img) {
      this.favorite = false
      this.payload.type = 'image'
      this.payload.content = img

      // webp的base64中包含'UklGR'
      const isWebp = img.substring(0, 30).indexOf('UklGR') >= 0
      if (!isWebp) {
        this.toWebpBase64(img)
      }

      this.confirmedSending()
    },

    deleteAt(target) {
      this.atList.delete(target)
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

    // 语音消息发送前预览
    audioMessagePreview() {
      return {
        payload: {
          meta: {
            length: this.recorder.time,
            blob: this.payload.content
          }
        }
      }
    },
    
    getNewAt() {
      return this.$store.state.currentAt
    }
  },

  watch: {
    getNewAt: {
      handler(newVal) {
        if (newVal) {
          this.atList.add(JSON.stringify(newVal))
        }
      }
    }
  },

  components: {
    atBar,
    favorite,
    audioMsg,
  },

}
</script>

<style scoped>
.inputBoxRoot {
  background-color: var(--inputBox-inputBoxRoot);
}

/* bar */

.bar {
  display: flex;
  width: 100%;
  height: 48px;
  padding: 8px 24px;
  background-color: var(--inputBox-bar);
}

input[type="file"] {
  display: none;
}

.barItem {
  height: 100%;
  cursor: pointer;
  background-color: transparent;
  margin-right: 24px;
  color: var(--inputBox-barItem);
}

.barItem label {
  cursor: pointer;
}

.barItemDisabled {
  color: var(--inputBox-iconDisabled);
  cursor: not-allowed;
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
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 48px);
}

.atBar {
  width: 100%;
}

textarea {
  display: block;
  width: 100%;
  height: 100%;
  padding: 8px 16px 16px 16px;
  font-size: 1.2rem;
  font-family: Microsoft Yahei;
  resize: none;
  border: none;
  outline: none;
  background-color: var(--inputBox-textarea);
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

.previewAudio {
  display: inline-flex;
  border-radius: 12px;
  padding: 12px 16px;
  background-color: var(--inputBox-previewAudio);
  cursor: pointer;
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

:deep(.el-dialog__body){ 
  display: flex;
  justify-content: center;
}
</style>