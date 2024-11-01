<template>
  <div class="chatPageRoot">

    <div class="leftSide" ref="leftSide">
      <div class="userInfo">
        <img :src=avatar alt="avatar">
        <p>{{ username }}</p>
      </div>
      <div class="groupList">
        <groupItem v-for="item in groupList"
          :avatar="item.avatar"
          :group="item.group"
          :name="item.name"
          :active="item.group === currGroupID"
          :isPinned="pinned[item.group] === true"
          @click="currGroupChange(item.group, item.name, item.available)"
          class="groupItem"></groupItem>
      </div>
      <tools @joinGroupSuccess="joinGroupSuccess"></tools>
    </div>

    <splitter @splitter="groupSplitter" class="groupSplitter" ref="groupSplitter"></splitter>

    <div class="rightSide" ref="rightSide">
      <div class="header">
        <div class="groupToolBar" v-show="currGroupID">
          <p>{{ currGroupName }}</p>
          <MoreFilled @click="drawer = !drawer"></MoreFilled>
          <el-drawer v-model="drawer" :with-header="false" :destroy-on-close="true">
            <groupConfig v-if="currGroupID"
              :info="groupList.find(item => item.group === currGroupID)"
              :isPinned="pinned[currGroupID]"
              :available="currGroupAvailable"
              @groupNameModified="groupNameModified"
              @groupAvatarModified="groupAvatarModified"
              @groupAdminModified="groupAdminModified"
              @groupPinnedModified="groupPinnedModified"
              @deleteHistory="deleteHistory"></groupConfig>
          </el-drawer>
        </div>
      </div>

      <div class="center" v-show="currGroupID">
        <div class="conversationView">
          <chatItem v-for="item in groupList"
            :avatar="item.avatar"
            :admins="item.admins"
            :group="item.group"
            :name="item.name"
            :available="item.available"
            :active="item.group === currGroupID"
            v-show="currGroupID === item.group"
            class="conversation"></chatItem>
        </div>
        <splitter @splitter="inputSplitter" class="inputSplitter" ref="inputSplitter"></splitter>
        <inputBox class="inputBox" ref="inputBox"
          :group="currGroupID" 
          :available="currGroupAvailable">
        </inputBox>
      </div>
      <div class="center" v-show="!currGroupID"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

import { queryInfo } from '../../assets/queryDB.js'
import router from '../../router/index.js'

import tools from './tools.vue'
import groupItem from './groupItem.vue'
import chatItem from './chatItem.vue'
import inputBox from './inputbox.vue'
import splitter from './splitter.vue'
import groupConfig from './groupConfig.vue'

import theme1 from './../../assets/css/theme1.css?inline'
import theme2 from './../../assets/css/theme2.css?inline'

