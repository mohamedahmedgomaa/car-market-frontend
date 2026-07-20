<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/api/index.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'
import { customBrandFilter, sortBrands, matchBrand } from '@/utils/brandTranslations.js'

const theme = useTheme()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

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
  if (smartSearch.value) q['filter[global]'] = smartSearch.value

  putBetween(q, 'km_between', filters.value.kmMin, filters.value.kmMax)

  const pf = toNumOrNull(filters.value.priceFrom)
  const pt = toNumOrNull(filters.value.priceTo)
  putBetween(q, 'price_between', pf, pt)

  const yf = toNumOrNull(filters.value.yearFrom)
  const yt = toNumOrNull(filters.value.yearTo)
  putBetween(q, 'year_between', yf, yt)

  return q
}

// ✅ Omni-Search (ID or Text)
const smartSearch = ref('')

const onSmartSearchInput = (val) => {
  if (!val) {
    smartSearch.value = ''
    return
  }
  
  // Convert Arabic to English instantly
  let cleaned = String(val).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  
  // If it looks like an ID (only numbers or # + numbers), enforce 6 digits limit
  if (/^(#?\d+)$/.test(cleaned)) {
    const hasHash = cleaned.startsWith('#')
    const maxLength = hasHash ? 7 : 6
    if (cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength)
    }
  }

  if (smartSearch.value !== cleaned) {
    nextTick(() => {
      smartSearch.value = cleaned
    })
  }
}

