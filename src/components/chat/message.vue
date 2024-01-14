<template>
  <div :class="messageFrom() ? 'message bySelf' : 'message'">
    <div class="avatar">
      <img :src="'data:image/png;base64,' + avatar">
    </div>
    <div class="container">
      <div class="upper">
        <p class="nameplate" ref="Nameplate">{{ nameplate }}</p>
        <p class="userName">{{ userName }}</p>
      </div>
      <div class="lower">
        <p class="payload textType" v-if="type=='text'">{{ payload }}</p>
        <img class="payload imgType" v-if="type=='image'" :src="payload">
        <p class="time">{{ formatedTime }}</p>
      </div>
    </div>
  </div>
</template>

<script>
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
      nameplate: "",
      formatedTime: "",
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
    }
  },

  mounted() {
    this.getNameplate()
    this.formatedTime = this.computeMessageTime(this.time)
  }

}
</script>

<style scoped>
.avatar img {
  display: inline-block;
  width: 3rem;
  height: 3rem;
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
  padding: 0.8rem 1rem;
  margin-top: 6px;
  direction: ltr;
}

.textType {
  font-size: 1.2rem;
  line-height: 1.5rem;
}

.imgType {
  max-height: 50vh;
}

.time {
  font-size: 0.75rem;
  margin: 0 8px;
  direction: ltr;
}
</style>