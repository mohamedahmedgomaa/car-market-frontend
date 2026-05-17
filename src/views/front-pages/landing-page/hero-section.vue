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

const yearToSelect = ref(null)
const isYearToMenuOpen = ref(false)

const priceToInput = ref(null)
const kmMinInput = ref(null)
const kmMaxInput = ref(null)

/* =========================
   ✅ Helpers
========================= */
const isNumberKey = (evt) => {
  const charCode = evt.which ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode < 1632 || charCode > 1641)) {
    evt.preventDefault()
  }
}

const toNumOrNull = (v, limit = 11) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d))
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

const displayKmMin = computed({
  get: () => formatWithCommas(filters.value.kmMin),
  set: (v) => {
    filters.value.kmMin = toNumOrNull(v, 6)
  },
})

const displayKmMax = computed({
  get: () => formatWithCommas(filters.value.kmMax),
  set: (v) => {
    filters.value.kmMax = toNumOrNull(v, 6)
  },
})

const focusNext = (refTarget) => {
  if (refTarget && refTarget.value) {
    refTarget.value.focus()
  }
}

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
  kmMin: null,
  kmMax: null,
})

const buildQuery = () => {
  const q = {}
  q['filter[status]'] = 'approved'
  if (filters.value.type) q['filter[type]'] = filters.value.type
  if (filters.value.condition) q['filter[condition]'] = filters.value.condition
  if (filters.value.brandId) q['filter[brand_id]'] = filters.value.brandId
  if (filters.value.modelId) q['filter[model_id]'] = filters.value.modelId

  putBetween(q, 'km_between', filters.value.kmMin, filters.value.kmMax)

  const pf = toNumOrNull(filters.value.priceFrom)
  const pt = toNumOrNull(filters.value.priceTo)
  putBetween(q, 'price_between', pf, pt)

  const yf = toNumOrNull(filters.value.yearFrom)
  const yt = toNumOrNull(filters.value.yearTo)
  putBetween(q, 'year_between', yf, yt)

  return q
}

// ✅ Search Ad by ID
const searchId = ref('')

