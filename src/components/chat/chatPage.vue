<template>
  <div class="chatPageRoot">

    <div class="leftSide" ref="leftSide">
      <div class="userInfo">
        <img :src=avatar>
        <p>{{ username }}</p>
      </div>
      <div class="groupItems">
        <groupItem v-for="item in groupList"
          :avatar="item['avatar']"
          :group="item['group']"
          :name="item['name']"
          @click="currGroupChange(item['group'], item['name'])"
          class="groupItem"></groupItem>
      </div>
    </div>

    <splitter @splitter="groupSplitter" class="groupSplitter" ref="groupSplitter"></splitter>

    <div class="rightSide">

      <div class="header">
        <div class="groupToolBar" v-show="currGroupID">
          <p>{{ currGroupName }}</p>
        </div>
      </div>

      <div class="center" v-if="currGroupID">
        <div class="conversationView">
          <chatItem v-for="item in groupList"
            :avatar="item['avatar']"
            :owner="item['owner']"
            :admin="item['admin']"
            :group="item['group']"
            :name="item['name']"
            v-show="currGroupID === item['group']"
            class="conversation"></chatItem>
        </div>
        <splitter @splitter="inputSplitter" class="inputSplitter" ref="inputSplitter"></splitter>
        <inputBox :currGroup="currGroupID" class="inputBox" ref="inputBox"></inputBox>
      </div>
      <div class="center" v-else></div>

    </div>

  </div>
</template>

<script>
import axios from 'axios'

import { queryInfo } from '../../assets/queryDB.js'
import router from '../../router/index.js'

import groupItem from './groupItem.vue'
import chatItem from './chatItem.vue'
import inputBox from './inputbox.vue'
import splitter from './splitter.vue'

export default {
  data() {
    return {
      avatar: "data:image/png;base64,",
      uuid: "",
      username: "",
      currGroupID: "",
      currGroupName: "",
      groupList: [], // [{group:String, avatar:String, name:String, owner:Object, admin:Map}]
    }
  },

  methods: {
    async initialization() {
      const URL = `http://${localStorage.getItem('adress')}/profile`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        const data = res["data"]
        const userInfo = await queryInfo("Account", data["lastUpdate"], data["uuid"])
        this.uuid = data["uuid"]
        this.username = data["userName"]
        this.avatar += userInfo["avatar"]
        this.$store.dispatch('loginAs', {
          "account": this.uuid,
          "userName": this.username,
        })
        data["groups"].forEach(id => {
          this.getGroupInfo(id["lastUpdate"], id["group"])
          this.makeConnection(id["group"])
        })
      }).catch(err => { console.log(err) })
    },

    async getGroupInfo(lastUpdate, groupID) {
      const groupInfo = await queryInfo("Group", lastUpdate, groupID)
      const adminInfo = await this.getAdminsInfo(groupID)


      const ownerMap = new Map()
      ownerMap.set(adminInfo["owner"]["uuid"], adminInfo["owner"]["lastUpdate"])
      adminInfo["owner"] = ownerMap

      const adminMap = new Map()
      adminInfo["admin"].forEach(i => {
        adminMap.set(i["uuid"], i["lastUpdate"])
      })
      adminInfo["admin"] = adminMap

      this.groupList.push({ ...groupInfo, ...adminInfo })
    },

    async getAdminsInfo(groupID) {
      const URL = `http://${localStorage.getItem('adress')}/getAdminInfo?group=${groupID}`
      try {
        const res = await axios.get(URL)
        return res["data"]
      } catch (err) {
        console.log(err)
      }
    },

    async makeConnection(groupID) {
      this.$store.dispatch('wsConnect', {
        "groupID": groupID,
        "uuid": this.uuid
      })
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

    currGroupChange(id, name) {
      this.currGroupID = id
      this.currGroupName = name
    },

    groupSplitter(pos) {
      const posX = pos["x"]
      const rate = posX / window.innerWidth
      if (rate < 0.5) {
        this.$refs.groupSplitter.$el.style.left = posX - 8 + "px"
        this.$refs.leftSide.style.width = posX + "px"
        localStorage.setItem('groupWidth', posX)
      }
    },

    inputSplitter(pos) {
      const posY = pos["y"]
      const rate = posY / window.innerHeight
      if (rate > 0.5 && rate < 0.8) {
        this.$refs.inputSplitter.$el.style.bottom = window.innerHeight - posY - 8 + "px"
        this.$refs.inputBox.$el.style.height = window.innerHeight - posY + "px"
        localStorage.setItem('inputTop', posY)
      }
    },

    logout() {
      localStorage.removeItem('token')
      router.push('/login')
    },
  },

  async mounted() {
    this.initialization()
    this.readLayoutSettings()
  },

  components: {
    groupItem,
    chatItem,
    inputBox,
    splitter,
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
  padding: 8px 16px;
}

.groupToolBar {
  width: 100%;
  height: 48px;
}

.groupToolBar p {
  font-size: 1.2rem;
  line-height: 48px;
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
  overflow: scroll;
}

.conversation::-webkit-scrollbar {
  display: none;
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
</style>