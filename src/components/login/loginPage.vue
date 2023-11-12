<template>
  <div class="bkgd">
    <div class="view">
      <login v-if="option==0"></login>
      <register v-else></register>
      <button @click="changeOption" class="yuanshen"></button>
    </div>
    <div class="bkgdItem1"></div>
    <div class="bkgdItem2"></div>
    <div class="bkgdItem3"></div>
  </div>
</template>

<script>
import login from './login.vue'
import register from './register.vue';
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
  components: {
    login,
    register
  }
}
</script>

<style>
.bkgd {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding: 10vh 0;
  background-image: linear-gradient(45deg, #fbc2eb, #a6c1ee);
  background-size: cover;
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
  z-index: 1;
}

.bkgdItem1 {
  position: absolute;
  width: 17vw;
  height: 17vw;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transform: translateX(-3vw) translateY(3vh) rotateZ(40deg);
  border-radius: 7.5%;
}

.bkgdItem2 {
  position: absolute;
  width: 22vw;
  height: 22vw;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transform: translateX(82vw) translateY(6vh) rotateZ(-17deg);
  border-radius: 7.5%;
}

.bkgdItem3 {
  position: absolute;
  width: 19vw;
  height: 19vw;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transform: translateX(11vw) translateY(72vh) rotateZ(43deg);
  border-radius: 7.5%;
}

.yuanshen {
  width: 20px;
  height: 20px;
}
</style>