const handleIdInput = (val) => {
  if (!val) {
    searchId.value = ''
    return
  }
  let cleaned = String(val)
  cleaned = cleaned.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  cleaned = cleaned.replace(/[^0-9#]/g, '')
  if (cleaned.includes('#')) {
    cleaned = '#' + cleaned.replace(/#/g, '')
  }
  
  const hasHash = cleaned.startsWith('#')
  const maxLength = hasHash ? 8 : 7
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
  }

  if (searchId.value !== cleaned) {
    searchId.value = cleaned
  }
}

const goSearchId = async () => {
  const numericId = searchId.value.replace(/[^0-9]/g, '')
  if (!numericId) return

  await router.push(`/user/cars/${numericId}`)
  searchId.value = ''
}

const onSearch = () => {
  router.push({
    path: '/user/cars',
    query: buildQuery(),
  })
}

const resetFilters = () => {
  searchId.value = ''
  filters.value = {
    type: 'car',
    condition: '',
    brandId: null,
    modelId: null,
    priceFrom: null,
    priceTo: null,
    yearFrom: null,
    yearTo: null,
    kmMin: null,
    kmMax: null,
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
  return yearsList
    .filter((y) => y >= filters.value.yearFrom)
    .sort((a, b) => b - a)
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

watch(
  () => filters.value.brandId,
  (val) => {
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
  },
)

watch(
  () => filters.value.yearFrom,
  (val) => {
    if (val) {
      nextTick(() => {
        if (yearToSelect.value) {
          yearToSelect.value.focus()
          isYearToMenuOpen.value = true
        }
      })
    }
  },
)

watch(
  () => filters.value.yearTo,
  (val) => {
    if (val) {
      nextTick(() => {
        if (kmMinInput.value) {
          kmMinInput.value.focus()
        }
      })
    }
  },
)

/* =========================
   ✅ Background Slider (Ad Space)
========================= */
const slides = ref([])
const slideIndex = ref(0)
const slideDelayMs = 5000
const showAdPhone = ref(false)
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
        <div class="hero-search-area animate-fade-in-up">
          <VCard class="premium-search-card" elevation="10" style="animation-delay: 0.1s">
            <!-- Top Chip & Reset -->
            <div class="d-flex align-center justify-space-between mb-4">
              <VChip label color="primary" class="font-weight-bold" size="x-small" variant="flat">
                Welcome to NegmCars
              </VChip>

              <VBtn
                variant="tonal"
                color="primary"
                size="small"
                class="reset-btn-v2"
                @click="resetFilters"
                icon="tabler-rotate"
              />
            </div>

            <!-- ✅ Search by ID -->
            <div class="mb-5">
              <VTextField
                v-model="searchId"
                placeholder="Search by ID"
                density="compact"
                variant="outlined"
                hide-details
                maxlength="8"
                prepend-inner-icon="tabler-hash"
                append-inner-icon="tabler-search"
                @click:append-inner="goSearchId"
                @keydown.enter="goSearchId"
                @update:model-value="handleIdInput"
                class="premium-id-input"
              />
            </div>

            <!-- Header Row with Title and Reset -->

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
                  density="compact"
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
                  density="compact"
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
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="premium-input no-spin"
                  inputmode="numeric"
                  @keypress="isNumberKey"
                  @keyup.enter="focusNext(priceToInput)"
                  maxlength="11"
                />
              </div>

              <div class="form-group">
                <VTextField
                  ref="priceToInput"
                  v-model="displayPriceTo"
                  label="Max Price"
                  prefix="EG"
                  density="compact"
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
                  v-model="filters.yearFrom"
                  :items="yearsList"
                  label="From Year"
                  density="compact"
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
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="premium-input"
                />
              </div>

              <!-- Kilometers Range -->
              <div class="form-group">
                <VTextField
                  ref="kmMinInput"
                  v-model="displayKmMin"
                  label="Min KM"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="premium-input no-spin"
                  inputmode="numeric"
                  @keypress="isNumberKey"
                  @keyup.enter="focusNext(kmMaxInput)"
                  maxlength="7"
                />
              </div>
              <div class="form-group">
                <VTextField
                  ref="kmMaxInput"
                  v-model="displayKmMax"
                  label="Max KM"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="premium-input no-spin"
                  inputmode="numeric"
                  @keypress="isNumberKey"
                  @keyup.enter="onSearch"
                  maxlength="7"
                />
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="search-actions-row mt-6 d-flex gap-3">
              <VBtn
                color="primary"
                height="48"
                class="search-main-btn flex-grow-1"
                @click="onSearch"
                prepend-icon="tabler-search"
                elevation="4"
              >
                Search
              </VBtn>
              <VBtn
                variant="tonal"
                color="warning"
                class="sell-side-btn"
                width="100"
                height="48"
                @click="showAdPhone = true"
                prepend-icon="tabler-circle-plus"
              >
                Sell
              </VBtn>
            </div>
          </VCard>
        </div>

        <!-- Right: Ad Area -->
        <div class="hero-ad-area animate-fade-in-up" style="animation-delay: 0.3s">
          <VCard class="premium-ad-card animate-float" elevation="10">
            <div class="ad-label">AD</div>
            <div class="ad-carousel-wrapper">
              <Transition name="fade" mode="out-in">
                <div v-if="slides.length > 0" :key="slideIndex" class="ad-slide">
                  <div
                    class="ad-image"
                    :style="{ backgroundImage: `url(${slides[slideIndex].image})` }"
                  />
                </div>
                <div
                  v-else
                  class="placeholder-ad d-flex flex-column align-center justify-center text-center pa-8 h-100"
                >
                  <VIcon
                    icon="tabler-photo-spark"
                    size="80"
                    color="primary"
                    class="opacity-10 mb-4"
                  />
                  <h4 class="text-h5 font-weight-bold mb-2">Ad Space</h4>
                  <p class="text-body-2 opacity-50 max-w-400">أضف إعلانك هنا ليصل لآلاف المهتمين</p>
                  <Transition name="fade" mode="out-in">
                    <div v-if="showAdPhone" class="phone-display-box mt-6">
                      <VIcon icon="tabler-phone-call" size="20" class="me-2 text-primary" />
                      <span class="text-h6 font-weight-black">01551552993</span>
                    </div>
                    <VBtn
                      v-else
                      variant="outlined"
                      color="primary"
                      size="small"
                      class="mt-6 contact-btn-pulse"
                      @click="showAdPhone = true"
                    >
                      Contact Us
                    </VBtn>
                  </Transition>
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
  padding-block: 20px;
  min-height: auto;
  display: flex;
  align-items: center;
}

.hero--dark {
  background: transparent;
}

/* Main Grid */
.hero-main-grid {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 30px;
  align-items: stretch;
}

/* Search Card */
.premium-search-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px !important;
  padding: 24px;
  height: 100%;
}

.premium-id-input :deep(.v-field) {
  border-radius: 9999px !important;
  background: rgba(var(--v-theme-primary), 0.08) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.3) !important;
  height: 36px !important;
  transition: all 0.3s ease;
}

.premium-id-input :deep(.v-field__input) {
  font-size: 0.88rem !important;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: rgb(var(--v-theme-primary)) !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 36px !important;
}

.premium-id-input :deep(.v-field--focused) {
  background: rgba(var(--v-theme-primary), 0.15) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 20px rgba(var(--v-theme-primary), 0.3);
}

.premium-id-input :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.8;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

.search-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-left: 4px;
  color: rgba(255, 255, 255, 0.6);
}

