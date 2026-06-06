<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'
import featureUserApi from '@/api/user/carFeatureUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import { customBrandFilter } from '@/utils/brandTranslations.js'

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
  { title: 'Mild Hybrid (MHEV)', value: 'mild_hybrid' },
  { title: 'REEV', value: 'reev' },
  { title: 'Electric (EV)', value: 'electric' },
]

const drivetrainOptions = [
  { title: 'FWD', value: 'fwd' },
  { title: 'RWD', value: 'rwd' },
  { title: 'AWD', value: 'awd' },
  { title: '4x4', value: '4wd' },
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
const isAdvancedOpen = ref(false)

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
  adCategory: '',
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

const activeType = computed(() => {
  return String(firstQueryVal(route.query['filter[type]']) || 'car')
})

// -------------------------
// Logic
// -------------------------
const syncDraftFromQuery = () => {
  const q = route.query
  const y = parseBetweenFromQuery(q, 'year_between')
  const p = parseBetweenFromQuery(q, 'price_between')
  const m = parseBetweenFromQuery(q, 'mileage_between')

  let adCat = ''
  if (q['filter[is_featured]'] === '1') {
    adCat = 'featured'
  } else if (q['filter[is_best_deal]'] === '1') {
    adCat = 'best_deal'
  } else if (q['filter[is_import]'] === '1') {
    adCat = 'imported'
  } else if (q['filter[is_import]'] === '0') {
    adCat = 'local'
  }

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
    adCategory: adCat,
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
  
  // Set corresponding backend filter
  if (d.adCategory === 'featured') {
    params['filter[is_featured]'] = '1'
  } else if (d.adCategory === 'best_deal') {
    params['filter[is_best_deal]'] = '1'
  } else if (d.adCategory === 'imported') {
    params['filter[is_import]'] = '1'
  } else if (d.adCategory === 'local') {
    params['filter[is_import]'] = '0'
  }

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
    const mainParams = buildParams(page.value)
    
    // 1. Fetch main filtered results
    const res = await carsUserApi.getAll(mainParams)
    const { items, total: tt } = normalizeCars(res.data)
    let finalItems = items.map(normalizeFavFields)

    // 2. If it's the first page, fetch Global Ads to inject them at the top
    // regardless of the current filters (but respecting vehicle type)
    if (page.value === 1) {
      try {
        const globalRes = await carsUserApi.getAll({
          perPage: 2,
          'filter[status]': 'approved',
          'filter[is_global_ad]': 1,
          'filter[type]': draft.value.type || 'car',
          sort: '-created_at'
        })
        const { items: globals } = normalizeCars(globalRes.data)
        const globalItems = globals.map(normalizeFavFields)

        // Prepend unique global ads to the list
        const existingIds = new Set(finalItems.map(c => c.id))
        const uniqueGlobals = globalItems.filter(g => !existingIds.has(g.id))
        
        finalItems = [...uniqueGlobals, ...finalItems]
      } catch (globalErr) {
        console.error('Global ads fetch error:', globalErr)
      }
    }

    cars.value = finalItems
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
  const idValue = draft.value.q?.trim()
  if (idValue && /^\d+$/.test(idValue)) {
    router.push(`/user/cars/${idValue}`)
    return
  }

  const query = { ...route.query }
  delete query.page // Reset to first page on filter change

  const d = draft.value
  if (d.q) query['filter[global]'] = d.q; else delete query['filter[global]']
  if (d.type) query['filter[type]'] = d.type; else delete query['filter[type]']
  if (d.condition) query['filter[condition]'] = d.condition; else delete query['filter[condition]']
  if (d.brandId) query['filter[brand_id]'] = d.brandId; else delete query['filter[brand_id]']
  if (d.modelId) query['filter[model_id]'] = d.modelId; else delete query['filter[model_id]']
  if (d.transmission) query['filter[transmission]'] = d.transmission; else delete query['filter[transmission]']
  if (d.fuelType) query['filter[fuel_type]'] = d.fuelType; else delete query['filter[fuel_type]']
  if (d.drivetrain) query['filter[drivetrain]'] = d.drivetrain; else delete query['filter[drivetrain]']
  
  // Clean old parameters
  delete query['filter[is_import]']
  delete query['filter[is_featured]']
  delete query['filter[is_best_deal]']

  // Map to corresponding router query parameter
  if (d.adCategory === 'featured') {
    query['filter[is_featured]'] = '1'
  } else if (d.adCategory === 'best_deal') {
    query['filter[is_best_deal]'] = '1'
  } else if (d.adCategory === 'imported') {
    query['filter[is_import]'] = '1'
  } else if (d.adCategory === 'local') {
    query['filter[is_import]'] = '0'
  }

  if (d.featureIds?.length) query['filter[feature_ids]'] = d.featureIds.join(','); else delete query['filter[feature_ids]']

  putBetween(query, 'year_between', d.yearFrom, d.yearTo)
  putBetween(query, 'price_between', d.priceFrom, d.priceTo)
  putBetween(query, 'mileage_between', d.mileageFrom, d.mileageTo)

  if (sort.value) query.sort = sort.value; else delete query.sort

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
    adCategory: '',
    featureIds: [],
  }
  router.push({ path: '/user/cars', query: {} })
}

