<template>
  <div class="bkgd">
    <div class="view">
      <button @click="changeOption" class="yuanshen"></button>
      <login v-if="option==0"></login>
      <register v-else></register>
    </div>
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
  background-color:antiquewhite;
}

.view {
  position: absolute;
  left: 35vw;
  width: 30vw;
  height: 100vh;
  background-color: rgba(127, 255, 212, 0.3);
  padding: 10vh 3vw;
}

.yuanshen {
  width: 20px;
  height: 20px;
}
</style>