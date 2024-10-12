<template>
  <div class="eachMemberRoot">
    <div class="info">
      <img :src="avatar" @click="namecardTrigger = !namecardTrigger" />
      <p :class="['nameplate', role + 'Nameplate']" v-if="this.role != 'user'">{{ role == 'owner' ? '群主' : '管理员' }}</p>
      <p class="name">{{ username }}</p>
    </div>
    <div class="oper">
      <div v-if="showAt" @click="newAt">
        <p class="icon">@</p>
      </div>
      <div v-if="getManagePermission" @click="beforeRequestCheck(adminModify, modifyAdminCheckerText)" :title="role === 'user' ? '添加管理员' : '移除管理员'">
        <CirclePlus v-if="role === 'user'"></CirclePlus>
        <Remove v-else-if="role === 'admin'"></Remove>
      </div>
      <div v-if="getRemovePermission" @click="beforeRequestCheck(userRemoved, modifyMemberCheckerText)" title="移除群聊">
        <Close></Close>
      </div>
    </div>

    <namecard 
      :uuid="uuid"
      :avatar="avatar"
      :username="username"
      :namecardTrigger="namecardTrigger">
    </namecard>

    <el-dialog v-model="checkerVisible" width="540px">
    <div class="checker">
      <WarningFilled></WarningFilled>
      <p>{{ checkerText }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="checkerVisible = false">取消</el-button>
        <el-button type="danger" @click="checked()">确认</el-button>
      </span>
    </template>
  </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

import namecard from './namecard.vue'

import { queryInfo } from '../../assets/queryDB.js'

export default {
  emits: [
    'groupAdminModified',
    'userRemoved'
  ],

  props: {
    uuid: String,       // 这个用户的uuid
    lastUpdate: String, // 这个用户上次修改名字/头像时间
    role: String,       // 这个用户的身份 'owner' | 'admin' | 'user'
    group: String,      // 当前群号
    currentUserPermission: String, // 当前登录用户的身份 'owner' | 'admin' | 'user'
  },

  data() {
    return {
      avatar: "",
      username: "",
      namecardTrigger : false,
      checkerVisible: false,
      invokeFunc: null, // Function
      checkerText: "",
    }
  },

  methods: {
    // 根据uuid和lastUpdate获取用户完整信息
    async getFullData() {
      const info = await queryInfo('Account', this.lastUpdate, this.uuid)
      this.avatar = info.avatar
      this.username = info.username
    },

    beforeRequestCheck(invoke, checkerText) {
      this.checkerVisible = true
      this.checkerText = checkerText
      this.invokeFunc = invoke
    },

    checked() {
      this.invokeFunc.call()
      this.checkerVisible = false
    },

    // 修改了管理员
    adminModify() {
      const isAdd = this.role === 'user'
      this.checkerText = `确认将 ${this.username} ${isAdd ? '添加为' : '移除'}管理员?`

      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/members/admin/${this.uuid}`
      const headers = { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      const method = isAdd ? axios.post(URL, {}, headers) : axios.delete(URL, headers)
      method.then(res => {
        ElMessage.success(`已将 ${this.username} ${isAdd ? '添加为' : '移除'}管理员`)
        this.$emit('groupAdminModified', { group: this.group, uuid: this.uuid, operation: isAdd })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 移除了群员
    userRemoved() { 
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/members/${this.uuid}`
      axios.delete(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success(`已将 ${this.username} 移除群聊`)
        this.$emit('userRemoved', { group: this.group, uuid: this.uuid, role: this.role })
      }).catch(err => {
        ElMessage({
          message: `移除失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // at别人了
    newAt() {
      ElMessage.success(`已@${this.username}`)
      this.$store.dispatch("getNewAt", {
        uuid: this.uuid,
        username: this.username,
      })
    }
  },

  computed: {
    // 确认是否有增删管理员的权限
    getManagePermission() {
      return this.currentUserPermission === 'owner' && this.role != 'owner'
    },

    // 确认是否有移除用户的权限
    getRemovePermission() {
      return (this.currentUserPermission === 'owner' && this.role != 'owner') ||
        (this.currentUserPermission === 'admin' && this.role === 'user')
    },

    // 显示@图标，除自己以外
    showAt() {
      return this.uuid != this.$store.state.account
    },

    modifyAdminCheckerText() {
      return `确认将 ${this.username} ${this.role === 'user' ? '添加为' : '移除'}管理员?`
    },

    modifyMemberCheckerText() {
      return `确认将 ${this.username} 移除群聊?`
    }
  },

  components: {
    namecard,
  },

  async mounted() {
    await this.getFullData()
  }
}
</script>

<style scoped>
.eachMemberRoot {
  display: flex;
  height: 64px;
  padding: 8px;
  border-radius: 8px;
  justify-content: space-between;
}

.eachMemberRoot:hover {
  background-color: var(--eachMember-hover);
}

.info {
  display: flex;
}

.info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
}

.nameplate {
  margin: 12px 0 12px 12px;
  line-height: 24px;
  padding: 0 6px;
  border-radius: 10px;
}

.name {
  line-height: 48px;
  margin-left: 12px;
  color: var(--text);
}

.ownerNameplate {
  background-color: var(--owner);
}

.adminNameplate {
  background-color: var(--admin);
}

.oper {
  display: flex;
}

.oper div {
  width: 24px;
  height: 24px;
  margin: auto 8px;
  cursor: pointer;
}

.oper div svg, 
.oper div .icon {
  width: 100%;
  height: 100%;
  font-size: 24px;
  line-height: 24px;
  color: var(--text);
}

.checker {
  display: flex;
  width: 100%;
  height: 48px;
}

.checker svg {
  width: 48px;
  height: 48px;
}

.checker p {
  line-height: 48px;
  margin-left: 16px;
}
</style>