const onSearch = async () => {
  if (!smartSearch.value) {
    router.push({
      path: '/user/cars',
      query: buildQuery(),
    })
    return
  }

  let queryText = String(smartSearch.value).trim().toLowerCase()
  
  // Check if it's an ID search (only numbers, optionally starting with #)
  const isId = /^(#?\d+)$/.test(queryText)

  if (isId) {
    const numericId = queryText.replace(/[^0-9]/g, '')
    router.push(`/user/cars/${numericId}`)
    smartSearch.value = ''
    return
  }

  // ✅ Smart Parsing: extract Brand, Model, Year from queryText
  let detectedBrandId = null
  let detectedModelId = null
  let detectedYear = null

  // 1. Detect Year (any 4 digit number starting with 19 or 20)
  const yearMatch = queryText.match(/\b(19\d{2}|20\d{2})\b/)
  if (yearMatch) {
    detectedYear = Number(yearMatch[1])
    queryText = queryText.replace(yearMatch[0], '').trim()
  }

  // 2. Detect Brand
  if (safeBrandsList.value.length > 0) {
    // Sort brands by longest name first to match "alfa romeo" before "alfa"
    const sortedBrands = [...safeBrandsList.value].sort((a, b) => {
      const aLen = Math.max(a.name?.length || 0, a.originalName?.en?.length || 0)
      const bLen = Math.max(b.name?.length || 0, b.originalName?.en?.length || 0)
      return bLen - aLen
    })

    for (const brand of sortedBrands) {
      if (matchBrand(brand, queryText)) {
        detectedBrandId = brand.id
        // Try to remove brand name from query to avoid matching model loosely
        const nameEn = String(brand.originalName?.en || brand.originalName || brand.name || '').toLowerCase()
        queryText = queryText.replace(nameEn, '').trim()
        break
      }
    }
  }

  // 3. Detect Model (if Brand was found)
  if (detectedBrandId) {
    try {
      const mRes = await modelUserApi.getAll({ 'filter[brand_id]': detectedBrandId })
      const models = mRes.data?.data || mRes.data || []
      const sortedModels = [...models].sort((a, b) => (b.name?.en?.length || 0) - (a.name?.en?.length || 0))
      for (const model of sortedModels) {
        const mNameEn = String(model.name?.en || model.name || '').toLowerCase()
        if (mNameEn && queryText.includes(mNameEn)) {
          detectedModelId = model.id
          break
        }
      }
    } catch (e) {
      console.error('Failed to fetch models for parsing', e)
    }
  }

  // Build query and merge with smart parsed fields
  const finalQuery = buildQuery()
  
  if (detectedBrandId) finalQuery['filter[brand_id]'] = detectedBrandId
  if (detectedModelId) finalQuery['filter[model_id]'] = detectedModelId
  if (detectedYear) finalQuery['filter[year_between]'] = `${detectedYear}.${detectedYear}`
  
  // If we couldn't parse everything, send the remaining text as global filter
  if (!detectedBrandId && !detectedYear) {
    finalQuery['filter[global]'] = smartSearch.value
  }

  router.push({
    path: '/user/cars',
    query: finalQuery,
  })
}

const resetFilters = () => {
  smartSearch.value = ''
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
const isBrandsLoading = ref(true)
const yearsList = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i)

// Ensure yearsList is always a valid array for VSelect
const safeYearsList = computed(() => yearsList || [])

// Ensure items are always valid arrays for Vuetify components
const safeBrandsList = computed(() => brandsList.value || [])
const safeModelsList = computed(() => modelsList.value || [])
const safeSlides = computed(() => slides.value || [])
const yearsToList = computed(() => {
  if (!filters.value.yearFrom) return yearsList || []
  return (yearsList || [])
    .filter((y) => y >= filters.value.yearFrom)
    .sort((a, b) => b - a)
})

const _t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const fetchBrands = async () => {
  isBrandsLoading.value = true
  try {
    const res = await brandUserApi.getAll()
    const data = res.data?.data || res.data || []
    brandsList.value = sortBrands(data.map((b) => ({ id: b.id, name: _t(b.name), originalName: b.name })))
  } catch (err) {
    console.error('Error fetching brands:', err)
  } finally {
    isBrandsLoading.value = false
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
    modelsList.value = data.map((m) => ({ id: m.id, name: _t(m.name) }))
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
    const res = await api.get('/user/banners', { params: { type: 'hero' } })
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

/* =========================
   ✅ Video Playback Controls (Ad Space)
========================= */
const adVideoRef = ref(null)
const isMuted = ref(true)
const isPlaying = ref(true)
const videoUrl = ref('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4')

const fetchVideoBanner = async () => {
  try {
    const res = await api.get('/user/banners', { params: { type: 'video' } })
    if (res.data && res.data.data && res.data.data.length > 0) {
      videoUrl.value = res.data.data[0].image_path
    }
  } catch (err) {
    console.error('Error fetching video banner:', err)
  }
}

const toggleMute = () => {
  if (adVideoRef.value) {
    adVideoRef.value.muted = !adVideoRef.value.muted
    isMuted.value = adVideoRef.value.muted
  }
}

const togglePlay = () => {
  if (adVideoRef.value) {
    if (adVideoRef.value.paused) {
      adVideoRef.value.play()
      isPlaying.value = true
    } else {
      adVideoRef.value.pause()
      isPlaying.value = false
    }
  }
}

onMounted(() => {
  fetchBanners()
  fetchVideoBanner()
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
                {{ t('welcomeToNegmCars') }}
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

            <!-- ✅ Search Inputs (Smart Search / Omni-Search) -->
            <div class="mb-5 d-flex gap-3 align-center search-inputs-row w-100">
              <VTextField
                v-model="smartSearch"
                :placeholder="t('searchPlaceholder')"
                density="compact"
                variant="outlined"
                hide-details
                prepend-inner-icon="tabler-search"
                @keydown.enter.prevent="onSearch"
                @update:model-value="onSmartSearchInput"
                class="premium-id-input smart-search-input flex-grow-1 w-100"
                dir="ltr"
              />
            </div>

            <!-- Header Row with Title and Reset -->

            <div class="search-form-grid">
              <!-- Type Toggle -->
              <div class="form-group">
                <label class="group-label">{{ t('vehicleType') }}</label>
                <div class="premium-toggle-group">
                  <button
                    v-for="t_type in ['car', 'motorcycle']"
                    :key="t_type"
                    class="toggle-btn"
                    :class="{ active: filters.type === t_type }"
                    @click="filters.type = t_type"
                  >
                    {{ t_type === 'car' ? t('cars') : t('bikes') }}
                  </button>
                </div>
              </div>

              <!-- Condition Toggle -->
              <div class="form-group">
                <label class="group-label">{{ t('condition') }}</label>
                <div class="premium-toggle-group">
                  <button
                    v-for="c in ['', 'used', 'new']"
                    :key="c"
                    class="toggle-btn toggle-btn--small"
                    :class="{ active: filters.condition === c }"
                    @click="filters.condition = c"
                  >
                    {{ c === '' ? t('allCondition') : (c === 'used' ? t('usedCondition') : t('newCondition')) }}
                  </button>
                </div>
              </div>

              <!-- Brand & Model -->
              <div class="form-group">
                <VAutocomplete
                  v-if="!isBrandsLoading"
                  v-model="filters.brandId"
                  :items="safeBrandsList"
                  item-title="name"
                  item-value="id"
                  maxlength="30"
                  :label="t('selectBrand')"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="premium-input"
                  no-data-text="No brands found"
                />
                <VSkeletonLoader
                  v-else
                  type="text-field"
                  class="premium-input"
                  height="44"
                />
              </div>

              <div class="form-group">
                <VSelect
                  ref="modelSelect"
                  v-model="filters.modelId"
                  v-model:menu="isModelMenuOpen"
                  :items="safeModelsList"
                  item-title="name"
                  item-value="id"
                  :label="t('selectModel')"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!filters.brandId"
                  class="premium-input"
                  no-data-text="No models found"
                />
              </div>

              <!-- Price Range -->
              <div class="form-group">
                <VTextField
                  v-model="displayPriceFrom"
                  :label="t('minPrice')"
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
                  :label="t('maxPrice')"
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
                  :items="safeYearsList"
                  :label="t('fromYear')"
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
                  :label="t('toYear')"
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
                  :label="t('minKM')"
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
                  :label="t('maxKM')"
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
                {{ t('searchBtn') }}
              </VBtn>
              <VBtn
                variant="tonal"
                color="warning"
                class="sell-side-btn"
                width="100"
                height="48"
                to="/user/sell"
                prepend-icon="tabler-circle-plus"
              >
                {{ t('sellBtn') }}
              </VBtn>
            </div>
          </VCard>
        </div>

        <!-- Right: Ads Column -->
        <div class="hero-ads-column">
          <!-- Top: Image Ad Area -->
          <div class="hero-ad-area animate-fade-in-up" style="animation-delay: 0.2s">
            <VCard class="premium-ad-card animate-float" elevation="10">
              <div class="ad-label">AD</div>
              <div class="ad-carousel-wrapper">
                <Transition name="fade" mode="out-in">
                  <div v-if="safeSlides.length > 0" :key="slideIndex" class="ad-slide-wrapper">
                    <a :href="safeSlides[slideIndex].link" target="_blank" class="ad-slide">
                      <div
                        class="ad-image animate-ken-burns"
                        :style="{ backgroundImage: `url(${safeSlides[slideIndex].image})` }"
                      />
                    </a>
                  </div>
                  <div
                    v-else
                    class="placeholder-ad d-flex flex-column align-center justify-center text-center pa-8 h-100"
                  >
                    <div class="placeholder-glow"></div>
                    <VIcon
                      icon="tabler-photo-spark"
                      size="80"
                      color="primary"
                      class="text-glow mb-4"
                    />
                    <h4 class="text-h5 font-weight-black mb-2 text-white">{{ t('adSpace') }}</h4>
                    <p class="text-body-2 opacity-70 max-w-400 text-white">{{ t('addAdHere') }}</p>
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
                        {{ t('contactUs') }}
                      </VBtn>
                    </Transition>
                  </div>
                </Transition>

                <!-- Indicators -->
                <div v-if="safeSlides.length > 1" class="carousel-indicators">
                  <span
                    v-for="(slide, idx) in safeSlides"
                    :key="idx"
                    class="indicator-dot"
                    :class="{ active: idx === slideIndex }"
                    @click="slideIndex = idx"
                  ></span>
                </div>
              </div>
            </VCard>
          </div>

          <!-- Bottom: Video Ad Area -->
          <div class="hero-video-area animate-fade-in-up" style="animation-delay: 0.3s">
            <VCard class="premium-video-card animate-float" elevation="10">
              <div class="video-label">PROMO</div>
              <div class="video-player-wrapper">
                <video
                  ref="adVideoRef"
                  :src="videoUrl"
                  autoplay
                  loop
                  muted
                  playsinline
                  class="ad-video"
                ></video>
                
                <!-- Video Controls Overlay -->
                <div class="video-controls">
                  <VBtn
                    icon
                    variant="text"
                    color="white"
                    size="small"
                    @click="togglePlay"
                    class="control-btn"
                  >
                    <VIcon :icon="isPlaying ? 'tabler-pause' : 'tabler-play'" />
                  </VBtn>
                  <VBtn
                    icon
                    variant="text"
                    color="white"
                    size="small"
                    @click="toggleMute"
                    class="control-btn"
                  >
                    <VIcon :icon="isMuted ? 'tabler-volume-off' : 'tabler-volume'" />
                  </VBtn>
                </div>
              </div>
            </VCard>
          </div>
        </div>
      </div>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  padding-block: 40px;
  min-height: auto;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero--dark {
  background: transparent;
}

/* Main Grid */
.hero-main-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 32px;
  align-items: stretch;
  width: 100%;
}

.hero-search-area {
  height: 100%;
}

.hero-ads-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.hero-ad-area,
.hero-video-area {
  flex: 1;
  height: 100%;
}

/* Search Card */
.premium-search-card {
  background: rgba(20, 24, 40, 0.65) !important;
  backdrop-filter: blur(30px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  padding: 28px !important;
  height: 100%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 20px 50px rgba(0, 0, 0, 0.45) !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Welcome Chip */
:deep(.v-chip.v-chip--variant-flat) {
  background: rgba(255, 107, 0, 0.12) !important;
  color: #FF6B00 !important;
  border: 1px solid rgba(255, 107, 0, 0.25) !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
  border-radius: 8px !important;
}

/* Search by ID Input */
.premium-id-input :deep(.v-field) {
  border-radius: 16px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  height: 44px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-id-input :deep(.v-field__input) {
  font-size: 0.9rem !important;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fff !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 44px !important;
}

.premium-id-input :deep(.v-field--focused) {
  background: rgba(0, 0, 0, 0.35) !important;
  border-color: #FF6B00 !important;
  box-shadow: 0 0 15px rgba(255, 107, 0, 0.25) !important;
}

.premium-id-input :deep(.v-icon) {
  color: #FF6B00;
  opacity: 0.8;
  transition: all 0.2s;
}

.premium-id-input :deep(.v-field--focused .v-icon) {
  opacity: 1;
  transform: scale(1.1);
}

/* Grid Layout for Inputs */
.search-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-label {
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-left: 2px;
  color: rgba(255, 255, 255, 0.45);
}

/* Toggle Pill Buttons */
.premium-toggle-group {
  display: flex;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.toggle-btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 800;
  border-radius: 10px;
  height: 34px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    background: linear-gradient(135deg, #FF6B00 0%, #FF3E1D 100%) !important;
    color: #fff !important;
    box-shadow: 0 4px 15px rgba(255, 107, 0, 0.35) !important;
    opacity: 1;
  }

  &:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.03);
  }
}

.toggle-btn--small {
  height: 30px;
  font-size: 11px;
}

/* Vuetify Input Fields */
.premium-input :deep(.v-field) {
  border-radius: 16px !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  height: 44px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    border-color: rgba(255, 107, 0, 0.3) !important;
    background: rgba(255, 255, 255, 0.04) !important;
  }
}

.premium-input :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 44px !important;
  font-size: 0.9rem !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

.premium-input :deep(.v-field--focused) {
  border-color: #FF6B00 !important;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 15px rgba(255, 107, 0, 0.2) !important;
}

.premium-input :deep(.v-label) {
  font-size: 0.85rem !important;
  color: rgba(255, 255, 255, 0.45) !important;
}

/* Buttons */
.search-main-btn {
  border-radius: 18px !important;
  font-weight: 850 !important;
  text-transform: none !important;
  font-size: 16px !important;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #FF6B00 0%, #FF3E1D 100%) !important;
  color: white !important;
  box-shadow: 0 6px 20px rgba(255, 107, 0, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255, 107, 0, 0.5) !important;
  }
}

.sell-side-btn {
  border-radius: 18px !important;
  font-weight: 800 !important;
  text-transform: none !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  background: rgba(255, 255, 255, 0.04) !important;
  color: white !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px);
  }
}

.reset-btn-v2 {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 107, 0, 0.15) !important;
    border-color: rgba(255, 107, 0, 0.35) !important;
    color: #FF6B00 !important;
    transform: rotate(180deg);
  }
}

