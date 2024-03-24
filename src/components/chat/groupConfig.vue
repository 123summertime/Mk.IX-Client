<template>
  <div class="groupConfigRoot">
    <ul class="groupItems">
      <li>
        <p>群头像</p>
        <img class="groupAvatar" :src="info['avatar']" title="点击修改头像" @click="beforeModifyAvatar" />
      </li>
      <li>
        <p>群名称</p>
        <div class="groupName">
          <input v-model="groupName" :disabled="!checkPermissions" @keydown="groupNameModified" />
        </div>
      </li>
      <li>
        <p>群ID</p>
        <p>{{ info['group'] }}</p>
      </li>
      <li>
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
      <li class="unsubscribe">
        <el-button type="danger" @click="unsubscribeVisible = true">{{ getRole === 'owner' ? '解散群' : '退出群' }}</el-button>
      </li>
    </ul>
  </div>

  <!-- 修改群头像 -->
  <el-dialog v-model="visible" width="540px">
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
        <el-button type="danger" @click="unsubscribe">{{ getRole === 'owner' ? '确认解散' : '确认退出' }}</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 群成员信息 -->
  <el-dialog v-model="membersVisible"
    class="memberInfo"
    width="540px"
    :title="`${this.info['name']}(${this.membersCount})`"
    style="max-height: 70vh; overflow-y: auto;">
    <ul class="list">
      <li>
        <p>群主</p>
      </li>
      <li>
        <eachMember
          :pair="getOwner"
          :role="'owner'"
          :group="group"
          :permission="getRole"></eachMember>
      </li>

      <li>
        <p>管理员</p>
      </li>
      <li v-if="getAdmin.length">
        <eachMember v-for="pair in getAdmin"
          :key="pair[0]"
          :pair="pair"
          :role="'admin'"
          :group="group"
          :permission="getRole"
          @groupAdminModified="groupAdminModified"
          @userRemoved="userRemoved"></eachMember>
      </li>
      <li class="empty" v-else>
        <p>无</p>
      </li>

      <li>
        <p>成员</p>
      </li>
      <li v-if="membersInfo.length">
        <eachMember v-for="pair in membersInfo"
          :key="pair['uuid']"
          :pair="[pair['uuid'], pair['lastUpdate']]"
          :role="'user'"
          :group="group"
          :permission="getRole"
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
    'userRemoved',
    'groupPinnedModified',
    'deleteHistory'
  ],

  props: {
    group: String,
    info: Object,
    isPinned: Boolean,
  },

  data() {
    return {
      groupName: this.info['name'],
      visible: false,
      membersVisible: false,
      unsubscribeVisible: false,
      deleteHistoryVisible: false,
      currPinned: this.isPinned,
      membersCount: 0,
      membersInfo: [],
    }
  },

  methods: {
    groupNameModified(event) {
      if (event.key === 'Enter') {
        const URL = `http://${localStorage.getItem('adress')}/modifyGroupName?group=${this.group}&newName=${this.groupName}`
        axios.post(URL, {}, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => {
          ElMessage.success("修改成功")
          this.$emit('groupNameModified', { "group": this.group, "name": this.groupName })
        }).catch(err => {
          ElMessage({
            message: `修改失败 ${err['response']['data']['detail']}`,
            duration: 6000,
            type: "error",
          })
        })
      }
    },

    beforeModifyAvatar() {
      if (this.checkPermissions) {
        this.visible = true
      }
    },

    groupAvatarModified(info) {
      const base64 = info["dataURL"]
      const URL = `http://${localStorage.getItem('adress')}/modifyGroupAvatar?group=${this.group}`
      axios.post(URL, { 'avatar': base64 }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.visible = false
        ElMessage.success("修改成功")
        this.$emit('groupAvatarModified', { "group": this.group, "avatar": base64 })
      }).catch(err => {
        ElMessage({
          message: `修改失败 ${err['response']['data']['detail']}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    getMembersInfo() {
      const URL = `http://${localStorage.getItem('adress')}/getMembersInfo?group=${this.group}`
      axios.get(URL).then(res => {
        const users = res["data"]["users"]
        this.membersCount = users.length

        const owner = this.info['owner']
        const admin = this.info['admin']
        this.membersInfo = users.filter(i => !(owner.has(i.uuid) || admin.has(i.uuid)))
      }).catch(err => {
        console.log(err)
      })
    },

    groupAdminModified(info) {
      if (info['operation']) {
        const user = this.membersInfo.find(i => i.uuid == info['uuid'])
        info['lastUpdate'] = user['lastUpdate']
        this.membersInfo = this.membersInfo.filter(i => i.uuid != info['uuid'])
      } else {
        const lastUpdate = this.info['admin'].get(info['uuid'])
        this.membersInfo.push({ "uuid": info['uuid'], "lastUpdate": lastUpdate })
      }
      this.$emit('groupAdminModified', info)
    },

    userRemoved(info) {
      this.membersInfo = this.membersInfo.filter(i => i.uuid != info['uuid'])
      this.$emit('userRemoved', info)
    },

    groupPinnedModified() {
      this.$emit('groupPinnedModified', this.currPinned)
    },

    async deleteHistory() {
      this.$emit('deleteHistory', this.group)
      this.deleteHistoryVisible = false
    },

    unsubscribe() {
      const URL = `http://${localStorage.getItem('adress')}/deleteGroup?group=${this.group}`
      axios.post(URL, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        this.unsubscribeVisible = false
        ElMessage.success("退出成功")
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
      const account = this.$store.state["account"]
      if (this.info['owner'].has(account)) return "owner"
      if (this.info['admin'].has(account)) return "admin"
      return "user"
    },

    getOwner() {
      return Array.from(this.info['owner'].entries())[0]
    },

    getAdmin() {
      return Array.from(this.info['admin'].entries())
    },
  },

  mounted() {
    this.getMembersInfo()
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

.unsubscribeText svg, .deleteHistoryText svg {
  width: 48px;
  height: 48px;
}

.unsubscribeText p, .deleteHistoryText p {
  line-height: 48px;
  margin-left: 16px;
}
</style>