.premium-toggle-group {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 3px;
  gap: 3px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.toggle-btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 9px;
  height: 38px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}

.toggle-btn.active {
  background: rgba(var(--v-theme-primary), 1);
  opacity: 1;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.4);
  color: #fff;
}

.toggle-btn--small {
  height: 32px;
  font-size: 11px;
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  height: 40px !important;
}

.premium-input :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 40px !important;
}

.premium-input :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 1) !important;
  background: rgba(255, 255, 255, 0.06) !important;
  box-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.2);
}

.search-main-btn {
  border-radius: 16px !important;
  font-weight: 900 !important;
  text-transform: none !important;
  font-size: 18px !important;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 1), #ff5722) !important;
  transition: all 0.3s ease !important;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.5) !important;
  }
}

.sell-side-btn {
  border-radius: 16px !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.reset-btn-v2 {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  border-radius: 12px !important;
  background: rgba(var(--v-theme-primary), 0.1) !important;
  transition: all 0.3s ease;
  &:hover {
    background: rgba(var(--v-theme-primary), 1) !important;
    color: white !important;
    transform: rotate(180deg);
  }
}

/* Ad Area */
.premium-ad-card {
  height: 100%;
  min-height: 460px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 32px !important;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phone-display-box {
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  padding: 12px 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 20px rgba(var(--v-theme-primary), 0.1);
}

.contact-btn-pulse {
  animation: pulse-border 2s infinite;
  border-radius: 12px !important;
}

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
  }
}

.ad-label {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(var(--v-theme-primary), 0.9);
  color: white;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  z-index: 10;
}

.ad-carousel-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
}

.ad-slide {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.ad-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.ad-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.2) 60%,
    transparent 100%
  );
  z-index: 2;
}

.ad-content {
  position: relative;
  z-index: 3;
  padding: 32px !important;
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
  .hero__container {
    padding-inline: 16px;
  }
  .hero-main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .search-form-grid {
    grid-template-columns: 1fr;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
