<template>
  <div class="title">登 录</div>
  <div>
    <span class="subTitle">IP/域名:端口</span>
    <el-input v-model="adress" maxlength="50" prefix-icon="Place" clearable />
    <span class="subTitle">账号(uuid)</span>
    <el-input v-model="account" minlength="3" maxlength="20" prefix-icon="User" clearable />
    <span class="subTitle">密码</span>
    <el-input v-model="password" type="password" minlength="6" maxlength="20" prefix-icon="Lock" clearable />
  </div>
  <div class="errBar" v-if="errorPassword">
    <span class="err">账号或密码不正确!</span>
  </div>
  <div class="submit">
    <button @click="login" :disabled="clicked">登 录</button>
    <div class="anim"></div>
  </div>
  <div class="tools">
    <el-switch v-model="asBot" size='small' active-text="Bot" inactive-text="用户" />
    <div @click="this.$emit('option')">去注册</div>
  </div>

  <el-dialog v-model="success" append-to-body title="Bot登录成功">
    <div>token:<div class="token">{{ token }}</div></div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="success = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
  
</template>

<script>
import axios from 'axios'

import router from './../../router/index.js'

export default {
  emits: ["option"],
  data() {
    return {
      adress: "",
      account: " ",
      password: "",
      token: "",
      clicked: false,
      errorPassword: false,
      asBot: false,
      success: false,
    }
  },
  methods: {
    async login() {
      this.clicked = true
      const URL = `http://${this.adress}/token?isBot=${this.asBot ? '1': '0'}`
      const formData = `grant_type=password&username=${this.account}&password=${this.password}`

      axios.post(URL, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }).then(response => {
        if (this.asBot) {
          this.success = true
          this.clicked = false
          this.token = response["data"]["access_token"]
        } else {
          localStorage.setItem("adress", this.adress)
          localStorage.setItem("account", this.account)
          localStorage.setItem("token", response["data"]["access_token"])
          router.push('/chat')
        }
      }).catch(error => {
        this.errorPassword = true
        this.clicked = false
      })
    }
  },
  mounted() {
    this.adress = localStorage.getItem("adress") ?? ""
    this.account = localStorage.getItem("account") ?? ""
  }
}
</script>

<style scoped>
.title {
  width: 100%;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
}

.subTitle {
  display: block;
  font-size: 1rem;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: var(--el-color-black);
}

.submit {
  position: relative;
  width: 100%;
  height: 2rem;
  border-radius: 1rem;
  margin-top: 1rem;
  overflow: hidden;
}

.submit .anim {
  position: absolute;
  left: -200%;
  top: 0;
  width: 300%;
  height: 100%;
  background: linear-gradient(-45deg, #fbc2eb, #a6c1ee, #fbc2eb, #a6c1ee);
}

.submit button {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 2rem;
  border: none;
  border-radius: 1rem;
  background: transparent;
  cursor: pointer;
  z-index: 114514;
}

.submit button:hover+.anim {
  animation: move 1.5s linear infinite;
}

@keyframes move {
  0% {
    left: -200%
  }

  100% {
    left: 0
  }
}

.tools {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 0.5rem;
}

.tools div {
  cursor: pointer;
}

.tools div:hover {
  color: var(--el-color-danger);
}

.errBar {
  margin-top: 0.5rem;
}

.err {
  color: var(--el-color-danger);
}

.token {
  color: var(--el-color-danger);
  word-break: break-all;
}

/* 覆盖原样式 */
:deep(.el-input),
:deep(.el-input__wrapper),
:deep(.el-input__inner) {
  border: none;
  outline: none;
  background-color: transparent;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border-radius: 0;
  border-bottom: 1px solid var(--el-color-black);
}

:deep(.el-input__prefix) {
  color: var(--el-color-black);
}

:deep(.is-focus) {
  animation: changeColor 0.2s ease;
  animation-fill-mode: forwards;
}

@keyframes changeColor {
  0% {
    border-bottom: 1px solid var(--el-color-black);
  }

  100% {
    border-bottom: 1px solid var(--el-color-danger);
  }
}
</style>