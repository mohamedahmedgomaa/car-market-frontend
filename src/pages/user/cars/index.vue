<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'

import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

// ⚠️ عدّل المسارات حسب APIs الموجودة عندك
import countryUserApi from '@/api/user/countryUserApi.js'
import cityUserApi from '@/api/user/cityUserApi.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'
import featureUserApi from '@/api/user/carFeatureUserApi.js'

definePage({
  meta: { layout: 'front', public: true },
})

const route = useRoute()

// -------------------------
// Helpers
// -------------------------
const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const firstQueryVal = (v) => Array.isArray(v) ? v[0] : v

const toNumOrNull = (v) => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// -------------------------
// ✅ Between helpers (filter[xxx_between]=from.to)
// -------------------------
const parseBetweenFromQuery = (qObj, key) => {
  const v = firstQueryVal(qObj?.[`filter[${key}]`])
  if (!v) return { from: null, to: null }

  // ✅ separator is dot now
  const [a, b] = String(v).split('.')
  const from = (a !== undefined && a !== '') ? Number(a) : null
  const to   = (b !== undefined && b !== '') ? Number(b) : null

  return {
    from: Number.isNaN(from) ? null : from,
    to: Number.isNaN(to) ? null : to,
  }
}

const putBetween = (obj, key, from, to) => {
  const a = (from ?? '') === '' ? '' : from
  const b = (to ?? '') === '' ? '' : to
  if (a !== '' || b !== '') obj[`filter[${key}]`] = `${a}.${b}`
}

// -------------------------
// State
// -------------------------
// ✅ FIX: نخليها تبدأ Loading علشان متظهرش Not Found أول لحظة
const loading = ref(true)
const loadingMore = ref(false)
const initialized = ref(false)

const error = ref('')
const cars = ref([])

const page = ref(1)
const perPage = ref(Number(firstQueryVal(route.query.perPage) || 12))
const sort = ref(String(firstQueryVal(route.query.sort) || ''))
const total = ref(0)

const hasMore = computed(() => cars.value.length < total.value)

// ✅ global search
const q = ref(String(firstQueryVal(route.query['filter[global]']) || ''))

// IDs
const countryId = ref(route.query['filter[country_id]'] ? Number(firstQueryVal(route.query['filter[country_id]'])) : null)
const cityId = ref(route.query['filter[city_id]'] ? Number(firstQueryVal(route.query['filter[city_id]'])) : null)
const brandId = ref(route.query['filter[brand_id]'] ? Number(firstQueryVal(route.query['filter[brand_id]'])) : null)
const modelId = ref(route.query['filter[model_id]'] ? Number(firstQueryVal(route.query['filter[model_id]'])) : null)

// ✅ ranges (from filter[xxx_between])
const y0 = parseBetweenFromQuery(route.query, 'year_between')
const p0 = parseBetweenFromQuery(route.query, 'price_between')
const m0 = parseBetweenFromQuery(route.query, 'mileage_between')

const yearFrom = ref(y0.from)
const yearTo = ref(y0.to)
const priceFrom = ref(p0.from)
const priceTo = ref(p0.to)
const mileageFrom = ref(m0.from)
const mileageTo = ref(m0.to)

// enums
const transmission = ref(route.query['filter[transmission]'] ? String(firstQueryVal(route.query['filter[transmission]'])) : null)
const type = ref(route.query['filter[type]'] ? String(firstQueryVal(route.query['filter[type]'])) : null)
const fuelType = ref(route.query['filter[fuel_type]'] ? String(firstQueryVal(route.query['filter[fuel_type]'])) : null)
const drivetrain = ref(route.query['filter[drivetrain]'] ? String(firstQueryVal(route.query['filter[drivetrain]'])) : null)
const condition = ref(route.query['filter[condition]'] ? String(firstQueryVal(route.query['filter[condition]'])) : null)

// features multi
const featureIds = ref(
  route.query['filter[feature_ids]']
    ? String(firstQueryVal(route.query['filter[feature_ids]'])).split(',').map(n => Number(n)).filter(Boolean)
    : []
)

// ✅ HYBRID inputs (Apply button)
const draft = ref({
  q: q.value,
  yearFrom: yearFrom.value,
  yearTo: yearTo.value,
  priceFrom: priceFrom.value,
  priceTo: priceTo.value,
  mileageFrom: mileageFrom.value,
  mileageTo: mileageTo.value,
})

