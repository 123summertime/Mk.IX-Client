<template>
  <div class="messageRoot" ref="MessageRoot">

    <div v-if="message.type === 'revoke'" @contextmenu.prevent="onRightClick">
      <broadcast class="payload" :group="group" :message="message"></broadcast>
    </div>

    <div :class="messageFrom() ? 'message bySelf' : 'message'" v-else>
      <div class="avatar" @click="showProfile">
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
      @deleteMsg="deleteMsg"
      @forwardMsg="forwardMsg"
      @revokeMsg="revokeMsg">
    </messageMenu>

    <el-dialog v-model="namecardVisible" :show-close="false" width="540px">
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

  </div>
</template>

<script>
import axios from 'axios'

import broadcast from './messageType/broadcast.vue'
import fileMsg from './messageType/fileMsg.vue'
import imageMsg from './messageType/imageMsg.vue'
import textMsg from './messageType/textMsg.vue'
import audioMsg from './messageType/audioMsg.vue'
import messageMenu from './messageMenu.vue'

export default {
  props: {
    group: String,
    message: Object,
    owner: Object,
    admin: Map,
  },

  data() {
    return {
      payload: {
        name: "",
        size: "",
        content: "",
        meta: "",
      },

      formatedTime: "",
      rightClicked: false,
      namecardVisible: false,

      bio: "",
      lastSeen: "",
    }
  },

  methods: {
    messageFrom() {
      return this.message.uuid === this.$store.state.account
    },

    getContent() {
      this.payload.name = this.message.name
      this.payload.size = this.message.size
      this.payload.content = this.message.content
      this.payload.meta = this.message.meta
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

    globalClick(event) {
      // 删除消息时不存在ContextMenu, if防报错
      if (this.$refs.ContextMenu) {
        this.$refs.ContextMenu.$el.style.display = 'none'
      }
      this.rightClicked = false
      window.removeEventListener('click', this.globalClick)
      window.removeEventListener('contextmenu', this.globalClick)
    },

    showProfile() {
      this.namecardVisible = true

      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/current/${this.message.uuid}`
      axios.get(URL).then(res => {
        const data = res["data"]
        this.bio = data["bio"]
        this.lastSeen = data["lastSeen"]
      }).catch(err => {
        console.log(err)
      })
    },

    deleteMsg() {
      this.$emit('deleteMsg', this.message.time)
    },

    forwardMsg() {
      this.$emit('forwardMsg', {
        type: this.message.type === "file" ? "forwardFile" : this.message.type,
        payload: {
          "name": this.payload.name,
          "size": this.payload.size,
          "content": this.payload.content
        }
      })
    },

    revokeMsg() {
      this.$emit('revokeMsg', this.message.time)
    }
  },

  computed: {
    getNameplate() {
      // 排除没有Nameplate的消息类型
      if (this.message.type === 'revoke') { return }

      if (this.owner.has(this.message.uuid)) {
        this.$nextTick(() => {
          this.$refs.Nameplate.style.display = "block"
          this.$refs.Nameplate.style.backgroundColor = "gold"
        })
        return "群主"
      }

      if (this.admin.has(this.message.uuid)) {
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

  },

  watch: {
    // 撤回时watch props的变化
    message: {
      handler() {
        this.getContent()
      }
    }
  },

  async mounted() {
    this.getContent()
    this.formatedTime = this.computeTime(this.message.time)
  },

  components: {
    broadcast,
    fileMsg,
    imageMsg,
    textMsg,
    audioMsg,
    messageMenu,
  }

}
</script>

<style scoped>
.messageRoot {
  position: relative;
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
  /* max-width: 90%; */
  word-wrap: break-word;
  white-space: pre-wrap;
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 6px;
  direction: ltr;
}

.time {
  font-size: 0.75rem;
  margin: 0 8px;
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