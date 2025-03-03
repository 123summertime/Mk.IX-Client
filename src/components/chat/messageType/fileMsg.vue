<template>
  <div class="fileMsg" @click="downloading">
    <div class="fileMsgInnerL">
      <p :title="message.payload.name"> {{ message.payload.name }}</p>
      <p v-if="download.state == 'pending'" :title="fileSize(message.payload.size)"> {{ fileSize(message.payload.size) }}</p>
      <p v-else-if="download.state == 'downloading'" class="downloadingInfo">
        <i>{{ downloadSPD }}</i><i>{{ downloadETC }}</i>
      </p>
      <p v-else-if="download.state == 'success'">下载完成</p>
      <p v-else>下载失败</p>
    </div>
    <div class="fileMsgInnerR">
      <div v-if="download.state == 'pending'">
        <Folder class="fileMsgIcon" />
        <p ref="IconText" class="iconInnerText">{{ message.payload.name.split('.').slice(-1)[0] }}</p>
      </div>
      <div v-else>
        <canvas width="64" height="64" ref="progress"></canvas>
        <p v-if="download.state == 'downloading'" class="iconInnerText">{{ download.rate.toFixed(0) + '%' }}</p>
        <Check v-else-if="download.state == 'success'" :style="{ color: getGreenColor }" class="iconInnerText"></Check>
        <Close v-else :style="{ color: getRedColor }" class="iconInnerText"></Close>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: {
    group: String,
    type: String,
    message: Object
  },

  data() {
    return {
      download: {
        state: "pending", // 文件的状态 为以下之一 pending(未下载) | downloading(下载中) | success(成功) | failed(失败)
        speed: 0,         // 下载速度
        rate: 0,          // 下载进度
      },
    }
  },

  methods: {
    // 下载文件，同时更新进度条
    downloading() {
      if (this.download.state === "downloading") { return }

      this.download.state = "downloading"
      const url = this.type === 'group' 
        ? `${localStorage.getItem('adress')}/v1/group/${this.group}/download/${this.message.payload.content}`
        : `${localStorage.getItem('adress')}/v1/user/${this.group}/download/${this.message.payload.content}`
      axios.get(url, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        onDownloadProgress: event => {
          this.download.speed = event.rate ?? 0
          this.download.rate = event.progress * 100 ?? 0
          this.canvasDrawer(this.download.rate, this.getNeutralColor, this.getGreenColor)
          if (this.download.rate >= 100) {
            this.canvasDrawer(0, this.getGreenColor, '#114514')
            this.download.state = "success"
          }
        }
      }).then(res => {
        let blob = new Blob([res.data])
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = this.message.payload.name
        link.click()
        // 清理
        URL.revokeObjectURL(link.href)
        blob = null
      }).catch(err => {
        this.canvasDrawer(0, this.getRedColor, '#114514')
        this.download.state = "failed"
        ElMessage({
          message: `下载文件失败`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 绘画进度条
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

    // 计算文件大小 转化为可读的形式
    fileSize(size) {
      const mb = 1 << 20
      const kb = 1 << 10

      size = Number(size)
      if (size >= mb) {
        return (size / mb).toFixed(2) + "MB"
      }
      if (size >= kb) {
        return (size / kb).toFixed(2) + "KB"
      }
      return size.toFixed(0) + "B"
    },

    // 计算字体大小，从而正好匹配文件夹的图标大小
    dynamicFontsize() {
      if (!this.$refs.IconText) { return }

      let currFontsize = 16
      const temp = document.createElement('span')
      temp.style.fontSize = currFontsize + 'px'
      temp.innerText = this.message.payload.name.split('.').slice(-1)[0]
      document.body.appendChild(temp)

      while (temp.offsetWidth > 48 && currFontsize > 8) {
        currFontsize--
        temp.style.fontSize = currFontsize + 'px'
      }

      this.$refs.IconText.style.fontSize = currFontsize + 'px'
      document.body.removeChild(temp)
    },

  },

  computed: {
    // 计算下载速度
    downloadSPD() {
      return this.fileSize(this.download.speed) + '/s'
    },

    // 计算剩余时间
    downloadETC() {
      const remain = this.message.payload.size * (100 - this.download.rate) / 100
      const speed = this.download.speed
      const time = remain / speed
      if (!Number.isFinite(time)) {
        return ""
      }
      if (time <= 60) {
        return "还需" + time.toFixed(0) + "秒"
      }
      if (time <= 60 * 60) {
        return "还需" + (time / 60).toFixed(0) + "分" + (time % 60).toFixed(0) + "秒"
      }
      return "还需" + (time / 3600).toFixed(0) + "时" + (time % 3600).toFixed(0) + "分"
    },

    getNeutralColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--neutral-2').trim()
    },

    getGreenColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-3').trim()
    },

    getRedColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-2').trim()
    }
  },

  mounted() {
    this.dynamicFontsize()
  }

}
</script>

<style scoped>
.fileMsg {
  display: flex;
  width: 300px;
  max-width: calc(100% - 3rem);
  height: 100px;
  background: var(--message-file-bgcolor);
  cursor: pointer;
}

.fileMsgInnerL {
  width: calc(100% - 64px);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding-right: 4px;
}

.fileMsgInnerL p {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fileMsgInnerL p, .fileMsgInnerL p i {
  color: var(--message-contentSec-textcolor);
}

.fileMsgInnerL p:first-child {
  font-size: 1.2rem;
  color: var(--message-content-textcolor);
}

.fileMsgInnerR {
  flex: 0 0 64px;
  position: relative;
  width: 64px;
  height: 64px;
  margin: auto 0;
}

.downloadingInfo {
  display: flex;
  justify-content: space-between;
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
  color: var(--message-fileRightSide-textcolor);
}

.fileMsgIcon {
  width: 64px;
  height: 64px;
  color: var(--message-fileRightSide-textcolor);
}
</style>