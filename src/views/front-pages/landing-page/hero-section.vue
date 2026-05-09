<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import api from '@/api/index.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'

const theme = useTheme()
const router = useRouter()

/* =========================
   ✅ Refs for Auto-Navigation
========================= */
const modelSelect = ref(null)
const isModelMenuOpen = ref(false)

const yearFromSelect = ref(null)
const yearToSelect = ref(null)
const isYearToMenuOpen = ref(false)

/* =========================
   ✅ Helpers
========================= */
const isNumberKey = (evt) => {
  const charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode < 1632 || charCode > 1641)) {
    evt.preventDefault()
  }
}

const toNumOrNull = (v, limit = 11) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  raw = raw.replace(/\D/g, '').slice(0, limit)
  let n = Number(raw)
  return Number.isNaN(n) || raw === '' ? null : n
}

const formatWithCommas = (v) => {
  if (!v && v !== 0) return ''
  const s = String(v).replace(/\D/g, '')
  if (!s) return ''
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const displayPriceFrom = computed({
  get: () => formatWithCommas(filters.value.priceFrom),
  set: (v) => {
    filters.value.priceFrom = toNumOrNull(v)
  },
})

const displayPriceTo = computed({
  get: () => formatWithCommas(filters.value.priceTo),
  set: (v) => {
    filters.value.priceTo = toNumOrNull(v)
  },
})

const putBetween = (obj, key, from, to) => {
  const a = (from ?? '') === '' ? '' : from
  const b = (to ?? '') === '' ? '' : to
  if (a !== '' || b !== '') obj[`filter[${key}]`] = `${a}.${b}`
}

/* =========================
   ✅ Filters
========================= */
const filters = ref({
  type: 'car',
  condition: '',
  brandId: null,
  modelId: null,
  priceFrom: null,
  priceTo: null,
  yearFrom: null,
  yearTo: null,
})

const buildQuery = () => {
  const q = {}
  q['filter[status]'] = 'approved'
  if (filters.value.type) q['filter[type]'] = filters.value.type
  if (filters.value.condition) q['filter[condition]'] = filters.value.condition
  if (filters.value.brandId) q['filter[brand_id]'] = filters.value.brandId
  if (filters.value.modelId) q['filter[model_id]'] = filters.value.modelId

  const pf = toNumOrNull(filters.value.priceFrom)
  const pt = toNumOrNull(filters.value.priceTo)
  putBetween(q, 'price_between', pf, pt)

  const yf = toNumOrNull(filters.value.yearFrom)
  const yt = toNumOrNull(filters.value.yearTo)
  putBetween(q, 'year_between', yf, yt)

  return q
}

const onSearch = () => {
  router.push({
    path: '/user/cars',
    query: buildQuery(),
  })
}

const resetFilters = () => {
  filters.value = {
    type: 'car',
    condition: '',
    brandId: null,
    modelId: null,
    priceFrom: null,
    priceTo: null,
    yearFrom: null,
    yearTo: null,
  }
}

/* =========================
   ✅ Data Fetching
========================= */
const brandsList = ref([])
const modelsList = ref([])
const yearsList = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i)
const yearsToList = computed(() => {
  if (!filters.value.yearFrom) return yearsList
  return yearsList.filter(y => y >= filters.value.yearFrom || y <= filters.value.yearFrom).sort((a,b) => b - a)
})

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const fetchBrands = async () => {
  try {
    const res = await brandUserApi.getAll()
    const data = res.data?.data || res.data || []
    brandsList.value = data.map((b) => ({ id: b.id, name: t(b.name) }))
  } catch (err) {
    console.error('Error fetching brands:', err)
  }
}

const fetchModels = async (brandId) => {
  if (!brandId) {
    modelsList.value = []
    return
  }
  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': brandId })
    const data = res.data?.data || res.data || []
    modelsList.value = data.map((m) => ({ id: m.id, name: t(m.name) }))
  } catch (err) {
    console.error('Error fetching models:', err)
  }
}

watch(() => filters.value.brandId, (val) => {
  filters.value.modelId = null
  if (val) {
    fetchModels(val).then(() => {
      nextTick(() => {
        if (modelSelect.value) {
          modelSelect.value.focus()
          isModelMenuOpen.value = true
        }
      })
    })
  }
})

