<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import carsUserApi from '@/api/user/carUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import { customBrandFilter, sortBrands } from '@/utils/brandTranslations.js'

definePage({
  meta: { layout: 'front', public: true },
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const loading = ref(true)
const cars = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(50)
const availableBrandsList = ref([])

// Draft state for search and filters
const draft = ref({
  type: String(route.query['filter[type]'] || ''),
  brandId: route.query['filter[brand_id]'] ? Number(route.query['filter[brand_id]']) : null,
})

// Sort state (Default: lowest price first)
const sort = ref(String(route.query.sort || 'price'))

const _t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

// Show ONLY brands that exist in available best deal offers
const filteredBrands = computed(() => {
  const type = draft.value.type
  let list = availableBrandsList.value || []
  if (type) {
    list = list.filter(b => !b.type || b.type === type)
  }
  return sortBrands(list)
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return Boolean(
    draft.value.type ||
    draft.value.brandId ||
    sort.value !== 'price'
  )
})

const syncDraftFromQuery = () => {
  draft.value.type = String(route.query['filter[type]'] || '')
  draft.value.brandId = route.query['filter[brand_id]'] ? Number(route.query['filter[brand_id]']) : null
  sort.value = String(route.query.sort || 'price')
  page.value = Number(route.query.page || 1)
}

// Fetch all available Best Deals brands dynamically so only existing brands appear in dropdown
const fetchBestDealBrands = async () => {
  try {
    const res = await carsUserApi.getAll({
      perPage: 1000,
      'filter[status]': 'approved',
      'filter[is_best_deal]': 1,
    })
    const payload = res.data?.data || res.data || {}
    const items = Array.isArray(payload) ? payload : (payload.data || [])
    
    const brandMap = new Map()
    items.forEach(car => {
      if (car.brand && car.brand.id) {
        brandMap.set(car.brand.id, car.brand)
      }
    })
    availableBrandsList.value = Array.from(brandMap.values())
  } catch (err) {
    console.error('Fetch best deal brands error:', err)
  }
}

const fetchCars = async () => {
  loading.value = true
  cars.value = []
  try {
    const params = {
      page: page.value,
      perPage: perPage.value,
      'filter[status]': 'approved',
      'filter[is_best_deal]': 1,
      sort: sort.value,
    }

    if (draft.value.type) {
      params['filter[type]'] = draft.value.type
    }

    if (draft.value.brandId) {
      params['filter[brand_id]'] = draft.value.brandId
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
    console.error('Fetch best deals error:', err)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  const query = {}
  
  if (draft.value.type) {
    query['filter[type]'] = draft.value.type
  }

  if (draft.value.brandId) {
    query['filter[brand_id]'] = draft.value.brandId
  }

  if (sort.value && sort.value !== 'price') {
    query.sort = sort.value
  } else if (sort.value === 'price') {
    query.sort = 'price'
  }

  router.push({ query })
}

const setVehicleType = (type) => {
  draft.value.type = type
  if (draft.value.brandId) {
    const brand = availableBrandsList.value.find(b => b.id === draft.value.brandId)
    if (brand && brand.type && type && brand.type !== type) {
      draft.value.brandId = null
    }
  }
  applyFilters()
}

const resetFilters = () => {
  draft.value = {
    type: '',
    brandId: null,
  }
  sort.value = 'price'
  router.push({ path: '/user/best-deals', query: {} })
}

const onPageChange = (p) => {
  router.push({ query: { ...route.query, page: p } })
}

watch(() => route.query, () => {
  syncDraftFromQuery()
  fetchCars()
}, { deep: true })

onMounted(() => {
  syncDraftFromQuery()
  fetchBestDealBrands()
  fetchCars()
})
</script>

<template>
  <section class="best-deals-page py-8">
    <VContainer class="best-deals-container">
      <!-- 1. Top Sleek Filter Bar Deck -->
      <div class="deals-search-deck mb-8 pa-4 rounded-xl">
        <div class="deals-filter-row">
          <!-- Vehicle Type Toggle Buttons (All / Cars / Bikes) -->
          <div class="filter-col filter-col-type">
            <div class="type-toggle-bar">
              <button
                type="button"
                class="type-bar-btn"
                :class="{ active: draft.type === '' }"
                @click="setVehicleType('')"
              >
                {{ t('all') }}
              </button>
              <button
                type="button"
                class="type-bar-btn"
                :class="{ active: draft.type === 'car' }"
                @click="setVehicleType('car')"
              >
                <VIcon icon="tabler-car" size="16" class="me-1" />
                {{ t('cars') }}
              </button>
              <button
                type="button"
                class="type-bar-btn"
                :class="{ active: draft.type === 'motorcycle' }"
                @click="setVehicleType('motorcycle')"
              >
                <VIcon icon="tabler-motorbike" size="16" class="me-1" />
                {{ t('bikes') }}
              </button>
            </div>
          </div>

          <!-- Brand Select Dropdown (Shows ONLY Brands with Active Best Deals) -->
          <div class="filter-col filter-col-brand">
            <VAutocomplete
              v-model="draft.brandId"
              :items="filteredBrands"
              item-value="id"
              :item-title="b => _t(b.name)"
              :custom-filter="customBrandFilter"
              :label="t('brand')"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              class="premium-field"
              @update:model-value="applyFilters"
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props" :title="_t(item.raw.name)" />
              </template>
              <template #selection="{ item }">
                {{ _t(item.raw.name) }}
              </template>
            </VAutocomplete>
          </div>

          <!-- Sort Select Dropdown -->
          <div class="filter-col filter-col-sort">
            <VSelect
              v-model="sort"
              :items="[
                { title: t('lowestPrice'), value: 'price' },
                { title: t('highestPrice'), value: '-price' },
                { title: t('newest'), value: '-created_at' },
              ]"
              :label="t('sortBy')"
              variant="outlined"
              density="comfortable"
              hide-details
              class="premium-field"
              @update:model-value="applyFilters"
            />
          </div>

          <!-- Reset Button -->
          <div class="filter-col filter-col-reset" v-if="hasActiveFilters">
            <VBtn
              variant="tonal"
              height="44"
              color="secondary"
              class="px-4 font-weight-bold"
              rounded="lg"
              :title="t('resetAll')"
              @click="resetFilters"
            >
              <VIcon icon="tabler-refresh" size="18" class="me-1" />
              {{ t('resetAll') }}
            </VBtn>
          </div>
        </div>
      </div>

      <!-- 2. Main Deals Container Card (Merged Header & Offers count inside) -->
      <VCard class="pa-6" rounded="xl" elevation="0" style="background: rgba(var(--v-theme-on-surface),0.02); border: 1px solid rgba(var(--v-theme-on-surface),0.05)">
        <!-- Merged Header inside Card -->
        <div class="d-flex align-center justify-space-between mb-8 flex-wrap gap-4 px-1">
          <div>
            <h1 class="text-h3 font-weight-black text-high-emphasis mb-1">{{ t('bestDealsTitle') }}</h1>
            <p class="text-h6 opacity-70 font-weight-medium mb-0"><span dir="ltr">{{ t('priceCrash') }}</span></p>
          </div>

          <div class="offers-count-chip px-4 py-2 rounded-xl d-flex align-center gap-2">
            <VIcon icon="tabler-flame-filled" size="18" color="error" />
            <span class="font-weight-bold text-body-1"><span dir="ltr">{{ t('offersFound', { count: total }) }}</span></span>
          </div>
        </div>

        <CarsSection
          embedded
          :showViewAll="false"
          :cars="cars"
          :loading="loading"
          title=""
        />

        <div v-if="!loading && cars.length === 0" class="text-center py-16">
          <VIcon icon="tabler-car-off" size="80" class="mb-4 opacity-10" />
          <h3 class="text-h5 opacity-50"><span dir="ltr">{{ t('noDealsFound') }}</span></h3>
          <p class="text-body-2 opacity-40 mt-1" v-if="hasActiveFilters">{{ t('tryAdjustingFilters') }}</p>
          <VBtn v-if="hasActiveFilters" variant="tonal" color="primary" class="mt-4" @click="resetFilters">
            {{ t('clearAllFilters') }}
          </VBtn>
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
.best-deals-page {
  min-height: 100vh;
}

.best-deals-container {
  max-width: 1340px !important;
}

/* 🚀 Premium Filter Deck */
.deals-search-deck {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.deals-filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-col-type {
  flex: 1.2;
  min-width: 240px;
}

.filter-col-brand {
  flex: 1.5;
  min-width: 220px;
}

.filter-col-sort {
  flex: 1.2;
  min-width: 200px;
}

.filter-col-reset {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .deals-filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-col-type,
  .filter-col-brand,
  .filter-col-sort,
  .filter-col-reset {
    width: 100%;
    min-width: 100%;
  }
}

/* 🎛️ Vehicle Type Toggle Bar */
.type-toggle-bar {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 3px;
  height: 44px;
  gap: 4px;
}

.type-bar-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.type-bar-btn:hover {
  color: rgba(var(--v-theme-on-surface), 1);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.type-bar-btn.active {
  color: #ffffff;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.35);
}

/* 🏷️ Offers Count Chip */
.offers-count-chip {
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
}

:deep(.premium-field .v-field) {
  border-radius: 12px !important;
}
</style>
