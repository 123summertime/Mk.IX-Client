<template>
  <div :class="['groupInfoRoot', rootClasses]" ref="groupInfoRoot">
    <div class="groupAvatar">
      <img :src="avatar" alt="avatar">
    </div>
    
    <div class="groupInfo">
      <p :class="['groupName', 'noOverflow', active ? 'groupNameActive' : '']">{{ name }}</p>
      <p :class="['currMessageContext', 'noOverflow', active ? 'currMessageContextActive': '']" >
        <i>
          <i class='attention' v-if="showAttention">{{ `[${this.attentionContent}]` }}</i>
          {{ lastMessage }}
        </i>
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
        this.$refs.groupInfoRoot.style.order = 2147483647
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
      const a = this.$store.state[`lastMessageOf${this.group}`]
      return a
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
        this.computeInfo(newVal)
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
  background-color: var(--groupItem-hover-bgcolor);
}

.pinnedBg {
  background-color: var(--groupItem-pinnedBg);
}

.noramlBg {
  background-color: var(--groupItem-normal-bgcolor);
}

.activeBg {
  background-color: var(--groupItem-active-bgcolor) !important;
}

.groupAvatar {
  flex: 0 0 48px;
}

.noOverflow {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.groupAvatar img {
  width: 100%;
  border-radius: 50%;
}

.groupInfo {
  flex: 1;
  height: 100%;
  margin: 0 12px;
  overflow: hidden;
}

.groupName {
  font-size: 1.2rem;
  color: var(--groupItem-groupName-textcolor);
}

.groupNameActive {
  color: var(--groupItem-groupNameActive-textcolor)
}

.attention {
  color: var(--groupItem-attention-textcolor);
  margin-right: 2px;
}

.currMessageContext {
  width: 100%;
  color: var(--groupItem-currMessageContext-textcolor);
}

.currMessageContextActive {
  color: var(--groupItem-currMessageContextActive-textcolor);
}

.rightSide {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: end;
}

.time {
  height: 24px;
  white-space: nowrap;
  font-size: 0.8rem;
  line-height: 24px;
  color: var(--groupItem-time-textcolor);
}

.timeActive {
  color: var(--groupItem-timeActive-textcolor);
}

.unread {
  height: 20px;
  margin: 2px 0;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 0.8rem;
  line-height: 20px;
  text-align: center;
  background-color: var(--groupItem-unread-bgcolor);
  color: var(--groupItem-unreadText-textcolor);
}
</style>