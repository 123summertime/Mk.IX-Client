<template>
  <div class="splitterRoot" draggable="true" @drag="dragging"></div>
</template>

<script>
export default {
  data() {
    return {
      currX: 0,
      currY: 0,
    }
  },

  methods: {

    dragging(event) {
      if (event.clientX != 0) {
        this.currX = event.clientX
        this.currY = event.clientY
        this.posSender()
      }
    },

    posSender() {
      this.$emit('splitter', {
        x: this.currX,
        y: this.currY,
      })
    }
  }
}
</script>

<style scoped>
.splitterRoot {
  min-width: 5px;
  min-height: 5px;
  width: 100%;
  height: 100%;
  background-color: transparent;
}
</style>