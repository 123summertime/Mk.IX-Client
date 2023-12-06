<template>
  <el-container class="root">

    <el-header class="head">
      <div class="userInfo">
        <img :src=avatar>
        <span>{{ username }}</span>
      </div>
      <div class="toolList">
        <el-button type="danger" plain @click="logout">退出登录</el-button>
      </div>
    </el-header>

    <el-container>

      <el-aside class="aside">
        <groupItem v-for="item in groupList" :avatar="item['avatar']" :group="item['group']" :name="item['name']"
          class="groupItem" @click="currGroup = item['group']"></groupItem>
      </el-aside>

      <el-main class="main">
        <chatItem v-for="item in groupList" v-show="currGroup === item['group']" :avatar="item['avatar']" :group="item['group']" :name="item['name']" class="mainChat"></chatItem>
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

export default {
  data() {
    return {
      avatar: "data:image/png;base64,",
      uuid: "",
      username: "",
      currGroup: "",
      groupList: [], // schema: [{group, avatar, name}]
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
    chatItem
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
  justify-content: space-between;
  width: 100vw;
  height: 4rem;
  padding: 0.5rem 2vw;
  background-color: aquamarine;
}

.aside {
  width: 20vw;
  height: 100%;
  background-color: bisque;
}

.main {
  position: relative;
  padding: 0;
  background-color: coral;
}

.userInfo {
  width: 30vw;
}

.userInfo img {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.userInfo span {
  display: inline-block;
  height: 3rem;
  font-size: 1rem;
  line-height: 3rem;
  margin-left: 1rem;
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
  padding: 0.5rem;
}

.mainChat {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>