/* Ad Area */
.premium-ad-card {
  height: 100%;
  min-height: 270px;
  background: rgba(20, 24, 40, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.premium-video-card {
  height: 100%;
  min-height: 270px;
  background: rgba(20, 24, 40, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.video-label {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(var(--v-theme-primary), 0.95);
  color: white;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.4);
}

.video-player-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.ad-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
  z-index: 10;
  background: rgba(15, 17, 26, 0.6);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn {
  opacity: 0.8;
  transition: all 0.2s;
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}


.ad-label {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(255, 107, 0, 0.95);
  color: white;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
}

.ad-carousel-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
}

.ad-slide-wrapper {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
}

.ad-slide {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.ad-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 1;
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Ken Burns Effect */
.animate-ken-burns {
  animation: kenBurnsAnimation 10s ease-in-out infinite alternate;
}

@keyframes kenBurnsAnimation {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.12);
  }
}


/* Carousel Indicators */
.carousel-indicators {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator-dot {
  width: 20px;
  height: 4px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    background: #FF6B00;
    width: 36px;
    box-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
  }
}

/* Placeholder Ad */
.placeholder-ad {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.1) 0%, rgba(15, 17, 26, 0.95) 100%);
  height: 100%;

  .placeholder-glow {
    position: absolute;
    top: -20%;
    left: -20%;
    width: 140%;
    height: 140%;
    background: radial-gradient(circle at center, rgba(255, 107, 0, 0.05) 0%, transparent 60%);
    animation: pulseGlow 8s infinite alternate;
    pointer-events: none;
  }

  .text-glow {
    filter: drop-shadow(0 0 15px rgba(255, 107, 0, 0.4));
  }
}

