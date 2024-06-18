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
  margin-bottom: 24px;
  background-color: orangered;
}

.broadcast p {
  text-align: center;
}
</style>