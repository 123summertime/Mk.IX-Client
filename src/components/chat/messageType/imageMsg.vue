<template>
  <el-image class="imageMsg"
    :src="message.payload.content"
    fit="cover"
    :hide-on-click-modal="true"
    :preview-src-list="[message.payload.content]"
    alt="image" />
</template>
  
<script>
export default {
  props: {
    group: String,
    message: Object
  },
}
</script>
  
<style scoped>
.imageMsg {
  padding: 0 !important;
}

.imageMsg .el-image {
  max-height: 100%;
  border-radius: 12px;
}

:deep(.el-image__inner) {
  min-height: 128px;
  max-height: 20vh;
}
</style>