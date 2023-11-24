<template>
  <div class="bkgd">
    <div class="view">
      <login v-if="option == 0" @option="changeOption"></login>
      <register v-else @option="changeOption"></register>
    </div>
    <div class="bkgdItem bkgdItem1"></div>
    <div class="bkgdItem bkgdItem2"></div>
    <div class="bkgdItem bkgdItem3"></div>
  </div>
</template>

<script>
import axios from 'axios'

import router from './../../router/index.js'

import login from './login.vue'
import register from './register.vue'

export default {
  data() {
    return {
      option: 0,
    }
  },
  methods: {
    changeOption() {
      this.option = !this.option
    }
  },
  async mounted() {
    const adress = localStorage.getItem("adress") ?? ""
    const token = localStorage.getItem("token") ?? ""

    if (adress && token) {
      const URL = `http://${adress}/check`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        // 刷新token
        if (res["data"]["refreshToken"] != "") {
          localStorage.setItem("token", res["data"]["refreshToken"])
        }
        router.push('/chat')
      }).catch(err => { console.log(err) })
    }
  },
  components: {
    login,
    register
  }
}
</script>

<style scoped>
.bkgd {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding: 10vh 0;
  background-image: linear-gradient(45deg, #fbc2eb, #a6c1ee);
  overflow: hidden;
}

.view {
  position: absolute;
  left: 35vw;
  width: 30vw;
  height: 80vh;
  background-color: rgba(245, 245, 245, 0.5);
  backdrop-filter: blur(15px);
  padding: 7.5vh 3vw;
  border-radius: 5%;
  overflow: scroll;
  z-index: 10;
}

.view::-webkit-scrollbar {
  	display: none;
}

.bkgdItem {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 7.5%;
  width: var(--bkgdItem-size);
  height: var(--bkgdItem-size);
}

.bkgdItem1 {
  transform: translateX(-3vw) translateY(3vh) rotateZ(40deg);
  --bkgdItem-size: 17vw;
}

.bkgdItem2 {
  transform: translateX(82vw) translateY(6vh) rotateZ(-17deg);
  --bkgdItem-size: 21vw;
}

.bkgdItem3 {
  transform: translateX(11vw) translateY(72vh) rotateZ(43deg);
  --bkgdItem-size: 19vw;
}

.yuanshen {
  width: 20px;
  height: 20px;
}
</style>