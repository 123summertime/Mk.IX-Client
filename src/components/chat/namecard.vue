<template>
  <el-dialog v-model="namecardVisible" :show-close="false" width="540px">
    <template #header>
      <div style="height: 0;"></div>
    </template>
    <div class="namecard">
      <div class="namecardAvatar">
        <el-image :src="avatar" :preview-src-list="[avatar]" alt="avatar" />
      </div>
      <p class="username">{{ username }}</p>
      <p class="uid">{{ "UID: " + uuid }}</p>
      <div class="state">
        <div>
          <svg :class="['point', lastSeen === '在线' ? 'online' : 'offline']" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><circle fill="currentColor" cx="512" cy="512" r="512"/></svg>
        </div>
        <el-tooltip
          effect="customized"
          :content="userState"
          :show-arrow="false"
          placement="right">
          <p>{{ lastSeen == '在线' ? '在线' : '离线' }}</p>
        </el-tooltip>
      </div>
      <div class="middle">
        <p>{{ "“" + bio + "”" }}</p>
      </div>
      <div class="addFriend" >
        <el-button plain type="primary" @click="friendRequestVisible = true">发送好友申请</el-button>
      </div>

      <el-dialog v-model="friendRequestVisible" width="540px" title="好友申请">
        <div>
          <el-input v-model="reason" placeholder="申请理由(选填)" />
        </div>
        <template #footer>
          <div>
            <el-button plain type="info" @click="friendRequestVisible = false">取消</el-button>
            <el-button plain type="primary" @click="friendRequest">发送</el-button>
          </div>
        </template>
      </el-dialog>

    </div>
  </el-dialog>
</template>

<script>
import axios from 'axios'

import { computeTime } from './../../assets/js/utils'
import { queryInfo } from './../../assets/js/queryDB'

export default {
  props: {
    uuid: String,
    namecardTrigger: Boolean,
  },

  data() {
    return {
      namecardVisible: false,
      friendRequestVisible: false,
      avatar: "",
      username: "",
      bio: "",
      lastSeen: "",
      reason: "",
    }
  },

  methods: {
    messageFrom() {
      return this.uuid === this.$store.state.account
    },

    // 获取用户详细信息(个人简介，最后登录等)
    getProfileInfo() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.uuid}/profile/current`
      axios.get(URL).then(async res => {
        const data = res.data
        this.bio = data.bio
        this.lastSeen = data.lastSeen
        const res2 = await queryInfo("Account", data.lastUpdate, this.uuid)
        this.username = res2.username
        this.avatar = res2.avatar
      }).catch(err => {
        ElMessage({
          message: `获取详细信息失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    friendRequest() {
      const reason = { reason: this.reason }
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${this.uuid}/verify/request`
      axios.post(URL, reason, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("发送成功")
      }).catch(err => {
        ElMessage({
          message: `发送好友申请失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
      this.namecardVisible = false
      this.friendRequestVisible = false
    },
  },

  watch: {
    // 当namecardTrigger改变时，就说明要显示namecard了，跟它的值没有关系
    namecardTrigger: {
      handler() {
        this.getProfileInfo()
        this.namecardVisible = true
      }
    }
  },

  computed: {
    userState() {
      if (this.lastSeen === "在线") { return "在线"}
      return `上次在线: ${computeTime(this.lastSeen)}` 
    },
  }

}
</script>

<style scoped>
.namecard {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.namecardAvatar {
  flex: 0 0 128px;
}

.namecard :deep(.el-image__inner) {
  width: 128px;
  height: 128px;
  border-radius: 50%;
}

.username {
  margin-top: 16px;
  font-size: 1.5rem;
  color: var(--namecard-username-textcolor);
}

.uid {
  color: var(--namecard-uid-textcolor);
  margin-top: 4px;
}

.state {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.state div {
  flex: 0 0 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 4px;
}

.state p {
  color: var(--namecard-state-textcolor);
  margin: 0 4px;
}

.online {
  color: var(--positive);
}

.offline {
  color: var(--negative);
}

.middle {
  width: 100%;
  padding: 8px 0;
  margin: 16px 0;
  border-top: 1px solid;
  border-image: var(--namecard-middle-border) 1;
}

.middle p {
  font-style: italic;
  word-break: break-all;
  color: var(--namecard-bio-textcolor);
}

.addFriend {
  margin-top: 16px;
}
</style>
