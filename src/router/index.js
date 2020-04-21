import Vue from 'vue'
import VueRouter from 'vue-router'
import ScontriniNuovi from '../views/ScontriniNuovi.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Nuovi',
    component: ScontriniNuovi
  },
  {
    path: '/stampati',
    name: 'Stampati',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "stampati" */ '../views/ScontriniStampati.vue')
  },
  {
      path: '/storico',
      name: 'Storico',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "storico" */ '../views/ScontriniInviati.vue')
  },
]

const router = new VueRouter({
  routes
})

export default router
