import { createRouter, createWebHistory } from 'vue-router'
import Home from '@renderer/views/Home.vue'
import MailList from '@renderer/views/MailList.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/mail',
    name: 'MailList',
    component: MailList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