// -------------------------
// Sort options
// -------------------------
const sortOptions = [
  { title: 'Default', value: '' },
  { title: 'Newest', value: '-created_at' },
  { title: 'Oldest', value: 'created_at' },
  { title: 'Price: High → Low', value: '-price' },
  { title: 'Price: Low → High', value: 'price' },
  { title: 'Most Favorited', value: '-favorites_count' },
]

// -------------------------
// Options (from DB)
// -------------------------
const countries = ref([])
const cities = ref([])
const brands = ref([])
const models = ref([])
const features = ref([])

const transmissionOptions = [
  { title: 'Automatic', value: 'automatic' },
  { title: 'Manual', value: 'manual' },
]

const typeOptions = [
  { title: 'Car', value: 'car' },
  { title: 'Motorcycle', value: 'motorcycle' },
]

const fuelOptions = [
  { title: 'Petrol', value: 'petrol' },
  { title: 'Diesel', value: 'diesel' },
  { title: 'Hybrid (⭐ الأفضل على الإطلاق)', value: 'hybrid' },
  { title: 'Electric', value: 'electric' },
]

const drivetrainOptions = [
  { title: 'FWD', value: 'fwd' },
  { title: 'RWD', value: 'rwd' },
  { title: 'AWD', value: 'awd' },
]

const conditionOptions = [
  { title: 'New', value: 'new' },
  { title: 'Used', value: 'used' },
]

// -------------------------
// Load filter lists
// -------------------------
const safeArray = (res) => {
  const data = res?.data?.data ?? res?.data
  return Array.isArray(data) ? data : []
}

const loadCountries = async () => {
  try { countries.value = safeArray(await countryUserApi.getAll()) } catch {}
}

const loadBrands = async () => {
  try { brands.value = safeArray(await brandUserApi.getAll()) } catch {}
}

const loadFeatures = async () => {
  try { features.value = safeArray(await featureUserApi.getAll()) } catch {}
}

const loadCities = async () => {
  if (!countryId.value) { cities.value = []; cityId.value = null; return }
  try {
    cities.value = safeArray(await cityUserApi.getAll({ 'filter[country_id]': countryId.value }))
  } catch {
    cities.value = []
  }
}

const loadModels = async () => {
  if (!brandId.value) { models.value = []; modelId.value = null; return }
  try {
    models.value = safeArray(await modelUserApi.getAll({ 'filter[brand_id]': brandId.value }))
  } catch {
    models.value = []
  }
}

// -------------------------
// ✅ Favorites normalize (like CarsSection)
// -------------------------
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
  const isAuthed = !!token

  const favArr = Array.isArray(car?.favorites) ? car.favorites : []

  const favorites_count =
    (car?.favorites_count !== undefined && car?.favorites_count !== null)
      ? Number(car.favorites_count)
      : favArr.length

  let is_favorited = false

  if (!isAuthed) {
    is_favorited = false
  } else if (car?.is_favorited !== undefined && car?.is_favorited !== null) {
    is_favorited = !!car.is_favorited
  } else if (userId && favArr.length) {
    is_favorited = favArr.some(f => {
      const id = Number(f?.id) || Number(f?.user_id) || Number(f?.pivot?.user_id)
      return id === userId
    })
  }

  return { ...car, favorites_count, is_favorited }
}

// -------------------------
// Fetch cars
// -------------------------
const normalizeCars = (payload) => {
  const items =
    (payload?.data && Array.isArray(payload.data)) ? payload.data :
      (payload?.data?.data && Array.isArray(payload.data.data)) ? payload.data.data :
        (Array.isArray(payload)) ? payload :
          []

  const tt = Number(payload?.meta?.total ?? payload?.data?.meta?.total ?? items.length)
  return { items, total: tt }
}

