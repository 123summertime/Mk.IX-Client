<template>
  <div class="eachMemberRoot">
    <div class="info">
      <img :src="avatar" @click="namecardTrigger = !namecardTrigger" />
      <p :class="['nameplate', role + 'Nameplate']" v-if="this.role != 'user'">{{ role == 'owner' ? '群主' : '管理员' }}</p>
      <p class="nameplate selfNameplate" v-if="isSelf">我</p>
      <p class="name">{{ username }}</p>
    </div>
    <div class="oper">
      <div v-if="getManagePermission" @click="beforeRequestCheck(adminModify, modifyAdminCheckerText)" :title="role === 'user' ? '添加管理员' : '移除管理员'">
        <CirclePlus v-if="role === 'user'"></CirclePlus>
        <Remove v-else-if="role === 'admin'" class="warnSVG"></Remove>
      </div>
      <div v-if="getRemovePermission" @click="beforeRequestCheck(userRemoved, modifyMemberCheckerText)" title="移除群聊">
        <Close class="warnSVG"></Close>
      </div>
      <div v-if="showAt" @click="newAt">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M67.565714 514.139429c0 282.422857 191.140571 453.851429 454.290286 453.851428 70.710857 0 138.861714-9.856 180.845714-23.570286 29.586286-9.417143 39.003429-24.850286 39.003429-40.704s-12.434286-27.867429-28.708572-27.867428c-4.717714 0-11.574857 0.859429-20.132571 2.998857-52.297143 12.873143-96.859429 21.430857-157.293714 21.430857-234.861714 0-394.294857-141.421714-394.294857-383.561143 0-231.862857 150.857143-393.435429 378.002285-393.435428 201.014857 0 369.005714 123.867429 369.005715 346.294857 0 129.846857-44.141714 217.289143-114.432 217.289143-47.140571 0-74.130286-27.428571-74.130286-74.148572v-290.56c0-23.149714-12.854857-37.302857-34.285714-37.302857-21.430857 0-35.145143 14.153143-35.145143 37.302857v48.841143h-3.858286c-21.869714-52.717714-75.428571-86.125714-138.861714-86.125714-110.994286 0-189.001143 94.701714-189.001143 230.546286 0 137.142857 77.568 232.722286 190.72 232.722285 66.011429 0 117.430857-36.004571 142.281143-96.859428h3.84c8.594286 60.434286 59.154286 97.28 127.305143 97.28 119.570286 0 193.718857-117.412571 193.718857-281.984 0-249.014857-183.442286-410.569143-436.297143-410.569143-266.130286 0-452.571429 182.125714-452.571429 458.130286z m433.298286 166.290285c-77.165714 0-125.586286-63.853714-125.586286-165.430857 0-99.84 48.859429-163.712 126.006857-163.712 78.427429 0 128.146286 62.573714 128.146286 162.011429 0 101.558857-50.578286 167.131429-128.566857 167.131428z"></path></svg>
      </div>
    </div>

    <namecard 
      :uuid="uuid"
      :avatar="avatar"
      :username="username"
      :namecardTrigger="namecardTrigger">
    </namecard>

    <el-dialog v-model="checkerVisible">
      <template #header>
        <div style="height: 0;"></div>
      </template>
      <div class="checker">
        <Warning></Warning>
        <p>{{ checkerText }}</p>
      </div>
      <template #footer>
        <span>
          <el-button plain type="info" @click="checkerVisible = false">取消</el-button>
          <el-button plain type="danger" @click="checked()">确认</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

import namecard from './namecard.vue'

import { queryInfo } from '../../assets/js/queryDB.js'

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
    },

    isSelf() {
      return this.uuid === this.$store.state.account
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
  height: 4rem;
  padding: 0.5rem;
  border-radius: 8px;
  justify-content: space-between;
}

.eachMemberRoot:hover {
  background: var(--eachMember-hover-bgcolor);
}

.info {
  display: flex;
  align-items: center;
  flex: 1;
}

.info img {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  cursor: pointer;
}

.nameplate {
  height: 1.5rem;
  line-height: 1.5rem;
  margin-left: 0.5rem;  
  padding: 0 0.5rem;
  border-radius: 6px;
  color: var(--eachMember-nameplate-textcolor);
}

.name {
  margin-left: 0.5rem;
  color: var(--eachMember-name-textcolor);
}

.ownerNameplate {
  background: var(--owner);
}

.adminNameplate {
  background: var(--admin);
}

.selfNameplate {
  background: var(--self);
}

.oper {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oper div {
  flex: 0 0 1.5rem;
  width: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 0.8rem;
}

.oper div svg {
  color: var(--eachMember-oper-svgcolor);
  cursor: pointer;
}

.oper div svg:hover {
  color: var(--positive);
  transform: scale(1.2);
}

.oper div .warnSVG:hover {
  color: var(--negative);
}

.checker {
  display: flex;
  align-items: center;
  width: 100%;
  height: 3rem;
}

.checker svg {
  flex: 0 0 3rem;
  color: var(--eachMember-checker-svgcolor);
}

.checker p {
  flex: 1;
  margin-left: 12px;
  color: var(--eachMember-checker-textcolor);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>