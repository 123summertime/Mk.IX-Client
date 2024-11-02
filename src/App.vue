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

/* <=480px */
@media (max-width: 480px) {
  .el-dialog {
    width: 480px !important;
  }
}

/* >480px */
@media (min-width: 481px) {
  .el-dialog {
    width: 100vw !important;
  }
}

/* >640px */
@media (min-width: 640px) {
  .el-dialog {
    width: 640px !important;
  }
}

@media screen and (max-width: 768px) {
  html {
    font-size: 14px;
  }
}
</style>
