export default [
  {
    title: 'Dashboard',
    to: { name: 'seller-dashboard' },
    icon: { icon: 'tabler-dashboard' }
  },
  {
    title: 'Cars Management',
    to: { name: 'seller-cars' },
    icon: { icon: 'tabler-car', size: 26 }
  },
  {
    title: 'Settings',
    icon: { icon: 'tabler-settings', size: 26 },
    children: [
      {
        title: 'Car Features',
        to: { name: 'seller-car-features' },
        icon: { icon: 'tabler-adjustments', size: 24 }
      },
      {
        title: 'Brands',
        to: { name: 'seller-brands' },
        icon: { icon: 'tabler-box', size: 24 }
      },
      {
        title: 'Models',
        to: { name: 'seller-models' },
        icon: { icon: 'tabler-car-garage', size: 24 }
      }
    ]
  }
]
