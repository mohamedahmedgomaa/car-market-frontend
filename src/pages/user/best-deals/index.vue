<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import carsUserApi from '@/api/user/carUserApi.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import { sortBrands, matchBrand, translateText } from '@/utils/brandTranslations.js'

definePage({
  meta: { layout: 'front', public: true },
})

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const loading = ref(true)
const loadingMore = ref(false)
const cars = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const currentOffset = ref(20)

// Brand Picker Dialog State
const brands = ref([])
const brandsLoading = ref(false)
const brandDialogOpen = ref(false)
const brandSearchQuery = ref('')

// Draft state for search and filters
const draft = ref({
  type: String(route.query['filter[type]'] || ''),
  brandId: route.query['filter[brand_id]'] ? Number(route.query['filter[brand_id]']) : null,
})

// Sort state (Default: lowest price first)
const sort = ref(String(route.query.sort || 'price'))

const _t = (val, parentObj = null) => {
  return translateText(val, locale.value || 'ar', parentObj)
}

const getAuth = () => {
  const token = localStorage.getItem('user_token')
  let userId = null
  try {
    const u = JSON.parse(localStorage.getItem('user_data') || 'null')
    userId = u?.id ? Number(u.id) : null
  } catch {}
  return { token, userId }
}

const normalizeFavFields = (car) => {
  const { userId } = getAuth()
  const favArr = Array.isArray(car?.favorites) ? car.favorites : []
  car.is_favorited = favArr.some(f => f.user_id === userId)
  return car
}

const normalizeCars = (data) => {
  if (Array.isArray(data)) return { items: data, total: data.length }

  if (data?.data && Array.isArray(data.data)) {
    const totalCount = data.meta?.total ?? data.total ?? data.data.length
    return { items: data.data, total: Number(totalCount) }
  }

  if (data?.data?.data && Array.isArray(data.data.data)) {
    const totalCount = data.data.meta?.total ?? data.data.total ?? data.meta?.total ?? data.data.data.length
    return { items: data.data.data, total: Number(totalCount) }
  }

  return { items: [], total: 0 }
}

const hasMore = computed(() => cars.value.length < total.value)

const selectedBrand = computed(() => {
  if (!draft.value.brandId) return null
  return brands.value.find(b => b.id === draft.value.brandId) || null
})

const selectedBrandName = computed(() => {
  if (!selectedBrand.value) return ''
  return _t(selectedBrand.value.name)
})

const modalFilteredBrands = computed(() => {
  const type = draft.value.type
  let items = brands.value || []
  if (type) {
    items = items.filter(b => !b.type || b.type === type)
  }
  items = sortBrands(items)

  if (!brandSearchQuery.value.trim()) return items

  const q = brandSearchQuery.value.trim().toLowerCase()
  return items.filter(b => {
    const en = String(b.originalName?.en || b.name?.en || b.name || '').toLowerCase()
    const ar = String(b.originalName?.ar || b.name?.ar || '').toLowerCase()
    return en.includes(q) || ar.includes(q) || matchBrand(b, q)
  })
})

const hasActiveFilters = computed(() => {
  return Boolean(
    draft.value.type ||
    draft.value.brandId ||
    sort.value !== 'price'
  )
})

const fetchBrands = async () => {
  if (brands.value.length > 0) return
  brandsLoading.value = true
  try {
    const res = await brandUserApi.getAll()
    brands.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Fetch brands error:', err)
  } finally {
    brandsLoading.value = false
  }
}

const openBrandDialog = () => {
  brandDialogOpen.value = true
  brandSearchQuery.value = ''
  if (brands.value.length === 0) {
    fetchBrands()
  }
}

const selectBrand = (brand) => {
  if (!brand) {
    draft.value.brandId = null
  } else {
    draft.value.brandId = brand.id
  }
  brandDialogOpen.value = false
  applyFilters()
}

const clearBrand = () => {
  draft.value.brandId = null
  applyFilters()
}

const syncDraftFromQuery = () => {
  draft.value.type = String(route.query['filter[type]'] || '')
  draft.value.brandId = route.query['filter[brand_id]'] ? Number(route.query['filter[brand_id]']) : null
  sort.value = String(route.query.sort || 'price')
  page.value = Number(route.query.page || 1)
}

