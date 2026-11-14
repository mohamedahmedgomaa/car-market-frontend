export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    let adminToken  = localStorage.getItem('admin_token')
    let sellerToken = localStorage.getItem('seller_token')
    let userToken   = localStorage.getItem('user_token')

    // Clean any legacy mock tokens
    if (adminToken && adminToken.startsWith('mock_')) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_data')
      adminToken = null
    }

    // ✅ Robust check if any matched route in the hierarchy is public
    const isPublic = to.matched.some(record => record.meta?.public)
    if (isPublic) return next()

    // -------------------
    // Admin area (/admin/*) - strictly requires admin_token
    // -------------------
    if (to.path.startsWith('/admin')) {
      const isUnauthOnly = to.matched.some(record => record.meta?.unauthenticatedOnly) || to.path === '/admin/login'
      if (isUnauthOnly) {
        return adminToken ? next('/admin/dashboard') : next()
      }

      // protected
      return adminToken ? next() : next('/admin/login')
    }

    // -------------------
    // Seller area (/seller/*) - strictly requires seller_token
    // -------------------
    if (to.path.startsWith('/seller')) {
      const isUnauthOnly = to.matched.some(record => record.meta?.unauthenticatedOnly) || to.path === '/seller/login' || to.path === '/seller/register'
      if (isUnauthOnly) {
        return sellerToken ? next('/seller/dashboard') : next()
      }

      // protected
      return sellerToken ? next() : next('/seller/login')
    }

    // -------------------
    // User area ( /user/* ) + legacy /login
    // -------------------
    const isUserArea = to.path.startsWith('/user') || to.path === '/login' || to.path === '/register'
    if (isUserArea) {
      const isUnauthOnly = to.matched.some(record => record.meta?.unauthenticatedOnly) || to.path === '/login' || to.path === '/register'
      if (isUnauthOnly) {
        return userToken ? next('/') : next()
      }

      // protected
      return userToken ? next() : next('/login')
    }

    // باقي الموقع (الصفحة العامة، تفاصيل السيارة، الخ)
    next()
  })
}
