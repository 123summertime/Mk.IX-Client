<template>
  <div class="main">
    <img :src="'data:image/png;base64,' + avatar" class="avatar">
    <div class="group">
      <p class="groupName">{{ name }}</p>
      <p class="currMessage">{{ lastMessage }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    avatar: String,
    group: String,
    name: String,
  },

  data() {
    return {
      lastMessage: "base",
    }
  },

  computed: {
    newMessage() {
      return this.$store.state[this.group]
    }
  },

  watch: {
    newMessage: {
      handler(newVal) {
        this.lastMessage = newVal["userName"] + ":" + newVal["payload"]
      }
    }
  },

}
</script>

<style scoped>
.main {
  display: flex;
  justify-content: space-around;
}

.avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  margin: auto 0;
}

.group {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 75%;
  padding: 6px 0;
}

.groupName {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 1.2rem;
}

.currMessage {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: gray;
}
</style>