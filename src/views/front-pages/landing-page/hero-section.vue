<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import api from '@/api/index.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'

// صور السلايدر الافتراضية في حالة عدم وجود إعلانات
// صور السلايدر الافتراضية تم إلغاؤها بناءً على طلب المستخدم
// import slide1 from '@images/front-pages/carbase2.png'
const slide1 = null

const theme = useTheme()
const router = useRouter()

/* =========================
   ✅ Helpers (Like Cars page)
========================= */
const isNumberKey = (evt) => {
  const charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode < 1632 || charCode > 1641)) {
    evt.preventDefault()
  }
}

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

// ✅ Between helper: filter[key]=from.to   (dot separator)
const putBetween = (obj, key, from, to) => {
  const a = (from ?? '') === '' ? '' : from
  const b = (to ?? '') === '' ? '' : to
  if (a !== '' || b !== '') obj[`filter[${key}]`] = `${a}.${b}`
}

/* =========================
   ✅ Filters (Hero Form)
========================= */
const filters = ref({
  type: 'car', // car | motorcycle
  condition: '', // '' (All) | used | new
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

  // ✅ IMPORTANT: match /user/cars page format (between scopes)
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

/* =========================
   ✅ Static Data (Brands/Models)
========================= */
const brandsList = ref([])
const modelsList = ref([])

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const fetchBrands = async () => {
  try {
    const res = await brandUserApi.getAll()
    const data = res.data?.data || res.data || []
    brandsList.value = data.map((b) => ({
      id: b.id,
      name: t(b.name),
    }))
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
    modelsList.value = data.map((m) => ({
      id: m.id,
      name: t(m.name),
    }))
  } catch (err) {
    console.error('Error fetching models:', err)
  }
}

const yearsList = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2026 - i)

const yearsToList = computed(() => {
  if (!filters.value.yearFrom) return yearsList
  return yearsList.filter((y) => y >= filters.value.yearFrom)
})

// ✅ Watch brand to clear model & auto-open
const modelSelect = ref(null)
const isModelMenuOpen = ref(false)

watch(
  () => filters.value.brandId,
  (val) => {
    filters.value.modelId = null
    fetchModels(val)
    if (val) {
      nextTick(() => {
        isModelMenuOpen.value = true
      })
    }
  },
)

// ✅ Watch Year From to auto-open Year To & validate
const isYearToMenuOpen = ref(false)

watch(
  () => filters.value.yearFrom,
  (val) => {
    if (val && filters.value.yearTo && filters.value.yearTo < val) {
      filters.value.yearTo = null
    }
    if (val) {
      nextTick(() => {
        isYearToMenuOpen.value = true
      })
    }
  },
)

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
   ✅ Background Slider
========================= */
const slides = ref([])

const slideIndex = ref(0)
const slideDelayMs = 5000
let timer = null

const fetchBanners = async () => {
  try {
    const res = await api.get('/user/banners')
    if (res.data && res.data.data && res.data.data.length > 0) {
      // Limit to 3 banners only
      slides.value = res.data.data.slice(0, 3).map((b) => ({
        light: b.image_path,
        dark: b.image_path,
      }))
    }
  } catch (err) {
    console.error('Error fetching banners:', err)
  }
}

const currentSlideSrc = computed(() => {
  const s = slides.value[slideIndex.value]
  return s ? (theme.current.value.dark ? s.dark : s.light) : null
})

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

watch(
  () => theme.current.value.dark,
  () => {},
)
</script>

<template>
  <section
    id="home"
    class="hero hero--full"
    :class="theme.current.value.dark ? 'hero--dark' : 'hero--light'"
  >
    <!-- Background removed - image now in right column -->

    <VContainer class="hero__container">
      <div class="heroGrid">
        <!-- Left: Search Form -->
        <div class="heroLeft">
          <VCard class="premium-card filterCard" elevation="0">
            <div class="filterCard__grid">
              <!-- Vehicle Type Toggle -->
              <div class="inputGroup">
                <div class="premium-toggle">
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: filters.type === 'car' }"
                    @click="filters.type = 'car'"
                  >
                    Cars
                  </button>
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: filters.type === 'motorcycle' }"
                    @click="filters.type = 'motorcycle'"
                  >
                    Bikes
                  </button>
                </div>
              </div>

              <!-- Condition Toggle -->
              <div class="inputGroup">
                <div class="premium-toggle premium-toggle--three">
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: filters.condition === '' }"
                    @click="filters.condition = ''"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: filters.condition === 'used' }"
                    @click="filters.condition = 'used'"
                  >
                    Used
                  </button>
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: filters.condition === 'new' }"
                    @click="filters.condition = 'new'"
                  >
                    New
                  </button>
                </div>
              </div>

              <!-- Row 2: Brand & Model -->
              <div class="inputGroup">
                <VSelect
                  v-model="filters.brandId"
                  :items="brandsList"
                  item-title="name"
                  item-value="id"
                  label="Brand"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="premium-input"
                />
              </div>

              <div class="inputGroup">
                <VSelect
                  ref="modelSelect"
                  v-model="filters.modelId"
                  v-model:menu="isModelMenuOpen"
                  :items="modelsList"
                  item-title="name"
                  item-value="id"
                  label="Model"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  :disabled="!filters.brandId"
                  class="premium-input"
                />
              </div>

              <!-- Price Row (Shared) -->
              <div class="inputGroup rangeRow">
                <div class="rangeRow__grid">
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
              </div>

              <!-- Year Row (Shared) -->
              <div class="inputGroup rangeRow">
                <div class="rangeRow__grid">
                  <VSelect
                    v-model="filters.yearFrom"
                    :items="yearsList"
                    label="From Year"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    class="premium-input"
                  />
                  <VSelect
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
            </div>

            <div class="filterCard__actions">
              <div class="d-flex gap-3 w-100 mb-3">
                <VBtn
                  variant="tonal"
                  class="flex-grow-1 actionBtn"
                  @click="resetFilters"
                  prepend-icon="tabler-rotate"
                >
                  Reset
                </VBtn>

                <VBtn
                  variant="tonal"
                  color="warning"
                  class="flex-grow-1 actionBtn"
                  to="/user/sell"
                  prepend-icon="tabler-circle-plus"
                >
                  Sell
                </VBtn>
              </div>

              <VBtn
                color="primary"
                block
                class="searchMainBtn"
                @click="onSearch"
              >
                Search
              </VBtn>
            </div>
          </VCard>
        </div>

        <!-- Right: Image/Visual -->
        <div class="heroRight">
          <VCard class="premium-card bannersCard" elevation="0">
            <div class="heroImageWrapper">
              <div class="heroBg">
                <Transition name="bgfade" mode="out-in">
                  <div
                    v-if="currentSlideSrc"
                    :key="currentSlideSrc"
                    class="heroBg__img heroBg__img--standalone"
                    :style="{ backgroundImage: `url(${currentSlideSrc})` }"
                  />
                  <div
                    v-else
                    class="d-flex align-center justify-center h-100 flex-column text-center pa-10"
                    style="
                      background: rgba(var(--v-theme-surface), 0.1);
                      border: 2px dashed rgba(var(--v-theme-on-surface), 0.2);
                      border-radius: 24px;
                    "
                  >
                    <VIcon
                      icon="tabler-photo-plus"
                      size="64"
                      color="primary"
                      class="mb-4 opacity-50"
                    />
                    <h3 class="text-h5 font-weight-bold mb-2">مساحة إعلانية شاغرة</h3>
                    <p class="text-body-2 opacity-70">أضف إعلانك هنا ليصل لآلاف العملاء يومياً</p>
                  </div>
                </Transition>
                <div class="heroBg__overlay" />

                <!-- Dots for standalone image -->
                <div class="heroBg__dots heroBg__dots--inline" v-if="slides.length > 1">
                  <button
                    v-for="(_, i) in slides"
                    :key="i"
                    class="dot"
                    :class="{ active: i === slideIndex }"
                    type="button"
                    aria-label="Go to slide"
                    @click="slideIndex = i"
                  />
                </div>
              </div>
            </div>
          </VCard>
        </div>
      </div>
    </VContainer>
  </section>
