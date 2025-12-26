export default [
  // ✅ USER (Front)
  {
    path: '/',
    component: () => import('@/layouts/FrontLayout.vue'),
    children: [
      { path: '', name: 'user-home', component: () => import('@/pages/index.vue') },
      { path: 'login', name: 'user-login', component: () => import('@/pages/login.vue') },
    ],
  },

  // ✅ ADMIN (Dashboard)
  {
    path: '/admin',
    component: () => import('@/layouts/default.vue'),
    children: [
      { path: 'login', name: 'admin-login', component: () => import('@/pages/admin/login.vue') },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/pages/admin/dashboard.vue') },
    ],
  },

  // ✅ SELLER (Dashboard)
  {
    path: '/seller',
    component: () => import('@/layouts/default.vue'),
    children: [
      { path: 'login', name: 'seller-login', component: () => import('@/pages/seller/login.vue') },
      { path: 'dashboard', name: 'seller-dashboard', component: () => import('@/pages/seller/dashboard.vue') },
    ],
  },
]
