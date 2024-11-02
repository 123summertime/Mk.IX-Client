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
  width: calc(100% - 112px);
  max-height: 128px;
  margin: 0 auto;
  background: var(--message-common-bgcolor);
}

.broadcast p {
  font-size: 1rem;
  text-align: center;
  color: var(--message-content-textcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>