const isMobileFilterOpen = ref(false)

const handleApplyMobile = () => {
  const idValue = draft.value.q?.trim()
  if (idValue && /^\d+$/.test(idValue)) {
    router.push(`/user/cars/${idValue}`)
    isMobileFilterOpen.value = false
    return
  }
  applyFilters()
  isMobileFilterOpen.value = false
}

const handleResetMobile = () => {
  resetAll()
  isMobileFilterOpen.value = false
}

watch(isMobileFilterOpen, (val) => {
  if (typeof window !== 'undefined') {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
  }
})

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



const filteredBrands = computed(() => {
  const type = draft.value.type || 'car'
  const items = brands.value || []
  return items.filter(b => !b.type || b.type === type)
})

const BIKE_KEYWORDS = [
  'ducati', 'yamaha', 'kawasaki', 'suzuki bike', 'honda bike', 'cc engine', 
  'quick shift', 'ride by wire', 'wheelie', 'slide control', 'traction control evo',
  'dqs', 'dtc', 'dsc', 'dwc', 'dpl', 'desmosedici', '1103cc', '955cc', 'v4 engine',
  'monoshock', 'chain drive', 'slipper clutch', 'engine cc', 'engine displacement'
]

const CAR_KEYWORDS = [
  'airbag', 'sunroof', 'carplay', 'android auto', 'isofix', 'seat', 'climate control',
  'tailgate', 'door', 'hepa', 'glass', 'lane keep', 'lane departure', 'blind spot',
  'park assist', 'cruise control', 'roof', 'trunk', 'frunk', 'window', 'chassis', 'differential',
  'nappa', 'alcantara', 'wood trim', 'carbon fiber trim', 'refrigerator', 'starlight', 'ambient lighting'
]

const filteredFeatures = computed(() => {
  const type = draft.value.type || 'car'
  const items = features.value || []
  
  return items.filter(feat => {
    const nameEn = String(feat.name?.en || feat.name || '').toLowerCase()
    const nameAr = String(feat.name?.ar || '').toLowerCase()
    const name = `${nameEn} ${nameAr}`
    
    const isBikeFeature = BIKE_KEYWORDS.some(kw => name.includes(kw) || nameEn.includes(kw))
    const isCarFeature = CAR_KEYWORDS.some(kw => name.includes(kw) || nameEn.includes(kw))
    
    if (type === 'motorcycle') {
      return !isCarFeature || isBikeFeature
    } else {
      return !isBikeFeature
    }
  })
})

watch(() => draft.value.type, () => {
  draft.value.brandId = null
  draft.value.modelId = null
  draft.value.featureIds = []
  draft.value.transmission = null
  draft.value.fuelType = null
  draft.value.drivetrain = null
})

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

const activeAdvancedFiltersCount = computed(() => {
  let count = 0
  const d = draft.value
  if (d.condition !== '') count++
  if (d.priceFrom !== null || d.priceTo !== null) count++
  if (d.yearFrom !== null || d.yearTo !== null) count++
  if (d.mileageFrom !== null || d.mileageTo !== null) count++
  if (d.transmission !== null) count++
  if (d.fuelType !== null) count++
  if (d.drivetrain !== null) count++
  if (d.adCategory !== '') count++
  if (d.featureIds && d.featureIds.length > 0) count++
  return count
})
</script>

