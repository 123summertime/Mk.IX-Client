<template>
  <div class="inputBoxRoot">
    <div class="bar">
      <el-button type="primary" @click="sending('text', message)" :disabled="message ? false : true"
        class="send">发送</el-button>
    </div>
    <textarea v-model=message @keydown="onKeyDown" v-on:paste="pasteImg"></textarea>

    <el-dialog v-model="visible" title="发送确认" width="30%">
      <img class="previewImg" :src="msgPayload"/>
      <template #footer>
        <span class="dialog-footer">
          <span>{{ msgName }}</span>
          <span>{{ msgSize + "KB"}}</span>
          <el-button type="primary" @click="confirmed">确认</el-button>
          <el-button @click="canceled">取消</el-button>
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

    beforeSending() {
      this.visible = true
    },

    confirmed() {
      this.visible = false
      this.sending("image", this.msgPayload)
    },

    canceled() {
      this.visible = false
    },

    pasteImg(event) {
      let items = (event.clipboardData || event.originalEvent.clipboardData).items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          let blob = items[i].getAsFile()
          let reader = new FileReader()
          this.msgName = blob.name

          reader.onload = (event) => {
            let img = new Image()
            img.src = event.target.result

            img.onload = () => {
              let canvas = document.createElement('canvas')
              let ctx = canvas.getContext('2d')
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)

              canvas.toBlob((webpBlob) => {
                this.msgSize = (webpBlob.size / 1000).toFixed(2)
                let readerWebP = new FileReader()
                readerWebP.onload = (eventWebP) => {
                  this.msgPayload = eventWebP.target.result
                  this.beforeSending()
                }
                readerWebP.readAsDataURL(webpBlob)
              }, 'image/webp')
            }
          }

          reader.readAsDataURL(blob)
        }
      }
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
  width: 100%;
  height: 36px;
  background-color: brown;
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

.previewImg {
  width: 100%;
  margin: auto;
}
</style>