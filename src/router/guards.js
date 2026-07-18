export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const adminToken  = localStorage.getItem('admin_token')
    const sellerToken = localStorage.getItem('seller_token')
    const userToken   = localStorage.getItem('user_token')

    // ✅ Robust check if any matched route in the hierarchy is public
    const isPublic = to.matched.some(record => record.meta?.public)
    if (isPublic) return next()

    // -------------------
    // Admin area
    // -------------------
    if (to.path.startsWith('/admin')) {
      const isUnauthOnly = to.matched.some(record => record.meta?.unauthenticatedOnly)
      if (isUnauthOnly) {
        return adminToken ? next('/admin/dashboard') : next()
      }

      // protected
      return adminToken ? next() : next('/admin/login')
    }

    // -------------------
    // Seller area
    // -------------------
    if (to.path.startsWith('/seller')) {
      const isUnauthOnly = to.matched.some(record => record.meta?.unauthenticatedOnly)
      if (isUnauthOnly) {
        return sellerToken ? next('/seller/dashboard') : next()
      }

      // protected
      return sellerToken ? next() : next('/seller/login')
    }

    // -------------------
    // User area ( /user/* ) + legacy /login
    // -------------------
    const isUserArea = to.path.startsWith('/user') || to.path === '/login'
    if (isUserArea) {
      const isUnauthOnly = to.matched.some(record => record.meta?.unauthenticatedOnly)
      if (isUnauthOnly) {
        // لو لوجين بالفعل امنعه من login/register
        return userToken ? next('/') : next()
      }

      // protected
      return userToken ? next() : next('/login')
    }

    // باقي الموقع (مثلاً الصفحة الرئيسية)
    next()
  })
}