@keyframes pulseGlow {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.08);
  }
}

.phone-display-box {
  background: rgba(255, 107, 0, 0.12);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 107, 0, 0.15);
  font-weight: 800;
  letter-spacing: 0.5px;
}

.contact-btn-pulse {
  border-radius: 14px !important;
  border: 1px solid rgba(255, 107, 0, 0.4) !important;
  background: rgba(255, 107, 0, 0.06) !important;
  color: #FF6B00 !important;
  font-weight: 800 !important;
  text-transform: none !important;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 107, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 0, 0);
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

/* =========================================
   ✅ LIGHT THEME OVERRIDES
   ========================================= */
.hero--light {
  .premium-search-card {
    background: rgba(255, 255, 255, 0.85) !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 20px 50px rgba(0, 0, 0, 0.08) !important;
  }

  .premium-ad-card,
  .premium-video-card {
    background: rgba(255, 255, 255, 0.85) !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
  }

  .group-label {
    color: rgba(0, 0, 0, 0.7);
  }

  .premium-toggle-group {
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .toggle-btn {
    color: rgba(0, 0, 0, 0.75);
    &:hover:not(.active) {
      color: #000;
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .premium-id-input :deep(.v-field) {
    background: rgba(0, 0, 0, 0.02) !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
  }
  .premium-id-input :deep(.v-field__input) {
    color: #000 !important;
  }
  .premium-id-input :deep(.v-field--focused) {
    background: rgba(0, 0, 0, 0.04) !important;
  }

  .premium-input :deep(.v-field) {
    background: rgba(0, 0, 0, 0.02) !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
  }
  .premium-input :deep(.v-field:hover) {
    border-color: rgba(255, 107, 0, 0.4) !important;
    background: rgba(0, 0, 0, 0.04) !important;
  }
  .premium-input :deep(.v-field__input) {
    color: rgba(0, 0, 0, 0.95) !important;
  }
  .premium-input :deep(.v-label) {
    color: rgba(0, 0, 0, 0.6) !important;
  }
  .premium-input :deep(.v-field--focused) {
    background: rgba(0, 0, 0, 0.02) !important;
    box-shadow: 0 0 15px rgba(255, 107, 0, 0.1) !important;
  }

  .sell-side-btn {
    border: 1px solid rgba(0, 0, 0, 0.15) !important;
    background: rgba(0, 0, 0, 0.04) !important;
    color: rgba(0, 0, 0, 0.85) !important;
    &:hover {
      background: rgba(0, 0, 0, 0.08) !important;
      border-color: rgba(0, 0, 0, 0.3) !important;
    }
  }

  .reset-btn-v2 {
    background: rgba(0, 0, 0, 0.04) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    color: rgba(0, 0, 0, 0.75) !important;
    &:hover {
      background: rgba(255, 107, 0, 0.1) !important;
      color: #FF6B00 !important;
    }
  }

  .placeholder-ad {
    background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
    h4, p {
      color: #000 !important;
    }
  }
}

@media (min-width: 1201px) and (max-width: 1450px) {
  .hero-main-grid {
    grid-template-columns: 1.25fr 1fr;
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .hero__container {
    padding-inline: 16px;
  }
  .hero-main-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .hero-ads-column {
    flex-direction: row;
    gap: 24px;
  }
  .premium-ad-card, .premium-video-card {
    min-height: 320px !important;
  }
}

@media (max-width: 768px) {
  .hero-ads-column {
    flex-direction: column;
  }
  .premium-ad-card, .premium-video-card {
    min-height: 260px !important;
  }
}

@media (max-width: 600px) {
  .premium-search-card {
    padding: 20px !important;
    border-radius: 24px !important;
  }
  .search-form-grid {
    grid-template-columns: 1fr;
    gap: 12px 10px !important;
  }
  .group-label {
    font-size: 10px !important;
    letter-spacing: 1px !important;
  }
  .toggle-btn {
    height: 34px !important;
    font-size: 12px !important;
  }
  .premium-input :deep(.v-field) {
    height: 40px !important;
    border-radius: 12px !important;
  }
  .premium-input :deep(.v-field__input) {
    min-height: 40px !important;
    font-size: 13px !important;
  }
  .premium-id-input :deep(.v-field) {
    height: 40px !important;
  }
  .premium-id-input :deep(.v-field__input) {
    min-height: 40px !important;
    font-size: 0.85rem !important;
  }
  .search-actions-row {
    gap: 8px !important;
    margin-top: 16px !important;
  }
  .search-main-btn, .sell-side-btn {
    height: 44px !important;
    font-size: 15px !important;
    border-radius: 12px !important;
  }
}

.search-inputs-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

@media (max-width: 600px) {
  .search-inputs-row {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .smart-search-input {
    width: 100% !important;
    max-width: 100% !important;
  }
  .search-id-input {
    max-width: 100% !important;
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



