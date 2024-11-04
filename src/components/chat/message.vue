<template>
  <div class="messageRoot" ref="MessageRoot">

    <div v-if=isBroadcastType @contextmenu.prevent="onRightClick">
      <broadcast class="payload" :group="group" :message="message"></broadcast>
    </div>

    <div :class="messageFrom() ? 'message bySelf' : 'message'" v-else>
      <div class="avatar"
        @click="showNamecard"
        @mousedown="longPressNewAt"
        @mouseup="cancelAt"
        @mouseleave="cancelAt"
        @contextmenu.prevent="dispatchNewAt">
        <img :src="message.avatar">
      </div>
      <div class="container">
        <div class="upper">
          <p :class="['nameplate', getNameplate == '群主' ? 'ownerNameplate' : 'adminNameplate']" v-if=getNameplate>{{ getNameplate }}</p>
          <p class="username">{{ message.username }}</p>
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
      :uuid="message.uuid"
      :avatar="message.avatar"
      :username="message.username"
      :namecardTrigger="namecardTrigger">
    </namecard>

  </div>
</template>

<script>
import { computeTime } from './../../assets/utils'

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
      formatedTime: "",
      namecardTrigger: false,
      rightClicked: false,
      showGroupSelector: false,
      isLongPress: false,
      longPressTimer: null,
    }
  },

  methods: {
    // 这条消息是自己发的吗?
    messageFrom() {
      return this.message.uuid === this.$store.state.account
    },

    // 右键消息，打开菜单栏
    onRightClick(event) {
      const rect = this.$refs.MessageRoot.getBoundingClientRect()
      const ref = this.$refs.ContextMenu.$el.style

      const x = event.pageX - rect.left
      const y = event.pageY - rect.top

      ref.left = x + 'px'
      ref.top = y + 'px'
      ref.display = 'flex'

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

    // 打开菜单栏后，在非菜单栏区域点击(无论左键还是右键)时，关闭菜单栏
    globalClick() {
      // 删除消息时不存在ContextMenu
      if (this.$refs.ContextMenu) {
        this.$refs.ContextMenu.$el.style.display = 'none'
      }
      this.rightClicked = false
      window.removeEventListener('click', this.globalClick)
      window.removeEventListener('contextmenu', this.globalClick)
    },

    // 单击打开用户的名片
    showNamecard() {
      if (!this.isLongPress) {
        this.namecardTrigger = !this.namecardTrigger
      }
    },

    deleteMsg() {
      this.$emit('deleteMsg', this.message.time)
    },

    // 转发消息，打开群选择器(groupSelector.vue)
    forwardMsg() {
      this.showGroupSelector = true
    },

    // 转发消息，选择了目标群，如果转发的是file类型，消息类型改为forwardFile
    groupSelectorSelected(groupID) {
      const newPayload = JSON.parse(JSON.stringify(this.message.payload))
      newPayload.meta = null

      this.$store.state.ws.send(JSON.stringify({
        type: this.message.type === "file" ? "forwardFile" : this.message.type,
        group: groupID,
        payload: newPayload,
      }))
      this.showGroupSelector = false
    },

    groupSelectorCanceled() {
      this.showGroupSelector = false
    },

    // 撤回一条消息
    revokeMsg() {
      this.$emit('revokeMsg', this.message.time)
    },

    // 长按头像@别人
    longPressNewAt() {
      this.isLongPress = false
      if (this.messageFrom()) { return }

      const activeDelay = 400
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true
        this.dispatchNewAt()
      }, activeDelay)
    },

    // 右键头像@别人
    rightPressNewAt(event) {
      event.preventDefault()
      this.dispatchNewAt()
    },

    dispatchNewAt() {
      this.$store.dispatch("getNewAt", {
        uuid: this.message.uuid,
        username: this.message.username,
      })
    },

    cancelAt() {
      clearTimeout(this.longPressTimer)
    }
  },

  computed: {
    getNameplate() {
      // 排除没有Nameplate的消息类型
      if (this.message.type === 'revoke') { return "" }
      if (this.admins.owner[this.message.uuid]) { return "群主" }
      if (this.admins.admin[this.message.uuid]) { return "管理员" }
      return ""
    },

    isBroadcastType() {
      return this.message.type === 'revoke' || this.message.type === 'system'
    }
  },

  async mounted() {
    this.formatedTime = computeTime(this.message.time)
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
  padding: 0.8rem 1.5rem;
}

.avatar img {
  position: relative;
  display: block;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  transform: translateY(0.8rem);
  cursor: pointer;
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
  margin: 0 0.5rem;
}

.upper {
  display: flex;
  align-items: flex-end;
  height: 1.5rem;
  white-space: nowrap;
  direction: ltr;
}

.nameplate {
  height: 1.5rem;
  line-height: 1.5rem;
  margin-right: 0.5rem;
  padding: 0 0.5rem;
  border-radius: 6px;
  color: var(--message-nameplate-textcolor);
}

.username {
  color: var(--message-username-textcolor);
}

.ownerNameplate {
  background: var(--owner);
}

.adminNameplate {
  background: var(--admin);
}

.lower {
  display: flex;
  align-items: flex-end;
  max-width: 100%;
  margin-top: 0.5rem;
}

.payload {
  word-wrap: break-word;
  white-space: pre-wrap;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  direction: ltr;
}

.time {
  font-size: 0.8rem;
  margin: 0 4px;
  white-space: nowrap;
  direction: ltr;
  color: var(--message-time-textcolor);
}

.contextMenu {
  display: none;
  position: absolute;
  direction: ltr;
}

@media screen and (max-width: 768px) {
  .container {
    max-width: calc(100% - 4rem);
  }
}
</style>