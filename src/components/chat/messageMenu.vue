<template>
  <div class="msgMenuRoot">
    <div @click="addToFavorite" v-if="type === 'image'">
      <Plus></Plus>
      <p>添加到表情</p>
    </div>
    <div @click="copyMsg" v-if="['text', 'image'].includes(type)">
      <DocumentCopy></DocumentCopy>
      <p>复制</p>
    </div>
    <div @click="deleteMsg">
      <Delete></Delete>
      <p>删除</p>
    </div>
    <div @click="forwardMsg">
      <Share></Share>
      <p>转发</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: String
  },

  methods: {
    addToFavorite() {
      this.$emit('addToFavorite')
    },

    copyMsg() {
      this.$emit('copyMsg')
    },

    deleteMsg() {
      this.$emit('deleteMsg')
    },

    forwardMsg() {
      this.$emit('forwardMsg')
    }
  },
}
</script>

<style scoped>
.msgMenuRoot {
  display: flex;
  flex-direction: column;
  width: 144px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(245, 245, 245, 0.5);
  backdrop-filter: blur(20px);
  z-index: 10000;
}

.msgMenuRoot div {
  display: flex;
  width: 100%;
  height: 24px;
  margin: 4px 0;
  padding: 0 4px;
  cursor: pointer;
}

.msgMenuRoot div svg {
  width: 16px;
  height: 100%;
}

.msgMenuRoot div p {
  height: 100%;
  line-height: 24px;
  margin-left: 8px;
}

.msgMenuRoot div:hover {
  border-radius: 8px;
  background-color: rgba(96, 96, 96, 0.5);
  backdrop-filter: blur(20px);
}
</style>