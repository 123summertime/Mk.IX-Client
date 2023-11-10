<template>
    <div><i>登录</i></div>
    <div class="form">
        <span><i>服务器IP/域名</i></span>
        <el-input v-model="adress" clearable />
        <span><i>账号</i></span>
        <el-input v-model="account" clearable />
        <span><i>密码</i></span>
        <el-input v-model="password" type="password" show-password />
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

</style>