const buildParams = () => {
  const params = {
    page: page.value,
    perPage: perPage.value,
    'filter[status]': 'approved',
  }

  if (q.value?.trim()) params['filter[global]'] = q.value.trim()
  if (sort.value) params.sort = sort.value

  if (countryId.value) params['filter[country_id]'] = countryId.value
  if (cityId.value) params['filter[city_id]'] = cityId.value
  if (brandId.value) params['filter[brand_id]'] = brandId.value
  if (modelId.value) params['filter[model_id]'] = modelId.value

  putBetween(params, 'year_between', yearFrom.value, yearTo.value)
  putBetween(params, 'price_between', priceFrom.value, priceTo.value)
  putBetween(params, 'mileage_between', mileageFrom.value, mileageTo.value)

  if (transmission.value) params['filter[transmission]'] = transmission.value
  if (type.value) params['filter[type]'] = type.value
  if (fuelType.value) params['filter[fuel_type]'] = fuelType.value
  if (drivetrain.value) params['filter[drivetrain]'] = drivetrain.value
  if (condition.value) params['filter[condition]'] = condition.value
  if (featureIds.value?.length) params['filter[feature_ids]'] = featureIds.value.join(',')

  return params
}

const fetchCars = async () => {
  loading.value = true
  error.value = ''

  // ✅ reset page + items
  page.value = 1
  cars.value = []

  try {
    const res = await carsUserApi.getAll(buildParams())
    const { items, total: tt } = normalizeCars(res.data)

    cars.value = items.map(normalizeFavFields)
    total.value = tt
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load cars'
    cars.value = []
    total.value = 0
  } finally {
    loading.value = false
    initialized.value = true
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  page.value += 1

  try {
    const res = await carsUserApi.getAll(buildParams())
    const { items } = normalizeCars(res.data)

    cars.value.push(...items.map(normalizeFavFields))
  } catch (e) {
    console.error(e)
  } finally {
    loadingMore.value = false
  }
}

// -------------------------
// Hybrid actions
// -------------------------
const applyFilters = () => {
  q.value = String(draft.value.q || '').trim()
  yearFrom.value = toNumOrNull(draft.value.yearFrom)
  yearTo.value = toNumOrNull(draft.value.yearTo)
  priceFrom.value = toNumOrNull(draft.value.priceFrom)
  priceTo.value = toNumOrNull(draft.value.priceTo)
  mileageFrom.value = toNumOrNull(draft.value.mileageFrom)
  mileageTo.value = toNumOrNull(draft.value.mileageTo)

  fetchCars()
}

const resetFilters = () => {
  draft.value = {
    q: '',
    yearFrom: null,
    yearTo: null,
    priceFrom: null,
    priceTo: null,
    mileageFrom: null,
    mileageTo: null,
  }

  q.value = ''
  countryId.value = null
  cityId.value = null
  brandId.value = null
  modelId.value = null
  yearFrom.value = null
  yearTo.value = null
  priceFrom.value = null
  priceTo.value = null
  mileageFrom.value = null
  mileageTo.value = null
  transmission.value = null
  type.value = null
  fuelType.value = null
  drivetrain.value = null
  condition.value = null
  sort.value = ''
  featureIds.value = []
  perPage.value = 12

  fetchCars()
}

// -------------------------
// Auto apply selects only (debounced)
// -------------------------
let syncTimer = null
const debouncedFetch = () => {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    fetchCars()
  }, 250)
}

watch(countryId, async () => {
  await loadCities()
  debouncedFetch()
})

watch(brandId, async () => {
  await loadModels()
  debouncedFetch()
})

watch(
  [cityId, modelId, transmission, type, fuelType, drivetrain, condition, featureIds, perPage, sort],
  () => debouncedFetch(),
  { deep: true }
)

// init
onMounted(async () => {
  await Promise.all([loadCountries(), loadBrands(), loadFeatures()])
  await Promise.all([loadCities(), loadModels()])
  fetchCars()
})
</script>