<template>
  <section class="cars-page">
    <VContainer>
      <!-- Premium Horizontal Search Deck (Desktop only) -->
      <div class="d-none d-md-block mb-8">
        <div class="premium-horizontal-search">
          <!-- Main Search Row -->
          <div class="search-main-row">
            <!-- 1. Global Search -->
            <div class="search-col search-col-query">
              <VTextField
                v-model="draft.q"
                placeholder="Search by ID..."
                prepend-inner-icon="tabler-search"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input-field"
                @keyup.enter="applyFilters"
              />
            </div>

            <!-- 2. Type Toggle (العربية ولا بايك) -->
            <div class="search-col search-col-type">
              <div class="horizontal-toggle">
                <button
                  type="button"
                  class="horizontal-toggle-btn"
                  :class="{ active: draft.type === 'car' }"
                  @click="draft.type = 'car'"
                >
                  Cars
                </button>
                <button
                  type="button"
                  class="horizontal-toggle-btn"
                  :class="{ active: draft.type === 'motorcycle' }"
                  @click="draft.type = 'motorcycle'"
                >
                  Bikes
                </button>
              </div>
            </div>

            <!-- 3. Brand Select -->
            <div class="search-col search-col-brand">
              <VAutocomplete
                v-model="draft.brandId"
                :items="filteredBrands"
                item-value="id"
                :item-title="b => t(b.name)"
                :custom-filter="customBrandFilter"
                maxlength="30"
                label="Brand"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input-field"
                @update:model-value="draft.modelId = null"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VAutocomplete>
            </div>

            <!-- 4. Model Select -->
            <div class="search-col search-col-model">
              <VSelect
                v-model="draft.modelId"
                :items="draftModels"
                item-value="id"
                :disabled="!draft.brandId"
                label="Model"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input-field"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>
            </div>

            <!-- Action Buttons (Reset and Advanced Filter) -->
            <div class="search-col search-col-actions">
              <VBtn
                variant="tonal"
                height="44"
                color="secondary"
                class="horizontal-reset-btn px-4"
                title="Reset All"
                @click="resetAll"
              >
                <VIcon icon="tabler-refresh" />
              </VBtn>

              <VBtn
                variant="tonal"
                height="44"
                color="secondary"
                class="horizontal-advanced-btn px-5"
                :class="{ active: isAdvancedOpen }"
                @click="isAdvancedOpen = !isAdvancedOpen"
              >
                <VIcon
                  :icon="isAdvancedOpen ? 'tabler-chevron-up' : 'tabler-adjustments-horizontal'"
                  class="me-1"
                />
                <span>{{ isAdvancedOpen ? 'Less Filters' : 'More Filters' }}</span>
                <span
                  v-if="activeAdvancedFiltersCount > 0"
                  class="filter-count-badge ms-1"
                >
                  {{ activeAdvancedFiltersCount }}
                </span>
              </VBtn>
            </div>
          </div>

          <!-- Advanced Collapsible Section -->
          <VExpandTransition>
            <div v-show="isAdvancedOpen" class="search-advanced-panel">
              <div class="advanced-panel-grid">
                <!-- Card 1: Condition -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-shield-check" class="filter-icon" />
                    <span class="filter-title">Condition</span>
                  </div>
                  <div class="filter-card-body">
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
                </div>

                <!-- Card 2: Price Range -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-currency-dollar" class="filter-icon" />
                    <span class="filter-title">Price Range (EG)</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="d-flex gap-2">
                      <VTextField
                        v-model="displayDraftPriceFrom"
                        placeholder="Min"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                        @keypress="isNumberKey"
                        maxlength="11"
                      />
                      <VTextField
                        v-model="displayDraftPriceTo"
                        placeholder="Max"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                        @keypress="isNumberKey"
                        maxlength="11"
                      />
                    </div>
                  </div>
                </div>

                <!-- Card 3: Year Range -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-calendar" class="filter-icon" />
                    <span class="filter-title">Year</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="d-flex gap-2">
                      <VSelect
                        v-model="draft.yearFrom"
                        :items="Array.from({ length: 26 }, (_, i) => 2025 - i)"
                        label="From"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                      />
                      <VSelect
                        v-model="draft.yearTo"
                        :items="Array.from({ length: 26 }, (_, i) => 2025 - i).filter(y => !draft.yearFrom || y >= draft.yearFrom)"
                        label="To"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                      />
                    </div>
                  </div>
                </div>

                <!-- Card 4: Mileage -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-road" class="filter-icon" />
                    <span class="filter-title">Mileage (km)</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="d-flex gap-2">
                      <VTextField
                        v-model="displayDraftMileageFrom"
                        placeholder="Min"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                        maxlength="7"
                        @keypress="isNumberKey"
                      />
                      <VTextField
                        v-model="displayDraftMileageTo"
                        placeholder="Max"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                        maxlength="7"
                        @keypress="isNumberKey"
                      />
                    </div>
                  </div>
                </div>

                <!-- Card 5: Transmission -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-settings" class="filter-icon" />
                    <span class="filter-title">Transmission</span>
                  </div>
                  <div class="filter-card-body">
                    <VSelect
                      v-model="draft.transmission"
                      :items="transmissionOptions"
                      item-value="value"
                      item-title="title"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input-field"
                    />
                  </div>
                </div>

                <!-- Card 6: Fuel Type -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-gas-station" class="filter-icon" />
                    <span class="filter-title">Fuel Type</span>
                  </div>
                  <div class="filter-card-body">
                    <VSelect
                      v-model="draft.fuelType"
                      :items="fuelOptions"
                      item-value="value"
                      item-title="title"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input-field"
                    />
                  </div>
                </div>

                <!-- Card 7: Drivetrain -->
                <div class="filter-card" v-if="draft.type === 'car'">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-propeller" class="filter-icon" />
                    <span class="filter-title">Drivetrain</span>
                  </div>
                  <div class="filter-card-body">
                    <VSelect
                      v-model="draft.drivetrain"
                      :items="drivetrainOptions"
                      item-value="value"
                      item-title="title"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input-field"
                    />
                  </div>
                </div>

                <!-- Card 8: Classification -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-tags" class="filter-icon" />
                    <span class="filter-title">Classification</span>
                  </div>
                  <div class="filter-card-body">
                    <VSelect
                      v-model="draft.adCategory"
                      :items="[
                        { title: 'All', value: '' },
                        { title: 'Featured Only', value: 'featured' },
                        { title: 'Best Deals Only', value: 'best_deal' },
                        { title: 'Imported Only', value: 'imported' },
                        { title: 'Local Only', value: 'local' }
                      ]"
                      item-value="value"
                      item-title="title"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input-field"
                    />
                  </div>
                </div>
              </div>

              <!-- Centered Search Button Row -->
              <div class="d-flex justify-center mt-6 pt-4" style="border-top: 1px solid rgba(255,255,255,0.05);">
                <VBtn
                  color="primary"
                  height="46"
                  min-width="240"
                  class="horizontal-search-btn px-8"
                  prepend-icon="tabler-sparkles"
                  @click="applyFilters"
                >
                  Search Vehicles
                </VBtn>
              </div>
            </div>
          </VExpandTransition>
        </div>
      </div>

      <VRow>
        <!-- Mobile Sidebar Filters (Drawer on Mobile, hidden on Desktop) -->
        <VCol cols="12" class="d-md-none position-relative">
          <!-- Backdrop for Mobile Drawer -->
          <div
            v-if="isMobileFilterOpen"
            class="filter-backdrop d-md-none"
            @click="isMobileFilterOpen = false"
          ></div>

          <div class="premium-search-box" :class="{ 'is-open': isMobileFilterOpen }">
            <!-- Mobile Header -->
            <div class="mobile-filter-header d-md-none d-flex align-center justify-space-between mb-4">
              <span class="text-h6 font-weight-bold text-white">Filters</span>
              <VBtn icon="tabler-x" variant="text" color="white" density="comfortable" @click="isMobileFilterOpen = false" />
            </div>

            <!-- Scrollable Content on Mobile -->
            <div class="filter-scroll-content">
              <!-- Global Text Search on Mobile -->
              <div class="mb-4">
                <VTextField
                  v-model="draft.q"
                  placeholder="Search by ID..."
                  prepend-inner-icon="tabler-search"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="premium-input"
                  @keyup.enter="handleApplyMobile"
                />
              </div>

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
                <VAutocomplete
                  v-model="draft.brandId"
                  :items="filteredBrands"
                  item-value="id"
                  :item-title="b => t(b.name)"
                  :custom-filter="customBrandFilter"
                  maxlength="30"
                  label="Brand"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="premium-input mb-3"
                  @update:model-value="draft.modelId = null"
                >
                  <template #item="{ props, item }">
                    <VListItem v-bind="props" :title="t(item.raw.name)" />
                  </template>
                  <template #selection="{ item }">
                    {{ t(item.raw.name) }}
                  </template>
                </VAutocomplete>

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
                
                <div class="technical-details-section">
                  <!-- Transmission -->
                  <div class="mb-4">
                    <VSelect
                      v-model="draft.transmission"
                      :items="transmissionOptions"
                      item-value="value"
                      item-title="title"
                      label="Transmission"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input"
                    />
                  </div>

                  <!-- Fuel Type -->
                  <div class="mb-4">
                    <VSelect
                      v-model="draft.fuelType"
                      :items="fuelOptions"
                      item-value="value"
                      item-title="title"
                      label="Fuel Type"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input"
                    />
                  </div>

                  <!-- Drivetrain -->
                  <div class="mb-4" v-if="draft.type === 'car'">
                    <VSelect
                      v-model="draft.drivetrain"
                      :items="drivetrainOptions"
                      item-value="value"
                      item-title="title"
                      label="Drivetrain"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input"
                    />
                  </div>

                  <!-- Classification -->
                  <div class="mb-4">
                    <VSelect
                      v-model="draft.adCategory"
                      :items="[
                        { title: 'All', value: '' },
                        { title: 'Featured Only', value: 'featured' },
                        { title: 'Best Deals Only', value: 'best_deal' },
                        { title: 'Imported Only', value: 'imported' },
                        { title: 'Local Only', value: 'local' }
                      ]"
                      item-value="value"
                      item-title="title"
                      label="Classification"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input"
                    />
                  </div>
                </div>

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
              </div>
            </div> <!-- Close filter-scroll-content -->

            <div class="filter-actions">
              <VBtn block color="primary" height="52" class="search-submit-btn mb-3" @click="handleApplyMobile">
                Apply Filters
              </VBtn>

              <VBtn block variant="text" color="secondary" size="small" @click="handleResetMobile">
                Reset All
              </VBtn>
            </div>
          </div>
        </VCol>

        <!-- Results -->
        <VCol cols="12">
          <VCard class="pa-6" rounded="xl" elevation="0" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05)">
            <div class="d-flex align-center justify-space-between mb-8">
              <div>
                <h2 class="text-h4 font-weight-bold text-white mb-1">
                  {{ activeType === 'motorcycle' ? 'Bikes' : (activeType === 'car' ? 'Cars' : 'Search Results') }}
                </h2>
                <div class="text-body-1 opacity-60">{{ total }} {{ activeType === 'motorcycle' ? 'bikes' : 'cars' }} available</div>
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

  <!-- Mobile Floating Filter Button -->
  <div class="mobile-filter-trigger d-md-none">
    <VBtn
      color="primary"
      rounded
      height="50"
      prepend-icon="tabler-adjustments-horizontal"
      class="px-6 mobile-floating-btn"
      @click="isMobileFilterOpen = true"
    >
      <span>Filters</span>
      <span
        v-if="activeAdvancedFiltersCount > 0"
        class="filter-count-badge filter-count-badge--mobile ms-2"
      >
        {{ activeAdvancedFiltersCount }}
      </span>
    </VBtn>
  </div>
