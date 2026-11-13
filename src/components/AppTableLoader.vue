<script setup>
import CarMotionLoader from '@/components/CarMotionLoader.vue'

defineProps({
  title: {
    type: String,
    default: 'جاري تحميل البيانات وتجهيز القائمة...',
  },
  subtitle: {
    type: String,
    default: 'لحظات ونكون جاهزين بأحدث العروض والتفاصيل',
  },
  height: {
    type: [String, Number],
    default: 260,
  },
})
</script>

<template>
  <div class="app-table-loader-box pa-4">
    <CarMotionLoader
      mode="table"
      :title="title"
      :subtitle="subtitle"
      :height="height"
    />
  </div>
</template>

<style scoped>
.app-table-loader-box {
  width: 100%;
}
</style>

