<template>
  <el-dialog v-model="namecardVisible" width="540px">
      <div class="namecard">
        <div class="namecardAvatar">
          <img :src="message.avatar" />
        </div>
        <div class="namecardInfo">
          <span>
            <i>昵称:</i>
            <i>{{ message.userName }}</i>
          </span>
          <span>
            <i>uuid:</i>
            <i>{{ message.uuid }}</i>
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
</template>

<script>
import axios from 'axios'

export default {
  props: {
    message: Object,
    namecardTrigger: Boolean,
  },

  data() {
    return {
      namecardVisible: false,
      bio: "",
      lastSeen: "",
    }
  },

  methods: {
    // 获取用户详细信息(个人简介，最后登录等)
    showProfile() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/current/${this.message.uuid}`
      axios.get(URL).then(res => {
        const data = res.data
        this.bio = data.bio
        this.lastSeen = data.lastSeen
      }).catch(err => {
        console.log(err)
      })
    },

    computeTime(timeStamp) {
      timeStamp = Math.round(Number(timeStamp.substring(0, 10)))  // 精确到秒的时间戳(10位)
      const todayMidnight = new Date().setHours(0, 0, 0, 0) / 1000

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
  },

  watch: {
    // 当namecardTrigger改变时，就说明要显示namecard了，跟它的值没有关系
    namecardTrigger: {
      handler() {
        this.namecardVisible = true
        this.showProfile()
      }
    }
  },

}
</script>

<style scoped>
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
</style>