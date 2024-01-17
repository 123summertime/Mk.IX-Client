<template>
  <div class="groupInfoRoot" ref="groupInfoRoot">
    <img class="groupAvatar" :src="'data:image/png;base64,' + avatar">
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
import Dexie from 'dexie'

import { dbCRUD } from '../../assets/dbCRUD.js'
import { queryInfo } from '../../assets/queryDB.js'

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
    async buildOrGetDB() {
      const db = new Dexie(this.group)
      db.version(1).stores({
        History: "&time",
      })
      this.DB = new dbCRUD(db)
    },

    async getLastHistory() {
      const history = await this.DB.queryRange('History', 0, 1)
      if (history.length) {
        const info = await queryInfo("Account", history[0]["senderKey"], history[0]["uuid"])
        this.computeInfo({...info, ...history[0] })
      }
    },

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
    newMessage() {
      return this.$store.state[this.group]
    }
  },

  watch: {
    newMessage: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.computeInfo(newVal)
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

  async mounted() {
    await this.buildOrGetDB()
    await this.getLastHistory()
  }
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