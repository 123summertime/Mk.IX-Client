<template>
  <div class="chatPageRoot" ref="Root">

    <div class="leftSide" ref="leftSide">
      <div class="userInfo">
        <img :src=avatar alt="avatar" @click="namecardTrigger = !namecardTrigger">
        <p>{{ username }}</p>
      </div>
      <div class="groupList">
        <groupItem v-for="item in groupList" :key="item.group"
          :avatar="item.avatar"
          :group="item.group"
          :name="item.name"
          :active="item.group === currGroupID"
          :type="item.type"
          :isPinned="pinned[item.group] === true"
          @click="currGroupChange(item.group, item.name, item.available, item.type)"
          class="groupItem"></groupItem>
      </div>
      <tools @joinGroupSuccess="joinGroupSuccess" @gotoSetting="settingVisible = true"></tools>
      <el-drawer v-model="settingVisible" direction="ltr" :with-header="false" :destroy-on-close="true">
        <setting
          :uuid="uuid" 
          :username="username"
          :avatar="avatar"
          @userAvatarModified="newAvatar => avatar = newAvatar"
          @usernameModified="newUsername => username = newUsername"
          @userLayoutModified="userLayoutModified"></setting>
      </el-drawer>
    </div>

    <namecard
      :uuid="uuid"
      :namecardTrigger="namecardTrigger">
    </namecard>

    <splitter @splitter="groupSplitter" class="groupSplitter" ref="groupSplitter"></splitter>

    <div class="rightSide" ref="rightSide">
      <div class="header">
        <div class="groupToolBar" v-show="currGroupID">
          <ArrowLeft class="back" @click="() => { mobileSwitchSide(); currGroupID = '' }"></ArrowLeft>
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
            :type="item.type"
            :active="item.group === currGroupID"
            :delete="currDeleteHistory"
            :key="item.group"
            v-show="currGroupID === item.group"
            class="conversation"></chatItem>
        </div>
        <splitter @splitter="inputSplitter" class="inputSplitter" ref="inputSplitter"></splitter>
        <inputBox class="inputBox" ref="inputBox"
          :group="currGroupID"
          :type="currGroupType"
          :available="currGroupAvailable">
        </inputBox>
      </div>
      <div class="center" v-show="!currGroupID"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

import { queryInfo } from '../../assets/js/queryDB.js'

