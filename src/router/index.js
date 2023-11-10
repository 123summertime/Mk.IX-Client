import { createRouter, createWebHistory } from 'vue-router'
import login from '../components/login/loginPage.vue'
import other from '../components/others.vue'

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
      path: '/other',
      name: 'other',
      component: other
    }
  ]
})

export default router
