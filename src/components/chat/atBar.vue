<template>
  <div class="atBarRoot">
    <ul class="atListWrapper" @wheel="onScroll" ref="AtListWrapper">
      <li class="atCard" v-for="user in atListArray" :key="user.uuid">
        <p class="atText">{{ "@" + user.username }}</p>
        <CircleClose @click="deleteAt(user)"></CircleClose>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    atList: Set,  // @列表，元素是包含uuid和用户名的JSON字符串
  },

  methods: {
    // 取消@某人
    deleteAt(user) {
      this.$emit("deleteAt", JSON.stringify(user))
    },

    // 改为横向滚动
    onScroll(event) {
      this.$refs.AtListWrapper.scrollLeft += event.deltaY
    }
  },

  computed: {
    atListArray() {
      return Array.from(this.atList).map(i => JSON.parse(i))
    },
  },
}
</script>

<style scoped>
.atListWrapper {
  display: flex;
  padding: 8px 16px 0 16px;
  overflow-x: auto;
}

.atListWrapper::-webkit-scrollbar {
  display: none;
}

.atCard {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 4px 12px;
  margin-right: 8px;
  background: var(--atBar-atCard-bgcolor);
  border-radius: 6px;
}

.atText {
  font-size: 1.2rem;
  color: var(--atBar-atCard-textcolor);
}

svg {
  height: 20px;
  margin-left: 4px;
  cursor: pointer;
  color: var(--atBar-atCard-svgcolor);
}
</style>