export default [
  {
    title: 'Dashboard',
    to: { name: 'admin-dashboard' },
    icon: { icon: 'tabler-dashboard', size: 26 }
  },
  {
    title: 'Cars Management',
    to: { name: 'admin-cars' },
    icon: { icon: 'tabler-car', size: 26 },
  },

  {
    title: 'Users Management',
    icon: { icon: 'tabler-users', size: 26 },
    children: [
      {
        title: 'Admins',
        to: { name: 'admin-admins' },
        icon: { icon: 'tabler-user-shield', size: 24 }
      },
      {
        title: 'Users',
        to: { name: 'admin-users' },
        icon: { icon: 'tabler-user', size: 24 }
      },
      {
        title: 'Sellers',
        to: { name: 'admin-sellers' },
        icon: { icon: 'tabler-user-dollar', size: 24 }
      }
    ]
  },

  {
    title: 'Settings',
    icon: { icon: 'tabler-settings', size: 26 },
    children: [
      {
        title: 'Countries',
        to: { name: 'admin-countries' },
        icon: { icon: 'tabler-flag', size: 24 }
      },
      {
        title: 'Cities',
        to: { name: 'admin-cities' },
        icon: { icon: 'tabler-map-pin', size: 24 }
      },
      {
        title: 'Car Features',
        to: { name: 'admin-car-features' },
        icon: { icon: 'tabler-adjustments', size: 24 }
      },
      {
        title: 'Brands',
        to: { name: 'admin-brands' },
        icon: { icon: 'tabler-box', size: 24 }
      },
      {
        title: 'Models',
        to: { name: 'admin-models' },
        icon: { icon: 'tabler-car-garage', size: 24 }
      }
    ]
  }
]
