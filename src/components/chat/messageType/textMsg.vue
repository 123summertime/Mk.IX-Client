<template>
  <div class="textMsg">
    <p>{{ payload.content }}</p>
  </div>
</template>

<script>
export default {
  props: {
    payload: Object
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