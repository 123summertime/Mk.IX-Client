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

em, i {
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
</style>