watch(() => filters.value.yearFrom, (val) => {
  if (val) {
    nextTick(() => {
      if (yearToSelect.value) {
        yearToSelect.value.focus()
        isYearToMenuOpen.value = true
      }
    })
  }
})

/* =========================
   ✅ Background Slider (Ad Space)
========================= */
const slides = ref([])
const slideIndex = ref(0)
const slideDelayMs = 5000
let timer = null

const fetchBanners = async () => {
  try {
    const res = await api.get('/user/banners')
    if (res.data && res.data.data && res.data.data.length > 0) {
      slides.value = res.data.data.slice(0, 3).map((b) => ({
        image: b.image_path,
        link: b.link || '#',
      }))
    }
  } catch (err) {
    console.error('Error fetching banners:', err)
  }
}

const nextSlide = () => {
  const len = slides.value.length || 1
  slideIndex.value = (slideIndex.value + 1) % len
}

onMounted(() => {
  fetchBanners()
  fetchBrands()
  timer = window.setInterval(nextSlide, slideDelayMs)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <section id="home" class="hero" :class="theme.current.value.dark ? 'hero--dark' : 'hero--light'">
    <VContainer class="hero__container">
      <!-- Main Content Grid -->
      <div class="hero-main-grid">
        <!-- Left: Search Card -->
        <div class="hero-search-area">
          <VCard class="premium-search-card" elevation="10">
            <!-- Chip moved inside card -->
            <div class="card-intro mb-4">
               <VChip
                label
                color="primary"
                class="font-weight-bold mb-4"
                size="small"
                variant="flat"
              >
                Welcome to NegmCars
              </VChip>
            </div>

            <div class="card-header mb-8">
              <h1 class="text-h4 font-weight-black mb-1">
                Discover Your <span class="text-primary">Perfect Car</span>
              </h1>
              <p class="text-h6 opacity-70 font-weight-medium">at the Best Prices in Egypt</p>
            </div>

            <div class="search-form-grid">
              <!-- Type Toggle -->
              <div class="form-group">
                <label class="group-label">Vehicle Type</label>
                <div class="premium-toggle-group">
                  <button
                    v-for="t in ['car', 'motorcycle']"
                    :key="t"
                    class="toggle-btn"
                    :class="{ active: filters.type === t }"
                    @click="filters.type = t"
                  >
                    {{ t === 'car' ? 'Cars' : 'Bikes' }}
                  </button>
                </div>
              </div>

              <!-- Condition Toggle -->
              <div class="form-group">
                <label class="group-label">Condition</label>
                <div class="premium-toggle-group">
                  <button
                    v-for="c in ['', 'used', 'new']"
                    :key="c"
                    class="toggle-btn toggle-btn--small"
                    :class="{ active: filters.condition === c }"
                    @click="filters.condition = c"
                  >
                    {{ c === '' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1) }}
                  </button>
                </div>
              </div>

              <!-- Brand & Model -->
              <div class="form-group">
                <VSelect
                  v-model="filters.brandId"
                  :items="brandsList"
                  item-title="name"
                  item-value="id"
                  label="Select Brand"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="premium-input"
                />
              </div>

              <div class="form-group">
                <VSelect
                  ref="modelSelect"
                  v-model="filters.modelId"
                  v-model:menu="isModelMenuOpen"
                  :items="modelsList"
                  item-title="name"
                  item-value="id"
                  label="Select Model"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  :disabled="!filters.brandId"
                  class="premium-input"
                />
              </div>

              <!-- Price Range -->
              <div class="form-group">
                <VTextField
                  v-model="displayPriceFrom"
                  label="Min Price"
                  prefix="EG"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="premium-input no-spin"
                  inputmode="numeric"
                  @keypress="isNumberKey"
                  maxlength="11"
                />
              </div>

              <div class="form-group">
                <VTextField
                  v-model="displayPriceTo"
                  label="Max Price"
                  prefix="EG"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="premium-input no-spin"
                  inputmode="numeric"
                  @keypress="isNumberKey"
                  maxlength="11"
                />
              </div>

              <!-- Year Range -->
              <div class="form-group">
                <VSelect
                  ref="yearFromSelect"
                  v-model="filters.yearFrom"
                  :items="yearsList"
                  label="From Year"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="premium-input"
                />
              </div>

              <div class="form-group">
                <VSelect
                  ref="yearToSelect"
                  v-model="filters.yearTo"
                  v-model:menu="isYearToMenuOpen"
                  :items="yearsToList"
                  label="To Year"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="premium-input"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="search-actions mt-10">
              <VBtn
                color="primary"
                height="64"
                block
                class="search-btn mb-4"
                @click="onSearch"
                prepend-icon="tabler-search"
                elevation="8"
              >
                Search
              </VBtn>
              <div class="d-flex gap-4">
                <VBtn variant="tonal" class="flex-grow-1" @click="resetFilters" height="48" prepend-icon="tabler-rotate">
                  Reset
                </VBtn>
                <VBtn variant="tonal" color="warning" class="flex-grow-1" to="/user/sell" height="48" prepend-icon="tabler-circle-plus">
                  Sell
                </VBtn>
              </div>
            </div>
          </VCard>
        </div>

        <!-- Right: Ad Area -->
        <div class="hero-ad-area">
          <VCard class="premium-ad-card" elevation="10">
            <div class="ad-label">SPONSORED</div>
            <div class="ad-carousel-wrapper">
              <Transition name="fade" mode="out-in">
                <div
                  v-if="slides.length > 0"
                  :key="slideIndex"
                  class="ad-slide"
                  :style="{ backgroundImage: `url(${slides[slideIndex].image})` }"
                >
                  <div class="ad-overlay" />
                  <div class="ad-content p-8">
                    <h4 class="text-h3 font-weight-black mb-4 text-white">Featured Offer</h4>
                    <p class="text-h6 opacity-90 text-white mb-8">Drive your business forward with premium ad placements.</p>
                    <VBtn color="primary" size="large" class="px-10">Explore Now</VBtn>
                  </div>
                </div>
                <div v-else class="placeholder-ad d-flex flex-column align-center justify-center text-center pa-12 h-100">
                  <VIcon icon="tabler-photo-spark" size="120" color="primary" class="opacity-10 mb-6" />
                  <h4 class="text-h4 font-weight-bold mb-4">Ad Space Available</h4>
                  <p class="text-h6 opacity-50 max-w-400">Reach thousands of active car buyers and sellers in Egypt every day.</p>
                  <VBtn variant="outlined" color="primary" size="large" class="mt-10" to="/user/sell">Contact Us</VBtn>
                </div>
              </Transition>
            </div>
          </VCard>
        </div>
      </div>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  padding-block: 40px;
  min-height: 85vh;
  display: flex;
  align-items: center;
}

