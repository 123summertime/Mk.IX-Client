<template>
  <div class="audioMsg">
    <div class="beforeBar">
      <VideoPlay></VideoPlay>
    </div>
    <div class="bar" ref="Bar">
      111
    </div>
    <div class="afterBar">
      <p>{{ message.payload.meta.length + 's' }}</p>
    </div>
    <audio></audio>
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
      currentState: "pending",
      audioFile: null,
    }
  },

  methods: {
    buildOrGetDB() {
      const db = new Dexie(this.$store.state['account'] + '-' + this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DB = new dbCRUD(db)
    },

    getMessageBoxWidth() {
      console.log(JSON.parse(JSON.stringify(this.message.payload)))
      const width = 10 * this.message.payload.meta.length + 100
      this.$refs.Bar.style.width = width + 'px'
    },

    getState() {
      // 如果该语音被下载过，那么直接读取payload.meta.blob (state: downloaded)
      // 没有被下载过，则发送请求 (state: pending)
      this.currentState = this.message.payload.meta.blob ? "downloaded" : "pending"
    },

    downloading() {
      const url = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/download/${this.message.payload.content}`

      axios.get(url, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      }).then(res => {
        this.buildOrGetDB()
        this.audioFile = new Blob([res.data])
        const payloadCopy = JSON.parse(JSON.stringify(this.message.payload))
        payloadCopy.meta.blob = this.audioFile
        this.DB.update('History', {
          time: this.message.time,
          type: "audio",
          uuid: this.message.uuid,
          payload: payloadCopy
        })
      }).catch(err => {
        ElMessage({
          message: `下载语音失败 ${err}`,
          duration: 6000,
          type: "error",
        })
      })
    }
  },

  mounted() {
    this.getMessageBoxWidth()
    this.getState()
    this.downloading()
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
  margin-left: 8px;
  margin-right: 16px;
}
</style>