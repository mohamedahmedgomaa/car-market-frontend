export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const adminToken  = localStorage.getItem('admin_token')
    const sellerToken = localStorage.getItem('seller_token')
    const userToken   = localStorage.getItem('user_token')

    // ✅ لو الصفحة public خلّص
    if (to.meta?.public) return next()

    // -------------------
    // Admin area
    // -------------------
    if (to.path.startsWith('/admin')) {
      if (to.meta?.unauthenticatedOnly) {
        return adminToken ? next('/admin/dashboard') : next()
      }

      // protected
      return adminToken ? next() : next('/admin/login')
    }

    // -------------------
    // Seller area
    // -------------------
    if (to.path.startsWith('/seller')) {
      if (to.meta?.unauthenticatedOnly) {
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
      if (to.meta?.unauthenticatedOnly) {
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
