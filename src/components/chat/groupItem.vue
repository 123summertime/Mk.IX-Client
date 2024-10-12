<template>
  <div :class="['groupInfoRoot', rootClasses]" ref="groupInfoRoot">
    <img class="groupAvatar" :src="avatar">
    <div class="groupInfo">
      <p :class="['groupName', active ? 'groupNameActive' : '']">{{ name }}</p>
      <p class="currMessage">
        <p :class="['currMessageContext', active ? 'currMessageContextActive': '']">
          <i class='attention' v-if="showAttention">{{ `[${this.attentionContent}]` }}</i>
          {{ lastMessage }}
        </p>
      </p>
    </div>
    <div class="rightSide">
      <p v-show="lastMessageTime" :class="['time', active ? 'timeActive': '']">{{ lastMessageTime }}</p>
      <p v-show="unreadCount" class="unread">{{ unreadCount <= 99 ? unreadCount : "99+" }}</p>
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
      lastMessage: "",
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
      const prefix = message.username + ": "
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
        this.$refs.groupInfoRoot.style.order = 0
      } else {
        this.$refs.groupInfoRoot.style.order = 2147483647
      }
    },

    // 更改了置顶群聊
    pinnedGroupModified() {
      // 先还原为时间戳，再重新计算order
      if (this.isPinned) {
        const lastMessageTime = 2147483647 - this.$refs.groupInfoRoot.style.order
        this.$refs.groupInfoRoot.style.order = -1 * lastMessageTime
      } else {
        const lastMessageTime = -1 * this.$refs.groupInfoRoot.style.order
        this.$refs.groupInfoRoot.style.order = 2147483647 - lastMessageTime
      }
    },
  },

  computed: {
    rootClasses() {
      let cls = this.isPinned ? 'pinnedBg' : 'normalBg'
      if (this.active) cls += " " + "activeBg"
      return cls
    },

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
        if (!attentions.has(this.group) || this.active) {
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
  width: 100%;
  padding: 12px 16px;
  cursor: pointer;
}

.groupInfoRoot:hover {
  background-color: var(--groupItem-hoverBg);
}

.pinnedBg {
  background-color: var(--groupItem-pinnedBg);
}

.noramlBg {
  background-color: var(--groupItem-normalBg);
}

.activeBg {
  background-color: var(--groupItem-activeBg) !important;
}

.groupAvatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.groupInfo {
  height: 100%;
  flex-grow: 1;
  padding: 0 8px 0 12px;
  overflow: hidden;
}

.groupName {
  width: 100%;
  height: 24px;
  font-size: 1.2rem;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: var(--groupItem-groupName);
}

.groupNameActive {
  color: var(--groupItem-groupNameActive)
}

.currMessage i {
  width: 100%;
  height: 100%;
  font-size: 1rem;
  line-height: 24px;
}

.attention {
  color: var(--groupItem-attention);
  margin-right: 4px;
}

.currMessageContext {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: var(--groupItem-currMessageContext);
}

.currMessageContextActive {
  color: var(--groupItem-currMessageContextActive);
}

.rightSide { 
  display: flex;
  flex-direction: column;
  align-items: end;
}

.time {
  height: 24px;
  white-space: nowrap;
  font-size: 0.8rem;
  line-height: 24px;
  color: var(--groupItem-time);
}

.timeActive {
  color: var(--groupItem-timeActive);
}

.unread {
  height: 20px;
  margin: 2px 0;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 0.8rem;
  line-height: 20px;
  text-align: center;
  background-color: var(--groupItem-unread);
  color: var(--groupItem-unreadText);
}
</style>