</template>

<style scoped lang="scss">
/* (نفس الـ CSS بتاعك زي ما هو بدون تغيير) */
.hero {
  border-radius: 0 0 50px 50px;
  overflow: hidden;
  position: relative;
}
.hero__container {
  padding-top: 20px;
  padding-bottom: 20px;
  position: relative;
  z-index: 2;
}

/* ✅ Grid Layout: Left (search) + Right (image) */
.heroGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  min-height: 350px;
}

@media (max-width: 1024px) {
  .heroGrid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .heroRight {
    order: -1; /* Image on top for mobile */
  }
}

.heroLeft {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.heroRight {
  display: flex;
  justify-content: center;
  align-items: center;
}

.heroImageWrapper {
  width: 100%;
  max-width: 550px;
  aspect-ratio: 16/10;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.heroBg__img--standalone {
  transform: scale(1);
  border-radius: 24px;
}
.hero--dark {
  background-color: #25293c;
}
.hero--light {
  background: linear-gradient(138.18deg, #eae8fd 0%, #fce5e6 94.44%);
}

.heroBg {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.heroBg__img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
  filter: saturate(1.05) contrast(1.05);
}
.heroBg__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2); /* Very light overlay for text contrast */
}
.heroBg__glow {
  position: absolute;
  inset: -40px;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 15%, rgba(90, 74, 255, 0.18), transparent 45%),
    radial-gradient(circle at 70% 85%, rgba(255, 55, 57, 0.12), transparent 50%);
}
.heroBg__dots {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  opacity: 0.55;
  background: #fff;
}
.dot.active {
  opacity: 1;
}
.bgfade-enter-active,
.bgfade-leave-active {
  transition: opacity 0.45s ease;
}
.bgfade-enter-from,
.bgfade-leave-to {
  opacity: 0;
}