import tools from './tools.vue'
import groupItem from './groupItem.vue'
import chatItem from './chatItem.vue'
import inputBox from './inputbox.vue'
import splitter from './splitter.vue'
import groupConfig from './groupConfig.vue'
import setting from './setting.vue'
import namecard from './namecard.vue'

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
      currGroupType: "",
      currDeleteHistory: {},
      currGroupAvailable: true,

      visible: false,
      drawer: false,
      settingVisible: false,
      namecardTrigger: false,

      pinned: {},
      groupList: [], // [{group:String, avatar:String, name:String, admins: Object, available: Boolean, type: String}]
    }
  },

  methods: {
    // 初始化，获取用户/群基本信息，建立websocket连接
    async initialization() {
      const URL = `${localStorage.getItem('adress')}/v1/user/profile/me`
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
          this.getGroupInfo(group, "group", true)
        }
        for (const friend of data.friends) {
          localGroups.delete(friend.uuid)
          this.getGroupInfo(friend, "friend", true)
        }
        for (const [k, v] of localGroups) {
          this.getGroupInfo({id: k}, v, false)
        }
      }).catch(err => {
        ElMessage({
          message: `初始化失败 ${err.response.data.detail}`,
          duration: 6000,
          type: "error",
        })
      })
    },

    // 获取每个群/好友的信息(群名，群主，管理员，是否可用) type为"group"|"friend"
    async getGroupInfo(id, type, available) {
      let groupInfo = null
      if (type == "group") {
        groupInfo = await queryInfo("Group", id.lastUpdate, id.group || id.id)
      } else {
        groupInfo = await queryInfo("Account", id.lastUpdate, id.uuid || id.id)
        groupInfo.group = groupInfo.uuid
        groupInfo.name = groupInfo.username
      }
      groupInfo.type = type

      if (!available) {
        const element = { ...groupInfo, admins: { owner: {}, admin: {} }, available }
        this.groupList.push(element)
        return
      }
      
      let element = {}
      if (groupInfo.type == "group") {
        const owner = { [id.owner.uuid]: id.owner.lastUpdate }
        const admin = {}
        id.admin.forEach(i => { admin[i.uuid] = i.lastUpdate })
        element = { ...groupInfo, admins: { owner, admin }, available }
      } else {
        element = {...groupInfo, admins: { owner: {}, admin: {} }, available }
      }
      this.groupList.push(element)
      this.$store.dispatch('updateGroupInfo', element)
    },

    // 获取本地群聊(如已退出的群或被踢出的群)
    async getLocalGroups(uuid) {
      const databases = await indexedDB.databases();
      return new Map(databases
        .map(db => db.name)
        .filter(name => name.split("-")[0] === uuid)
        .map(name => [name.split("-")[1], name.split("-")[2]]));
    },

    // 读取页面布局设置
    readLayoutSettings() {
      this.readSplitterSettings()
      this.readThemeSettings()
      this.readFontsizeSetting()
    },

    readSplitterSettings() {
      let groupWidth = localStorage.getItem('groupWidth')
      let inputTop = localStorage.getItem('inputTop')
      if (!groupWidth) {
        groupWidth = 0.2 * window.innerWidth
        localStorage.setItem('groupWidth', groupWidth)
      }
      if (!inputTop) {
        inputTop = 0.8 * window.innerHeight
        localStorage.setItem('inputTop', inputTop)
      }
      this.groupSplitter({ x: groupWidth })
      this.inputSplitter({ y: inputTop })
    },

    readThemeSettings() {
      let currentTheme = localStorage.getItem("theme")
      if (!currentTheme) {
        currentTheme = "theme2"
        localStorage.setItem("theme", currentTheme)
      }
      this.changeTheme(currentTheme)
    },

    readFontsizeSetting() {
      let currentFontsize = localStorage.getItem("fontsize")
      if (!currentFontsize) { return }  // 没有设置fontsize则会依据App.vue中的css规定的fontsize
      document.documentElement.style.fontSize = currentFontsize + "px"
    },

    // 获取置顶群列表
    getPinnedGroups() {
      const pinned = localStorage.getItem("pinned") || '{}'
      this.pinned = JSON.parse(pinned)
    },

    // 当前在看的群改变了
    currGroupChange(id, name, available, type) {
      this.currGroupID = id
      this.currGroupName = name
      this.currGroupAvailable = available
      this.currGroupType = type
      if (this.isMobileDevice) {
        this.mobileSwitchSide()
      }
    },

    mobileSwitchSide() {
      this.$refs.Root.classList.toggle("animate")
    },

    userLayoutModified(vals) {
      const { groupWidth, inputTop, theme } = vals
      this.groupSplitter({ x: groupWidth })
      this.inputSplitter({ y: inputTop })
      this.changeTheme(theme)
    },

    // 左边群列表和右边消息区的分割线设置 宽度占比在[0.15, 0.5]之间
    groupSplitter(pos) {
      if (this.isMobileDevice) { return }
      const posX = Math.min(Math.max(0.15 * window.innerWidth, pos.x), 0.5 * window.innerWidth)
      this.$refs.groupSplitter.$el.style.left = posX - 8 + "px"
      this.$refs.leftSide.style.width = posX + "px"
      localStorage.setItem('groupWidth', posX)
    },

    // 上面消息区和下面输入区的分割线设置 高度占比在[0.5, 0.9]之间
    inputSplitter(pos) {
      const posY = Math.min(Math.max(0.5 * window.innerHeight, pos.y), 0.9 * window.innerHeight)
      this.$refs.inputSplitter.$el.style.bottom = window.innerHeight - posY - 8 + "px"
      this.$refs.inputBox.$el.style.height = window.innerHeight - posY + "px"
      localStorage.setItem('inputTop', posY)
    },

    changeTheme(theme) {
      localStorage.setItem('theme', theme)
      const mapping = { theme1, theme2 }
      const style = document.createElement('style')
      style.innerHTML = mapping[theme] || theme2
      document.head.appendChild(style)
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
      const URL = `${localStorage.getItem('adress')}/v1/group/${groupID}/members/admin`
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
      let element = null
      if (info.type === "group") {
        const res = await this.getAdminsInfo(info.group)
        const groupInfo = await queryInfo('Group', info.targetKey, info.group)
        const owner = { [res.owner.uuid]: res.owner.lastUpdate }
        const admin = {}
        res.admin.forEach(i => { admin[i.uuid] = i.lastUpdate })
        groupInfo.type = info.type
        element = { ...groupInfo, admins: { owner, admin }, available: true }
      } else {
        const groupInfo = await queryInfo("Account", info.targetKey, info.group)
        groupInfo.group = groupInfo.uuid
        groupInfo.name = groupInfo.username
        groupInfo.type = info.type
        element = { ...groupInfo, admins: { owner: {}, admin: {}}, available: true }
      }
      
      const idx = this.groupList.findIndex(i => i.group === element.group)
      if (idx != -1) {
        this.groupList.splice(idx, 1)
      }
      this.groupList.push(element)
      this.$store.dispatch('updateGroupInfo', element)
      if (this.currGroupID === info.group) {
        this.currGroupAvailable = true
      }
    },

    // 删除某群历史记录
    deleteHistory(info) {
      const { group, available } = info
      this.drawer = false
      this.currGroupID = ""
      this.currGroupName = ""
      this.currDeleteHistory = { group, random: Math.random() } // 如果清除同一个群的历史记录2次，group不变random会变保证被chatItem watch到
      this.$store.state.groupDB[group].deleteDB().then(() => { 
        if (this.isMobileDevice) {
          this.mobileSwitchSide()
        }
        if (!available) {
          this.groupList.splice(this.groupList.findIndex(i => i.group === group), 1)
        }
        ElMessage.success("清空聊天记录成功")
      }).catch(err => {
        ElMessage({
          message: '删除失败',
          duration: 6000,
          type: "error",
        })
      })
    },
  },

  computed: {
    isMobileDevice() {
      return window.innerWidth <= 768
    },
  },

  async mounted() {
    await this.initialization()
    this.readLayoutSettings()
    this.getPinnedGroups()
  },

  components: {
    tools,
    groupItem,
    chatItem,
    inputBox,
    splitter,
    groupConfig,
    setting,
    namecard,
  }
}
</script>

