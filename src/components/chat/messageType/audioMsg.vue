<template>
  <div class="audioMsg" @click="clickHandler">
    <div class="beforeBar">
      <VideoPause v-if="currentState === 'play'"></VideoPause>
      <VideoPlay v-else></VideoPlay>
    </div>
    <div class="bar" ref="Bar">
      <audio :src="audioURL" ref="Audio"
        @canplaythrough="playAfterDownload"
        @timeupdate="audioPlaying"
        @ended="audioEnd"></audio>
      <div class="progressWrapper" @click="changeProgress">
        <div class="progress" ref="Progress"></div>
      </div>
    </div>
    <div class="afterBar">
      <p>{{ Math.round(message.payload.meta.length) + '"' }}</p>
    </div>
  </div>
</template>

<script>
import Dexie from 'dexie'
import axios from 'axios'

import { dbCRUD } from '../../../assets/dbCRUD'

export default {
  props: {
    group: String,
    message: Object
  },

  data() {
    return {
      currentState: "pending", // pending | downloading | pause | playing
      audioURL: null,
      progress: 0,
    }
  },

  methods: {
    buildOrGetDB() {
      const db = new Dexie(this.$store.state.account + '-' + this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DB = new dbCRUD(db)
    },

    getMessageBoxWidth() {
      const width = 16 * this.message.payload.meta.length + 16
      this.$refs.Bar.style.width = width + 'px'
    },

    getState() {
      // 如果该语音被下载过，那么直接读取payload.meta.blob (currentState: pause)
      // 没有被下载过，则发送请求 (currentState: pending)

      this.currentState = this.message.payload.meta.blob ? "pause" : "pending"
      if (this.currentState === 'pause') {
        this.audioURL = URL.createObjectURL(this.message.payload.meta.blob)
      }
    },

    downloading() {
      // 下载中和下载成功currentState为downloading
      // 下载失败currentState为pending

      this.currentState = "downloading"
      const url = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/download/${this.message.payload.content}`
      axios.get(url, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      }).then(res => {
        this.buildOrGetDB()
        const blob = new Blob([res.data])
        const payloadCopy = JSON.parse(JSON.stringify(this.message.payload))
        payloadCopy.meta.blob = blob
        this.DB.update('History', {
          time: this.message.time,
          type: "audio",
          uuid: this.message.uuid,
          payload: payloadCopy
        })
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

    playAfterDownload() {
      // 下载完后自动播放
      if (this.currentState === "downloading") {
        this.currentState = "play"
        this.$refs.Audio.play()
      }
    },

    clickHandler() {
      const mapping = {
        pending: this.downloading,
        downloading: () => {},
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

    audioPlaying() {
      const progress = this.$refs.Audio.currentTime / this.message.payload.meta.length * 100
      this.progress = progress ? progress : 0
    },

    audioEnd() {
      this.currentState = "pause"
      this.$refs.Audio.currentTime = 0
    },

    changeProgress(event) {
      event.stopPropagation()
      const clickPos = event.offsetX
      const width = this.$refs.Bar.offsetWidth
      this.progress = clickPos / width * 100
      this.$refs.Audio.currentTime = this.message.payload.meta.length * this.progress / 100
    },

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
  height: 48px;
  max-width: 100%;
  background-color: orangered;
  cursor: pointer;
}

.audioMsg p {
  font-size: 1.2rem;
  line-height: 1.5rem;
}

.beforeBar svg {
  height: 24px;
}

.bar {
  width: 100%;
  height: 8px;
  margin: auto 8px;
}

.progressWrapper {
  width: 100%;
  height: 100%;
  background-color: #E5EAF3;
  border-radius: 4px;
}

.progress {
  width: 0;
  height: 100%;
  background-color: #409EFF;
  border-radius: 4px;
}
</style>