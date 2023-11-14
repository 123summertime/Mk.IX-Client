<template>
    <div class="title">注 册</div>
    <div class="form">
        <span class="subTitle">服务器IP/域名</span>
        <el-input v-model="adress" maxlength="50" prefix-icon="Place" clearable />
        <span class="subTitle">昵称</span>
        <el-input v-model="account" minlength="6" maxlength="20" prefix-icon="User" clearable />
        <span class="subTitle">密码</span>
        <el-input v-model="password" type="password" minlength="6" maxlength="20" prefix-icon="Lock" clearable />
        <span class="subTitle">头像</span>
    </div>
    <div class="tools">
        <div @click="this.$emit('option')">去登录</div>
    </div>
    <div class="submit">
        <button>注 册</button>
        <div class="anim"></div>
    </div>
</template>
  
<script>
export default {
    emits: ["option"],
    data() {
        return {
            adress: "",
            account: "",
            password: "",
        }
    },
    methods: {

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
    margin-top: 1.5rem;
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