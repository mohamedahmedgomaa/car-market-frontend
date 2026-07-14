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
const selectedCondition = ref(String(route.query['filter[condition]'] || ''))

const fetchCars = async () => {
  loading.value = true
  cars.value = [] // Clear list for visual feedback
  try {
    const params = {
      page: page.value,
      perPage: perPage.value,
      'filter[status]': 'approved',
      'filter[is_import]': 1,
      sort: sort.value,
    }

    if (selectedCondition.value) {
      params['filter[condition]'] = selectedCondition.value
    }

    const res = await carsUserApi.getAll(params)
    const payload = res.data?.data || res.data || {}
    
    if (Array.isArray(payload)) {
      cars.value = payload
      total.value = payload.length
    } else if (payload.data) {
      cars.value = payload.data
      total.value = payload.total || payload.data.length
    } else {
      cars.value = []
      total.value = 0
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
  selectedCondition.value = String(route.query['filter[condition]'] || '')
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
        <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
          <div>
            <h1 class="text-h3 font-weight-black text-high-emphasis mb-2"><span dir="ltr">Import Cars</span></h1>
            <p class="text-h6 opacity-70 font-weight-medium mb-0"><span dir="ltr">Vehicles available for import (Personal Import - Initiative) with the highest specifications and best prices.</span></p>
          </div>

          <!-- ✅ Condition Toggle (Used, New, All) -->
          <div class="premium-type-toggle">
            <button 
              class="type-btn" 
              :class="{ active: selectedCondition === '' }"
              @click="router.push({ query: { ...route.query, 'filter[condition]': undefined, page: 1 } })"
            >
              All
            </button>
            <button 
              class="type-btn" 
              :class="{ active: selectedCondition === 'used' }"
              @click="router.push({ query: { ...route.query, 'filter[condition]': 'used', page: 1 } })"
            >
              Used
            </button>
            <button 
              class="type-btn" 
              :class="{ active: selectedCondition === 'new' }"
              @click="router.push({ query: { ...route.query, 'filter[condition]': 'new', page: 1 } })"
            >
              New
            </button>
          </div>
        </div>
      </div>

      <VCard class="pa-6" rounded="xl" elevation="0" style="background: rgba(var(--v-theme-on-surface),0.02); border: 1px solid rgba(var(--v-theme-on-surface),0.05)">
        <div class="d-flex align-center justify-space-between mb-8">
          <div class="text-body-1 opacity-60"><span dir="ltr">{{ total }} vehicles found</span></div>
          
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
          <h3 class="text-h5 opacity-50"><span dir="ltr">No vehicles found in Import Cars</span></h3>
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
}

.premium-type-toggle {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 16px;
  padding: 5px;
  gap: 5px;
  backdrop-filter: blur(10px);

  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-between;
    border-radius: 12px;
    padding: 3px;
    gap: 3px;
  }
}

.type-btn {
  display: flex;
  align-items: center;
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.6;

  @media (max-width: 600px) {
    flex: 1;
    justify-content: center;
    padding: 8px 12px !important;
    font-size: 13px;
    border-radius: 9px;
  }
}

.type-btn:hover {
  opacity: 1;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.type-btn.active {
  opacity: 1;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.3);
}
</style>
