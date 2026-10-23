<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/api/index.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'
import carsUserApi from '@/api/user/carUserApi.js'
import { customBrandFilter, sortBrands, matchBrand, translateText } from '@/utils/brandTranslations.js'
import { getActiveVideoBanner, resolveVideoSource } from '@/utils/videoBannerStorage.js'

const theme = useTheme()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const isDark = computed(() => theme.current.value.dark)

const props = defineProps({
  controlled: { type: Boolean, default: false },
  initialBanners: { type: Array, default: null },
  initialVideoUrl: { type: String, default: null },
  initialVideoLink: { type: String, default: null },
  initialBrands: { type: Array, default: null },
})

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

// ✅ Text & Ad ID Search
const smartSearch = ref('')
const adIdSearch = ref('')
const isSearchingId = ref(false)
const idNotFoundSnackbar = ref(false)
const idNotFoundMessage = ref('')

const onSmartSearchInput = (val) => {
  if (!val) {
    smartSearch.value = ''
    return
  }
  const converted = String(val)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  if (smartSearch.value !== converted) {
    nextTick(() => {
      smartSearch.value = converted
    })
  }
}

const onAdIdInput = (val) => {
  if (!val) {
    adIdSearch.value = ''
    return
  }
  let cleaned = String(val)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  cleaned = cleaned.replace(/[^0-9#]/g, '')
  if (cleaned.startsWith('#')) {
    cleaned = '#' + cleaned.slice(1).replace(/[^0-9]/g, '').slice(0, 7)
  } else {
    cleaned = cleaned.replace(/[^0-9]/g, '').slice(0, 7)
  }
  if (adIdSearch.value !== cleaned) {
    nextTick(() => {
      adIdSearch.value = cleaned
    })
  }
}

const onAdIdSearch = async () => {
  if (!adIdSearch.value) return
  const numericId = String(adIdSearch.value).replace(/[^0-9]/g, '')
  if (!numericId) return

  try {
    isSearchingId.value = true
    const res = await carsUserApi.getById(numericId)
    const data = res.data?.data ?? res.data
    if (data && data.status === 'approved') {
      router.push(`/user/cars/${numericId}`)
      adIdSearch.value = ''
    } else {
      idNotFoundMessage.value = t('adNotFoundMsg', { id: numericId })
      idNotFoundSnackbar.value = true
    }
  } catch (e) {
    idNotFoundMessage.value = t('adNotFoundMsg', { id: numericId })
    idNotFoundSnackbar.value = true
  } finally {
    isSearchingId.value = false
  }
}

const onSearch = async () => {
  // If Ad ID was provided, validate it first without leaving the page if it does not exist
  if (adIdSearch.value && adIdSearch.value.trim()) {
    await onAdIdSearch()
    return
  }

  if (!smartSearch.value) {
    router.push({
      path: '/user/cars',
      query: buildQuery(),
    })
    return
  }

  let queryText = String(smartSearch.value).trim().toLowerCase()
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))

  // ✅ Smart Parsing: extract Brand, Model, Year from queryText (e.g. BMW 320, X5, 2025)
  // Numeric text like "320" will be treated as car/model search, NOT as an Ad ID redirect!

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
        const nameEn = String(brand.originalName?.en || brand.originalName || brand.name?.en || brand.name || '').toLowerCase()
        const nameAr = String(brand.originalName?.ar || brand.name?.ar || '').toLowerCase()
        
        let removed = false
        if (nameEn && queryText.includes(nameEn)) {
          queryText = queryText.replace(nameEn, '').trim()
          removed = true
        }
        if (!removed && nameAr && queryText.includes(nameAr)) {
          queryText = queryText.replace(nameAr, '').trim()
        }
        // Also check aliases if not removed
        if (!removed) {
          for (const [key, aliases] of Object.entries(brandArabicMap)) {
            if (key === nameEn || nameEn.includes(key)) {
               for (const alias of aliases) {
                 const al = alias.toLowerCase()
                 if (queryText.includes(al)) {
                   queryText = queryText.replace(al, '').trim()
                   removed = true
                   break
                 }
               }
            }
            if(removed) break;
          }
        }
        
        // Final fallback: if queryText is exactly equal to the brand name (or very close), just clear it
        if (!removed && (queryText === nameEn || queryText === nameAr)) {
          queryText = ''
        }

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

  // 4. Fallback: If no Brand was found, check ALL models
  if (!detectedBrandId && !detectedModelId && queryText && allModelsList.value.length > 0) {
    const sortedAllModels = [...allModelsList.value].sort((a, b) => (b.name?.en?.length || 0) - (a.name?.en?.length || 0))
    for (const model of sortedAllModels) {
      const mNameEn = String(model.name?.en || model.name || '').toLowerCase()
      if (mNameEn && (queryText === mNameEn || queryText.startsWith(mNameEn + ' ') || queryText.endsWith(' ' + mNameEn) || queryText.includes(` ${mNameEn} `))) {
        detectedModelId = model.id
        if (model.brand_id) {
          detectedBrandId = model.brand_id
        }
        queryText = queryText.replace(mNameEn, '').trim()
        break
      }
    }
  }

  // Build query and merge with smart parsed fields
  const finalQuery = buildQuery()
  
  // Auto-detect type if we used smart search
  if (smartSearch.value) {
    const bikeKeywords = ['m1000rr', 's1000rr', 'gsxr', 'ninja', 'cbr', 'yzf', 'ducati', 'yamaha', 'kawasaki', 'harley', 'ktm']
    const textLower = String(smartSearch.value).toLowerCase()
    const isBikeKeyword = bikeKeywords.some(k => textLower.includes(k))
    
    let isBikeBrand = false
    if (detectedBrandId) {
      const brandObj = safeBrandsList.value.find(b => b.id === detectedBrandId)
      if (brandObj && brandObj.type === 'motorcycle') {
        isBikeBrand = true
      }
    }
    
    if (isBikeKeyword || isBikeBrand) {
      finalQuery['filter[type]'] = 'motorcycle'
    } else if (detectedBrandId) {
       const brandObj = safeBrandsList.value.find(b => b.id === detectedBrandId)
       if (brandObj && brandObj.type === 'car') {
         finalQuery['filter[type]'] = 'car'
       }
    }
  }

  // Clean up global filter if we parsed successfully
  if (detectedBrandId || detectedYear) {
    delete finalQuery['filter[global]']
    
    // If there's still leftover text that looks substantial, we can put it in global
    if (queryText && queryText.length > 1 && !detectedModelId) {
      finalQuery['filter[global]'] = queryText
    }
  }

  if (detectedBrandId) finalQuery['filter[brand_id]'] = detectedBrandId
  if (detectedModelId) finalQuery['filter[model_id]'] = detectedModelId
  if (detectedYear) finalQuery['filter[year_between]'] = `${detectedYear}.${detectedYear}`


  router.push({
    path: '/user/cars',
    query: finalQuery,
  })
}

