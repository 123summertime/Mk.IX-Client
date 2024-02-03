<template>
  <div class="groupInfoRoot" ref="groupInfoRoot">
    <img class="groupAvatar" :src="avatar">
    <div class="groupInfo">
      <p class="groupName">{{ name }}</p>
      <p class="currMessage">{{ lastMessage }}</p>
    </div>
    <div class="information">
      <div :class="lastMessageTime ? 'time' : 'time hidden'">{{ lastMessageTime }}</div>
      <div :class="unreadCount ? 'unread' : 'unread hidden'">{{ unreadCount <= 99 ? unreadCount : "99+" }}</div>
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
      unreadCount: 0,
      lastMessage: " ",
      lastMessageTime: "",
    }
  },

  methods: {
    computeLastMessageTime(timeStamp) {
      const time = new Date(Number(timeStamp) * 1000)
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
        return month + "/" + date
      }
      return year + "/" + month + "/" + date
    },

    cvtPayload(type, payload) {
      if (type === "text") {
        return payload
      }
      if (type === "image") {
        return "[图片]"
      } 
      return "[文件]"
    },

    computeInfo(message) {
      const short = message["time"].substring(0, 10)
      this.$refs.groupInfoRoot.style.order = 2147483647 - short
      this.lastMessage = message["userName"] + ": " + this.cvtPayload(message["type"] ,message["payload"])
      this.lastMessageTime = this.computeLastMessageTime(short)
    }
  },

  computed: {
    getLastMessage() {
      return this.$store.state[`lastMessageOf${this.group}`]
    }
  },

  watch: {
    getLastMessage: {
      handler(newVal) {
        if (newVal) {
          this.computeInfo(newVal)
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
  width: 48px;
  height: 48px;
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
  align-items: flex-end;
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