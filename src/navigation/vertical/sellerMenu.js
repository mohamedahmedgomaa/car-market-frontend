export default [
  {
    title: 'Dashboard',
    to: { name: 'seller-dashboard' },
    icon: { icon: 'tabler-dashboard', size: 24 },
  },
  {
    title: 'Cars Management',
    icon: { icon: 'tabler-car', size: 24 },
    children: [
      {
        title: 'All Cars',
        to: { name: 'seller-cars' },
        icon: { icon: 'tabler-list', size: 22 },
      },
      {
        title: 'Add New Car',
        to: { name: 'seller-cars-create' },
        icon: { icon: 'tabler-circle-plus', size: 22 },
      },
    ],
  },
  {
    title: 'Notifications',
    to: { name: 'seller-notifications' },
    icon: { icon: 'tabler-bell', size: 24 },
  },
  {
    title: 'Showroom Profile',
    to: { name: 'seller-profile' },
    icon: { icon: 'tabler-building-store', size: 24 },
  },
]