const resetFilters = () => {
  smartSearch.value = ''
  adIdSearch.value = ''
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
const isBrandsLoading = ref(false)
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

const _t = (val, parentObj = null) => {
  return translateText(val, locale.value || 'ar', parentObj)
}

const fetchBrands = async () => {
  if (props.initialBrands && props.initialBrands.length) {
    brandsList.value = props.initialBrands
    isBrandsLoading.value = false
    return
  }
  isBrandsLoading.value = true
  try {
    const res = await brandUserApi.getAll()
    brandsList.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Error fetching brands:', err)
  } finally {
    isBrandsLoading.value = false
  }
}

const brandDialogOpen = ref(false)
const brandSearchQuery = ref('')
const modelDialogOpen = ref(false)
const modelSearchQuery = ref('')
const modelsLoading = ref(false)

const openBrandDialog = () => {
  brandSearchQuery.value = ''
  brandDialogOpen.value = true
  if (brandsList.value.length === 0) {
    fetchBrands()
  } else {
    isBrandsLoading.value = false
  }
}

const selectBrand = (b) => {
  if (!b) {
    filters.value.brandId = null
    filters.value.modelId = null
    brandDialogOpen.value = false
    return
  }
  filters.value.brandId = b.id
  filters.value.modelId = null
  brandDialogOpen.value = false
  fetchModels(b.id).then(() => {
    openModelDialog()
  })
}

const clearBrand = () => {
  filters.value.brandId = null
  filters.value.modelId = null
}

const selectedBrand = computed(() => {
  if (!filters.value.brandId) return null
  return brandsList.value.find((b) => b.id === filters.value.brandId) || null
})

const selectedBrandName = computed(() => {
  if (!selectedBrand.value) return ''
  return _t(selectedBrand.value.name)
})

const modalFilteredBrands = computed(() => {
  const type = filters.value.type || 'car'
  let items = (brandsList.value || []).filter((b) => !b.type || b.type === type)
  items = sortBrands(items)

  if (!brandSearchQuery.value.trim()) return items

  const q = brandSearchQuery.value.trim().toLowerCase()
  return items.filter((b) => {
    const en = String(b.originalName?.en || b.name?.en || b.name || '').toLowerCase()
    const ar = String(b.originalName?.ar || b.name?.ar || '').toLowerCase()
    return en.includes(q) || ar.includes(q) || matchBrand(b, q)
  })
})

const fetchModels = async (brandId) => {
  if (!brandId) {
    modelsList.value = []
    return
  }
  modelsLoading.value = true
  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': brandId })
    modelsList.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Error fetching models:', err)
  } finally {
    modelsLoading.value = false
  }
}

