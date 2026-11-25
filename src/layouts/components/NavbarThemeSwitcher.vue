<script setup>
const themes = [
  {
    name: 'light',
    icon: 'tabler-sun-high',
  },
  {
    name: 'amberLight',
    icon: 'tabler-sunrise',
  },
  {
    name: 'dark',
    icon: 'tabler-moon-stars',
  },
  {
    name: 'emberDark',
    icon: 'tabler-flame',
  },
  {
    name: 'system',
    icon: 'tabler-device-desktop-analytics',
  },
]
</script>

<template>
  <ThemeSwitcher :themes="themes" />
</template>
