// import { createRouter, createWebHistory } from 'vue-router'
// import adminRoutes from '../navigation/vertical/adminMenu.js'
// import sellerRoutes from '../navigation/vertical/sellerMenu.js'
// import userRoutes from '../navigation/vertical/userMenu.js'
// const routes = []
//
// const router = createRouter({
//   history: createWebHistory(),
//   routes: [
//     ...adminRoutes,
//     ...sellerRoutes,
//     ...userRoutes,
//   ],
// })
//
// export default router

import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