.hero--dark {
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.1), transparent 50%), #1a1d2e;
}

/* Main Grid */
.hero-main-grid {
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 40px;
  align-items: stretch;
}

/* Search Card */
.premium-search-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 40px !important;
  padding: 40px;
  height: 100%;
}

.search-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.4;
  margin-left: 4px;
}

.premium-toggle-group {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 4px;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.toggle-btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}

.toggle-btn.active {
  background: rgba(var(--v-theme-primary), 1);
  opacity: 1;
  box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.5);
  color: #fff;
}

.toggle-btn--small {
  height: 40px;
  font-size: 12px;
}

.premium-input :deep(.v-field) {
  border-radius: 18px !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.premium-input :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 1) !important;
  background: rgba(255, 255, 255, 0.06) !important;
  box-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.2);
}

.search-btn {
  border-radius: 20px !important;
  font-weight: 950 !important;
  text-transform: none !important;
  font-size: 20px !important;
  letter-spacing: 1px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px -5px rgba(var(--v-theme-primary), 0.6) !important;
  }
}

/* Ad Area */
.premium-ad-card {
  height: 100%;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 40px !important;
  position: relative;
  overflow: hidden;
}

.ad-label {
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(var(--v-theme-primary), 0.9);
  color: white;
  padding: 8px 18px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.ad-carousel-wrapper {
  height: 100%;
}

.ad-slide {
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.ad-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
}

.ad-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 60px !important;
}

/* Hide number input spinners */
:deep(.no-spin input::-webkit-outer-spin-button),
:deep(.no-spin input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
:deep(.no-spin input[type='number']) {
  -moz-appearance: textfield;
}

@media (max-width: 1200px) {
  .hero-main-grid {
    grid-template-columns: 1fr;
  }
  .premium-ad-card {
    min-height: 400px;
  }
}

@media (max-width: 600px) {
  .search-form-grid {
    grid-template-columns: 1fr;
  }
  .premium-search-card {
    padding: 24px;
  }
  .ad-content {
    padding: 30px !important;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
