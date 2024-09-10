<template>
  <el-dialog v-model="namecardVisible" width="540">
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
          <i>{{ lastSeen === "Online" ? "在线" : formatedTime(lastSeen) }}</i>
        </span>
        <span v-if="!messageFrom()">
          <el-button type="primary" @click="friendRequestVisible = true">发送好友申请</el-button>
          <el-dialog v-model="friendRequestVisible" width="540" title="好友申请">
            <div>
              <el-input v-model="reason" placeholder="申请理由(选填)" />
            </div>
            <template #footer>
              <div>
                <el-button @click="friendRequestVisible = false">取消</el-button>
                <el-button type="primary" @click="friendRequest">发送</el-button>
              </div>
            </template>
          </el-dialog>
        </span>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import axios from 'axios'

import { computeTime } from './../../assets/utils'

export default {
  props: {
    message: Object,
    namecardTrigger: Boolean,
  },

  data() {
    return {
      namecardVisible: false,
      friendRequestVisible: false,
      bio: "",
      lastSeen: "",
      reason: "",
    }
  },

  methods: {
    messageFrom() {
      return this.message.uuid === this.$store.state.account
    },

    // 获取用户详细信息(个人简介，最后登录等)
    showProfile() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/current/${this.message.uuid}`
      axios.get(URL).then(res => {
        const data = res.data
        this.bio = data.bio
        this.lastSeen = data.lastSeen
      }).catch(err => {
        console.log(err)
      })
    },

    formatedTime(time) {
      return computeTime(time)
    },

    friendRequest() {
      const reason = { note: this.reason }
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.message.uuid}/friend`
      axios.post(URL, reason, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("发送成功")
      }).catch(err => {
        ElMessage({
          message: err,
          duration: 6000,
          type: "error",
        })
      })
      friendRequestVisible = false
    },
  },

  watch: {
    // 当namecardTrigger改变时，就说明要显示namecard了，跟它的值没有关系
    namecardTrigger: {
      handler() {
        this.namecardVisible = true
        this.showProfile()
      }
    }
  },
}
</script>

<style scoped>
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

:deep(.el-dialog__body) {
  padding: 12px 20px;
}
</style>