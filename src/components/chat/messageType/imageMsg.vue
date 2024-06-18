<template>
  <div class="imageMsg">
    <el-image :src="message.payload.content" :preview-src-list="[message.payload.content]" />
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
  background-color: orangered;
}

:deep(.el-image__inner) {
  max-height: 40vh;
}
</style>