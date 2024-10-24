<template>
  <div class="groupConfigRoot">
    <span class="title">
      <p>群聊信息</p>
    </span>
    <ul class="general">
      <li class="avatar">
        <p>群头像</p>
        <img class="groupAvatar" :src="info.avatar" title="点击修改头像" @click="beforeModifyAvatar" />
        <ArrowRight class="arrow hiddenArrow" />
      </li>

      <li>
        <p>群ID</p>
        <p>{{ info.group }}</p>
        <ArrowRight class="arrow hiddenArrow" />
      </li>

      <li @click="checkPermissions ? editGroupNameVisible = true : ''">
        <p>群名称</p>
        <p>{{ this.info.name }}</p>
        <ArrowRight :class="['arrow', checkPermissions ? '' : 'hiddenArrow']" />
      </li>

      <li v-if="available" @click="membersVisible = true">
        <p>群成员</p>
        <p>{{ membersCount + "人" }}</p>
        <ArrowRight class="arrow" />
      </li>

      <li v-if="available && checkPermissions" @click="editGroupQAVisible = true">
        <p>入群问题</p>
        <ArrowRight class="arrow" />
      </li>
    </ul>

    <span class="title">
      <p>个人设置</p>
    </span>
    <ul class="general">
      <li>
        <p>加密</p>
        <ArrowRight class="arrow" />
      </li>
      <li>
        <p>置顶</p>
        <el-switch v-model="currPinned" @change="groupPinnedModified" />
      </li>
    </ul>

    <span class="title dangerTitle">
      <p>高危操作</p>
    </span>
    <ul class="dangerZone">
      <li @click="deleteHistoryVisible = true" >
        <p class="dangerItem">删除聊天记录</p>
        <ArrowRight class="arrow dangerItem" />
      </li>
      <li v-if="available" @click="unsubscribeVisible = true">
        <p class="dangerItem">{{ getRole === 'owner' ? '解散群' : '退出群' }}</p>
        <ArrowRight class="arrow dangerItem" />
      </li>
    </ul>
  </div>

  <!-- 修改群头像 -->
  <el-dialog v-model="editAvatarVisible" width="640px">
    <ImgCutter class="imgCutter"
      :isModal="false"
      :boxWidth="600"
      fileType="webp"
      rate="1:1"
      @cutDown="groupAvatarModified">
      <template #cancel>
        <el-button @click="editAvatarVisible = false">取消</el-button>
      </template>
    </ImgCutter>
  </el-dialog>

  <!-- 修改群名 -->
  <el-dialog title="修改群名" v-model="editGroupNameVisible" width="640px">
    <el-input v-model="groupName" placeholder="新群名" />
    <template #footer>
      <el-button @click="editGroupNameVisible = false">取消</el-button>
      <el-button type="primary" @click="groupNameModified">确认修改</el-button>
    </template>
  </el-dialog>

  <!-- 修改入群问题 -->
  <el-dialog title="修改入群问题" v-model="editGroupQAVisible" width="640px">
    <div class="editQAContent">
      <p>正确回答入群问题可以直接加入群聊，无需验证</p>
      <p>问题允许为空，为空时该群聊将无法被搜索到</p>
      <el-input v-model="newGroupQ" placeholder="入群问题" />
      <el-input v-model="newGroupA" placeholder="入群问题的答案" />
    </div>
    <template #footer>
      <el-button @click="editGroupQAVisible = false">取消</el-button>
      <el-button type="primary" @click="groupQAModified">确认修改</el-button>
    </template>
  </el-dialog>

  <!-- 清空聊天记录确认 -->
  <el-dialog v-model="deleteHistoryVisible" width="640px">
    <div class="checker">
      <Warning></Warning>
      <p>确认清空聊天记录?</p>
    </div>
    <template #footer>
      <el-button @click="deleteHistoryVisible = false">取消</el-button>
      <el-button type="danger" @click="deleteHistory">确认删除</el-button>
    </template>
  </el-dialog>

  <!-- 退出群确认 -->
  <el-dialog v-model="unsubscribeVisible" width="640px">
    <div class="checker">
      <Warning></Warning>
      <p>{{ getRole === 'owner' ? '确认解散群?' : '确认退出群?' }}</p>
    </div>
    <template #footer class="di">
      <el-checkbox class="checkbox" v-model="unsubscribeAndDeleteHistory" label="同时删除本地聊天记录" />
      <el-button @click="unsubscribeVisible = false">取消</el-button>
      <el-button type="danger" @click="unsubscribe">{{ getRole === 'owner' ? '确认解散' : '确认退出' }}</el-button>
    </template>
  </el-dialog>

  <!-- 群成员信息 -->
  <el-dialog v-model="membersVisible"
    class="memberInfo"
    width="640px"
    :title="`${this.info.name} (${this.membersCount})`"
    style="max-height: 70vh; overflow-y: auto;">
    <div class="list">
      <div>
        <eachMember v-for="(lastUpdate, uuid) in (info.admins.owner)"
          :key="uuid"
          :uuid="uuid"
          :lastUpdate="lastUpdate"
          :role="'owner'"
          :currentUserPermission="getRole"
          :group="info.group"></eachMember>
      </div>
      <div v-if="Object.keys(info.admins.admin).length">
        <eachMember v-for="(lastUpdate, uuid) in (info.admins.admin)"
          :key="uuid"
          :uuid="uuid"
          :lastUpdate="lastUpdate"
          :role="'admin'"
          :group="info.group"
          :currentUserPermission="getRole"
          @groupAdminModified="groupAdminModified"
          @userRemoved="userRemoved"></eachMember>
      </div>
      <div v-if="membersInfo">
        <eachMember v-for="(lastUpdate, uuid) in membersInfo"
          :key="uuid"
          :uuid="uuid"
          :lastUpdate="lastUpdate"
          :role="'user'"
          :group="info.group"
          :currentUserPermission="getRole"
          @groupAdminModified="groupAdminModified"
          @userRemoved="userRemoved"></eachMember>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import axios from 'axios'
