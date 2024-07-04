<template>
  <div class="eachMemberRoot">
    <div class="info">
      <img :src="avatar" />
      <p :class="role">{{ userName }}</p>
    </div>
    <div class="oper">
      <div v-if="getManagePermission" @click="adminModify" :title="role === 'user' ? '添加管理员' : '移除管理员'">
        <CirclePlus v-if="role === 'user'"></CirclePlus>
        <Remove v-else-if="role === 'admin'"></Remove>
      </div>
      <div v-if="getRemovePermission" @click="userRemoved" title="移除群聊">
        <Close></Close>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

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
      userName: "",
    }
  },

  methods: {
    async getFullData() {
      // 根据uuid和lastUpdate获取用户完整信息
      const info = await queryInfo('Account', this.lastUpdate, this.uuid)
      this.avatar = info.avatar
      this.userName = info.userName
    },

    adminModify() {
      const isAdd = this.role === 'user'
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/members/admin/${this.uuid}?operation=${isAdd}`
      axios.patch(URL, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success(`已将${this.userName}${isAdd ? '添加为' : '移除'}管理员`)
        this.$emit('groupAdminModified', { group: this.group, uuid: this.uuid, operation: isAdd })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    userRemoved() {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/members/${this.uuid}`
      axios.delete(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success(`已将${this.userName}移除群聊`)
        this.$emit('userRemoved', { group: this.group, uuid: this.uuid, role: this.role })
      }).catch(err => {
        ElMessage({
          message: `移除失败 ${err}`,
          duration: 6000,
          type: "error",
        })
      })
    }
  },

  computed: {
    getManagePermission() {
      // 增删管理员的权限
      return this.currentUserPermission === 'owner' && this.role != 'owner'
    },

    getRemovePermission() {
      // 移除用户的权限
      return (this.currentUserPermission === 'owner' && this.role != 'owner') ||
        (this.currentUserPermission === 'admin' && this.role === 'user')
    }
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
  border-radius: 16px;
  justify-content: space-between;
}

.eachMemberRoot:hover {
  background-color: lightsalmon;
}

.info {
  display: flex;
}

.info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.info p {
  line-height: 48px;
  margin-left: 16px;
}

.owner {
  color: gold;
}

.admin {
  color: aqua;
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

.oper div svg {
  width: 100%;
  height: 100%;
}
</style>