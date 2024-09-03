<template>
  <div class="groupInfoRoot" ref="groupInfoRoot">
    <img class="groupAvatar" :src="avatar">
    <div class="groupInfo">
      <p class="groupName">{{ name }}</p>
      <p class="currMessage">
        <i class="attention" v-if="showAttention">{{ `[${this.attentionContent}]` }}</i>
        <i>{{ lastMessage }}</i>
      </p>
    </div>
    <div class="information">
      <div :class="lastMessageTime ? 'time' : 'time hidden'">{{ lastMessageTime }}</div>
      <div :class="unreadCount ? 'unread' : 'unread hidden'">{{ unreadCount <= 99 ? unreadCount : "99+" }}</div>
    </div>
  </div>
</template>

<script>
import { computeTime } from './../../assets/utils'

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
      let formatedTime = computeTime(timeStamp)
      let idx = formatedTime.indexOf(" ")
      if (idx != -1) {
        formatedTime = formatedTime.split(" ")[0]
      }
      return formatedTime
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

    // 计算最后一条消息的显示文本
    computeInfo(message) {
      if (!message) {
        this.lastMessage = " "
        this.lastMessageTime = ""
        return
      }

      const lastMessageTime = message.time.substring(0, 10)
      if (this.isPinned) {
        // 对于置顶群(order值都<=0)，-1*时间戳设定order实现按最后消息的时间排序
        this.$refs.groupInfoRoot.style.order = -1 * lastMessageTime
      } else {
        // 对于非置顶群(order值都>0) INT32_MAX-时间戳实现按最后消息的时间排序
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

    // 更改了置顶群聊
    pinnedGroupModified() {
      // 先还原为时间戳，再重新计算order
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
  },

  computed: {
    getNewMessage() {
      return this.$store.state[this.group]
    },

    getLastMessage() {
      return this.$store.state[`lastMessageOf${this.group}`]
    },

    needAttention() {
      return this.$store.state.groupAttentions
    }
  },

  watch: {
    // 未读消息计数
    getNewMessage: {
      handler(newVal) {
        if (!this.active && newVal) {
          this.unreadCount += 1
        }
      }
    },

    // 获取该群最后一条消息
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

    // 有人@你
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

.currMessage i {
  font-size: 1rem;
  line-height: 1rem;
}

.attention {
  color: red;
  margin-right: 4px;
}
</style>