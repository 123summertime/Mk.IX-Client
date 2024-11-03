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
  font-family: Microsoft Yahei;
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

.el-dialog p {
  font-size: 1rem;
}

@media screen and (min-width: 768px) {
  html {
    font-size: 16px;
  }
}

@media screen and (max-width: 768px) {
  .el-dialog {
    width: min(600px, 100vw) !important;
  }

  .el-drawer {
    width: 90vw !important;
  }

  html {
    font-size: 14px;
  }
}

@media screen and (max-width: 480px) {
  .el-dialog {
    width: max(240px, 100vw) !important;
  }

  html {
    font-size: 12px;
  }
}
</style>
