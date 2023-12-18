<template>
  <div :class="messageFrom() ? 'message bySelf' : 'message'">
    <div class="avatar">
      <img :src="'data:image/png;base64,' + avatar">
    </div>
    <div class="container">
      <p class="userName">{{ userName }}</p>
      <div>
        <p class="payload">{{ payload }}</p>
      </div>
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
  methods: {
    messageFrom() {
      return this.uuid === this.$store.state["account"]
    }
  }
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

.message {
  display: flex;
  margin-bottom: 16px;
}

.bySelf {
  direction: rtl;
}

.container {
  display: inline-block;
  max-width: 60%;
  margin: 0 8px;
}

.userName {
  width: 0;
}

.payload {
  word-wrap: break-word;
  white-space: pre-wrap;
  background-color: orangered;
  font-size: 1.2rem;
  line-height: 1.5rem;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  margin-top: 6px;
  direction: ltr;
}
</style>