const fetchCars = async () => {
  loading.value = true
  cars.value = []
  try {
    const params = {
      page: 1,
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
    const { items, total: tt } = normalizeCars(res.data)

    cars.value = items.map(normalizeFavFields)
    total.value = tt
    currentOffset.value = items.length
  } catch (err) {
    console.error('Fetch best deals error:', err)
  } finally {
    loading.value = false
  }
}

const loadMoreCars = async () => {
  if (loading.value || loadingMore.value || cars.value.length >= total.value) return
  loadingMore.value = true

  try {
    const params = {
      'filter[status]': 'approved',
      'filter[is_best_deal]': 1,
      sort: sort.value,
      offset: currentOffset.value,
      limit: 10,
    }

    if (draft.value.type) {
      params['filter[type]'] = draft.value.type
    }

    if (draft.value.brandId) {
      params['filter[brand_id]'] = draft.value.brandId
    }

    const res = await carsUserApi.getAll(params)
    const { items, total: tt } = normalizeCars(res.data)
    const newItems = items.map(normalizeFavFields)

    const existingIds = new Set(cars.value.map(c => c.id))
    const uniqueNew = newItems.filter(c => !existingIds.has(c.id))

    cars.value.push(...uniqueNew)
    currentOffset.value += items.length

    if (items.length === 0) {
      total.value = cars.value.length
    } else if (tt) {
      total.value = tt
    }
  } catch (err) {
    console.error('Load more error:', err)
  } finally {
    loadingMore.value = false
  }
}

let lastScrollY = 0
let scrollCooldown = false

const handleAutoScroll = () => {
  if (typeof window === 'undefined') return
  if (loading.value || loadingMore.value || !hasMore.value || scrollCooldown) return

  const currentY = window.scrollY
  const isScrollingDown = currentY > lastScrollY + 15
  lastScrollY = currentY

  if (!isScrollingDown) return

  const scrollBottom = window.innerHeight + currentY
  const triggerPoint = document.documentElement.scrollHeight - 450

  if (scrollBottom >= triggerPoint) {
    scrollCooldown = true
    loadMoreCars().finally(() => {
      setTimeout(() => {
        scrollCooldown = false
      }, 1200)
    })
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
  if (draft.value.brandId && brands.value.length > 0) {
    const brand = brands.value.find(b => b.id === draft.value.brandId)
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

watch(() => route.query, () => {
  syncDraftFromQuery()
  fetchCars()
}, { deep: true })

onMounted(() => {
  syncDraftFromQuery()
  fetchCars()
  if (draft.value.brandId) {
    fetchBrands()
  }

  if (typeof window !== 'undefined') {
    lastScrollY = window.scrollY
    window.addEventListener('scroll', handleAutoScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleAutoScroll)
    document.body.style.overflow = ''
  }
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

          <!-- Brand Select Button (Opens Brand Modal) -->
          <div class="filter-col filter-col-brand">
            <div
              class="filter-trigger-btn"
              :class="{ 'has-value': !!draft.brandId }"
              @click="openBrandDialog"
            >
              <div class="filter-trigger-content">
                <VIcon icon="tabler-car" size="18" class="filter-trigger-icon" />
                <div class="filter-trigger-texts">
                  <span class="filter-trigger-label">{{ t('brand') }}</span>
                  <span class="filter-trigger-value">{{ selectedBrandName || t('all') }}</span>
                </div>
              </div>
              <VIcon
                v-if="draft.brandId"
                icon="tabler-x"
                size="16"
                class="filter-trigger-clear"
                @click.stop="clearBrand"
              />
              <VIcon v-else icon="tabler-chevron-down" size="16" class="filter-trigger-arrow" />
            </div>
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

        <!-- User-initiated Load More Button (10 deals per click) -->
        <div v-if="cars.length > 0 && hasMore" class="d-flex flex-column align-center justify-center my-10">
          <VBtn
            color="primary"
            height="52"
            rounded="pill"
            class="px-10 font-weight-black text-body-1 load-more-btn"
            :loading="loadingMore"
            @click="loadMoreCars"
          >
            <VIcon icon="tabler-plus" size="20" class="me-2" />
            <span>{{ locale === 'ar' ? 'عرض المزيد من العروض (+10)' : 'Load More Deals (+10)' }}</span>
            <span class="ms-3 text-caption opacity-80 font-weight-bold">({{ cars.length }} / {{ total.toLocaleString() }})</span>
          </VBtn>
        </div>

        <div v-else-if="cars.length > 0 && !hasMore && !loading" class="text-center my-8 opacity-60 text-caption font-weight-bold">
          {{ locale === 'ar' ? `✨ تم عرض جميع العروض المتاحة (${total})` : `✨ All ${total} deals loaded` }}
        </div>
      </VCard>
    </VContainer>

    <!-- Brand Selection Dialog Modal -->
    <VDialog
      v-model="brandDialogOpen"
      max-width="680"
      scrollable
      class="filter-dialog"
    >
      <VCard rounded="xl" class="filter-modal-card">
        <VCardTitle class="d-flex align-center justify-space-between pa-4 border-b">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-car" color="primary" size="24" />
            <span class="font-weight-black text-h6">{{ locale === 'ar' ? 'اختر الماركة' : 'Select Brand' }}</span>
          </div>
          <VBtn icon="tabler-x" variant="text" density="comfortable" @click="brandDialogOpen = false" />
        </VCardTitle>

        <div class="pa-4 border-b">
          <VTextField
            v-model="brandSearchQuery"
            :placeholder="locale === 'ar' ? 'ابحث عن ماركة السيارة...' : 'Search brand...'"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            autofocus
            class="modal-search-field"
          />
        </div>

        <VCardText class="pa-4 modal-scroll-body" style="max-height: 460px;">
          <!-- Loading State -->
          <div v-if="brandsLoading" class="text-center py-12">
            <VProgressCircular indeterminate color="primary" size="44" />
            <p class="mt-3 text-body-2 opacity-60">{{ locale === 'ar' ? 'جاري تحميل الماركات...' : 'Loading brands...' }}</p>
          </div>

          <div v-else>
            <!-- All Brands Option -->
            <div
              class="brand-tile brand-tile--all mb-3"
              :class="{ active: draft.brandId === null }"
              @click="selectBrand(null)"
            >
              <div class="d-flex align-center gap-3">
                <div class="brand-avatar-box">
                  <VIcon icon="tabler-apps" size="20" />
                </div>
                <span class="brand-tile-name font-weight-bold">{{ locale === 'ar' ? 'جميع الماركات' : 'All Brands' }}</span>
              </div>
              <VIcon v-if="draft.brandId === null" icon="tabler-check" color="primary" size="20" />
            </div>

            <!-- Brand Grid -->
            <div class="brand-grid">
              <div
                v-for="b in modalFilteredBrands"
                :key="b.id"
                class="brand-tile"
                :class="{ active: draft.brandId === b.id }"
                @click="selectBrand(b)"
              >
                <div class="d-flex align-center gap-3 w-100">
                  <div class="brand-avatar-box">
                    <span class="brand-initials">{{ String(b.originalName?.en || b.name?.en || b.name || '').slice(0, 2).toUpperCase() }}</span>
                  </div>
                  <div class="d-flex flex-column text-start overflow-hidden">
                    <span class="brand-tile-name font-weight-bold text-truncate">{{ _t(b.name) }}</span>
                    <span v-if="(b.originalName?.en || b.name?.en) && locale === 'ar'" class="text-caption opacity-50 text-truncate">{{ b.originalName?.en || b.name?.en }}</span>
                  </div>
                </div>
                <VIcon v-if="draft.brandId === b.id" icon="tabler-check" color="primary" size="18" class="ms-auto flex-shrink-0" />
              </div>
            </div>

            <div v-if="modalFilteredBrands.length === 0" class="text-center py-8 opacity-60">
              <VIcon icon="tabler-search-off" size="36" class="mb-2 opacity-50" />
              <p class="mb-0">{{ locale === 'ar' ? 'لا توجد ماركة بهذا الاسم' : 'No brands matching your search' }}</p>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
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

/* =========================================
   Filter Trigger Buttons
   ========================================= */
.filter-trigger-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-trigger-btn:hover {
  border-color: rgba(255, 109, 0, 0.5);
  background: rgba(255, 109, 0, 0.06);
}

.filter-trigger-btn.has-value {
  border-color: rgba(255, 109, 0, 0.6);
  background: rgba(255, 109, 0, 0.08);
}

.filter-trigger-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.filter-trigger-icon {
  color: rgba(var(--v-theme-on-surface), 0.5);
  flex-shrink: 0;
}

.filter-trigger-btn.has-value .filter-trigger-icon {
  color: rgb(var(--v-theme-primary));
}

.filter-trigger-texts {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  text-align: start;
}

.filter-trigger-label {
  font-size: 10px;
  line-height: 1.1;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-trigger-value {
  font-size: 13px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-trigger-clear {
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.filter-trigger-clear:hover {
  color: #ff5252;
  background: rgba(255, 82, 82, 0.15);
}

.filter-trigger-arrow {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

/* =========================================
   Brand Dialog Modal
   ========================================= */
.filter-dialog :deep(.v-overlay__content) {
  margin: 16px;
}

.filter-modal-card {
  background: rgb(18, 24, 38) !important;
  border: 1.5px solid rgba(255, 109, 0, 0.3) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 109, 0, 0.15) !important;
}

.modal-search-field :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
}

.brand-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.brand-tile:hover {
  background: rgba(255, 109, 0, 0.1);
  border-color: rgba(255, 109, 0, 0.4);
  transform: translateY(-1px);
}

.brand-tile.active {
  background: rgba(255, 109, 0, 0.15);
  border-color: rgba(255, 109, 0, 0.8);
  box-shadow: 0 4px 15px rgba(255, 109, 0, 0.2);
}

.brand-tile--all {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.15);
}

.brand-avatar-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-initials {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.85);
}

.brand-tile-name {
  font-size: 13px;
  color: #fff;
}

/* =========================================
   Load More Button
   ========================================= */
.load-more-btn {
  background: linear-gradient(135deg, #ff6d00 0%, #ff8f00 100%) !important;
  color: #fff !important;
  box-shadow: 0 8px 25px rgba(255, 109, 0, 0.35) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(255, 109, 0, 0.5) !important;
}
</style>
