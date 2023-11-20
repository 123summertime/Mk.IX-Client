<template>
  <div class="title">注 册</div>
  <div class="form">
    <span class="subTitle">IP/域名:端口</span>
    <el-input v-model="adress" maxlength="50" prefix-icon="Place" clearable />
    <span class="subTitle">昵称</span>
    <el-input v-model="username" minlength="3" maxlength="20" prefix-icon="User" clearable />
    <span class="subTitle">密码</span>
    <el-input v-model="password" type="password" minlength="6" maxlength="20" prefix-icon="Lock" clearable />
  </div>
  <div class="submit">
    <button @click="register" :disabled="clicked">注 册</button>
    <div class="anim"></div>
  </div>
  <div class="tools">
    <div @click="this.$emit('option')">去登录</div>
  </div>

  <el-dialog v-model="success" append-to-body title="注册成功">
    <div>您的uuid为<span class="uuid">{{ uuid }}</span></div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="this.$emit('option')">去登录</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="fail" append-to-body title="注册失败">
    <div>请重试</div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="fail = false">重试</el-button>
      </span>
    </template>
  </el-dialog>
  
</template>
  
<script>
import axios from 'axios'

export default {
  emits: ["option"],
  data() {
    return {
      adress: "",
      username: "",
      password: "",
      clicked: false,
      success: false,
      fail: false,
      uuid: "",
    }
  },
  methods: {
    async register() {
      this.clicked = true

      const URL = `http://${this.adress}/register?userName=${this.username}&password=${this.password}`
      axios.post(URL).then(response => {
        this.uuid = response["data"]["uuid"]
        localStorage.setItem("adress", this.adress)
        localStorage.setItem("account", this.uuid)
        this.clicked = false
        this.success = true
      }).catch(error => {
        this.clicked = false
        this.fail = true
      })
    }
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
  left: 0;
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
    left: 0
  }

  100% {
    left: -200%
  }
}

.tools {
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
}

.tools div {
  margin-top: 0.5rem;
  cursor: pointer;
}

.tools div:hover {
  color: var(--el-color-danger);
}

.uuid {
  color: var(--el-color-danger);
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