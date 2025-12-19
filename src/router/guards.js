import { useAdminAuth } from '@/stores/adminAuth'
import { useSellerAuth } from '@/stores/sellerAuth'
import { useUserAuth } from '@/stores/userAuth'

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {

    const adminAuth = useAdminAuth()
    const sellerAuth = useSellerAuth()
    const userAuth = useUserAuth()

    const adminToken = localStorage.getItem('admin_token')
    const sellerToken = localStorage.getItem('seller_token')
    const userToken = localStorage.getItem('user_token')

    if (to.path.startsWith('/admin')) {
      if (adminToken && to.path === '/admin/login') {
        return next('/admin/dashboard')
      }

      if (!adminToken && to.path !== '/admin/login') {
        return next('/admin/login')
      }
    }

    if (to.path.startsWith('/seller')) {
      if (sellerToken && to.path === '/seller/login') {
        return next('/seller/dashboard')
      }

      if (!sellerToken && to.path !== '/seller/login') {
        return next('/seller/login')
      }
    }

    // 🟢 User Routes
    if (to.path.startsWith('/user') || to.path === '/login') {
      if (userToken && (to.path === '/login' || to.path === '/user/login')) {
        return next('/')
      }

      if (!userToken && (to.path !== '/login' && to.path !== '/user/login')) {
        return next('/login')
      }
    }

    next()
  })
}
