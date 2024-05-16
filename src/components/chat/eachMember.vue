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
  emits: ['groupAdminModified', 'userRemoved'],

  props: {
    pair: Array,  // [uuid, lastUpdate]
    role: String, // 'owner' or 'admin' or 'user'
    group: String,
    permission: String,
  },

  data() {
    return {
      uuid: "",
      avatar: "",
      userName: "",
    }
  },

  methods: {
    async getFullData() {
      const info = await queryInfo('Account', this.pair[1], this.pair[0])
      this.uuid = info["uuid"]
      this.avatar = info["avatar"]
      this.userName = info["userName"]
    },

    adminModify() {
      let isAdd = this.role === 'user'
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.group}/members/admin/${this.uuid}?operation=${isAdd}`
      axios.patch(URL, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success(`已将${this.userName}${isAdd ? '添加为' : '移除'}管理员`)
        this.$emit('groupAdminModified', {"group": this.group, "uuid": this.uuid, "operation": isAdd})
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err['response']['data']['detail']}`,
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
        this.$emit('userRemoved', {"group": this.group, "uuid": this.uuid})
      }).catch(err => {
        ElMessage({
          message: `移除失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    }
  },

  computed: {
    getManagePermission() {
      return this.permission === 'owner' && this.role != 'owner'
    },

    getRemovePermission() {
      return (this.permission === 'owner' && this.role != 'owner') || 
             (this.permission === 'admin' && this.role === 'user')
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