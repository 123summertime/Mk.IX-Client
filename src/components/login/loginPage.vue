<template>
  <div class="loginPageRoot">
    <div class="view">
      <loginANDregister></loginANDregister>
    </div>
    <div class="bkgdItem bkgdItem1"></div>
    <div class="bkgdItem bkgdItem2"></div>
    <div class="bkgdItem bkgdItem3"></div>
  </div>
</template>

<script>
import axios from 'axios'

import router from './../../router/index.js'

import loginANDregister from './loginANDregister.vue'

export default {
  data() {
    return {

    }
  },

  methods: {
    tryLogin() {
      const adress = localStorage.getItem("adress") ?? ""
      const token = localStorage.getItem("token") ?? ""
      if (!adress || !token) { return }

      const URL = `${adress}/v1/user/check`
      axios.get(URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        // 刷新token
        localStorage.setItem("token", res.data.refreshToken)
        router.push('/chat')
      }).catch(err => { })
    },
  },

  mounted() {
    this.tryLogin()
  },

  components: {
    loginANDregister,
  }
}
</script>

<style scoped>
.loginPageRoot {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding: 10vh 0 5vh 0;
  background-image: linear-gradient(45deg, #fbc2eb, #a6c1ee);
  overflow: hidden;
}

.view {
  width: 33%;
  min-width: 300px;
  max-width: 450px;
  max-height: 100%;
  margin: 0 auto;
  padding: 32px;
  border-radius: 32px;
  background: rgba(245, 245, 245, 0.1);
  overflow: scroll;
  z-index: 10;
}

.view::-webkit-scrollbar {
  display: none;
}

.bkgdItem {
  position: absolute;
  background: rgba(245, 245, 245, 0.2);
  border-radius: 16px;
  width: var(--bkgdItem-size);
  height: var(--bkgdItem-size);
}

.bkgdItem1 {
  transform: translateX(-3vw) translateY(3vh) rotateZ(40deg);
  --bkgdItem-size: 15vw;
}

.bkgdItem2 {
  transform: translateX(82vw) translateY(6vh) rotateZ(-17deg);
  --bkgdItem-size: 23vw;
}

.bkgdItem3 {
  transform: translateX(11vw) translateY(72vh) rotateZ(43deg);
  --bkgdItem-size: 19vw;
}
</style>