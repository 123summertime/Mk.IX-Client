<template>
  <div class="messageRoot" ref="MessageRoot">

    <div v-if="['revoke'].includes(type)" @contextmenu.prevent="onRightClick">
      <!-- 广播信息 -->
      <p class="payload broadcastType">{{ payload.content }}</p>
    </div>

    <div :class="messageFrom() ? 'message bySelf' : 'message'" v-else>
      <div class="avatar" @click="showProfile">
        <img :src="avatar">
      </div>
      <div class="container">
        <div class="upper">
          <p class="nameplate" ref="Nameplate">{{ getNameplate }}</p>
          <p class="userName">{{ userName }}</p>
        </div>
        <div class="lower" @contextmenu.prevent="onRightClick">
          <!-- 文字信息 -->
          <p class="payload textType" v-if="type == 'text'">{{ payload.content }}</p>
          <!-- 图片信息 -->
          <el-image class="payload imgType" v-else-if="type == 'image'" :src="payload.content"
            :preview-src-list="[payload.content]" />
          <!-- 文件信息 -->
          <div class="payload fileType" @click="downloading" ref="fileType" v-else>
            <div class="fileTypeInnerL">
              <p :title="payload.name"> {{ payload.name }}</p>
              <p v-if="download.state == 'pending'" :title="fileSize(payload.size)"> {{ fileSize(payload.size) }}</p>
              <p v-else-if="download.state == 'downloading'" class="downloadingInfo">
                <i>{{ downloadSPD }}</i><i>{{ downloadETC }}</i>
              </p>
              <p v-else-if="download.state == 'success'">下载完成</p>
              <p v-else>下载失败</p>
            </div>
            <div class="fileTypeInnerR">
              <div v-if="download.state == 'pending'">
                <Folder class="fileTypeIcon" />
                <p ref="IconText" class="iconInnerText">{{ payload.name.split('.').slice(-1)[0] }}</p>
              </div>
              <div v-else>
                <canvas width="64" height="64" ref="progress"></canvas>
                <p v-if="download.state == 'downloading'" class="iconInnerText">{{ download.rate.toFixed(0) + '%' }}</p>
                <Check v-else-if="download.state == 'success'" color="#67C23A" class="iconInnerText"></Check>
              </div>
            </div>
          </div>
          <p class="time">{{ formatedTime }}</p>
        </div>
      </div>
    </div>

    <messageMenu class="contextMenu" ref="ContextMenu"
      :type="type"
      :uuid="uuid"
      :owner="owner"
      :admin="admin"
      @addToFavorite="addToFavorite"
      @copyMsg="copyMsg"
      @deleteMsg="deleteMsg"
      @forwardMsg="forwardMsg"
      @revokeMsg="revokeMsg">
    </messageMenu>

    <el-dialog v-model="namecardVisible" :show-close="false" width="540px">
      <div class="namecard">
        <div class="namecardAvatar">
          <img :src="avatar" />
        </div>
        <div class="namecardInfo">
          <span>
            <i>昵称:</i>
            <i>{{ userName }}</i>
          </span>
          <span>
            <i>uuid:</i>
            <i>{{ uuid }}</i>
          </span>
          <span>
            <i>个性签名:</i>
            <i>{{ bio }}</i>
          </span>
          <span>
            <i>最后访问:</i>
            <i>{{ lastSeen === "Online" ? "在线" : computeTime(lastSeen) }}</i>
          </span>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

import messageMenu from './messageMenu.vue'

