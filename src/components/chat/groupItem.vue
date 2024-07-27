<template>
  <div class="groupInfoRoot" ref="groupInfoRoot">
    <img class="groupAvatar" :src="avatar">
    <div class="groupInfo">
      <p class="groupName">{{ name }}</p>
      <p class="currMessage"><i v-if="showAttention">{{ this.attentionContent }}</i>{{ lastMessage }}</p>
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
    isPinned: Boolean,
  },

  data() {
    return {
      unreadCount: 0,
      lastMessage: " ",
      lastMessageTime: "",
      attentionContent: "",
      showAttention: false,
    }
  },

  methods: {
    computeLastMessageTime(timeStamp) {
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
        return month + "/" + date
      }
      return year + "/" + month + "/" + date
    },

    getSummary(message) {
      const type = message.type
      const prefix = message.userName + ": "
      const mapping = {
        text: prefix + message.payload.content,
        revoke: message.payload.content,
        system: message.payload.content,
        image: prefix + "[图片]",
        audio: prefix + "[语音]"
      }
      return mapping[type] || (prefix + "[文件]")
    },

    computeInfo(message) {
      if (!message) {
        this.lastMessage = " "
        this.lastMessageTime = ""
        return
      }

      const lastMessageTime = message.time.substring(0, 10)
      if (this.isPinned) {
        this.$refs.groupInfoRoot.style.order = -1 * lastMessageTime
      } else {
        this.$refs.groupInfoRoot.style.order = 2147483647 - lastMessageTime
      }
      this.lastMessage = this.getSummary(message)
      this.lastMessageTime = this.computeLastMessageTime(lastMessageTime)
    },

    pinnedGroupInit() {
      if (this.$refs.groupInfoRoot.style.order) { return }
      if (this.isPinned) {
        this.$refs.groupInfoRoot.style.backgroundColor = 'lightyellow'
        this.$refs.groupInfoRoot.style.order = 0
      } else {
        this.$refs.groupInfoRoot.style.backgroundColor = 'darkkhaki'
        this.$refs.groupInfoRoot.style.order = 2147483647
      }
    },

    pinnedGroupModified() {
      if (this.isPinned) {
        this.$refs.groupInfoRoot.style.backgroundColor = 'lightyellow'
        const lastMessageTime = 2147483647 - this.$refs.groupInfoRoot.style.order
        this.$refs.groupInfoRoot.style.order = -1 * lastMessageTime
      } else {
        this.$refs.groupInfoRoot.style.backgroundColor = 'darkkhaki'
        const lastMessageTime = -1 * this.$refs.groupInfoRoot.style.order
        this.$refs.groupInfoRoot.style.order = 2147483647 - lastMessageTime
      }
    },

    hasGroupAttention() {

    }
  },

  computed: {
    getLastMessage() {
      return this.$store.state[`lastMessageOf${this.group}`]
    },

    needAttention() {
      return this.$store.state.groupAttentions
    }
  },

  watch: {
    getLastMessage: {
      deep: true,
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
          this.showAttention = false
        }
      }
    },

    isPinned: {
      handler() {
        this.pinnedGroupModified()
      }
    },

    needAttention: {
      deep: true,
      handler(attentions) {
        if (!attentions.has(this.group)) {
          this.showAttention = false
          return
        }

        const content = {
          at: "有人@你"
        }
        this.attentionContent = content[attentions.get(this.group)]
        this.showAttention = true
      }
    }

  },

  mounted() {
    this.pinnedGroupInit()
  }
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