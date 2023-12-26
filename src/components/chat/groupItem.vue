<template>
  <div class="groupInfoRoot" ref="groupInfoRoot">
    <img class="groupAvatar" :src="'data:image/png;base64,' + avatar">
    <div class="groupInfo">
      <p class="groupName">{{ name }}</p>
      <p class="currMessage">{{ lastMessage }}</p>
    </div>
    <div class="information">
      <div :class="lastMessageTime ? 'time' : 'time hidden'">{{ lastMessageTime }}</div>
      <div :class="unreadCount ? 'unread' : 'unread hidden'">{{ unreadCount <= 99 ? unreadCount : "99+"}}</div>   
    </div>
  </div>
</template>

<script>
export default {
  props: {
    avatar: String,
    group: String,
    name: String,
    active: Boolean,
  },

  data() {
    return {
      lastMessage: " ",
      unreadCount: 0,
      lastMessageTime: "",
    }
  },

  methods: {
    computeLastMessageTime(timeStamp) {
      const time = new Date(Number(timeStamp) * 1000)
      const year = time.getFullYear()
      const month = time.getMonth() + 1
      const date = time.getDate()
      const day = time.getDay()
      let hours = time.getHours()
      let minutes = time.getMinutes()
      const current = Math.round(new Date() / 1000)
      const delta = current - timeStamp
      if (delta < 86400) {
        hours = (hours < 10) ? "0" + hours : hours
        minutes = (minutes < 10) ? "0" + minutes : minutes
        return hours + ":" + minutes
      }
      if (delta < 2 * 86400) {
        return "昨天"
      }
      if (delta < 7 * 86400) {
        const days = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期天"]     
        return days[day]
      }
      if (delta < 365 * 86400) {
        return month + "月" + date + "日"
      }
      return year + "年" + month + "月" + date + "日"
    }
  },

  computed: {
    newMessage() {
      return this.$store.state[this.group]
    }
  },

  watch: {
    newMessage: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          const short = newVal["time"].substring(0, 10)
          this.$refs.groupInfoRoot.style.order = 2147483647 - short
          this.lastMessage = newVal["userName"] + ":" + newVal["payload"]
          this.lastMessageTime = this.computeLastMessageTime(short)
          if (!this.active) {
            this.unreadCount += 1
          }
        }
      }
    },

    active: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.unreadCount = 0
        }
      }
    }
  },

}
</script>

<style scoped>
.groupInfoRoot {
  display: flex;
  padding: 8px 16px;
}

.groupAvatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  margin: auto 0;
}

.groupInfo {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex-grow: 1;
  padding: 6px 0;
  margin-left: 12px;
  overflow: hidden;
}

.groupName {
  width: 100%;
  font-size: 1.2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.information {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items:flex-end;
  padding: 6px 0;
}

.time {
  white-space: nowrap;
  font-size: 0.75rem;
}

.unread {
  padding: 0 6px;
  border-radius: 8px;
  background-color: coral;
}

.hidden {
  visibility: hidden;
}

.currMessage {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: gray;
}
</style>