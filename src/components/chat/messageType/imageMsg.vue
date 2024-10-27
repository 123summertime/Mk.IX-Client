<template>
  <div class="imageMsg">
    <el-image :src="message.payload.content" :preview-src-list="[message.payload.content]" alt="image" />
  </div>
</template>
  
<script>
export default {
  props: {
    group: String,
    message: Object
  },

  data() {
    return {

    }
  },
}
</script>
  
<style scoped>
.imageMsg {
  background-color: var(--message-common-bgcolor);
}

:deep(.el-image__inner) {
  max-height: 40vh;
}
</style>