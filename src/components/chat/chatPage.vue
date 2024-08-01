<template>
  <div class="chatPageRoot">

    <div class="leftSide" ref="leftSide">
      <div class="userInfo">
        <img :src=avatar>
        <p>{{ username }}</p>
      </div>
      <div class="groupItems">
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
          <el-drawer v-model="drawer" :with-header="false" :destroy-on-close="true" style="min-width: 400px;">
            <groupConfig
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
            :active="item['group'] === currGroupID"
            :deletedHistory="item['group'] === deletedHistory"
            v-show="currGroupID === item['group']"
            class="conversation"></chatItem>
        </div>
        <splitter @splitter="inputSplitter" class="inputSplitter" ref="inputSplitter"></splitter>
        <inputBox :group="currGroupID" :available="currGroupAvailable" class="inputBox" ref="inputBox"></inputBox>
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

export default {
  data() {
    return {
      avatar: "",
      uuid: "",
      username: "",
      currGroupID: "",
      currGroupName: "",
      currGroupAvailable: true,
      deletedHistory: "",
      visible: false,
      drawer: false,
      pinned: {},
      groupList: [], // [{group:String, avatar:String, name:String, admins: Object, available: Boolean}]
    }
  },

  methods: {
    async initialization() {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/profile/me`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        const data = res.data
        const userInfo = await queryInfo("Account", data["lastUpdate"], data["uuid"])
        this.uuid = data.uuid
        this.username = data.userName
        this.avatar = userInfo.avatar

        this.$store.dispatch('loginAs', {
          account: this.uuid,
          userName: this.username,
        })
        this.$store.dispatch('sysConnection', {
          uuid: this.uuid,
        })

        const localGroups = await this.getLocalGroups(this.uuid)
        data.groups.forEach(id => {
          localGroups.delete(id.group)
          this.getGroupInfo(id.lastUpdate, id.group, true)
        })
        for (const id of localGroups) {
          this.getGroupInfo(null, id, false)
        }
      }).catch(err => { console.log(err) })
    },

    async getGroupInfo(lastUpdate, groupID, available) {
      const groupInfo = await queryInfo("Group", lastUpdate, groupID)
      if (!available) {
        const element = {...groupInfo, admins: {owner: {}, admin: {}}, available}
        this.groupList.push(element)
        return
      }

      const adminInfo = await this.getAdminsInfo(groupID)

      const owner = { [adminInfo.owner.uuid]: adminInfo.owner.lastUpdate }
      const admin = {}
      adminInfo.admin.forEach(i => { admin[`${i.uuid}`] = i.lastUpdate })

      const element = { ...groupInfo, admins: { owner, admin }, available }
      this.groupList.push(element)
      this.$store.dispatch('updateGroupInfo', element)
    },

    async getAdminsInfo(groupID) {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${groupID}/members/admin`
      try {
        const res = await axios.get(URL)
        return res.data
      } catch (err) {
        console.log(err)
        return []
      }
    },

    async getLocalGroups(uuid) {
      const databases = await indexedDB.databases();
      return new Set(databases
        .map(db => db.name)
        .filter(name => name.split("-")[0] === uuid)
        .map(name => name.split("-")[1]))
    },

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

    getPinnedGroups() {
      const pinned = localStorage.getItem("pinned") || '{}'
      this.pinned = JSON.parse(pinned)
    },

    currGroupChange(id, name, available) {
      this.currGroupID = id
      this.currGroupName = name
      this.currGroupAvailable = available
    },

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

    inputSplitter(pos) {
      const posY = pos.y
      const rate = posY / window.innerHeight
      if (rate > 0.5 && rate < 0.8) {
        this.$refs.inputSplitter.$el.style.bottom = window.innerHeight - posY - 8 + "px"
        this.$refs.inputBox.$el.style.height = window.innerHeight - posY + "px"
        localStorage.setItem('inputTop', posY)
      }
    },

    groupNameModified(info) {
      const { group, name } = info
      if (this.currGroupID === group) {
        this.currGroupName = name
      }

      this.groupList = this.groupList.map(item => {
        if (item.group === group) {
          return { ...item, name: name }
        }
        return item
      })
    },

    groupAvatarModified(info) {
      const { group, avatar } = info
      this.groupList = this.groupList.map(item => {
        if (item.group === group) {
          return { ...item, avatar }
        }
        return item
      })
    },

    groupAdminModified(info) {
      // 更新群的管理员变化
      const { group, uuid, operation, lastUpdate } = info
      const targetGroup = this.groupList.find(i => i.group === group)
      if (operation) {
        targetGroup.admins.admin[uuid] = lastUpdate
      } else {
        Reflect.deleteProperty(targetGroup.admins.admin, uuid)
      }
    },

    groupPinnedModified(info) {
      this.pinned[this.currGroupID] = info
      localStorage.setItem("pinned", JSON.stringify(this.pinned))
    },

    joinGroupSuccess(info, autoChangeGroup) {
      this.getGroupInfo("", info["group"])
      if (autoChangeGroup) {
        this.currGroupChange(info["group"], info["name"])
      }
    },

    deleteHistory(info) {
      this.deletedHistory = info
    },

    logout() {
      localStorage.removeItem('token')
      router.push('/login')
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
  }
}
</script>

<style scoped>
.chatPageRoot {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
}

/* leftSide */
.leftSide {
  position: relative;
  width: 20vw;
  height: 100%;
  background-color: bisque;
}

.userInfo {
  display: flex;
  width: 100%;
  height: 64px;
  padding: 8px 16px;
}

.userInfo img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.userInfo p {
  height: 48px;
  font-size: 1.2rem;
  line-height: 48px;
  margin-left: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.groupItems {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 64px);
  padding-bottom: 48px;
  overflow: scroll;
}

.groupItems::-webkit-scrollbar {
  display: none;
}

.groupItem {
  width: 100%;
  height: 80px;
  background-color: darkkhaki;
  order: 2147483647;
}

/* rightSide */
.rightSide {
  height: 100%;
  flex-grow: 1;
}

.header {
  display: flex;
  width: 100%;
  height: 64px;
  background-color: aquamarine;
  padding: 8px 24px;
}

.groupToolBar {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 48px;
}

.groupToolBar p {
  font-size: 1.2rem;
  line-height: 48px;
}

.groupToolBar svg {
  height: 32px;
  margin: 8px 0;
  cursor: pointer;
}

.center {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 64px);
  background-color: coral;
}

.conversationView {
  position: relative;
  width: 100%;
  flex-grow: 1;
}

.conversation {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.inputBox {
  width: 100%;
  height: 25%;
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

@media screen and (max-width: 480px) {
  .chatPageRoot {
    width: 100vh;
    height: 100vw;
  }
}
</style>


<!-- 
文件关系结构
chatPage
  |- groupItem
  |- splitter
  |- tools
  |     |- sysMsgGetter
  |- groupConfig
  |     |- eachMember
  |- inputBox
  |     |- atBar
  |     |- favorite
  |     |- audioMsg
  |- chatItem
  |     |- message
  |     |     |- broadcast
  |     |     |- fileMsg
  |     |     |- imageMsg
  |     |     |- textMsg
  |     |     |- audioMsg
  |     |     |- messageMenu
  |     |     |- namecard
 -->