<template>
  <div class="main">
    <img :src="'data:image/png;base64,' + avatar">
    <div class="message">
      <div class="userName">{{ userName }}</div>
      <div class="payload">{{ payload }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    time: String,
    type: String,
    avatar: String,
    uuid: String,
    userName: String,
    payload: String,
  },
}
</script>

<style scoped>
img {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.message {
  display: inline-block;
}
</style>