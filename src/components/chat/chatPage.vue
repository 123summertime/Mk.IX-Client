<template>
  <el-container class="root">

    <el-header class="head">
      <div class="userInfo">
        <img :src=avatar>
        <p>{{ username }}</p>
      </div>
      <div class="groupToolBar" v-show="currGroupID">
         <p>{{ currGroupName }}</p>
      </div>
      <!-- <div class="toolList">
        <el-button type="danger" plain @click="logout">退出登录</el-button>
      </div> -->
    </el-header>

    <el-container>
      <el-aside class="aside">
        <groupItem v-for="item in groupList" :avatar="item['avatar']" :group="item['group']" :name="item['name']"
          class="groupItem" @click="currGroupChange(item['group'], item['name'])"></groupItem>
      </el-aside>
      <el-main class="main">
        <chatItem v-for="item in groupList" v-show="currGroupID === item['group']" 
        :avatar="item['avatar']" :group="item['group']" :name="item['name']" class="mainChat"></chatItem>
        <inputBox :currGroup="currGroupID" class="inputBox"></inputBox>
      </el-main>
    </el-container>
    
  </el-container>
</template>

<script>
import axios from 'axios'

import { queryInfo } from '../../assets/queryDB.js'
import router from '../../router/index.js'

import groupItem from './groupItem.vue'
import chatItem from './chatItem.vue'
import inputBox from './inputbox.vue'

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
  }
}
</script>

<style scoped>
.root {
  width: 100vw;
  height: 100vh;
}

.head {
  display: flex;
  width: 100vw;
  height: 64px;
  background-color: aquamarine;
  padding: 8px 0;
}

.aside {
  width: 20vw;
  height: 100%;
  background-color: bisque;
}

.main {
  position: relative;
  width: 80vh;
  height: 100%;
  padding: 0;
  background-color: coral;
}

.userInfo {
  display: flex;
  justify-content: space-around;
  width: 20vw;
  height: 48px;
  padding: 0 8px;
}

.userInfo img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.userInfo p {
  width: 75%;
  height: 48px;
  font-size: 1.2rem;
  line-height: 48px;
  margin-left: 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.groupToolBar {
  width: 80vw;
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
  padding: 8px;
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