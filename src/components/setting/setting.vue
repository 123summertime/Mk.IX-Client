<template>
  <div class="settingRoot">
    <div>Setting</div>
    <div>Avatar</div>
    <div>Name</div>
    <button @click="tm">change</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentStyleName: 'theme1',
      currentStyleElement: null,
    };
  },
  
  methods: {
    fir() {
      const style = document.createElement('style')
      style.innerHTML = this.currentStyleName === 'theme1' ? theme1 : theme2
      document.head.appendChild(style)
      this.currentStyleElement = style
      console.log(style)
    },

    tm() {
      this.currentStyleName = this.currentStyleName === 'theme1' ? 'theme2' : 'theme1'
      this.currentStyleElement.innerHTML = this.currentStyleName === 'theme1' ? theme1 : theme2
    }
  },

  mounted() {
    // this.fir()
  }
};
</script>

<style scoped>
.settingRoot {
  color: antiquewhite;
}
</style>