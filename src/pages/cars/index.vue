<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  router.replace('/user/cars')
})
</script>

<template>
  <div class="d-flex align-center justify-center min-vh-100 pa-6">
    <VProgressCircular indeterminate color="primary" size="48" />
  </div>
</template>