</template>

<style scoped>
.cars-page { padding: 40px 0; min-height: 100vh; }

/* Premium Horizontal Search Deck Styles */
.premium-horizontal-search {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 20px 24px;
  margin-bottom: 30px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.premium-horizontal-search:hover {
  border-color: rgba(var(--v-theme-primary), 0.15);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
}

.search-main-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.search-col {
  flex: 1;
  min-width: 0;
}

.search-col-query {
  flex: 1.3;
}

.search-col-brand,
.search-col-model {
  flex: 0.85;
}

.search-col-type {
  flex: 0.85;
  max-width: 150px;
}

.search-col-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Integrated Outlined Cohesion for all Vuetify 3 inputs */
.premium-input-field :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px !important;
  display: flex;
  align-items: center;
}

.premium-input-field :deep(.v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: rgba(255, 255, 255, 0.08) !important;
  transition: color 0.3s ease;
}

.premium-input-field :deep(.v-field:hover .v-field__outline) {
  color: rgba(255, 255, 255, 0.2) !important;
}

.premium-input-field :deep(.v-field--focused .v-field__outline) {
  color: rgba(var(--v-theme-primary), 1) !important;
}

.premium-input-field :deep(.v-field__input) {
  min-height: 44px !important;
  height: 44px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  align-items: center;
  color: #fff !important;
  font-size: 14px;
}

