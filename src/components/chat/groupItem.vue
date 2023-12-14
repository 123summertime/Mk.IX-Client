<template>
  <div class="mainGroupItem">
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
.mainGroupItem {
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
  margin-left: 6px;
  overflow: hidden;
}

.groupName {
  width: 100%;
  font-size: 1.2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.currMessage {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: gray;
}
</style>