const openModelDialog = () => {
  if (!filters.value.brandId) return
  modelSearchQuery.value = ''
  modelDialogOpen.value = true
}

const selectModel = (m) => {
  if (!m) {
    filters.value.modelId = null
  } else {
    filters.value.modelId = m.id
  }
  modelDialogOpen.value = false
}

const clearModel = () => {
  filters.value.modelId = null
}

const selectedModel = computed(() => {
  if (!filters.value.modelId) return null
  return modelsList.value.find((m) => m.id === filters.value.modelId) || null
})

const selectedModelName = computed(() => {
  if (!selectedModel.value) return ''
  return _t(selectedModel.value.name)
})

const modalFilteredModels = computed(() => {
  const items = modelsList.value || []
  if (!modelSearchQuery.value.trim()) return items
  const q = modelSearchQuery.value.trim().toLowerCase()
  return items.filter((m) => {
    const en = String(m.name?.en || m.name || '').toLowerCase()
    const ar = String(m.name?.ar || '').toLowerCase()
    return en.includes(q) || ar.includes(q)
  })
})

watch(
  () => filters.value.brandId,
  (val) => {
    if (val) {
      fetchModels(val)
    } else {
      modelsList.value = []
      filters.value.modelId = null
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

import { getBannerLink } from '@/utils/bannerLinkStorage.js'

const hasValidLink = (link) => {
  return !!link && typeof link === 'string' && link.trim() !== '' && link !== '#' && link !== 'javascript:void(0)'
}

const openBannerLink = (link) => {
  if (!hasValidLink(link)) {
    showAdPhone.value = true
    return
  }
  let url = link.trim()
  if (url.startsWith('/')) {
    router.push(url)
  } else {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const fetchBanners = async () => {
  if (props.initialBanners && props.initialBanners.length) {
    slides.value = props.initialBanners.slice(0, 5).map((b) => ({
      image: b.image_path,
      link: getBannerLink(b.id, b.link || ''),
    }))
    return
  }
  if (props.controlled) return
  try {
    const res = await api.get('/user/banners', { params: { type: 'hero' } })
    if (res.data && res.data.data && res.data.data.length > 0) {
      slides.value = res.data.data.slice(0, 5).map((b) => ({
        image: b.image_path,
        link: getBannerLink(b.id, b.link || ''),
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
const videoUrl = ref('')
const videoLink = ref('')

const isDeadVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return true
  const lower = url.toLowerCase()
  return lower.includes('commondatastorage.googleapis.com') || lower.includes('forbiggerjoyrides')
}

const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/ ]{11})/i
  const match = url.match(regExp)
  if (match && match[1]) {
    const videoId = match[1]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&playsinline=1`
  }
  return null
}

const isYouTube = computed(() => !!getYouTubeEmbedUrl(videoUrl.value))
const youtubeEmbedUrl = computed(() => getYouTubeEmbedUrl(videoUrl.value))

const fetchVideoBanner = async () => {
  // 1. Check local/IndexedDB video banner storage first (always active & instant)
  const localActive = getActiveVideoBanner()
  if (localActive && localActive.image_path) {
    const resolved = await resolveVideoSource(localActive.image_path)
    if (resolved && !isDeadVideoUrl(resolved)) {
      videoUrl.value = resolved
      videoLink.value = localActive.link || ''
      return
    }
  }

  // 2. Props from parent (only if valid and NOT the dead Google fallback!)
  if (props.initialVideoUrl && !isDeadVideoUrl(props.initialVideoUrl)) {
    videoUrl.value = props.initialVideoUrl
    videoLink.value = props.initialVideoLink || ''
    return
  }

  // 3. Fallback to API if not controlled
  if (!props.controlled) {
    try {
      const res = await api.get('/user/banners', { params: { type: 'video' } })
      if (res.data && res.data.data && res.data.data.length > 0) {
        const latest = res.data.data[0]
        if (latest.image_path && !isDeadVideoUrl(latest.image_path)) {
          videoUrl.value = latest.image_path
          videoLink.value = latest.link || ''
          return
        }
      }
    } catch (err) {
      console.error('Error fetching video banner:', err)
    }
  }

  // 4. Default: No valid video configured -> reset so clean placeholder appears!
  videoUrl.value = ''
  videoLink.value = ''
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
      adVideoRef.value.play().catch(() => {})
      isPlaying.value = true
    } else {
      adVideoRef.value.pause()
      isPlaying.value = false
    }
  }
}

watch(() => props.initialBanners, (val) => { if (val?.length) fetchBanners() }, { immediate: true })
watch(
  () => props.initialVideoUrl,
  () => {
    fetchVideoBanner()
  },
  { immediate: true },
)
watch(() => props.initialVideoLink, (val) => {
  if (val) videoLink.value = val
}, { immediate: true })
watch(
  () => props.initialBrands,
  (val) => {
    if (val?.length && brandsList.value.length === 0) {
      brandsList.value = val
      isBrandsLoading.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('negm_video_banner_updated', fetchVideoBanner)
  if (!props.controlled) {
    fetchBanners()
  }
  fetchVideoBanner()
  timer = window.setInterval(nextSlide, slideDelayMs)
})

onBeforeUnmount(() => {
  window.removeEventListener('negm_video_banner_updated', fetchVideoBanner)
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

            <!-- ✅ Search Inputs Row: Text Search + Dedicated Ad ID Field -->
            <div class="mb-5 d-flex gap-2 align-center search-inputs-row w-100">
              <VTextField
                v-model="smartSearch"
                :placeholder="t('searchPlaceholder')"
                density="compact"
                variant="outlined"
                hide-details
                prepend-inner-icon="tabler-search"
                @keydown.enter.prevent="onSearch"
                @update:model-value="onSmartSearchInput"
                class="premium-id-input smart-search-input flex-grow-1"
                :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
              />

              <VTextField
                v-model="adIdSearch"
                :placeholder="t('adIdPlaceholder')"
                density="compact"
                variant="outlined"
                hide-details
                prepend-inner-icon="tabler-hash"
                :loading="isSearchingId"
                :disabled="isSearchingId"
                @keydown.enter.prevent="onAdIdSearch"
                @update:model-value="onAdIdInput"
                class="premium-id-input ad-id-search-input"
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

              <!-- Brand & Model Trigger Pickers (Matching Cars Page Modals) -->
              <div class="form-group">
                <div
                  class="filter-trigger-btn"
                  :class="{ 'has-value': !!filters.brandId }"
                  @click="openBrandDialog"
                >
                  <div class="filter-trigger-content">
                    <div class="filter-trigger-texts">
                      <span class="filter-trigger-label">{{ t('brand') }}</span>
                      <span class="filter-trigger-value">{{ selectedBrandName || t('all') }}</span>
                    </div>
                  </div>
                  <VIcon
                    v-if="filters.brandId"
                    icon="tabler-x"
                    size="16"
                    class="filter-trigger-clear"
                    @click.stop="clearBrand"
                  />
                  <VIcon v-else icon="tabler-chevron-down" size="16" class="filter-trigger-arrow" />
                </div>
              </div>

              <div class="form-group">
                <div
                  class="filter-trigger-btn"
                  :class="{ 'has-value': !!filters.modelId, 'is-disabled': !filters.brandId }"
                  @click="openModelDialog"
                >
                  <div class="filter-trigger-content">
                    <div class="filter-trigger-texts">
                      <span class="filter-trigger-label">{{ t('model') }}</span>
                      <span class="filter-trigger-value">
                        {{ selectedModelName || (filters.brandId ? t('all') : (locale === 'ar' ? 'اختر الماركة أولاً' : 'Select brand')) }}
                      </span>
                    </div>
                  </div>
                  <VIcon
                    v-if="filters.modelId"
                    icon="tabler-x"
                    size="16"
                    class="filter-trigger-clear"
                    @click.stop="clearModel"
                  />
                  <VIcon v-else icon="tabler-chevron-down" size="16" class="filter-trigger-arrow" />
                </div>
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
          <div class="hero-ad-area">
            <VCard class="premium-ad-card" elevation="10">
              <div class="ad-label">AD</div>
              <div class="ad-carousel-wrapper">
                <Transition name="fade" mode="out-in">
                  <div v-if="safeSlides.length > 0" :key="slideIndex" class="ad-slide-wrapper">
                    <div
                      class="ad-slide"
                      :class="{ 'clickable-ad': hasValidLink(safeSlides[slideIndex]?.link) }"
                      @click="openBannerLink(safeSlides[slideIndex]?.link)"
                    >
                      <!-- Background Ambient Blur -->
                      <div
                        class="ad-image-blur"
                        :style="{ backgroundImage: `url(${safeSlides[slideIndex].image})` }"
                      />
                      <!-- Main Image Container (Zero Cut-Off / 100% Fit) -->
                      <img
                        :src="safeSlides[slideIndex].image"
                        class="ad-image-main animate-ken-burns"
                        alt="Hero Banner"
                      />
                    </div>
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
                        <span class="text-h6 font-weight-black">01055353377</span>
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

                <!-- Action Button at Bottom Right of Banner -->
                <button
                  v-if="safeSlides.length > 0"
                  type="button"
                  class="ad-link-btn"
                  title="فتح رابط الإعلان"
                  @click.stop.prevent="openBannerLink(safeSlides[slideIndex]?.link)"
                >
                  <VIcon icon="tabler-external-link" size="14" />
                  <span>فتح الإعلان</span>
                </button>
              </div>
            </VCard>
          </div>

          <!-- Bottom: Video Ad Area -->
          <div class="hero-video-area">
            <VCard class="premium-video-card" elevation="10">
              <div class="video-label">PROMO</div>
              <div class="video-player-wrapper">
                <!-- 1. YouTube Video Embed -->
                <iframe
                  v-if="isYouTube"
                  :src="youtubeEmbedUrl"
                  class="ad-video-iframe"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>

                <!-- 2. Direct HTML5 Video (MP4 / WebM / Cloudinary) -->
                <video
                  v-else-if="videoUrl"
                  ref="adVideoRef"
                  :src="videoUrl"
                  autoplay
                  loop
                  muted
                  playsinline
                  preload="metadata"
                  class="ad-video"
                ></video>

                <!-- 3. Clean Placeholder if no video configured -->
                <div v-else class="video-empty-state">
                  <VIcon icon="tabler-player-play" size="44" class="empty-play-icon mb-2" />
                  <span class="empty-state-title">فيديو ترويجي</span>
                  <span class="empty-state-desc">يمكنك إضافة فيديو من لوحة التحكم</span>
                </div>
                
                <!-- Video Controls Overlay (for HTML5 Video) -->
                <div v-if="!isYouTube && videoUrl" class="video-controls">
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

                <!-- Action Button at Bottom Left of Video (if link is provided) -->
                <button
                  v-if="videoLink && hasValidLink(videoLink)"
                  type="button"
                  class="ad-link-btn video-link-btn"
                  title="فتح الرابط المرفق"
                  @click.stop.prevent="openBannerLink(videoLink)"
                >
                  <VIcon icon="tabler-external-link" size="14" />
                  <span>فتح الإعلان</span>
                </button>
              </div>
            </VCard>
          </div>
        </div>
      </div>
    </VContainer>

    <!-- Ad ID Not Found Snackbar -->
    <VSnackbar
      v-model="idNotFoundSnackbar"
      color="#181820"
      location="top"
      timeout="3500"
      elevation="12"
      class="rounded-xl border"
      style="border-color: rgba(255, 107, 0, 0.45) !important;"
    >
      <div class="d-flex align-center gap-3 py-1">
        <VIcon icon="tabler-alert-triangle" color="warning" size="24" />
        <span class="font-weight-bold text-white text-body-1">{{ idNotFoundMessage }}</span>
      </div>
    </VSnackbar>

    <!-- Brand Selection Dialog Modal -->
    <VDialog
      v-model="brandDialogOpen"
      max-width="640"
      scrollable
      class="filter-dialog"
    >
      <VCard rounded="xl" class="filter-modal-card" :class="isDark ? 'modal--dark' : 'modal--light'">
        <VCardTitle class="d-flex align-center justify-space-between pa-4 border-b">
          <span class="font-weight-black text-h6">{{ locale === 'ar' ? 'اختر الماركة' : 'Select Brand' }}</span>
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
          <div v-if="isBrandsLoading" class="text-center py-12">
            <VProgressCircular indeterminate color="primary" size="44" />
            <p class="mt-3 text-body-2 opacity-60">{{ locale === 'ar' ? 'جاري تحميل الماركات...' : 'Loading brands...' }}</p>
          </div>

          <div v-else>
            <!-- All Brands Option -->
            <div
              class="brand-tile brand-tile--all mb-3"
              :class="{ active: filters.brandId === null }"
              @click="selectBrand(null)"
            >
              <div class="d-flex align-center gap-3">
                <div class="brand-avatar-box">
                  <VIcon icon="tabler-apps" size="20" />
                </div>
                <span class="brand-tile-name font-weight-bold">{{ locale === 'ar' ? 'جميع الماركات' : 'All Brands' }}</span>
              </div>
              <VIcon v-if="filters.brandId === null" icon="tabler-check" color="primary" size="20" />
            </div>

            <!-- Brand Grid -->
            <div class="brand-grid">
              <div
                v-for="b in modalFilteredBrands"
                :key="b.id"
                class="brand-tile"
                :class="{ active: filters.brandId === b.id }"
                @click="selectBrand(b)"
              >
                <div class="d-flex align-center gap-3 w-100">
                  <div class="brand-avatar-box">
                    <span class="brand-initials">{{ String(b.name?.en || b.name || '').slice(0, 2).toUpperCase() }}</span>
                  </div>
                  <div class="d-flex flex-column text-start overflow-hidden">
                    <span class="brand-tile-name font-weight-bold text-truncate">{{ _t(b.name) }}</span>
                    <span v-if="b.name?.en && locale === 'ar'" class="text-caption opacity-50 text-truncate">{{ b.name.en }}</span>
                  </div>
                </div>
                <VIcon v-if="filters.brandId === b.id" icon="tabler-check" color="primary" size="18" class="ms-auto flex-shrink-0" />
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

    <!-- Model Selection Dialog Modal -->
    <VDialog
      v-model="modelDialogOpen"
      max-width="580"
      scrollable
      class="filter-dialog"
    >
      <VCard rounded="xl" class="filter-modal-card" :class="isDark ? 'modal--dark' : 'modal--light'">
        <VCardTitle class="d-flex align-center justify-space-between pa-4 border-b">
          <span class="font-weight-black text-h6">
            {{ locale === 'ar' ? 'اختر الموديل' : 'Select Model' }}
            <span v-if="selectedBrandName" class="text-primary text-subtitle-2 ms-1">({{ selectedBrandName }})</span>
          </span>
          <VBtn icon="tabler-x" variant="text" density="comfortable" @click="modelDialogOpen = false" />
        </VCardTitle>

        <div class="pa-4 border-b">
          <VTextField
            v-model="modelSearchQuery"
            :placeholder="locale === 'ar' ? 'ابحث عن الموديل...' : 'Search model...'"
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
          <div v-if="modelsLoading" class="text-center py-12">
            <VProgressCircular indeterminate color="primary" size="44" />
            <p class="mt-3 text-body-2 opacity-60">{{ locale === 'ar' ? 'جاري تحميل الموديلات...' : 'Loading models...' }}</p>
          </div>

          <div v-else>
            <!-- All Models Option -->
            <div
              class="brand-tile brand-tile--all mb-3"
              :class="{ active: filters.modelId === null }"
              @click="selectModel(null)"
            >
              <div class="d-flex align-center gap-3">
                <div class="brand-avatar-box">
                  <VIcon icon="tabler-apps" size="20" />
                </div>
                <span class="brand-tile-name font-weight-bold">{{ locale === 'ar' ? 'جميع الموديلات' : 'All Models' }}</span>
              </div>
              <VIcon v-if="filters.modelId === null" icon="tabler-check" color="primary" size="20" />
            </div>

            <!-- Model Grid -->
            <div class="model-grid">
              <div
                v-for="m in modalFilteredModels"
                :key="m.id"
                class="brand-tile"
                :class="{ active: filters.modelId === m.id }"
                @click="selectModel(m)"
              >
                <span class="brand-tile-name font-weight-bold text-truncate">{{ _t(m.name) }}</span>
                <VIcon v-if="filters.modelId === m.id" icon="tabler-check" color="primary" size="18" class="ms-auto flex-shrink-0" />
              </div>
            </div>

            <div v-if="modalFilteredModels.length === 0" class="text-center py-8 opacity-60">
              <VIcon icon="tabler-search-off" size="36" class="mb-2 opacity-50" />
              <p class="mb-0">{{ locale === 'ar' ? 'لا توجد موديلات متاحة' : 'No models available' }}</p>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  padding-block: 14px 36px;
  min-height: auto;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero__container {
  padding-top: 4px !important;
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
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 32px !important;
  padding: 28px !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
  }
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

.ad-id-search-input {
  width: 140px;
  min-width: 115px;
  max-width: 155px;
  flex-shrink: 0;
}

.ad-id-search-input :deep(.v-field__input) {
  font-family: inherit;
  font-size: 0.85rem !important;
}

@media (max-width: 600px) {
  .ad-id-search-input {
    width: 115px !important;
    min-width: 100px !important;
  }
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

.ad-video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  z-index: 1;
}

.video-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 220px;
  padding: 24px;
  background: radial-gradient(circle at center, rgba(255, 107, 0, 0.08) 0%, rgba(15, 17, 26, 0.95) 75%);
  text-align: center;
}

.empty-play-icon {
  color: #FF6B00;
  opacity: 0.7;
}

.empty-state-title {
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 4px;
}

.empty-state-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.video-link-btn {
  bottom: 24px !important;
  left: 24px !important;
  right: auto !important;
  z-index: 10;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0b0d14;

  &.clickable-ad {
    cursor: pointer;
  }
}

.ad-image-blur {
  position: absolute;
  inset: -15px;
  background-size: cover;
  background-position: center;
  filter: blur(28px) brightness(0.45);
  opacity: 0.65;
  transform: scale(1.15);
  z-index: 1;
}

.ad-image-main {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  z-index: 2;
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
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
    transform: scale(1.06);
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

/* Small Ad Link Button (Bottom Right) */
.ad-link-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 12;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(15, 17, 26, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 107, 0, 0.5);
  border-radius: 99px;
  color: #ffffff !important;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 107, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  &:hover {
    background: #FF6B00;
    border-color: #FF6B00;
    color: #ffffff !important;
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 6px 20px rgba(255, 107, 0, 0.5);
  }

  &.ad-link-btn--contact {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(15, 17, 26, 0.8);

    &:hover {
      background: #FF6B00;
      border-color: #FF6B00;
    }
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
    gap: 16px;
  }
  .premium-ad-card, .premium-video-card {
    min-height: 220px !important;
  }
}

@media (max-width: 600px) {
  .hero {
    padding-block: 8px 24px;
  }
  .hero__container {
    padding-inline: 10px;
    padding-top: 0 !important;
  }
  .premium-search-card {
    padding: 16px !important;
    border-radius: 20px !important;
  }
  .search-form-grid {
    grid-template-columns: 1fr;
    gap: 10px !important;
  }
  .group-label {
    font-size: 9.5px !important;
    letter-spacing: 0.8px !important;
  }
  .toggle-btn {
    height: 32px !important;
    font-size: 11.5px !important;
    padding: 0 8px !important;
  }
  .premium-input :deep(.v-field) {
    height: 42px !important;
    border-radius: 14px !important;
  }
  .premium-input :deep(.v-field__input) {
    min-height: 42px !important;
    font-size: 13px !important;
  }
  .premium-id-input :deep(.v-field) {
    height: 42px !important;
    border-radius: 14px !important;
  }
  .premium-id-input :deep(.v-field__input) {
    min-height: 42px !important;
    font-size: 0.85rem !important;
  }
  .search-actions-row {
    gap: 8px !important;
    margin-top: 14px !important;
  }
  .search-main-btn {
    height: 46px !important;
    font-size: 15px !important;
    border-radius: 14px !important;
  }
  .sell-side-btn {
    height: 46px !important;
    font-size: 14px !important;
    border-radius: 14px !important;
    padding-inline: 12px !important;
  }
  .ad-label, .video-label {
    top: 12px !important;
    right: 12px !important;
    padding: 4px 10px !important;
    font-size: 9px !important;
  }
  .video-controls {
    bottom: 12px !important;
    right: 12px !important;
    padding: 4px 8px !important;
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
    margin-bottom: 12px !important;
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

/* =========================================
   Filter Trigger Buttons (Desktop & Mobile)
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

.filter-trigger-btn:hover:not(.is-disabled) {
  border-color: rgba(255, 109, 0, 0.5);
  background: rgba(255, 109, 0, 0.06);
}

.filter-trigger-btn.has-value {
  border-color: rgba(255, 109, 0, 0.6);
  background: rgba(255, 109, 0, 0.08);
}

.filter-trigger-btn.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.filter-trigger-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
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
   Brand & Model Dialog Modals (Light & Dark Theme)
   ========================================= */
.filter-dialog :deep(.v-overlay__content) {
  margin: 16px;
}

.filter-modal-card {
  border: 1.5px solid rgba(255, 109, 0, 0.3) !important;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

/* Default / Dark Mode */
.modal--dark.filter-modal-card {
  background: rgb(18, 24, 38) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 109, 0, 0.15) !important;
}

.modal--dark .v-card-title {
  color: #ffffff !important;
}

.modal--dark .modal-search-field :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

.modal--dark .brand-tile {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.modal--dark .brand-tile:hover {
  background: rgba(255, 109, 0, 0.1);
  border-color: rgba(255, 109, 0, 0.4);
}

.modal--dark .brand-tile.active {
  background: rgba(255, 109, 0, 0.15);
  border-color: rgba(255, 109, 0, 0.8);
  box-shadow: 0 4px 15px rgba(255, 109, 0, 0.2);
}

.modal--dark .brand-tile--all {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.15);
}

.modal--dark .brand-avatar-box {
  background: rgba(255, 255, 255, 0.06);
}

.modal--dark .brand-tile-name {
  color: #ffffff !important;
}

/* Light Mode - Matching Website Light Theme */
.modal--light.filter-modal-card {
  background: #ffffff !important;
  border: 1.5px solid rgba(255, 109, 0, 0.35) !important;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15), 0 0 30px rgba(255, 109, 0, 0.08) !important;
}

.modal--light .v-card-title {
  color: #0f172a !important;
}

.modal--light .border-b {
  border-bottom-color: #e2e8f0 !important;
}

.modal--light .v-card-title :deep(.v-btn) {
  color: #0f172a !important;
}

.modal--light .modal-search-field :deep(.v-field) {
  border-radius: 12px !important;
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

.modal--light .modal-search-field :deep(input) {
  color: #0f172a !important;
}

.modal--light .modal-search-field :deep(input::placeholder) {
  color: #94a3b8 !important;
}

.modal--light .brand-tile {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

.modal--light .brand-tile:hover {
  background: rgba(255, 109, 0, 0.06) !important;
  border-color: rgba(255, 109, 0, 0.4) !important;
}

.modal--light .brand-tile.active {
  background: rgba(255, 109, 0, 0.1) !important;
  border-color: #ff6d00 !important;
  box-shadow: 0 4px 15px rgba(255, 109, 0, 0.15) !important;
}

.modal--light .brand-tile-name {
  color: #0f172a !important;
}

.modal--light .brand-avatar-box {
  background: #edf2f7 !important;
  border: 1px solid #cbd5e1 !important;
  color: #ff6d00 !important;
}

.modal--light .brand-initials {
  color: #ff6d00 !important;
}

.modal--light .brand-tile--all {
  border-style: dashed !important;
  border-color: #cbd5e1 !important;
}

.modal--light .modal-scroll-body p {
  color: #475569 !important;
}

.modal--light .text-caption {
  color: #64748b !important;
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.brand-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.brand-avatar-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ff6d00;
}

.brand-initials {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brand-tile-name {
  font-size: 13px;
}
</style>