.premium-input-field :deep(.v-label) {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 14px;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.premium-input-field :deep(.v-field--active .v-label) {
  top: 0 !important;
  transform: translateY(-60%) scale(0.75) !important;
}

.premium-input-field :deep(.v-field__append-inner),
.premium-input-field :deep(.v-field__prepend-inner) {
  align-items: center;
  padding-top: 0 !important;
  margin-top: 0 !important;
  height: 44px !important;
  color: rgba(255, 255, 255, 0.5);
}

/* Type Toggle Bar */
.horizontal-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 2px;
  gap: 2px;
  height: 44px;
  width: 100%;
}

.horizontal-toggle-btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
}

.horizontal-toggle-btn.active {
  opacity: 1;
  background: rgba(var(--v-theme-primary), 1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

/* Premium Outlined Cohesive Action Buttons */
.horizontal-search-btn {
  border-radius: 12px !important;
  font-weight: 800 !important;
  text-transform: none !important;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.horizontal-search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--v-theme-primary), 0.5) !important;
}

.horizontal-advanced-btn,
.horizontal-reset-btn {
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px !important;
}

.horizontal-advanced-btn:hover,
.horizontal-advanced-btn.active,
.horizontal-reset-btn:hover {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  color: rgba(var(--v-theme-primary), 1) !important;
}

