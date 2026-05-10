<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'
import featureUserApi from '@/api/user/carFeatureUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({
  meta: { layout: 'front', public: true },
})

const route = useRoute()
const router = useRouter()

// -------------------------
// Helpers
// -------------------------
const isNumberKey = (evt) => {
  const charCode = (evt.which) ? evt.which : evt.keyCode
  // Allow numbers 0-9 and Arabic/Hindi numbers 0-9
  if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode < 1632 || charCode > 1641)) {
    evt.preventDefault()
  }
}

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const firstQueryVal = (v) => (Array.isArray(v) ? v[0] : v)

const toNumOrNull = (v, limit = 9) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  raw = raw.replace(/\D/g, '').slice(0, limit)
  let n = Number(raw)
  return Number.isNaN(n) || raw === '' ? null : n
}

const formatWithCommas = (v) => {
  if (!v && v !== 0) return ''
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const parseBetweenFromQuery = (qObj, key) => {
  const v = firstQueryVal(qObj?.[`filter[${key}]`])
  if (!v) return { from: null, to: null }
  const [a, b] = String(v).split('.')
  return {
    from: (a !== undefined && a !== '') ? Number(a) : null,
    to: (b !== undefined && b !== '') ? Number(b) : null,
  }
}

const putBetween = (obj, key, from, to) => {
  const a = (from ?? '') === '' ? '' : from
  const b = (to ?? '') === '' ? '' : to
  if (a !== '' || b !== '') obj[`filter[${key}]`] = `${a}.${b}`
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
  const { token, userId } = getAuth()
  const favArr = Array.isArray(car?.favorites) ? car.favorites : []
  car.is_favorited = favArr.some(f => f.user_id === userId)
  return car
}

const normalizeCars = (data) => {
  if (Array.isArray(data)) return { items: data, total: data.length }
  if (data?.data && Array.isArray(data.data)) return { items: data.data, total: data.total || data.data.length }
  return { items: [], total: 0 }
}

// -------------------------
// Options
// -------------------------
const transmissionOptions = [
  { title: 'Automatic', value: 'automatic' },
  { title: 'Manual', value: 'manual' },
]

const fuelOptions = [
  { title: 'Petrol', value: 'petrol' },
  { title: 'Diesel', value: 'diesel' },
  { title: 'Hybrid', value: 'hybrid' },
  { title: 'Electric', value: 'electric' },
]

const drivetrainOptions = [
  { title: 'FWD', value: 'fwd' },
  { title: 'RWD', value: 'rwd' },
  { title: 'AWD', value: 'awd' },
]

// -------------------------
// State
// -------------------------
const loading = ref(true)
const loadingMore = ref(false)
const initialized = ref(false)
const cars = ref([])
const total = ref(0)
const page = ref(1)
const brands = ref([])
const draftModels = ref([])
const features = ref([])

const draft = ref({
  q: '',
  type: 'car',
  condition: '',
  brandId: null,
  modelId: null,
  yearFrom: null,
  yearTo: null,
  priceFrom: null,
  priceTo: null,
  mileageFrom: null,
  mileageTo: null,
  transmission: null,
  fuelType: null,
  drivetrain: null,
  featureIds: [],
})

const sort = ref(String(firstQueryVal(route.query.sort) || ''))
const perPage = ref(Number(firstQueryVal(route.query.perPage) || 50))

const displayDraftPriceFrom = computed({
  get: () => formatWithCommas(draft.value.priceFrom),
  set: (v) => { draft.value.priceFrom = toNumOrNull(v) }
})

const displayDraftPriceTo = computed({
  get: () => formatWithCommas(draft.value.priceTo),
  set: (v) => { draft.value.priceTo = toNumOrNull(v) }
})

const displayDraftMileageFrom = computed({
  get: () => formatWithCommas(draft.value.mileageFrom),
  set: (v) => { draft.value.mileageFrom = toNumOrNull(v, 6) }
})

const displayDraftMileageTo = computed({
  get: () => formatWithCommas(draft.value.mileageTo),
  set: (v) => { draft.value.mileageTo = toNumOrNull(v, 6) }
})

const hasMore = computed(() => cars.value.length < total.value)

const sectionTitle = computed(() => {
  return draft.value.type === 'motorcycle' ? 'Bikes' : 'Cars'
})

// -------------------------
// Logic
// -------------------------
const syncDraftFromQuery = () => {
  const q = route.query
  const y = parseBetweenFromQuery(q, 'year_between')
  const p = parseBetweenFromQuery(q, 'price_between')
  const m = parseBetweenFromQuery(q, 'mileage_between')

  draft.value = {
    q: String(firstQueryVal(q['filter[global]']) || ''),
    type: String(firstQueryVal(q['filter[type]']) || 'car'),
    condition: String(firstQueryVal(q['filter[condition]']) || ''),
    brandId: q['filter[brand_id]'] ? Number(firstQueryVal(q['filter[brand_id]'])) : null,
    modelId: q['filter[model_id]'] ? Number(firstQueryVal(q['filter[model_id]'])) : null,
    yearFrom: y.from,
    yearTo: y.to,
    priceFrom: p.from,
    priceTo: p.to,
    mileageFrom: m.from,
    mileageTo: m.to,
    transmission: q['filter[transmission]'] ? String(firstQueryVal(q['filter[transmission]'])) : null,
    fuelType: q['filter[fuel_type]'] ? String(firstQueryVal(q['filter[fuel_type]'])) : null,
    drivetrain: q['filter[drivetrain]'] ? String(firstQueryVal(q['filter[drivetrain]'])) : null,
    featureIds: q['filter[feature_ids]'] ? String(firstQueryVal(q['filter[feature_ids]'])).split(',').map(Number).filter(Boolean) : [],
  }
}

const buildParams = (p = 1) => {
  const params = {
    page: p,
    perPage: perPage.value,
    'filter[status]': 'approved',
  }

  if (sort.value) params.sort = sort.value
  
  const d = draft.value
  if (d.q) params['filter[global]'] = d.q
  if (d.type) params['filter[type]'] = d.type
  if (d.condition) params['filter[condition]'] = d.condition
  if (d.brandId) params['filter[brand_id]'] = d.brandId
  if (d.modelId) params['filter[model_id]'] = d.modelId
  if (d.transmission) params['filter[transmission]'] = d.transmission
  if (d.fuelType) params['filter[fuel_type]'] = d.fuelType
  if (d.drivetrain) params['filter[drivetrain]'] = d.drivetrain
  if (d.featureIds?.length) params['filter[feature_ids]'] = d.featureIds.join(',')
  
  putBetween(params, 'year_between', d.yearFrom, d.yearTo)
  putBetween(params, 'price_between', d.priceFrom, d.priceTo)
  putBetween(params, 'mileage_between', d.mileageFrom, d.mileageTo)

  return params
}

const fetchCars = async () => {
  loading.value = true
  cars.value = []

  try {
    const res = await carsUserApi.getAll(buildParams(page.value))
    const { items, total: tt } = normalizeCars(res.data)

    cars.value = items.map(normalizeFavFields)
    total.value = tt
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
    initialized.value = true
  }
}

const onMileageInput = (val, key) => {
  if (!val) {
    draft.value[key] = ''
    return
  }

  // Convert Arabic/Hindi digits to English digits
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let clean = val.toString().replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  
  // Remove any non-numeric characters
  clean = clean.replace(/[^0-9]/g, '')
  
  // Limit to 6 digits
  if (clean.length > 6) {
    clean = clean.substring(0, 6)
  }
  
  draft.value[key] = clean
}

const applyFilters = () => {
  const query = { ...route.query }
  delete query.page // Reset to first page on filter change

  const d = draft.value
  // ... rest same ...
  if (d.q) query['filter[global]'] = d.q; else delete query['filter[global]']
  if (d.type) query['filter[type]'] = d.type; else delete query['filter[type]']
  if (d.condition) query['filter[condition]'] = d.condition; else delete query['filter[condition]']
  if (d.brandId) query['filter[brand_id]'] = d.brandId; else delete query['filter[brand_id]']
  if (d.modelId) query['filter[model_id]'] = d.modelId; else delete query['filter[model_id]']
  if (d.transmission) query['filter[transmission]'] = d.transmission; else delete query['filter[transmission]']
  if (d.fuelType) query['filter[fuel_type]'] = d.fuelType; else delete query['filter[fuel_type]']
  if (d.drivetrain) query['filter[drivetrain]'] = d.drivetrain; else delete query['filter[drivetrain]']
  if (d.featureIds?.length) query['filter[feature_ids]'] = d.featureIds.join(','); else delete query['filter[feature_ids]']

  putBetween(query, 'year_between', d.yearFrom, d.yearTo)
  putBetween(query, 'price_between', d.priceFrom, d.priceTo)
  putBetween(query, 'mileage_between', d.mileageFrom, d.mileageTo)

  router.push({ query })
}

const resetAll = () => {
  draft.value = {
    q: '',
    type: 'car',
    condition: '',
    brandId: null,
    modelId: null,
    yearFrom: null,
    yearTo: null,
    priceFrom: null,
    priceTo: null,
    mileageFrom: null,
    mileageTo: null,
    transmission: null,
    fuelType: null,
    drivetrain: null,
    featureIds: [],
  }
  router.push({ path: '/user/cars', query: {} })
}

const onPageChange = (p) => {
  const query = { ...route.query, page: p }
  router.push({ query })
}

// -------------------------
// Watchers & Lifecycle
// -------------------------
watch(() => route.query, () => {
  syncDraftFromQuery()
  page.value = Number(firstQueryVal(route.query.page) || 1)
  fetchCars()
}, { deep: true })

watch(() => draft.value.brandId, async (val) => {
  if (!val) { draftModels.value = []; return }
  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': val })
    const data = res.data?.data || res.data || []
    draftModels.value = data
  } catch { draftModels.value = [] }
}, { immediate: true })

