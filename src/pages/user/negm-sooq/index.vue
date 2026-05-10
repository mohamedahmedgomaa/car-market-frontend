<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({
  meta: { layout: 'front', public: true },
})

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const cars = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(50)

const sort = ref(String(route.query.sort || '-favorites_count'))

const fetchCars = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      perPage: perPage.value,
      'filter[status]': 'approved',
      sort: sort.value,
    }

    const res = await carsUserApi.getAll(params)
    const data = res.data?.data || res.data || []
    
    // Normalize data structure if needed
    if (Array.isArray(data)) {
      cars.value = data
      total.value = data.length
    } else if (data.data) {
      cars.value = data.data
      total.value = data.total || data.data.length
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const onPageChange = (p) => {
  router.push({ query: { ...route.query, page: p } })
}

watch(() => route.query, () => {
  page.value = Number(route.query.page || 1)
  sort.value = String(route.query.sort || '-favorites_count')
  fetchCars()
}, { deep: true })

onMounted(() => {
  fetchCars()
})
</script>

<template>
  <section class="negm-sooq-page py-12">
    <VContainer>
      <div class="mb-8">
        <h1 class="text-h3 font-weight-black text-white mb-2">NegmSooq</h1>
        <p class="text-h6 opacity-60">Discover our most popular and exclusive vehicle selections</p>
      </div>

      <VCard class="pa-6" rounded="xl" elevation="0" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05)">
        <div class="d-flex align-center justify-space-between mb-8">
          <div class="text-body-1 opacity-60">{{ total }} vehicles found</div>
          
          <VSelect
            v-model="sort"
            :items="[
              { title: 'Most Popular', value: '-favorites_count' },
              { title: 'Newest', value: '-created_at' },
              { title: 'Price: Low to High', value: 'price' },
              { title: 'Price: High to Low', value: '-price' },
            ]"
            label="Sort By"
            variant="tonal"
            density="comfortable"
            hide-details
            style="max-width: 200px"
            @update:model-value="(val) => router.push({ query: { ...route.query, sort: val, page: 1 } })"
          />
        </div>

        <CarsSection
          embedded
          :showViewAll="false"
          :cars="cars"
          :loading="loading"
        />

        <div v-if="!loading && cars.length === 0" class="text-center py-16">
          <VIcon icon="tabler-car-off" size="80" class="mb-4 opacity-10" />
          <h3 class="text-h5 opacity-50">No vehicles found in NegmSooq</h3>
        </div>

        <div class="d-flex justify-center mt-12" v-if="total > perPage && !loading">
          <VPagination
            v-model="page"
            :length="Math.ceil(total / perPage)"
            :total-visible="7"
            @update:model-value="onPageChange"
          />
        </div>
      </VCard>
    </VContainer>
  </section>
</template>

<style scoped>
.negm-sooq-page {
  min-height: 100vh;
  background: #0f111a;
}
</style>
