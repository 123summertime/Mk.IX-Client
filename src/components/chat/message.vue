<template>
  <div class="main">
    <div class="avatar">
      <img :src="'data:image/png;base64,' + avatar">
    </div>
    <div class="message">
      <p class="userName">{{ userName }}</p>
      <p class="payload">{{ payload }}</p>
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
  transform: translateY(8px);
}

.main {
  display: flex;
  margin-bottom: 1rem;
}

.message {
  display: inline-block;
  max-width: 60%;
  margin-left: 0.5rem;
}

.userName {
  margin-bottom: 6px;
}

.payload {
  word-wrap: break-word;
  background-color: orangered;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  line-height: 1.2rem;
  font-size: 1.2rem;
}
</style>