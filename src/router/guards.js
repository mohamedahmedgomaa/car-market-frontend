import { useAdminAuth } from '@/stores/adminAuth'
import { useSellerAuth } from '@/stores/sellerAuth'
import { useUserAuth } from '@/stores/userAuth'

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const adminToken = localStorage.getItem('admin_token')
    const sellerToken = localStorage.getItem('seller_token')
    const userToken  = localStorage.getItem('user_token')

    // Admin
    if (to.path.startsWith('/admin')) {
      if (adminToken && to.path === '/admin/login') return next('/admin/dashboard')
      if (!adminToken && to.path !== '/admin/login') return next('/admin/login')
      return next()
    }

    // Seller
    if (to.path.startsWith('/seller')) {
      if (sellerToken && to.path === '/seller/login') return next('/seller/dashboard')
      if (!sellerToken && to.path !== '/seller/login') return next('/seller/login')
      return next()
    }

    // ✅ Public user pages (guest allowed)
    const publicUserPaths = [
      '/user/cars',
      /^\/user\/cars\/\d+$/,        // details by numeric id
    ]

    const isPublicUser =
      publicUserPaths.some(p => (p instanceof RegExp ? p.test(to.path) : to.path === p || to.path.startsWith(p + '/')))

    // User
    if (to.path.startsWith('/user') || to.path === '/login' || to.path === '/user/login') {
      if (isPublicUser) return next()

      if (userToken && (to.path === '/login' || to.path === '/user/login')) return next('/')

      if (!userToken && (to.path !== '/login' && to.path !== '/user/login')) return next('/login')
    }

    next()
  })
}
