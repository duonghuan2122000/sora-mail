import { createRouter, createWebHistory } from 'vue-router'
import Home from '@renderer/views/Home.vue'
import MailList from '@renderer/views/MailList.vue'
import MailDetail from '@renderer/views/MailDetail.vue'

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
  },
  {
    path: '/mail/:id',
    name: 'MailDetail',
    component: MailDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