export default {
  props: {
    group: String,
    time: String,
    type: String,
    avatar: String,
    uuid: String,
    userName: String,
    message: String,
    owner: Object,
    admin: Map,
  },

  data() {
    return {
      payload: {
        name: "",
        size: "",
        content: "",
      },
      download: {
        state: "pending",
        speed: 0,
        rate: 0,
      },

      formatedTime: "",
      rightClicked: false,
      namecardVisible: false,

      bio: "",
      lastSeen: "",
    }
  },

  methods: {
    async getFavoriteDB() {
      this.DB = await this.$store.state["favoriteDB"]
    },

    messageFrom() {
      return this.uuid === this.$store.state["account"]
    },

    // file类型: payload是包含文件名，文件大小，文件ID的JSON字符串
    // text, image, revoke类型: payload就是信息内容
    getContent() {
      if (this.type != 'text' && this.type != 'image') {
        let info = JSON.parse(this.message)
        this.payload.name = info["name"]
        this.payload.size = info["size"]
        this.payload.content = info["hashcode"]
      } else {
        this.payload.content = this.message
      }
    },

    downloading() {
      this.download.state = "downloading"

      const url = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/download/${this.payload.content}`
      axios.get(url, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        onDownloadProgress: event => {
          this.download.speed = event.rate ?? 0
          this.download.rate = event.progress * 100 ?? 0

          this.canvasDrawer(this.download.rate, '#E5EAF3', '#409EFF')
          if (this.download.rate >= 100) {
            this.canvasDrawer(0, '#67C23A', '#000000')
            this.download.state = "success"
          }
        }
      }).then(res => {
        const blob = new Blob([res.data])
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = this.payload.name
        link.click()
      }).catch(err => {
        this.download.state = "failed"
        ElMessage({
          message: `下载文件失败 ${err}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    canvasDrawer(percentage, color1, color2) {
      const canvas = this.$refs.progress

      const ctx = canvas.getContext('2d')
      const X = canvas.width / 2
      const Y = canvas.height / 2
      const R = X - 4
      const start = -0.5 * Math.PI
      const end = start + 2 * Math.PI * (percentage / 100)

      ctx.lineWidth = 4
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.beginPath()
      ctx.arc(X, Y, R, 0, 2 * Math.PI, false)
      ctx.strokeStyle = color1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(X, Y, R, start, end, false)
      ctx.strokeStyle = color2
      ctx.stroke()
    },

    fileSize(size) {
      const mb = 2 ** 20
      const kb = 2 ** 10

      size = Number(size)
      if (size >= mb) {
        return (size / mb).toFixed(2) + "MB"
      }
      if (size >= kb) {
        return (size / kb).toFixed(2) + "KB"
      }
      return size.toFixed(0) + "B"
    },

    computeTime(timeStamp) {
      timeStamp = Math.round(Number(timeStamp.substring(0, 10)))  // 精确到秒的时间戳(10位)
      let todayMidnight = new Date().setHours(0, 0, 0, 0) / 1000

      const time = new Date(timeStamp * 1000)
      const year = time.getFullYear()
      const month = time.getMonth() + 1
      const date = time.getDate()
      let hours = time.getHours()
      let minutes = time.getMinutes()

      hours = (hours < 10) ? "0" + hours : hours
      minutes = (minutes < 10) ? "0" + minutes : minutes
      const T = hours + ":" + minutes

      // 1d === 86400s
      if (timeStamp >= todayMidnight) {
        return T
      }
      if (timeStamp >= todayMidnight - 86400) {
        return "昨天 " + T
      }
      if (timeStamp >= todayMidnight - 2 * 86400) {
        return "前天 " + T
      }
      if (timeStamp >= todayMidnight - 364 * 86400) {
        return month + "/" + date + " " + T
      }
      return year + "/" + month + "/" + date + " " + T
    },

    dynamicFontsize() {
      if (!this.$refs.IconText) { return }

      let currFontsize = 16
      const temp = document.createElement('span')
      temp.style.fontSize = currFontsize + 'px'
      temp.innerText = this.payload.name.split('.').slice(-1)[0]
      document.body.appendChild(temp)

      while (temp.offsetWidth > 48 && currFontsize > 8) {
        currFontsize--
        temp.style.fontSize = currFontsize + 'px'
      }

      this.$refs.IconText.style.fontSize = currFontsize + 'px'
      document.body.removeChild(temp)
    },

    onRightClick(event) {
      const rect = this.$refs.MessageRoot.getBoundingClientRect()
      const ref = this.$refs.ContextMenu.$el.style

      const x = event.pageX - rect.left
      const y = event.pageY - rect.top

      ref.left = x + 'px'
      ref.top = y + 'px'
      ref.display = 'block'

      // 右键菜单会超出屏幕则向左挪144px 144px是右键菜单的宽度
      if (event.pageX + 144 > window.innerWidth) {
        ref.left = x - 144 + 'px'
      }

      event.preventDefault()
      if (!this.rightClicked) {
        this.rightClicked = true
        setTimeout(() => {
          window.addEventListener('click', this.globalClick)  // 点击其它地方，关闭右键菜单
          window.addEventListener('contextmenu', this.globalClick)
        }, 100)
      }
    },

    globalClick(event) {
      // 删除消息时不存在ContextMenu, if防报错
      if (this.$refs.ContextMenu) {
        this.$refs.ContextMenu.$el.style.display = 'none'
      }
      this.rightClicked = false
      window.removeEventListener('click', this.globalClick)
      window.removeEventListener('contextmenu', this.globalClick)
    },

    addToFavorite() {
      this.DB.add('Image', {
        time: Date.now(),
        payload: this.payload.content
      })
    },

    showProfile() {
      this.namecardVisible = true

      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/current/${this.uuid}`
      axios.get(URL).then(res => {
        const data = res["data"]
        this.bio = data["bio"]
        this.lastSeen = data["lastSeen"]
      }).catch(err => {
        console.log(err)
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
        cb.writeText(this.payload)
      }
      if (this.type === 'image') {
        const blob = this.base64ToBlob(this.payload, "image/png")
        cb.write([
          new ClipboardItem({ "image/png": blob })
        ])
      }
    },

    deleteMsg() {
      this.$emit('deleteMsg', this.time)
    },

    forwardMsg() {
      this.$emit('forwardMsg', {
        type: this.type,
        payload: this.payload,
      })
    },

    revokeMsg() {
      this.$emit('revokeMsg', this.time)
    }
  },

  computed: {
    getNameplate() {
      // 排除没有Nameplate的消息类型
      if (['revoke'].includes(this.type)) { return }

      if (this.owner.has(this.uuid)) {
        this.$nextTick(() => {
          this.$refs.Nameplate.style.display = "block"
          this.$refs.Nameplate.style.backgroundColor = "gold"
        })
        return "群主"
      }

      if (this.admin.has(this.uuid)) {
        this.$nextTick(() => {
          this.$refs.Nameplate.style.display = "block"
          this.$refs.Nameplate.style.backgroundColor = "aqua"
        })
        return "管理员"
      }

      this.$nextTick(() => {
        this.$refs.Nameplate.style.display = "none"
      })
      return ""
    },

    downloadSPD() {
      return this.fileSize(this.download.speed) + '/s'
    },

    downloadETC() {
      const remain = this.payload.size * (100 - this.download.rate) / 100
      const speed = this.download.speed
      const time = remain / speed

      if (!Number.isFinite(time)) {
        return ""
      }
      if (time <= 60) {
        return "还需" + time.toFixed(0) + "秒"
      }
      if (time <= 60 * 60) {
        return "还需" + (time / 60).toFixed(0) + "分"
      }
      return "还需" + (time / 60 / 60).toFixed(0) + "时"
    },
  },

  watch: {
    payload: {
      handler() {
        this.getContent()
      }
    }
  },

  async mounted() {
    await this.getFavoriteDB()
    this.getContent()
    this.dynamicFontsize()
    this.formatedTime = this.computeTime(this.time)
  },

  components: {
    messageMenu,
  }

}
</script>

<style scoped>
.messageRoot {
  position: relative;
}

.avatar img {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transform: translateY(8px);
}

.message {
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
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-width: 192px;
  justify-content: space-around;
}

.fileTypeInnerL p {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.downloadingInfo {
  display: flex;
  justify-content: space-between;
}

.fileTypeInnerR {
  position: relative;
  width: 64px;
  height: 64px;
  margin: auto 0;
}

.iconInnerText {
  position: absolute;
  top: 20px;
  left: 8px;
  width: 48px;
  height: 24px;
  line-height: 26px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fileTypeIcon {
  width: 64px;
  height: 64px;
}

.broadcastType {
  max-width: calc(100% - 112px);
  margin: 0 auto;
  text-align: center;
  margin-bottom: 24px;
}

.time {
  font-size: 0.75rem;
  margin: 0 8px;
  direction: ltr;
}

.contextMenu {
  display: none;
  position: absolute;
  direction: ltr;
}

:deep(.el-dialog__body) {
  padding-top: 0;
}

.namecard {
  display: flex;
  width: 100%;
}

.namecardAvatar img {
  width: 96px;
  height: 96px;
  border-radius: 16px;
}

.namecardInfo {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin-left: 32px;
}

.namecardInfo span {
  display: flex;
  margin: 12px 0;
}

.namecardInfo span:nth-child(1) {
  margin-top: 0;
}

.namecardInfo span i:nth-child(1) {
  width: 96px;
}

.namecardInfo span i:nth-child(2) {
  width: calc(100% - 96px);
  word-break: break-all;
}

@media screen and (max-width: 1000px) {
  .fileTypeInnerL {
    max-width: 100%;
  }

  .fileTypeInnerR {
    display: none;
  }
}
</style>