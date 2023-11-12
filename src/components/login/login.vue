<template>
  <div class="title">登 录</div>
  <div class="form">
    <span>服务器IP/域名</span>
    <el-input v-model="adress" />
    <span>账号</span>
    <el-input v-model="account" />
    <span>密码</span>
    <el-input v-model="password" type="password" prefix-icon="Search"/>

  </div>
</template>

<script>
export default {
  data() {
    return {
      adress: "",
      account: "",
      password: "",
    }
  },
}
</script>

<style>
.title {
  width: 100%;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
}

.form span {
  font-size: 1rem;
  color: #333;
}

.form input {
  display: block;
  width: 100%;
  height: 1.5rem;
  border: none;
  background-color: transparent;
}
</style>