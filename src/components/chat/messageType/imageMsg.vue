<template>
  <div class="imageMsg">
    <el-image :src="payload.content" :preview-src-list="[payload.content]" />
  </div>
</template>
  
<script>
export default {
  props: {
    payload: Object
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
  max-height: 50vh;
}
</style>