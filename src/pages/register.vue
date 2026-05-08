<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace('/login?tab=register')
})
</script>

<template>
  <div />
</template>
