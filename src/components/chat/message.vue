<template>
  <div class="messageRoot" ref="MessageRoot">

    <div v-if=isBroadcastType @contextmenu.prevent="onRightClick">
      <broadcast class="payload" :group="group" :message="message"></broadcast>
    </div>

    <div :class="messageFrom() ? 'message bySelf' : 'message'" v-else>
      <div class="avatar"
        @click="showNamecard"
        @mousedown="newAt"
        @mouseup="cancelAt"
        @mouseleave="cancelAt">
        <img :src="message.avatar">
      </div>
      <div class="container">
        <div class="upper">
          <p class="nameplate" ref="Nameplate">{{ getNameplate }}</p>
          <p class="userName">{{ message.userName }}</p>
        </div>
        <div class="lower" @contextmenu.prevent="onRightClick">
          <textMsg class="payload" v-if="message.type == 'text'" :group="group" :message="message"></textMsg>
          <imageMsg class="payload" v-else-if="message.type == 'image'" :group="group" :message="message"></imageMsg>
          <audioMsg class="payload" v-else-if="message.type == 'audio'" :group="group" :message="message"></audioMsg>
          <fileMsg class="payload" v-else :group="group" :message="message"></fileMsg>
          <p class="time">{{ formatedTime }}</p>
        </div>
      </div>
    </div>

    <messageMenu class="contextMenu" ref="ContextMenu"
      :message="message"
      :admins="admins"
      @deleteMsg="deleteMsg"
      @forwardMsg="forwardMsg"
      @revokeMsg="revokeMsg">
    </messageMenu>

    <groupSelector v-if="showGroupSelector" title="转发"
      @groupSelectorSelected="groupSelectorSelected"
      @groupSelectorCanceled="groupSelectorCanceled"></groupSelector>

    <namecard
      :message="message"
      :namecardTrigger="namecardTrigger">
    </namecard>

  </div>
</template>

<script>
import broadcast from './messageType/broadcast.vue'
import fileMsg from './messageType/fileMsg.vue'
import imageMsg from './messageType/imageMsg.vue'
import textMsg from './messageType/textMsg.vue'
import audioMsg from './messageType/audioMsg.vue'
import messageMenu from './messageMenu.vue'
import groupSelector from './groupSelector.vue'
import namecard from './namecard.vue'

export default {
  props: {
    group: String,
    message: Object,
    admins: Object,
  },

  data() {
    return {
      namecardTrigger: 0,
      formatedTime: "",
      rightClicked: false,
      showGroupSelector: false,
      isLongPress: false,
      longPressTimer: null,
    }
  },

  methods: {
    messageFrom() {
      return this.message.uuid === this.$store.state.account
    },

    computeTime(timeStamp) {
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
        return month + "/" + date + " " + T
      }
      return year + "/" + month + "/" + date + " " + T
    },

    onRightClick(event) {
      const rect = this.$refs.MessageRoot.getBoundingClientRect()
      const ref = this.$refs.ContextMenu.$el.style

      const x = event.pageX - rect.left
      const y = event.pageY - rect.top

      ref.left = x + 'px'
      ref.top = y + 'px'
      ref.display = 'block'

      // 右键菜单会超出屏幕则向左挪144px 144px是右键菜单的宽度
      if (event.pageX + 144 > window.innerWidth) {
        ref.left = x - 144 + 'px'
      }

      event.preventDefault()
      if (!this.rightClicked) {
        this.rightClicked = true
        setTimeout(() => {
          window.addEventListener('click', this.globalClick)  // 点击其它地方，关闭右键菜单
          window.addEventListener('contextmenu', this.globalClick)
        }, 100)
      }
    },

    globalClick() {
      // 删除消息时不存在ContextMenu, if防报错
      if (this.$refs.ContextMenu) {
        this.$refs.ContextMenu.$el.style.display = 'none'
      }
      this.rightClicked = false
      window.removeEventListener('click', this.globalClick)
      window.removeEventListener('contextmenu', this.globalClick)
    },

    showNamecard() {
      if (!this.isLongPress) {
        this.namecardTrigger += 1
      }
    },

    deleteMsg() {
      this.$emit('deleteMsg', this.message.time)
    },

    forwardMsg() {
      this.showGroupSelector = true
    },

    groupSelectorSelected(groupID) {
      this.$store.state.wsConnections[groupID].send(JSON.stringify({
        type: this.message.type === "file" ? "forwardFile" : this.message.type,
        payload: this.message.payload,
      }))
      this.showGroupSelector = false
    },

    groupSelectorCanceled() {
      this.showGroupSelector = false
    },

    revokeMsg() {
      this.$emit('revokeMsg', this.message.time)
    },

    newAt() {
      this.isLongPress = false
      if (this.messageFrom()) { return }

      const activeDelay = 400
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true
        this.$store.dispatch("getNewAt", {
          uuid: this.message.uuid,
          userName: this.message.userName,
        })
      }, activeDelay)
    },

    cancelAt() {
      clearTimeout(this.longPressTimer)
    }
  },

  computed: {
    getNameplate() {
      // 排除没有Nameplate的消息类型
      if (this.message.type === 'revoke') { return }

      if (this.admins.owner[this.message.uuid]) {
        this.$nextTick(() => {
          this.$refs.Nameplate.style.display = "block"
          this.$refs.Nameplate.style.backgroundColor = "gold"
        })
        return "群主"
      }

      if (this.admins.admin[this.message.uuid]) {
        this.$nextTick(() => {
          this.$refs.Nameplate.style.display = "block"
          this.$refs.Nameplate.style.backgroundColor = "aqua"
        })
        return "管理员"
      }

      this.$nextTick(() => {
        this.$refs.Nameplate.style.display = "none"
      })
      return ""
    },

    isBroadcastType() {
      return this.message.type === 'revoke' || this.message.type === 'system'
    }
  },

  async mounted() {
    this.formatedTime = this.computeTime(this.message.time)
  },

  components: {
    broadcast,
    fileMsg,
    imageMsg,
    textMsg,
    audioMsg,
    messageMenu,
    groupSelector,
    namecard,
  }

}
</script>

<style scoped>
.messageRoot {
  position: relative;
  padding: 12px;
  border-radius: 24px;
}

.avatar img {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transform: translateY(8px);
}

.message {
  display: flex;
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
  word-wrap: break-word;
  white-space: pre-wrap;
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 6px;
  direction: ltr;
}

.time {
  font-size: 0.75rem;
  margin: 0 4px;
  white-space: nowrap;
  direction: ltr;
}

.contextMenu {
  display: none;
  position: absolute;
  direction: ltr;
}

:deep(.el-dialog__body) {
  padding-top: 0;
}
</style>