export default {
  data() {
    return {
      avatar: "",
      uuid: "",
      username: "",

      currGroupID: "",
      currGroupName: "",
      currGroupAvailable: true,

      visible: false,
      drawer: false,
      pinned: {},
      groupList: [], // [{group:String, avatar:String, name:String, admins: Object, available: Boolean}]
    }
  },

  methods: {
    // 初始化，获取用户/群基本信息，建立websocket连接
    async initialization() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/me`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        const data = res.data
        const userInfo = await queryInfo("Account", data.lastUpdate, data.uuid)
        this.uuid = data.uuid
        this.username = data.username
        this.avatar = userInfo.avatar

        this.$store.dispatch('websocketConnection', {
          account: this.uuid,
          username: this.username,
          groups: data.groups.filter(i => {
            return (i.owner.uuid === this.uuid) || i.admin.some(admin => admin.uuid === this.uuid)
          }), // 自己为群主或管理员的群
        })

        const localGroups = await this.getLocalGroups(this.uuid)
        for (const group of data.groups) {
          localGroups.delete(group.group)
          this.getGroupInfo(group, true)
        }
        for (const group of localGroups) {
          this.getGroupInfo({group}, false)
        }
      }).catch(err => {
        console.log(err)
        ElMessage({
          message: `初始化失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 获取每个群的信息(群名，群主，管理员，是否可用)
    async getGroupInfo(group, available) {
      const groupInfo = await queryInfo("Group", group.lastUpdate, group.group)
      if (!available) {
        const element = { ...groupInfo, admins: { owner: {}, admin: {} }, available }
        this.groupList.push(element)
        return
      }

      const owner = { [group.owner.uuid]: group.owner.lastUpdate }
      const admin = {}
      group.admin.forEach(i => { admin[i.uuid] = i.lastUpdate })

      const element = { ...groupInfo, admins: { owner, admin }, available }
      this.groupList.push(element)
      this.$store.dispatch('updateGroupInfo', element)
    },

    // 获取本地群聊(如已退出的群或被踢出的群)
    async getLocalGroups(uuid) {
      const databases = await indexedDB.databases();
      return new Set(databases
        .map(db => db.name)
        .filter(name => name.split("-")[0] === uuid)
        .map(name => name.split("-")[1]))
    },

    // 读取页面布局设置
    readLayoutSettings() {
      const groupWidth = localStorage.getItem('groupWidth')
      const inputTop = localStorage.getItem('inputTop')
      if (groupWidth) {
        this.groupSplitter({ "x": groupWidth })
      }
      if (inputTop) {
        this.inputSplitter({ "y": inputTop })
      }
    },

    readThemeSettings() {
      const currentTheme = localStorage.getItem("theme") || "theme2"
      const mapping = { theme1, theme2 }
      const style = document.createElement('style')
      style.innerHTML = mapping[currentTheme]
      document.head.appendChild(style)
    },

    // 获取置顶群列表
    getPinnedGroups() {
      const pinned = localStorage.getItem("pinned") || '{}'
      this.pinned = JSON.parse(pinned)
    },

    // 当前在看的群改变了
    currGroupChange(id, name, available) {
      this.currGroupID = id
      this.currGroupName = name
      this.currGroupAvailable = available
    },

    // 左边群列表和右边消息区的分割线设置
    groupSplitter(pos) {
      const posX = pos.x
      const rate = posX / window.innerWidth
      if (rate > 0.125 && rate < 0.5) {
        this.$refs.groupSplitter.$el.style.left = posX - 8 + "px"
        this.$refs.leftSide.style.width = posX + "px"
        this.$refs.rightSide.style.width = window.innerWidth - posX + "px"
        localStorage.setItem('groupWidth', posX)
      }
    },

    // 上面消息区和下面输入区的分割线设置
    inputSplitter(pos) {
      const posY = pos.y
      const rate = posY / window.innerHeight
      if (rate > 0.5 && rate < 0.8) {
        this.$refs.inputSplitter.$el.style.bottom = window.innerHeight - posY - 8 + "px"
        this.$refs.inputBox.$el.style.height = window.innerHeight - posY + "px"
        localStorage.setItem('inputTop', posY)
      }
    },

    // 群名修改后
    groupNameModified(info) {
      const { group, name } = info
      const idx = this.groupList.findIndex(i => i.group === group)
      this.groupList[idx].name = name
      if (this.currGroupID === group) {
        this.currGroupName = name
      }
    },

    // 群头像修改后
    groupAvatarModified(info) {
      const { group, avatar } = info
      const idx = this.groupList.findIndex(i => i.group === group)
      this.groupList[idx].avatar = avatar
    },

    // 群的管理员变化后
    // operation为true为有人成为了管理员 false时有人被撤销了管理员
    groupAdminModified(info) {
      const { group, uuid, operation, lastUpdate } = info
      const idx = this.groupList.findIndex(i => i.group === group)
      if (operation) {
        this.groupList[idx].admins.admin[uuid] = lastUpdate
      } else {
        Reflect.deleteProperty(this.groupList[idx].admins.admin, uuid)
      }
    },

    // 群置顶变化后
    groupPinnedModified(info) {
      this.pinned[this.currGroupID] = info
      localStorage.setItem("pinned", JSON.stringify(this.pinned))
    },

    // 获取该群管理员信息
    async getAdminsInfo(groupID) {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${groupID}/members/admin`
      try {
        const res = await axios.get(URL, {headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }})
        return res.data
      } catch (err) {
        ElMessage({
          message: `获取管理员信息时失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
        return {}
      }
    },

    // 加入某群后
    async joinGroupSuccess(info) {
      const res = await this.getAdminsInfo(info.target)
      const groupInfo = await queryInfo('Group', info.targetKey, info.target)
      const owner = { [res.owner.uuid]: res.owner.lastUpdate }
      const admin = {}
      res.admin.forEach(i => { admin[i.uuid] = i.lastUpdate })
      const element = { ...groupInfo, admins: { owner, admin }, available: true }
      const idx = this.groupList.findIndex(i => i.group === info.target)
      if (idx != -1) {
        this.groupList.splice(idx, 1)
      }
      this.groupList.push(element)
      if (this.currGroupID === info.target) {
        this.currGroupAvailable = true
      }
    },

    // 删除某群历史记录
    deleteHistory(group) {
      this.drawer = false
      this.currGroupID = ""
      this.currGroupName = ""
      this.$store.state.groupDB[group].deleteDB().then(() => {
        this.groupList.splice(this.groupList.findIndex(i => i.group === group), 1)
        ElMessage.success("清空聊天记录成功")
      }).catch(err => {
        ElMessage({
          message: '删除失败',
          duration: 6000,
          type: "error",
        })
      })
    },

    logout() {
      localStorage.removeItem('token')
      router.push('/login')
    },
  },

  async mounted() {
    await this.initialization()
    this.readLayoutSettings()
    this.readThemeSettings()
    this.getPinnedGroups()
  },

  components: {
    tools,
    groupItem,
    chatItem,
    inputBox,
    splitter,
    groupConfig,
  }
}
</script>

