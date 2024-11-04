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
  width: calc(100% - 7rem);
  margin: 0 auto;
  background: var(--message-common-bgcolor);
}

.broadcast p {
  height: 100%;
  text-align: center;
  color: var(--message-content-textcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>