.horizontal-advanced-btn.active {
  background: rgba(var(--v-theme-primary), 0.15) !important;
}

/* Collapsible Advanced Panel Styles */
.search-advanced-panel {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.advanced-panel-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* Beautiful Rounded Filter Cards (مربعات مخصصة لكل فلتر) */
.filter-card {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 18px;
  padding: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-card:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(var(--v-theme-primary), 0.15);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.filter-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.filter-card-header .filter-icon {
  color: rgba(var(--v-theme-primary), 0.9);
  font-size: 16px;
}

.filter-card-header .filter-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
}

.filter-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Dynamic Column Spanning */
.fuel-type-card {
  grid-column: span 2;
}

/* High Performance Symmetrical Button Grids inside Cards */
.transmission-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 8px;
}

.fuel-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr) !important; /* Perfect 3 columns layout */
  gap: 8px;
}

.drivetrain-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 8px;
}

.fuel-type-btn, .transmission-btn, .drivetrain-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  height: 42px;
}

.fuel-type-btn:hover, .transmission-btn:hover, .drivetrain-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.fuel-type-btn.active, .transmission-btn.active, .drivetrain-btn.active {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.25);
  font-weight: 700;
}

.fuel-icon, .trans-icon {
  font-size: 14px;
}

.trans-title, .fuel-title, .drive-title {
  white-space: nowrap;
}

/* Mobile Sidebar Drawer styling fallback */
.premium-search-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 16px;
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
  height: 42px;
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

/* Responsive Mobile Drawer / Bottom Sheet */
.filter-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.filter-scroll-content {
  display: block;
}

@media (max-width: 959px) {
  .premium-search-box {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    z-index: 1001 !important;
    height: 80vh !important;
    max-height: 80vh !important;
    border-radius: 32px 32px 0 0 !important;
    background: #0f1620 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-bottom: none !important;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6) !important;
    transform: translateY(110%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
    padding: 24px 20px 0 20px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow-y: hidden;
  }

  .premium-search-box.is-open {
    transform: translateY(0) !important;
  }

  .filter-scroll-content {
    flex: 1 !important;
    overflow-y: auto !important;
    padding-bottom: 24px !important;
    scrollbar-width: thin;
  }

  .filter-scroll-content::-webkit-scrollbar {
    width: 4px;
  }

  .filter-scroll-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  .filter-actions {
    flex-shrink: 0 !important;
    background: #0f1620 !important;
    padding: 16px 0 24px 0 !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    margin: 0 -20px !important;
    padding-left: 20px !important;
    padding-right: 20px !important;
    z-index: 10;
  }
}

.mobile-filter-trigger {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99;
}

.mobile-floating-btn {
  font-weight: 800 !important;
  text-transform: none !important;
  font-size: 14px !important;
  letter-spacing: 0.5px !important;
  background: rgba(var(--v-theme-primary), 0.9) !important;
  backdrop-filter: blur(8px) !important;
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.45) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: #fff !important;
}

.mobile-floating-btn:active {
  transform: scale(0.95);
  background: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 12px 36px rgba(var(--v-theme-primary), 0.6) !important;
}

.trans-title, .fuel-title, .drive-title {
  white-space: nowrap;
}

/* filter count badge styling */
.filter-count-badge {
  background: rgba(var(--v-theme-primary), 1);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  border-radius: 9999px;
  padding: 2px 8px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-count-badge--mobile {
  background: #fff;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
