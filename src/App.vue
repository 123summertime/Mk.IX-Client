<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script></script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 16px;
}

em,
i {
  font-style: normal;
}

li {
  list-style: none;
}

img {
  vertical-align: middle
}

a {
  text-decoration: none;
}

@media screen and (max-width: 480px) {
  body {
    transform: rotateZ(90deg);
  }
}

/* teleport */

.el-overlay-dialog {
  overflow: hidden;
}

.memberInfo .el-dialog__body {
  padding: 20px;
}
</style>
