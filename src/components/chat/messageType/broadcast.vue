<template>
  <div class="broadcast">
    <p>{{ message.payload.content }}</p>
  </div>
</template>

<script>
export default {
  props: {
    group: String,
    message: Object
  }
}
</script>

<style scoped>
.broadcast {
  max-width: calc(100% - 112px);
  margin: 0 auto;
  background-color: var(--message-commonBg);
}

.broadcast p {
  font-size: 1rem;
  text-align: center;
}
</style>