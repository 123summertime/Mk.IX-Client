<template>
  <div class="chatPageRoot">

    <div class="leftSide" ref="leftSide">
      <div class="userInfo">
        <img :src=avatar>
        <p>{{ username }}</p>
      </div>
      <div class="groupItems">
        <groupItem v-for="item in groupList" :avatar="item['avatar']" :group="item['group']" :name="item['name']"
        class="groupItem" @click="currGroupChange(item['group'], item['name'])"></groupItem>
      </div>
    </div>

    <div class="splitter" ref="splitter">
      <splitter @splitter="groupSplitter"></splitter>
    </div>

    <div class="rightSide">

      <div class="head">
        <div class="groupToolBar" v-show="currGroupID">
          <p>{{ currGroupName }}</p>
        </div>
      </div>

      <div class="main">
        <chatItem v-for="item in groupList" v-show="currGroupID === item['group']" :avatar="item['avatar']"
          :group="item['group']" :name="item['name']" class="mainChat"></chatItem>
        <inputBox :currGroup="currGroupID" class="inputBox"></inputBox>
      </div>

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
      groupList: [], // [{group, avatar, name}]
    }
  },

  methods: {
    async getGroupInfo(lastUpdate, group) {
      const groupInfo = await queryInfo("Group", lastUpdate, group)
      this.groupList.push(groupInfo)
    },

    async makeConnection(groupID) {
      this.$store.dispatch('wsConnect', {
        "groupID": groupID,
        "uuid": this.uuid
      })
    },

    currGroupChange(id, name) {
      this.currGroupID = id
      this.currGroupName = name
    },

    groupSplitter(pos) {
      const posX = pos["x"]
      if (posX / window.innerWidth < 0.5) {
        this.$refs.splitter.style.left = posX - 8 + "px"
        this.$refs.leftSide.style.width = posX + "px"
      }    
    },

    logout() {
      localStorage.removeItem('token')
      router.push('/login')
    },
  },

  async mounted() {
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

/* splitter */
.splitter {
  position: fixed;
  left: calc(20vw - 8px);
  width: 16px;
  height: 100vh;
  z-index: 100;
}

.splitter:hover {
  cursor: ew-resize;
}


/* rightSide */
.rightSide {
  flex-grow: 1;
}

.head {
  display: flex;
  width: 100%;
  height: 64px;
  background-color: aquamarine;
  padding: 8px 0;
}

.main {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: coral;
}

.groupToolBar {
  width: 100%;
  height: 48px;
}

.groupToolBar p {
  font-size: 1.2rem;
  line-height: 48px;
}

.toolList {
  display: flex;
  justify-content: space-between;
  margin: auto 0;
}

.groupItem {
  width: 100%;
  height: 5rem;
  background-color: darkkhaki;
}

.mainChat {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 75%;
  padding: 1rem;
  overflow: scroll;
}

.mainChat::-webkit-scrollbar {
  display: none;
}

.inputBox {
  position: absolute;
  left: 0;
  top: 75%;
  width: 100%;
  height: 25%;
  overflow: hidden;
}
</style>