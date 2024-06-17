<template>
  <div class="audioMsg">
    <p>{{ payload }}</p>
  </div>
</template>

<script>
export default {
  props: {
    payload: Object,
  }
}
</script>

<style scoped>
.audioMsg {
  background-color: orangered;
}
.audioMsg p {
  font-size: 1.2rem;
  line-height: 1.5rem;
}
</style>