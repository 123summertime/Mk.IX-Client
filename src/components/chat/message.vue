<template>
  <div :class="messageFrom() ? 'message bySelf' : 'message'" ref="Message">
    <div class="avatar">
      <img :src="'data:image/png;base64,' + avatar">
    </div>
    <div class="container">
      <div class="upper">
        <p class="nameplate" ref="Nameplate">{{ nameplate }}</p>
        <p class="userName">{{ userName }}</p>
      </div>
      <div class="lower" @contextmenu.prevent="onRightClick">
        <p class="payload textType" v-if="type == 'text'">{{ content }}</p>
        <el-image class="payload imgType" v-else-if="type == 'image'" :src="content" :preview-src-list="[content]" />
        <div class="payload fileType" @click="downloading" v-else>
          <div class="fileTypeInnerL">
            <p> {{ fileName }}</p>
            <p> {{ fileSize }}</p>
          </div>
          <div class="fileTypeInnerR">
            <Folder class="fileTypeIcon" />
            <p ref="IconText">{{ fileName.split('.').slice(-1)[0] }}</p>
          </div>
        </div>
        <p class="time">{{ formatedTime }}</p>
      </div>
    </div>
    <messageMenu class="contextMenu" ref="ContextMenu"></messageMenu>
  </div>
</template>

<script>
import messageMenu from './messageMenu.vue'

export default {
  props: {
    time: String,
    type: String,
    avatar: String,
    uuid: String,
    userName: String,
    payload: String,
    owner: Object,
    admin: Map,
  },

  data() {
    return {
      fileName: "",
      fileSize: "",
      content: "",
      nameplate: "",
      formatedTime: "",
      rightClicked: false
    }
  },

  methods: {
    messageFrom() {
      return this.uuid === this.$store.state["account"]
    },

    getNameplate() {
      if (this.owner.has(this.uuid)) {
        this.$refs.Nameplate.style.backgroundColor = "gold"
        this.nameplate = "群主"
        return
      }
      if (this.admin.has(this.uuid)) {
        this.$refs.Nameplate.style.backgroundColor = "aqua"
        this.nameplate = "管理员"
        return
      }
      this.$refs.Nameplate.style.display = "none"
    },

    // 文本类型:payload就是信息内容 文件类型:payload是包含文件名(UTF-8),文件大小和文件内容的base64字符串
    getContent() {
      if (this.type === "text") {
        this.content = this.payload
      } else {
        try {
          const c = JSON.parse(atob(this.payload))
          this.content = c["content"]
          this.fileSize = c["fileSize"]
          this.fileName = new TextDecoder().decode(new Uint8Array(c["fileName"]))
        } catch (err) {
          this.content = this.payload
        }
      }
    },

    base64ToBlob(base64) {
      const bytes = atob(base64.split(',')[1])
      const byteNumbers = new Array(bytes.length);
      for (var i = 0; i < bytes.length; i++) {
        byteNumbers[i] = bytes.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/octet-stream" })
      return blob
    },

    downloadFile(blob, fileName) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName
      link.click()
    },

    downloading() {
      const blob = this.base64ToBlob(this.content)
      this.downloadFile(blob, this.fileName)
    },

    computeMessageTime(timeStamp) {
      timeStamp = Math.round(Number(timeStamp.substring(0, 10)))  // 精确到秒的时间戳(10位)

      const time = new Date(timeStamp * 1000)
      const year = time.getFullYear()
      const month = time.getMonth() + 1
      const date = time.getDate()
      let hours = time.getHours()
      let minutes = time.getMinutes()
      const current = Math.round(new Date() / 1000)
      const delta = current - timeStamp

      hours = (hours < 10) ? "0" + hours : hours
      minutes = (minutes < 10) ? "0" + minutes : minutes
      const T = hours + ":" + minutes

      // 1d === 86400s
      if (delta < 86400) {
        return T
      }
      if (delta < 2 * 86400) {
        return "昨天 " + T
      }
      if (delta < 3 * 86400) {
        return "前天 " + T
      }
      if (delta < 365 * 86400) {
        return month + "/" + date + " " + T
      }
      return year + "/" + month + "/" + date + " " + T
    },

    dynamicFontsize() {
      if ('IconText' in this.$refs) {
        let currFontsize = 16
        const temp = document.createElement('span')
        temp.style.fontSize = currFontsize + 'px'
        temp.innerText = this.fileName.split('.').slice(-1)[0]
        document.body.appendChild(temp)

        while (temp.offsetWidth > 48 || currFontsize == 8) {
          currFontsize--
          temp.style.fontSize = currFontsize + 'px'
        }

        this.$refs.IconText.style.fontSize = currFontsize + 'px'
        document.body.removeChild(temp)
      }
    },

    onRightClick(event) {
      const rect = this.$refs.Message.getBoundingClientRect()
      const ref = this.$refs.ContextMenu.$el.style

      ref.left = event.pageX - rect.left + 'px'
      ref.top = event.pageY - rect.top + 'px'
      ref.display = 'block'

      event.preventDefault()
      if (!this.rightClicked) {
        this.rightClicked = true
        setTimeout(() => {
        window.addEventListener('click', this.globalClick)  // 用于点击其它地方，关闭右键菜单
        window.addEventListener('contextmenu', this.globalClick)
      }, 50)
      }
    },

    globalClick(event) {
      this.rightClicked = false
      this.$refs.ContextMenu.$el.style.display = 'none'
      window.removeEventListener('click', this.globalClick)
      window.removeEventListener('contextmenu', this.globalClick)
    },
  },

  mounted() {
    this.getNameplate()
    this.getContent()
    this.dynamicFontsize()
    this.formatedTime = this.computeMessageTime(this.time)
  },

  components: {
    messageMenu
  }

}
</script>

<style scoped>
.avatar img {
  display: inline-block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transform: translateY(8px);
}

.message {
  position: relative;
  display: flex;
  margin-bottom: 24px;
}

.bySelf {
  direction: rtl;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 75%;
  margin: 0 8px;
}

.upper {
  display: flex;
  height: 24px;
  white-space: nowrap;
  direction: ltr;
}

.nameplate {
  line-height: 24px;
  margin-right: 6px;
  padding: 0 6px;
  border-radius: 10px;
}

.userName {
  line-height: 30px;
}

.lower {
  display: flex;
  align-items: flex-end;
  max-width: 100%;
}

.payload {
  max-width: 90%;
  word-wrap: break-word;
  white-space: pre-wrap;
  background-color: orangered;
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 6px;
  direction: ltr;
}

.textType {
  font-size: 1.2rem;
  line-height: 1.5rem;
}

:deep(.el-image__inner) {
  max-height: 50vh;
}

.fileType {
  display: flex;
  justify-content: space-between;
  width: 300px;
  height: 100px;
  background-color: beige;
  cursor: pointer;
}

.fileTypeInnerL {
  width: 192px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.fileTypeInnerL p {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fileTypeInnerR {
  position: relative;
  width: 64px;
  height: 64px;
  margin: auto 0;
}

.fileTypeInnerR p {
  position: absolute;
  top: 24px;
  left: 8px;
  width: 48px;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
  text-overflow: ellipsis;
}

.fileTypeIcon {
  width: 100%;
  height: 100%;
}

.time {
  font-size: 0.75rem;
  margin: 0 8px;
  direction: ltr;
}

.contextMenu {
  display: none;
  position: absolute;
  left: 0;
  top: 0;
  direction: ltr;
}
</style>