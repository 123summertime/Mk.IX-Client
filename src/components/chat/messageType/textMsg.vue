<template>
  <div class="textMsg">
    <p>{{ message.payload.content }}</p>
  </div>
</template>

<script>
export default {
  props: {
    group: String,
    message: Object
  }
}
</script>

<style scoped>
.textMsg {
  background-color: orangered;
}
.textMsg p {
  font-size: 1.2rem;
  line-height: 1.5rem;
}
</style>