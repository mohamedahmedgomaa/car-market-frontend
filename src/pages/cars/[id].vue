<script setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const carId = route.params.id
  if (carId) {
    router.replace(`/user/cars/${carId}`)
  } else {
    router.replace('/user/cars')
  }
})
</script>

<template>
  <div class="d-flex align-center justify-center min-vh-100 pa-6">
    <VProgressCircular indeterminate color="primary" size="48" />
  </div>
</template>
