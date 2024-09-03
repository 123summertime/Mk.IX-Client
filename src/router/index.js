import axios from 'axios'

import login from '../components/login/loginPage.vue'
import chat from '../components/chat/chatPage.vue'
import setting from '../components/setting/setting.vue'

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'base',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: login
    },
    {
      path: '/chat',
      name: 'chat',
      component: chat,
      meta: { keepAlive: true }
    },
    {
      path: '/setting',
      name: 'setting',
      component: setting,
    }
  ]
})

const exempt = ["base", "login"]

router.beforeEach((to, from, next) => {
  if (exempt.includes(to["name"])) {
    next()
    return
  }

  const adress = localStorage.getItem("adress") ?? ""
  const token = localStorage.getItem("token") ?? ""
  if (!adress || !token) {
    next('/login')
    return
  }

  const URL = `http://${adress}/v1/user/check`
  axios.get(URL, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => {
    next()
  }).catch(err => {
    next('/login')
  })
})

export default router
