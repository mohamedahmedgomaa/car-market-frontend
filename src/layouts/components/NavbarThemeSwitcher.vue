<script setup>
const themes = [
  {
    name: 'amberLight',
    label: 'Light',
    icon: 'tabler-sunrise',
  },
  {
    name: 'emberDark',
    label: 'Dark',
    icon: 'tabler-flame',
  },
  {
    name: 'system',
    label: 'System',
    icon: 'tabler-device-desktop-analytics',
  },
]
</script>

<template>
  <ThemeSwitcher :themes="themes" />
</template>