import ImgCutter from 'vue-img-cutter'

import eachMember from './eachMember.vue'

export default {
  emits: [
    'groupNameModified',
    'groupAvatarModified',
    'groupAdminModified',
    'groupPinnedModified',
    'deleteHistory'
  ],

  props: {
    info: Object, // {time, group, name, avatar, admins: {owner: {}, admin: {}}}
    isPinned: Boolean,
    available: Boolean,
  },

  data() {
    return {
      groupName: "",
      newGroupQ: "",
      newGroupA: "",
      editAvatarVisible: false,
      editGroupNameVisible: false,
      membersVisible: false,
      unsubscribeVisible: false,
      unsubscribeAndDeleteHistory: false,
      deleteHistoryVisible: false,
      editGroupQAVisible: false,
      currPinned: this.isPinned,
      membersCount: 0,
      membersInfo: {},
    }
  },

  methods: {
    // 群名修改后
    groupNameModified() {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/info/name`
      const payload = { name: this.groupName }
      axios.patch(URL, payload, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editGroupNameVisible = false
        ElMessage.success("修改成功")
        this.$emit('groupNameModified', { group: this.info.group, name: this.groupName })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 群头像修改前验证权限
    beforeModifyAvatar() {
      if (this.checkPermissions) {
        this.editAvatarVisible = true
      }
    },

    // 群头像修改后
    groupAvatarModified(info) {
      const base64 = info.dataURL
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/info/avatar`
      axios.patch(URL, { avatar: base64 }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editAvatarVisible = false
        ElMessage.success("修改成功")
        this.$emit('groupAvatarModified', { group: this.info.group, avatar: base64 })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    groupQAModified() {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/verify/question`
      axios.patch(URL, { Q: this.newGroupQ, A: this.newGroupA }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editGroupQAVisible = false
        ElMessage.success("修改成功")
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 获取群员信息
    // 以{uuid: lastUpdate}的形式存储在this.membersInfo中
    getMembersInfo() {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/members`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        const users = res.data.users
        this.membersCount = users.length

        const owner = this.info.admins.owner
        const admin = this.info.admins.admin
        users.forEach(i => {
          if (!(owner[i.uuid] || admin[i.uuid])) {
            this.membersInfo[i.uuid] = i.lastUpdate
          }
        })
      }).catch(err => {
        console.log(err)
      })
    },

    // 更改管理员
    groupAdminModified(info) {
      // 这里仅对membersInfo(普通用户)的对象进行处理，管理员对象的处理在chatPage.vue
      if (info.operation) {
        info.lastUpdate = this.membersInfo[info.uuid]
        Reflect.deleteProperty(this.membersInfo, info.uuid)
      } else {
        const lastUpdate = this.info.admins.admin[info.uuid]
        this.membersInfo[info.uuid] = lastUpdate
      }
      this.$emit('groupAdminModified', info)
    },

    // 处理移出用户
    userRemoved(info) {
      if (info.role === 'admin') {
        this.$emit('groupAdminModified', { operation: false, ...info })
      } else {
        Reflect.deleteProperty(this.membersInfo, info.uuid)
      }
    },

    // 处理置顶群的变化
    groupPinnedModified() {
      this.$emit('groupPinnedModified', this.currPinned)
    },

    // 处理清空历史记录
    async deleteHistory() {
      this.$emit('deleteHistory', this.info.group)
      this.deleteHistoryVisible = false
    },

    // 处理退出/解散群
    unsubscribe() {
      const URL = this.getRole === 'owner'
        ? `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}`
        : `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/members/me`

      axios.delete(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("退出成功")
        this.unsubscribeVisible = false
        if (this.unsubscribeAndDeleteHistory) {
          setTimeout(() => {
            this.deleteHistory()
          }, 200);
        }
      }).catch(err => {
        ElMessage({
          message: `退出失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },
  },

  computed: {
    checkPermissions() {
      const role = this.getRole
      return role === 'owner' || role === 'admin'
    },

    getRole() {
      const account = this.$store.state.account
      if (this.info.admins.owner[account]) return "owner"
      if (this.info.admins.admin[account]) return "admin"
      return "user"
    },
  },

  mounted() {
    if (this.available) {
      this.getMembersInfo()
    }
  },

  components: {
    ImgCutter,
    eachMember,
  }
}
</script>

<style scoped>
.groupConfigRoot .title {
  display: inline-block;
  border-bottom: 2px solid var(--spical-0);
  margin-bottom: 16px;
}

.groupConfigRoot .title p {
  font-size: 1.4rem;
  padding: 6px 24px 6px 0;
}

.groupConfigRoot .dangerTitle {
  border-bottom: 2px solid var(--spical-1);
}

.groupConfigRoot .dangerTitle p {
  color: var(--basic-5-0);
}

ul {
  overflow: hidden;
}

ul li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
}

.avatar {
  height: 160px;
}

.avatar img {
  height: 100%;
  border-radius: 16px;
  cursor: pointer;
}

li p:nth-of-type(1) {
  flex: 1 0 auto;
  font-size: 1.2rem;
}

li p:nth-of-type(2) {
  color: var(--neutral-3);
}

li .dangerItem {
  color: var(--warn);
}

.arrow {
  flex: 0 0 24px;
  margin-left: 12px;
}

.hiddenArrow {
  visibility: hidden;
}

.general {
  border: 2px solid var(--spical-0);
  border-radius: 8px;
  margin-bottom: 32px;
}

.general li:hover {
  background-color: var(--spical-0);
}

.dangerZone {
  border: 2px solid var(--spical-1);
  border-radius: 8px;
  /* background-image: repeating-linear-gradient(-45deg, var(--spical-1), var(--spical-1) 8px, transparent 8px, transparent 24px); */
}

.dangerZone li:hover {
  background-color: var(--spical-1);
}

.list {
  display: flex;
  flex-direction: column;
  max-height: 40vh;
  overflow-y: auto;
}

.list::-webkit-scrollbar {
  display: none;
}

.checker {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
}

.checker svg {
  flex: 0 0 48px;
  color: var(--text);
}

.checker p {
  flex: 1;
  margin-left: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editQAContent p, 
.editQAContent .el-input {
  margin-bottom: 16px;
}

.checkbox {
  float: left;
}
</style>
