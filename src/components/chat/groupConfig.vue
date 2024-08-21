<template>
  <div class="groupConfigRoot">
    <ul class="groupItems">
      <li>
        <p>群头像</p>
        <img class="groupAvatar" :src="info.avatar" title="点击修改头像" @click="beforeModifyAvatar" />
      </li>
      <li>
        <p>群名称</p>
        <div class="groupName">
          <input v-model="groupName" :disabled="!checkPermissions" @keydown="groupNameModified" />
        </div>
      </li>
      <li>
        <p>群ID</p>
        <p>{{ info.group }}</p>
      </li>
      <li v-if="available">
        <p>群成员</p>
        <div class="members" title="点击查看详细信息">
          <p @click="membersVisible = true">{{ membersCount + "人" }}</p>
        </div>
      </li>
      <li>
        <p>置顶</p>
        <el-switch v-model="currPinned" @change="groupPinnedModified" />
      </li>
      <li class="deleteHistory">
        <el-button type="danger" @click="deleteHistoryVisible = true">清空聊天记录</el-button>
      </li>
      <li class="unsubscribe" v-if="available">
        <el-button type="danger" @click="unsubscribeVisible = true">{{ getRole === 'owner' ? '解散群' : '退出群' }}</el-button>
      </li>
    </ul>
  </div>

  <!-- 修改群头像 -->
  <el-dialog v-model="editAvatarVisible" width="540px">
    <ImgCutter class="imgCutter"
      :isModal="false"
      :boxWidth="500"
      fileType="webp"
      rate="1:1"
      @cutDown="groupAvatarModified"></ImgCutter>
  </el-dialog>

  <!-- 清空聊天记录确认 -->
  <el-dialog v-model="deleteHistoryVisible" width="540px">
    <div class="deleteHistoryText">
      <WarningFilled></WarningFilled>
      <p>确认清空聊天记录?</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="deleteHistoryVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteHistory">确认删除</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 退出群确认 -->
  <el-dialog v-model="unsubscribeVisible" width="540px">
    <div class="unsubscribeText">
      <WarningFilled></WarningFilled>
      <p>{{ getRole === 'owner' ? '确认解散群?' : '确认退出群?' }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="unsubscribeVisible = false">取消</el-button>
        <el-button type="danger" @click="unsubscribe(false)">{{ getRole === 'owner' ? '确认解散' : '确认退出' }}</el-button>
        <el-button type="danger" @click="unsubscribe(true)">{{ (getRole === 'owner' ? '确认解散' : '确认退出') + "并清空聊天记录" }}</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 群成员信息 -->
  <el-dialog v-model="membersVisible"
    class="memberInfo"
    width="540px"
    :title="`${this.info.name}(${this.membersCount})`"
    style="max-height: 70vh; overflow-y: auto;">
    <ul class="list">
      <li>
        <p>群主</p>
      </li>
      <li>
        <eachMember v-for="(lastUpdate, uuid) in (info.admins.owner)"
          :key="uuid"
          :uuid="uuid"
          :lastUpdate="lastUpdate"
          :role="'owner'"
          :currentUserPermission="getRole"
          :group="info.group"></eachMember>
      </li>

      <li>
        <p>管理员</p>
      </li>
      <li v-if="info.admins.admin">
        <eachMember v-for="(lastUpdate, uuid) in (info.admins.admin)"
          :key="uuid"
          :uuid="uuid"
          :lastUpdate="lastUpdate"
          :role="'admin'"
          :group="info.group"
          :currentUserPermission="getRole"
          @groupAdminModified="groupAdminModified"
          @userRemoved="userRemoved"></eachMember>
      </li>
      <li class="empty" v-else>
        <p>无</p>
      </li>

      <li>
        <p>成员</p>
      </li>
      <li v-if="membersInfo">
        <eachMember v-for="(lastUpdate, uuid) in membersInfo"
          :key="uuid"
          :uuid="uuid"
          :lastUpdate="lastUpdate"
          :role="'user'"
          :group="info.group"
          :currentUserPermission="getRole"
          @groupAdminModified="groupAdminModified"
          @userRemoved="userRemoved"></eachMember>
      </li>
      <li class="empty" v-else>
        <p>无</p>
      </li>
    </ul>
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
      groupName: this.info.name,
      editAvatarVisible: false,
      membersVisible: false,
      unsubscribeVisible: false,
      deleteHistoryVisible: false,
      currPinned: this.isPinned,
      membersCount: 0,
      membersInfo: {},
    }
  },

  methods: {
    // 群名修改后
    groupNameModified(event) {
      if (event.key === 'Enter') {
        const URL = `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/info/name`
        const payload = { note: this.groupName }
        axios.patch(URL, payload, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => {
          ElMessage.success("修改成功")
          this.$emit('groupNameModified', { group: this.info.group, name: this.groupName })
        }).catch(err => {
          ElMessage({
            message: `修改失败 ${err['response']['data']['detail']}`,
            duration: 6000,
            type: "error",
          })
        })
      }
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
      axios.patch(URL, { note: base64 }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.editAvatarVisible = false
        ElMessage.success("修改成功")
        this.$emit('groupAvatarModified', { group: this.info.group, avatar: base64 })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err['response']['data']['detail']}`,
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
    unsubscribe(deleteHistory) {
      const URL = this.getRole === 'owner'
        ? `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}`
        : `http://${localStorage.getItem('adress')}/v1/group/${this.info.group}/members/me`

      axios.delete(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        ElMessage.success("退出成功")
        this.unsubscribeVisible = false
        this.$store.dispatch('disconnect', this.info.group)
        if (deleteHistory) {
          this.deleteHistory()
        }
      }).catch(err => {
        ElMessage({
          message: `退出失败 ${err['response']['data']['detail']}`,
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
.groupItems li {
  display: flex;
  justify-content: space-between;
  height: 48px;
  margin: 8px 0;
  line-height: 48px;
}

.groupItems li:nth-of-type(1) {
  height: 64px;
  line-height: 64px;
}

.groupAvatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  cursor: pointer;
}

.groupName {
  position: relative;
  height: 36px;
}

.groupName input {
  height: 36px;
  padding: 0 6px;
  text-align: right;
  border: 1px black solid;
}

.groupName input:focus {
  outline: none;
  border: 1px var(--el-color-danger) solid;
}

.groupName::before {
  display: block;
  position: absolute;
  content: "Enter键确认修改";
  width: 112px;
  font-size: 0.75rem;
  right: 100%;
  opacity: 0;
}

.groupName:focus-within::before {
  opacity: 1;
}

.members {
  width: 33%;
  cursor: pointer;
}

.members p {
  text-align: right;
}

.list {
  display: flex;
  flex-direction: column;
}

.list li {
  margin: 4px 0;
}

.list li:nth-of-type(2n - 1) {
  height: 36px;
  line-height: 36px;
  font-weight: 700;
  margin-bottom: 0;
}

.list li:nth-of-type(1) {
  color: gold;
}

.list li:nth-of-type(3) {
  color: aqua;
}

.list .empty {
  height: 36px;
  line-height: 36px;
}

li .el-switch {
  height: 48px;
}

li .el-button {
  width: 100%;
  height: 80%;
  margin: auto 0;
}

.unsubscribeText,
.deleteHistoryText {
  display: flex;
  width: 100%;
  height: 48px;
}

.unsubscribeText svg,
.deleteHistoryText svg {
  width: 48px;
  height: 48px;
}

.unsubscribeText p,
.deleteHistoryText p {
  line-height: 48px;
  margin-left: 16px;
}
</style>
