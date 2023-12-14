<template>
  <div>
    <div class="bar"></div>
    <div class="input">
      <textarea v-model=message></textarea>
      <el-button type="primary" @click="sending" :disabled="message ? false : true" class="send">发送</el-button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    currGroup: String
  },

  data() {
    return {
      message: "",
    }
  }, 

  methods: {
    sending() {
      this.$store.state.wsConnections[this.currGroup].send(JSON.stringify({
        "group": this.currGroup,
        "payload": this.message,
      }))
      this.message = ""
    }
  }
}
</script>

<style scoped>
.inputBox {
  display: flex;
  flex-direction: column;
  background-color: lightsalmon;
}

.bar {
  width: 100%;
  height: 36px;
  background-color: brown;
}

.input {
  position: relative;
  flex-grow: 1;
  width: 100%;
  padding: 16px;
}

textarea {
  width: 100%;
  height: 100%;
  font-size: 1.2rem;
  font-family: Microsoft Yahei;
  resize: none;
  border:none;
	outline: none;
  background-color: transparent;
}

textarea::-webkit-scrollbar {
  display: none;
}

.send{
  position: absolute;
  right: 50px;
  bottom: 16px;
  width: 100px;
}
</style>