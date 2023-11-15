import { createRouter, createWebHistory } from 'vue-router'
import login from '../components/login/loginPage.vue'
import chat from '../components/chat/chat.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'home',
      component: login
    },
    {
      path: '/chat',
      name: 'chat',
      component: chat
    }
  ]
})

export default router
