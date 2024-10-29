<template>
  <div class="audioMsg" @click="clickHandler">
    <div class="beforeBar">
      <VideoPause v-if="currentState === 'play'"></VideoPause>
      <VideoPlay v-else></VideoPlay>
    </div>
    <div class="bar" ref="Bar">
      <audio :src="audioURL" ref="Audio"
        @canplaythrough="playAfterLoaded"
        @timeupdate="audioPlaying"
        @ended="audioEnd"></audio>
      <div class="progressWrapper" ref="ProgressWrapper" @click="changeProgress">
        <ul class="volumes">
          <li class="volume" v-for="vol in message.payload.meta.volume" :style="`height: ${volumeHeight(vol)};`"></li>
        </ul>
        <div class="progress" ref="Progress">
          <div class="progressLine" v-show="progress != 0"></div>
        </div>
      </div>
    </div>
    <div class="afterBar">
      <p>{{ Math.round(message.payload.meta.length) + '"' }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: {
    group: String,
    message: Object
  },

  data() {
    return {
      currentState: "pending", // 语音的状态 为以下之一 pending(未下载) | downloading(下载中) | downloaded(已下载) | pause(暂停) | play(播放中)
      audioURL: null,          // 语音的blobURL
      progress: 0,             // 播放百分比
    }
  },

  methods: {
    getDB() {
      this.DB = this.$store.state.groupDB[this.group]
    },

    // 计算该语音消息宽度，和语音长度成正比
    getMessageBoxWidth() {
      const width = 12 * this.message.payload.meta.length + 16
      this.$refs.Bar.style.width = width + 'px'
    },

    // 获取当前状态
    getState() {
      // 如果该语音被下载过或直接传入，那么直接读取payload.meta.blob (currentState: downloaded)
      // 没有被下载过，则发送请求 (currentState: pending)
      this.currentState = this.message.payload.meta.blob ? "downloaded" : "pending"
    },

    // 下载该语音
    downloading() {
      this.currentState = "downloading"
      const url = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/download/${this.message.payload.content}`
      axios.get(url, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      }).then(res => {
        this.getDB()
        const blob = new Blob([res.data])
        const payloadCopy = JSON.parse(JSON.stringify(this.message.payload))
        payloadCopy.meta.blob = blob
        this.DB.update('History', {
          time: this.message.time,
          type: "audio",
          uuid: this.message.uuid,
          payload: payloadCopy
        })
        this.currentState = "downloaded"
        this.audioURL = URL.createObjectURL(blob)
      }).catch(err => {
        ElMessage({
          message: `下载语音失败 ${err}`,
          progress: 6000,
          type: "error",
        })
        this.currentState = "pending"
      })
    },

    // 语音加载完毕后播放
    playAfterLoaded() {
      if (this.currentState === 'downloaded') {
        this.currentState = "play"
        this.$refs.Audio.play()
      }
    },

    clickHandler() {
      const mapping = {
        pending: this.downloading,
        downloading: () => { },
        downloaded: () => {
          this.audioURL = URL.createObjectURL(this.message.payload.meta.blob)
        },
        pause: () => {
          this.currentState = "play"
          this.$refs.Audio.play()
        },
        play: () => {
          this.currentState = "pause"
          this.$refs.Audio.pause()
        },
      }
      mapping[this.currentState]()
    },

    // 播放时更新播放进度
    audioPlaying() {
      const progress = Math.min(this.$refs.Audio.currentTime / this.message.payload.meta.length * 100, 100)
      this.progress = progress ? progress : 0
    },

    // 播放完成时
    audioEnd() {
      this.currentState = "pause"
      this.$refs.Audio.currentTime = 0
    },

    // 点击进度条时，进行跳转
    changeProgress(event) {
      if (this.currentState === 'pending') { return }

      event.stopPropagation()
      const clickPos = event.clientX - this.$refs.ProgressWrapper.getBoundingClientRect().left
      const width = this.$refs.ProgressWrapper.offsetWidth
      this.progress = clickPos / width * 100
      this.$refs.Audio.currentTime = this.message.payload.meta.length * this.progress / 100
      if (this.currentState === 'pause') {
        this.clickHandler()
      }
    },

    // 计算音量条高度
    volumeHeight(volume) {
      return `${volume * 0.16 + 8}px`
    }
  },

  watch: {
    progress: {
      handler(newVal) {
        this.$refs.Progress.style.width = newVal + "%"
      }
    }
  },

  mounted() {
    this.getMessageBoxWidth()
    this.getState()
  }
}
</script>

<style scoped>
.audioMsg {
  display: flex;
  justify-content: center;
  max-width: 90%;
  height: 48px;
  background: var(--message-common-bgcolor);
  cursor: pointer;
}

.audioMsg p {
  font-size: 1.2rem;
  line-height: 24px;
}

.beforeBar svg {
  height: 24px;
}

.beforeBar svg, .afterBar p {
  color: var(--message-content-textcolor);
}

.bar {
  width: 100%;
  height: 24px;
  margin-left: 8px;
  margin-right: 12px;
}

.progressWrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.volumes {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.volume {
  width: 6px;
  border-radius: 3px;
  background: var(--message-volume-bgcolor);
}

.progress {
  display: flex;
  justify-content: right;
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 24px;
  background: var(--message-progress-bgcolor);
  mix-blend-mode: darken;
}

.progressLine {
  height: 48px;
  border-right: 2px solid black;
  transform: translateY(-12px);
}

@media screen and (max-width: 1200px) {
  .volumes {
    display: none;
  }
}
</style>