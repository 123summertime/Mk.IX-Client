<template>
  <div>
    <div class="bar"></div>
    <div class="input">
      <textarea></textarea>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "",
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
  flex-grow: 1;
  width: 100%;
  padding: 16px;
}

textarea {
  width: 100%;
  height: 100%;
  font-size: 1.2rem;
  resize: none;
  border:none;
	outline: none;
  background-color: transparent;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>