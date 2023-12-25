<template>
  <div class="groupInfoRoot" ref="groupInfoRoot">
    <img :src="'data:image/png;base64,' + avatar" class="groupAvatar">
    <div class="groupInfo">
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
      lastMessageTime: 0,
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
        this.$refs.groupInfoRoot.style.order = 2147483647 - (newVal["time"].substring(0, 10))
        this.lastMessage = newVal["userName"] + ":" + newVal["payload"]
      }
    }
  },

}
</script>

<style scoped>
.groupInfoRoot {
  display: flex;
  padding: 8px 16px;
}

.groupAvatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  margin: auto 0;
}

.groupInfo {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 6px 0;
  margin-left: 12px;
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