<style scoped>
.chatPageRoot {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--chatPage-chatPageRoot-bgcolor);
}

/* leftSide */
.leftSide {
  position: relative;
  width: 20vw;
  height: 100%;
  background: var(--chatPage-leftSide-bgcolor);
  overflow: hidden;
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
  cursor: pointer;
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
  height: calc(100% - 64px - 3rem); /* .userInfo 64px .tools 3rem */
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
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.header {
  display: flex;
  width: 100%;
  height: 64px;
  background: var(--chatPage-header-bgcolor);
  padding: 8px 0;
}

.groupToolBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0 1.5rem;
  color: var(--chatPage-groupName-textcolor);
}

.back {
  display: none;
}

.groupToolBar p {
  font-size: 1.2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.groupToolBar svg {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

:deep(.el-drawer) {
  max-width: 600px;
  min-width: min(450px, 90%);
  background: var(--chatPage-drawer-bgcolor);
}

:deep(.el-drawer__body)::-webkit-scrollbar {
  display: none;
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
  border-top: 2px solid;
  border-bottom: 2px solid;
  border-image: var(--chatPage-center-border) 1;
}

.conversation {
  position: absolute;
  width: 100%;
  height: 100%;
}

.inputBox {
  width: 100%;
  height: 20%;
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

@media screen and (max-width: 768px) {
  .leftSide {
    width: 100%;
    transition: width 0.2s ease;
  }
  
  .rightSide {
    width: 0;
    transition: width 0.2s ease;
  }

  .animate .leftSide {
    width: 0;
  }

  .animate .rightSide {
    width: 100%;
  }

  .groupSplitter, 
  .inputSplitter {
    display: none;
  }

  .back {
    display: block;
  }

  .groupList {
    border-top: 2px solid;
    border-bottom: 2px solid;
    border-image: var(--chatPage-center-border) 1;
  }

  .userInfo p, .groupToolBar p {
    font-size: 1.4rem;
  }
}
</style>


<!-- 
文件关系结构
chatPage
  ├─ groupItem
  ├─ splitter
  ├─ namecard
  ├─ setting
  │     └─ groupSelector
  ├─ tools
  │     ├─ namecard
  │     ├─ sysMsgGetter
  │     ├─ eachNotice  
  │     │     └─ namecard
  │     └─ eachRequest
  │           └─ namecard
  ├─ groupConfig
  │     └─ eachMember
  │           └─ namecard
  ├─ inputBox
  │     ├─ atBar
  │     ├─ favorite
  │     ├─ upload
  │     └─ audioMsg
  └─ chatItem
        └─ message
              ├─ groupSelector
              ├─ fileMsg
              ├─ imageMsg
              ├─ textMsg
              ├─ audioMsg
              ├─ messageMenu
              ├─ namecard
              └─ broadcast
                   └─ namecard
-->