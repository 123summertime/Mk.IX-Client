<template>
  <el-container class="root">
    <el-header class="head">
      <div class="userInfo">
        <img :src=avatar>
        <span>{{ username }}</span>
      </div>

    </el-header>
    <el-container>
      <el-aside class="aside">Aside</el-aside>
      <el-main class="main">Main</el-main>
    </el-container>
  </el-container>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      avatar: "data:image/png;base64,",
      username: "",
    }
  },
  methods: {

  },
  async mounted() {
    const URL = `http://${localStorage.getItem('adress')}/profile`
    axios.get(URL, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      const data = res["data"]
      this.avatar += data["avatar"]
      this.username = data["userName"]
    }).catch(err => { console.log(err) })
  }
}
</script>

<style>
.root {
  width: 100vw;
  height: 100vh;
}

.head {
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

</style>