<style scoped>
.chatPageRoot {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
  min-width: 600px;
  min-height: 400px;
  background: var(--chatPage-chatPageRoot-bgcolor);
}

/* leftSide */
.leftSide {
  position: relative;
  width: 20vw;
  max-width: 50%;
  height: 100%;
  background: var(--chatPage-leftSide-bgcolor);
}

.userInfo {
  display: flex;
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 8px 16px;
  background: var(--chatPage-userInfo-bgcolor);
}

.userInfo p {
  color: var(--chatPage-username-textcolor);
}

.userInfo img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.userInfo p {
  font-size: 1.2rem;
  margin-left: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.groupList {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 64px - 48px); /* .userInfo 64px .tools 48px */
  overflow: scroll;
}

.groupList::-webkit-scrollbar {
  display: none;
}

.groupItem {
  width: 100%;
}

/* rightSide */
.rightSide {
  min-width: 400px;
  height: 100%;
  flex-grow: 1;
}

.header {
  display: flex;
  width: 100%;
  height: 64px;
  background: var(--chatPage-header-bgcolor);
  padding: 8px 24px;
}

.groupToolBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  color: var(--chatPage-groupName-textcolor);
}

.groupToolBar p {
  font-size: 1.2rem;
}

.groupToolBar svg {
  height: 75%;
  cursor: pointer;
}

:deep(.el-drawer) {
  max-width: 600px;
  min-width: 400px;
  background: var(--chatPage-drawer-bgcolor);
}

.center {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 64px);
  background: var(--chatPage-center-bgcolor);
}

.conversationView {
  position: relative;
  width: 100%;
  flex-grow: 1;
  border-top: 1px solid;
  border-bottom: 1px solid;
  border-image: var(--chatPage-center-border) 1;
}

.conversation {
  position: absolute;
  width: 100%;
  height: 100%;
}

.inputBox {
  width: 100%;
  height: 25%;
  max-height: 50%;
}

/* splitter */
.groupSplitter {
  position: absolute;
  left: calc(20vw - 8px);
  width: 16px;
  height: 100%;
  z-index: 100;
}

.groupSplitter:hover {
  cursor: ew-resize;
}

.inputSplitter {
  position: absolute;
  bottom: calc(25% - 8px);
  width: 100%;
  height: 16px;
  z-index: 100;
}

.inputSplitter:hover {
  cursor: ns-resize;
}
</style>


<!-- 
文件关系结构
chatPage
  ├─ groupItem
  ├─ splitter
  ├─ tools
  │     ├─ namecard
  │     ├─ sysMsgGetter
  │     ├─ eachNotice  
  │     └─ eachRequest
  ├─ groupConfig
  │     └─ eachMember
  │           └─ namecard
  ├─ inputBox
  │     ├─ atBar
  │     ├─ favorite
  │     └─ audioMsg
  └─ chatItem
        └─ message
              ├─ broadcast
              ├─ fileMsg
              ├─ imageMsg
              ├─ textMsg
              ├─ audioMsg
              ├─ messageMenu
              ├─ namecard
              └─ groupSelector 
 -->