.heroCenter {
  max-width: 980px;
  margin-inline: auto;
}
.heroTop {
  max-width: 100%;
  text-align: center;
}
.hero__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.hero__title {
  font-size: 40px;
  line-height: 46px;
  font-weight: 950;
  margin: 0;
}
.hero__accent {
  color: #ff6b00;
}
.hero__subtitle {
  margin-top: 10px;
  opacity: 0.82;
  max-width: 560px;
}

.heroGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: stretch; /* Make items equal height */
}

.premium-card {
  width: 100%;
  padding: 26px;
  border-radius: 32px !important;
  background: rgba(15, 20, 30, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.filterCard {
  max-width: 520px;
}

.bannersCard {
  width: 100%;
  overflow: hidden;
  padding: 0; /* Remove padding for edge-to-edge carousel if desired, or keep for consistency */
}
.bannersCard.premium-card {
  padding: 12px; /* Smaller padding for the ad container */
}

.filterCard__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 20px;
}
.rangeRow {
  grid-column: span 2;
}
.rangeRow__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.inputGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.inputLabel {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.5;
  margin-left: 4px;
  color: #fff;
  margin-bottom: 2px;
}

.premium-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  height: 48px;
}
.premium-toggle__btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  opacity: 0.6;
}
.premium-toggle__btn:hover {
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.04);
}
.premium-toggle__btn.active {
  opacity: 1;
  background: rgba(var(--v-theme-primary), 1);
  color: #fff;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.3);
}

.premium-input :deep(.v-field__outline) {
  --v-field-border-opacity: 0.15;
}
.premium-input :deep(.v-label) {
  font-size: 13px;
  font-weight: 600;
}

.searchMainBtn {
  height: 48px !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  font-size: 15px !important;
  text-transform: none !important;
}

.actionBtn {
  height: 38px !important;
  border-radius: 10px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

.filterCard__actions {
  margin-top: 24px;
}
.actionBtn {
  height: 40px !important;
  border-radius: 14px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  text-transform: none !important;
}
.searchBtn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  text-transform: none !important;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 1) 0%,
    rgba(var(--v-theme-primary), 0.8) 100%
  ) !important;
  box-shadow: 0 12px 24px -6px rgba(var(--v-theme-primary), 0.5) !important;
}

.filterCard__actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filterCard__spacer {
  flex: 1;
}
.btnMain,
.btnGhost {
  height: 44px;
  border-radius: 14px;
  padding-inline: 16px;
}
.btnSmall {
  height: 44px;
  border-radius: 14px;
  padding-inline: 14px;
}

.quickInHero {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.quickInHero__card {
  cursor: pointer;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}
.quickInHero__card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.16);
}
.qTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.qIcon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.qChip {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.95;
}
.qBody {
  margin-top: 12px;
}
.qTitle {
  font-weight: 950;
  font-size: 15px;
}
.qSub {
  margin-top: 4px;
  font-size: 12.5px;
  opacity: 0.78;
  line-height: 1.5;
}
.qFoot {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: 0.9;
}
.qAction {
  font-weight: 900;
  font-size: 12.5px;
}

@media (max-width: 1100px) {
  .filterCard__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rangeRow {
    grid-column: span 2;
  }
  .quickInHero {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .hero__title {
    font-size: 32px;
    line-height: 38px;
  }
  .filterCard__grid {
    grid-template-columns: 1fr;
  }
  .rangeRow {
    grid-column: span 1;
  }
  .rangeRow__grid {
    grid-template-columns: 1fr;
  }
  .filterCard__spacer {
    display: none;
  }
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
</style>

// الجزء العلوي في صفحه الاساسيه