onMounted(async () => {
  syncDraftFromQuery()
  fetchCars(true)
  try {
    const [bRes, fRes] = await Promise.all([
      brandUserApi.getAll(),
      featureUserApi.getAll()
    ])
    brands.value = bRes.data?.data || bRes.data || []
    features.value = fRes.data?.data || fRes.data || []
  } catch {}
})
</script>

<template>
  <section class="cars-page">
    <VContainer>
      <VRow>
        <!-- Sidebar Filters -->
        <VCol cols="12" md="4" lg="3">
          <div class="premium-search-box">
            <!-- Type Toggle -->
            <div class="mb-4">
              <div class="premium-toggle">
                <button
                  type="button"
                  class="premium-toggle__btn"
                  :class="{ active: draft.type === 'car' }"
                  @click="draft.type = 'car'"
                >
                  Cars
                </button>
                <button
                  type="button"
                  class="premium-toggle__btn"
                  :class="{ active: draft.type === 'motorcycle' }"
                  @click="draft.type = 'motorcycle'"
                >
                  Bikes
                </button>
              </div>
            </div>

            <!-- Condition Toggle -->
            <div class="mb-3">
              <div class="premium-toggle premium-toggle--three">
                <button
                  type="button"
                  class="premium-toggle__btn"
                  :class="{ active: draft.condition === '' }"
                  @click="draft.condition = ''"
                >
                  All
                </button>
                <button
                  type="button"
                  class="premium-toggle__btn"
                  :class="{ active: draft.condition === 'used' }"
                  @click="draft.condition = 'used'"
                >
                  Used
                </button>
                <button
                  type="button"
                  class="premium-toggle__btn"
                  :class="{ active: draft.condition === 'new' }"
                  @click="draft.condition = 'new'"
                >
                  New
                </button>
              </div>
            </div>

            <!-- Brand & Model -->
            <div class="mb-3">
              <VSelect
                v-model="draft.brandId"
                :items="brands"
                item-value="id"
                label="Brand"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input mb-3"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>

              <VSelect
                v-model="draft.modelId"
                :items="draftModels"
                item-value="id"
                :disabled="!draft.brandId"
                label="Model"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>
            </div>

            <!-- Price -->
            <div class="mb-4">
              <div class="input-label-mini">Price (EG)</div>
              <VRow dense>
                <VCol cols="6">
                  <VTextField
                    v-model="displayDraftPriceFrom"
                    placeholder="Min"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="premium-input"
                    @keypress="isNumberKey"
                    maxlength="11"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model="displayDraftPriceTo"
                    placeholder="Max"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="premium-input"
                    @keypress="isNumberKey"
                    maxlength="11"
                  />
                </VCol>
              </VRow>
            </div>

            <!-- Year -->
            <div class="mb-4">
              <div class="input-label-mini">Year</div>
              <VRow dense>
                <VCol cols="6">
                  <VSelect
                    v-model="draft.yearFrom"
                    :items="Array.from({ length: 26 }, (_, i) => 2025 - i)"
                    label="From"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="premium-input"
                  />
                </VCol>
                <VCol cols="6">
                  <VSelect
                    v-model="draft.yearTo"
                    :items="Array.from({ length: 26 }, (_, i) => 2025 - i).filter(y => !draft.yearFrom || y >= draft.yearFrom)"
                    label="To"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="premium-input"
                  />
                </VCol>
              </VRow>
            </div>

            <!-- Advanced Filters -->
            <div class="advanced-filters-section mt-6">
              <div class="input-label-mini mb-2">Technical Details</div>
              
              <VSelect
                v-model="draft.transmission"
                :items="transmissionOptions"
                label="Transmission"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                class="premium-input mb-3"
              />

              <VSelect
                v-model="draft.fuelType"
                :items="fuelOptions"
                label="Fuel Type"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                class="premium-input mb-3"
              />

              <VSelect
                v-model="draft.drivetrain"
                :items="drivetrainOptions"
                label="Drivetrain"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                class="premium-input mb-3"
              />

              <div class="input-label-mini mb-1">Mileage (km)</div>
              <VRow dense class="mb-3">
                <VCol cols="6">
                  <VTextField
                    v-model="displayDraftMileageFrom"
                    placeholder="Min"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="premium-input"
                    maxlength="7"
                    @keypress="isNumberKey"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model="displayDraftMileageTo"
                    placeholder="Max"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="premium-input"
                    maxlength="7"
                    @keypress="isNumberKey"
                  />
                </VCol>
              </VRow>

              <VSelect
                v-model="draft.featureIds"
                :items="features"
                item-value="id"
                label="Features"
                variant="outlined"
                density="comfortable"
                hide-details
                multiple
                chips
                clearable
                class="premium-input mb-4"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  <VChip size="x-small">{{ t(item.raw.name) }}</VChip>
                </template>
              </VSelect>
            </div>

            <VBtn block color="primary" height="52" class="search-submit-btn mb-3" @click="applyFilters">
              Apply Filters
            </VBtn>

            <VBtn block variant="text" color="secondary" size="small" @click="resetAll">
              Reset All
            </VBtn>
          </div>
        </VCol>

        <!-- Results -->
        <VCol cols="12" md="8" lg="9">
          <VCard class="pa-6" rounded="xl" elevation="0" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05)">
            <div class="d-flex align-center justify-space-between mb-8">
              <div>
                <h2 class="text-h4 font-weight-bold text-white mb-1">
                  {{ draft.type === 'motorcycle' ? 'Bikes' : (draft.type === 'car' ? 'Cars' : 'Search Results') }}
                </h2>
                <div class="text-body-1 opacity-60">{{ total }} {{ draft.type === 'motorcycle' ? 'bikes' : 'cars' }} available</div>
              </div>
              
              <VSelect
                v-model="sort"
                :items="[
                  { title: 'Newest', value: '-created_at' },
                  { title: 'Price: Low to High', value: 'price' },
                  { title: 'Price: High to Low', value: '-price' },
                ]"
                label="Sort By"
                variant="tonal"
                density="comfortable"
                hide-details
                style="max-width: 200px"
                @update:model-value="applyFilters"
              />
            </div>

            <CarsSection
              embedded
              :showViewAll="false"
              :cars="cars"
              :loading="loading"
              title=""
            />

            <div v-if="initialized && !loading && cars.length === 0" class="text-center py-16">
              <VIcon icon="tabler-car-off" size="80" class="mb-4 opacity-10" />
              <h3 class="text-h5 opacity-50 mb-2">No matching vehicles found</h3>
              <p class="text-body-1 opacity-40 mb-6">Try adjusting your filters to see more results.</p>
              <VBtn variant="flat" color="primary" @click="resetAll">Clear All Filters</VBtn>
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
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style scoped>
.cars-page { padding: 40px 0; min-height: 100vh; background: #0f111a; }

.premium-search-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 16px; /* Reduced from 24px */
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: thin;
}

.premium-search-box::-webkit-scrollbar {
  width: 4px;
}

.premium-search-box::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.input-label-mini {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.5;
  margin-bottom: 8px;
  color: #fff;
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.premium-input :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 0.8) !important;
  background: rgba(0, 0, 0, 0.4) !important;
}

.search-submit-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  text-transform: none !important;
  font-size: 16px !important;
  box-shadow: 0 10px 25px -5px rgba(var(--v-theme-primary), 0.4) !important;
}

.premium-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 3px;
  gap: 3px;
  height: 42px; /* Reduced from 50px */
}

.premium-toggle__btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.4;
}

.premium-toggle__btn.active {
  opacity: 1;
  background: rgba(var(--v-theme-primary), 1);
  color: #fff;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.4);
}

.premium-toggle--three .premium-toggle__btn { font-size: 12px; }

:deep(.v-chip) {
  font-weight: 700;
  font-size: 10px;
}

/* Hide number input spinners */
:deep(input::-webkit-outer-spin-button),
:deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

:deep(input[type=number]) {
  -moz-appearance: textfield;
}
</style>