<template>
  <section class="cars-page">
    <VContainer>
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h2 class="text-h5 mb-1">Cars</h2>
          <div class="text-body-2" style="opacity: .75">
            Approved listings only
          </div>
        </div>

        <VBtn variant="tonal" @click="resetFilters">
          Reset
        </VBtn>
      </div>

      <VRow>
        <!-- Filters -->
        <VCol cols="12" md="4" lg="3">
          <VCard class="pa-4" rounded="lg">
            <div class="text-subtitle-1 font-weight-bold mb-3">Filters</div>

            <VSelect
              v-model="sort"
              :items="sortOptions"
              item-title="title"
              item-value="value"
              label="Sort"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-4"
            />

            <!-- Manual Apply -->
            <div class="filter-section">
              <div class="filter-section__title">
                Manual Filters (Apply Button)
              </div>

              <VTextField
                v-model="draft.q"
                label="Search"
                prepend-inner-icon="tabler-search"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
                @keyup.enter="applyFilters"
              />

              <VRow class="mb-3" dense>
                <VCol cols="6">
                  <VTextField
                    v-model="draft.yearFrom"
                    type="number"
                    label="Year from"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @keyup.enter="applyFilters"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model="draft.yearTo"
                    type="number"
                    label="Year to"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @keyup.enter="applyFilters"
                  />
                </VCol>
              </VRow>

              <VRow class="mb-3" dense>
                <VCol cols="6">
                  <VTextField
                    v-model="draft.priceFrom"
                    type="number"
                    label="Price from"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @keyup.enter="applyFilters"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model="draft.priceTo"
                    type="number"
                    label="Price to"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @keyup.enter="applyFilters"
                  />
                </VCol>
              </VRow>

              <VRow dense>
                <VCol cols="6">
                  <VTextField
                    v-model="draft.mileageFrom"
                    type="number"
                    label="Mileage from"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @keyup.enter="applyFilters"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model="draft.mileageTo"
                    type="number"
                    label="Mileage to"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @keyup.enter="applyFilters"
                  />
                </VCol>
              </VRow>

              <VBtn color="primary" block class="mt-4" @click="applyFilters">
                Apply Manual Filters
              </VBtn>
            </div>

            <VDivider class="my-5" />

            <!-- Auto Apply -->
            <div class="filter-section">
              <div class="filter-section__title">
                Auto Filters (Instant)
              </div>

              <VSelect
                v-model="type"
                :items="typeOptions"
                label="Type"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
                clearable
              />

              <VSelect
                v-model="countryId"
                :items="countries"
                item-value="id"
                label="Country"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>

              <VSelect
                v-model="cityId"
                :items="cities"
                item-value="id"
                :disabled="!countryId"
                label="City"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>

              <VSelect
                v-model="brandId"
                :items="brands"
                item-value="id"
                label="Brand"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>

              <VSelect
                v-model="modelId"
                :items="models"
                item-value="id"
                :disabled="!brandId"
                label="Model"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>

              <VSelect
                v-model="transmission"
                :items="transmissionOptions"
                label="Transmission"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
                clearable
              />

              <VSelect
                v-model="fuelType"
                :items="fuelOptions"
                label="Fuel type"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
                clearable
              />

              <VSelect
                v-model="drivetrain"
                :items="drivetrainOptions"
                label="Drivetrain"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
                clearable
              />

              <VSelect
                v-model="condition"
                :items="conditionOptions"
                label="Condition"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
                clearable
              />

              <VSelect
                v-model="featureIds"
                :items="features"
                item-value="id"
                label="Features"
                variant="outlined"
                density="comfortable"
                hide-details
                multiple
                chips
                clearable
                class="mb-3"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VSelect>

              <VSelect
                v-model="perPage"
                :items="[12, 24, 36]"
                label="Per page"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
          </VCard>
        </VCol>

        <!-- Results -->
        <VCol cols="12" md="8" lg="9">
          <VCard class="pa-4" rounded="lg">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-1 font-weight-bold">Results</div>
              <div class="text-body-2" style="opacity: .75">
                {{ cars.length }} shown
              </div>
            </div>

            <!-- ✅ IMPORTANT:
                 - CarsSection هيعرض Loading لما loading=true
                 - لو cars فاضية قبل أول fetch، مش هتشوف Not found لأن loading يبدأ true
            -->
            <CarsSection
              embedded
              :showViewAll="false"
              title=""
              subtitle=""
              :cars="cars"
              :loading="loading"
              :error="error"
            />

            <!-- ✅ لو خلص أول تحميل ومفيش نتائج -->
            <div
              v-if="initialized && !loading && !error && cars.length === 0"
              class="text-center mt-6"
              style="opacity:.75"
            >
              No cars found.
            </div>

            <!-- ✅ Load More -->
            <div class="d-flex justify-center mt-6" v-if="hasMore && !loading">
              <VBtn
                variant="tonal"
                :loading="loadingMore"
                @click="loadMore"
              >
                Load more
              </VBtn>
            </div>

            <div class="text-center mt-4" v-else-if="initialized && !loading && cars.length">
              No more results.
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style scoped>
.cars-page { padding: 32px 0; }

.filter-section{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 14px;
  padding: 14px;
}
.filter-section__title{
  font-weight: 900;
  font-size: 13px;
  opacity: .85;
  margin-bottom: 12px;
}
</style>
