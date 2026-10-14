<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import carsUserApi from '@/api/user/carUserApi.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import modelUserApi from '@/api/user/modelUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import { customBrandFilter, sortBrands, matchBrand, brandArabicMap, translateText } from '@/utils/brandTranslations.js'

definePage({
  meta: { layout: 'front', public: true },
})

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const vuetifyTheme = useTheme()
const isDark = computed(() => vuetifyTheme.current.value.dark)

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

const _t = (val, parentObj = null) => {
  return translateText(val, locale.value || 'ar', parentObj)
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
const currentOffset = ref(20)
const brands = ref([])
const draftModels = ref([])
const isAdvancedOpen = ref(false)

// Brand & Model Picker Dialog State
const brandsLoading = ref(false)
const modelsLoading = ref(false)
const brandDialogOpen = ref(false)
const modelDialogOpen = ref(false)
const brandSearchQuery = ref('')
const modelSearchQuery = ref('')
const scrollTrigger = ref(null)
let scrollObserver = null

const draft = ref({
  q: '',
  adId: '',
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
const perPage = ref(Number(firstQueryVal(route.query.perPage) || 20))

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
  } else if (q['filter[is_import]'] === 'available_for_import' || q['filter[is_import]'] === '2') {
    adCat = 'available_for_import'
  } else if (q['filter[is_import]'] === '1') {
    adCat = 'imported'
  } else if (q['filter[is_import]'] === '0') {
    adCat = 'local'
  }

  draft.value = {
    q: String(firstQueryVal(q['filter[global]']) || ''),
    adId: '',
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
  } else if (d.adCategory === 'available_for_import') {
    params['filter[is_import]'] = 'available_for_import'
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
    
    // Fetch main filtered results (single API request)
    const res = await carsUserApi.getAll(mainParams)
    const { items, total: tt } = normalizeCars(res.data)

    cars.value = items.map(normalizeFavFields)
    total.value = tt
    currentOffset.value = items.length
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

const onTextSearchInput = (val) => {
  if (!val) {
    draft.value.q = ''
    return
  }
  const converted = String(val)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  if (draft.value.q !== converted) {
    nextTick(() => {
      draft.value.q = converted
    })
  }
}

const onAdIdInput = (val) => {
  if (!val) {
    draft.value.adId = ''
    return
  }
  let clean = String(val)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  clean = clean.replace(/[^0-9#]/g, '')
  if (clean.startsWith('#')) {
    clean = '#' + clean.slice(1).replace(/[^0-9]/g, '').slice(0, 7)
  } else {
    clean = clean.replace(/[^0-9]/g, '').slice(0, 7)
  }
  if (draft.value.adId !== clean) {
    nextTick(() => {
      draft.value.adId = clean
    })
  }
}

const isSearchingId = ref(false)
const idNotFoundSnackbar = ref(false)
const idNotFoundMessage = ref('')

const handleAdIdSearch = async () => {
  const adIdValue = draft.value.adId?.trim()?.replace(/[^0-9]/g, '')
  if (!adIdValue) return

  try {
    isSearchingId.value = true
    const res = await carsUserApi.getById(adIdValue)
    const data = res.data?.data ?? res.data
    if (data && data.status === 'approved') {
      router.push(`/user/cars/${adIdValue}`)
      draft.value.adId = ''
    } else {
      idNotFoundMessage.value = t('adNotFoundMsg', { id: adIdValue })
      idNotFoundSnackbar.value = true
    }
  } catch (e) {
    idNotFoundMessage.value = t('adNotFoundMsg', { id: adIdValue })
    idNotFoundSnackbar.value = true
  } finally {
    isSearchingId.value = false
  }
}

const applyFilters = async () => {
  // If user entered an Ad ID, validate it first without leaving the page
  const adIdValue = draft.value.adId?.trim()?.replace(/[^0-9]/g, '')
  if (adIdValue) {
    await handleAdIdSearch()
    return
  }

  const query = { ...route.query }
  delete query.page // Reset to first page on filter change

  const d = draft.value

  let detectedBrandId = d.brandId
  let detectedModelId = d.modelId
  let detectedYear = null
  let queryText = d.q ? d.q.trim().toLowerCase()
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) : ''

  // Smart Parsing if text is provided
  if (queryText) {
    const yearMatch = queryText.match(/\b(19\d{2}|20\d{2})\b/)
    if (yearMatch) {
      detectedYear = Number(yearMatch[1])
      queryText = queryText.replace(yearMatch[0], '').trim()
    }
    
    const sortedBrands = [...brands.value].sort((a, b) => {
      const aLen = Math.max(a.name?.en?.length || 0, a.originalName?.en?.length || 0)
      const bLen = Math.max(b.name?.en?.length || 0, b.originalName?.en?.length || 0)
      return bLen - aLen
    })
    
    let foundBrandId = null
    for (const brand of sortedBrands) {
      if (matchBrand(brand, queryText)) {
        foundBrandId = brand.id
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
        if (!removed && (queryText === nameEn || queryText === nameAr)) {
          queryText = ''
        }
        break
      }
    }
    
    if (foundBrandId && foundBrandId !== detectedBrandId) {
      detectedBrandId = foundBrandId
      detectedModelId = null // Brand changed via text search
    }
    
    if (detectedBrandId) {
      try {
        const mRes = await modelUserApi.getAll({ 'filter[brand_id]': detectedBrandId })
        const models = mRes.data?.data || mRes.data || []
        const sortedModels = [...models].sort((a, b) => (b.name?.en?.length || 0) - (a.name?.en?.length || 0))
        
        let foundModelId = null
        for (const model of sortedModels) {
          const mNameEn = String(model.name?.en || model.name || '').toLowerCase()
          if (mNameEn && queryText.includes(mNameEn)) {
            foundModelId = model.id
            queryText = queryText.replace(mNameEn, '').trim()
            break
          }
        }
        
        if (foundModelId) {
          detectedModelId = foundModelId
        }
      } catch (e) {
         console.error('Failed to parse models', e)
      }
    }
    

    
    // Auto-detect vehicle type (car or bike) based on text or brand
    const bikeKeywords = ['m1000rr', 's1000rr', 'gsxr', 'ninja', 'cbr', 'yzf', 'ducati', 'yamaha', 'kawasaki', 'harley', 'ktm']
    const textLower = queryText.toLowerCase() || (idValue ? idValue.toLowerCase() : '')
    const isBikeKeyword = bikeKeywords.some(k => textLower.includes(k))
    
    let isBikeBrand = false
    if (detectedBrandId) {
      const brandObj = brands.value.find(b => b.id === detectedBrandId)
      if (brandObj && brandObj.type === 'motorcycle') {
        isBikeBrand = true
      }
    }
    
    if (isBikeKeyword || isBikeBrand) {
      d.type = 'motorcycle'
    } else if (detectedBrandId) {
      const brandObj = brands.value.find(b => b.id === detectedBrandId)
      if (brandObj && brandObj.type === 'car') {
        d.type = 'car'
      }
    }
  }

  // If we fully parsed into brand, we can clear global search. Otherwise send original text.
  if (detectedBrandId || detectedYear) {
    delete query['filter[global]']
    // optionally, if there's still leftover text, we could put it in global, 
    // but typically users just write "bmw x6 2025"
    if (queryText && queryText.length > 1 && !detectedModelId) {
       query['filter[global]'] = queryText
    }
  } else if (d.q && d.q.trim()) {
    query['filter[global]'] = d.q.trim()
  } else {
    delete query['filter[global]']
  }

  if (d.type) query['filter[type]'] = d.type; else delete query['filter[type]']
  if (d.condition) query['filter[condition]'] = d.condition; else delete query['filter[condition]']
  
  if (detectedBrandId) query['filter[brand_id]'] = detectedBrandId; else delete query['filter[brand_id]']
  if (detectedModelId) query['filter[model_id]'] = detectedModelId; else delete query['filter[model_id]']
  
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
  } else if (d.adCategory === 'available_for_import') {
    query['filter[is_import]'] = 'available_for_import'
  } else if (d.adCategory === 'imported') {
    query['filter[is_import]'] = '1'
  } else if (d.adCategory === 'local') {
    query['filter[is_import]'] = '0'
  }

  if (d.featureIds?.length) query['filter[feature_ids]'] = d.featureIds.join(','); else delete query['filter[feature_ids]']

  if (detectedYear) {
    putBetween(query, 'year_between', detectedYear, detectedYear)
  } else {
    putBetween(query, 'year_between', d.yearFrom, d.yearTo)
  }
  
  putBetween(query, 'price_between', d.priceFrom, d.priceTo)
  putBetween(query, 'mileage_between', d.mileageFrom, d.mileageTo)

  if (sort.value) query.sort = sort.value; else delete query.sort

  router.push({ query })
}

const resetAll = () => {
  draft.value = {
    q: '',
    adId: '',
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

const handleApplyMobile = async () => {
  const adIdValue = draft.value.adId?.trim()?.replace(/[^0-9]/g, '')
  if (adIdValue) {
    await handleAdIdSearch()
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
  return sortBrands(items.filter(b => !b.type || b.type === type))
})

const selectedBrand = computed(() => {
  if (!draft.value.brandId) return null
  return brands.value.find(b => b.id === draft.value.brandId) || null
})

const selectedBrandName = computed(() => {
  if (!selectedBrand.value) return ''
  return _t(selectedBrand.value.name)
})

const selectedModel = computed(() => {
  if (!draft.value.modelId) return null
  return draftModels.value.find(m => m.id === draft.value.modelId) || null
})

const selectedModelName = computed(() => {
  if (!selectedModel.value) return ''
  return _t(selectedModel.value.name)
})

const modalFilteredBrands = computed(() => {
  const type = draft.value.type || 'car'
  let items = (brands.value || []).filter(b => !b.type || b.type === type)
  items = sortBrands(items)

  if (!brandSearchQuery.value.trim()) return items

  const q = brandSearchQuery.value.trim().toLowerCase()
  return items.filter(b => {
    const en = String(b.originalName?.en || b.name?.en || b.name || '').toLowerCase()
    const ar = String(b.originalName?.ar || b.name?.ar || '').toLowerCase()
    return en.includes(q) || ar.includes(q) || matchBrand(b, q)
  })
})

const modalFilteredModels = computed(() => {
  const items = draftModels.value || []
  if (!modelSearchQuery.value.trim()) return items
  const q = modelSearchQuery.value.trim().toLowerCase()
  return items.filter(m => {
    const en = String(m.name?.en || m.name || '').toLowerCase()
    const ar = String(m.name?.ar || '').toLowerCase()
    return en.includes(q) || ar.includes(q)
  })
})

const fetchBrands = async () => {
  if (brands.value.length > 0) return
  brandsLoading.value = true
  try {
    const res = await brandUserApi.getAll()
    brands.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Failed to fetch brands:', err)
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
    draft.value.modelId = null
    draftModels.value = []
  } else {
    draft.value.brandId = brand.id
    draft.value.modelId = null
  }
  brandDialogOpen.value = false
}

const clearBrand = () => {
  draft.value.brandId = null
  draft.value.modelId = null
  draftModels.value = []
}

const openModelDialog = () => {
  if (!draft.value.brandId) {
    openBrandDialog()
    return
  }
  modelDialogOpen.value = true
  modelSearchQuery.value = ''
}

const selectModel = (model) => {
  if (!model) {
    draft.value.modelId = null
  } else {
    draft.value.modelId = model.id
  }
  modelDialogOpen.value = false
}

const clearModel = () => {
  draft.value.modelId = null
}

const loadMoreCars = async () => {
  if (loading.value || loadingMore.value || cars.value.length >= total.value) return
  loadingMore.value = true

  try {
    const baseParams = buildParams(1)
    delete baseParams.page
    delete baseParams.perPage
    baseParams.offset = currentOffset.value
    baseParams.limit = 10

    const res = await carsUserApi.getAll(baseParams)
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

  // Only trigger when user is actively moving downwards
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

watch(() => draft.value.type, () => {
  draft.value.brandId = null
  draft.value.modelId = null
  draft.value.featureIds = []
  draft.value.transmission = null
  draft.value.fuelType = null
  draft.value.drivetrain = null
})

onMounted(() => {
  syncDraftFromQuery()
  fetchCars()

  // Only fetch brands if a brand filter is already present in URL query
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
        <div
          class="premium-horizontal-search"
          :class="isDark ? 'search--dark' : 'search--light'"
        >
          <!-- Main Search Row -->
          <div class="search-main-row">
            <!-- 1. Text Search & Ad ID -->
            <div class="search-col search-col-query d-flex gap-2 align-center">
              <VTextField
                v-model="draft.q"
                :placeholder="t('searchByIdOrText')"
                prepend-inner-icon="tabler-search"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input-field flex-grow-1"
                @keyup.enter="applyFilters"
                @update:model-value="onTextSearchInput"
                :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
              />
              <VTextField
                v-model="draft.adId"
                :placeholder="t('adIdPlaceholder')"
                prepend-inner-icon="tabler-hash"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="isSearchingId"
                :disabled="isSearchingId"
                class="premium-input-field ad-id-deck-input"
                @keyup.enter="handleAdIdSearch"
                @update:model-value="onAdIdInput"
                dir="ltr"
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
                  {{ t('cars') }}
                </button>
                <button
                  type="button"
                  class="horizontal-toggle-btn"
                  :class="{ active: draft.type === 'motorcycle' }"
                  @click="draft.type = 'motorcycle'"
                >
                  {{ t('bikes') }}
                </button>
              </div>
            </div>

            <!-- 3. Brand Picker -->
            <div class="search-col search-col-brand">
              <div
                class="filter-trigger-btn"
                :class="{ 'has-value': !!draft.brandId }"
                @click="openBrandDialog"
              >
                <div class="filter-trigger-content">
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

            <!-- 4. Model Picker -->
            <div class="search-col search-col-model">
              <div
                class="filter-trigger-btn"
                :class="{ 'has-value': !!draft.modelId, 'is-disabled': !draft.brandId }"
                @click="openModelDialog"
              >
                <div class="filter-trigger-content">
                  <div class="filter-trigger-texts">
                    <span class="filter-trigger-label">{{ t('model') }}</span>
                    <span class="filter-trigger-value">{{ selectedModelName || (draft.brandId ? t('all') : (locale === 'ar' ? 'اختر الماركة أولاً' : 'Select brand')) }}</span>
                  </div>
                </div>
                <VIcon
                  v-if="draft.modelId"
                  icon="tabler-x"
                  size="16"
                  class="filter-trigger-clear"
                  @click.stop="clearModel"
                />
                <VIcon v-else icon="tabler-chevron-down" size="16" class="filter-trigger-arrow" />
              </div>
            </div>

            <!-- Action Buttons (Reset and Advanced Filter) -->
            <div class="search-col search-col-actions">
              <VBtn
                variant="tonal"
                height="44"
                color="secondary"
                class="horizontal-reset-btn px-4"
                :title="t('resetAll')"
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
                <span>{{ isAdvancedOpen ? t('lessFilters') : t('moreFilters') }}</span>
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
                    <span class="filter-title">{{ t('condition') }}</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="premium-toggle premium-toggle--three">
                      <button
                        type="button"
                        class="premium-toggle__btn"
                        :class="{ active: draft.condition === '' }"
                        @click="draft.condition = ''"
                      >
                        {{ t('allCondition') }}
                      </button>
                      <button
                        type="button"
                        class="premium-toggle__btn"
                        :class="{ active: draft.condition === 'used' }"
                        @click="draft.condition = 'used'"
                      >
                        {{ t('usedCondition') }}
                      </button>
                      <button
                        type="button"
                        class="premium-toggle__btn"
                        :class="{ active: draft.condition === 'new' }"
                        @click="draft.condition = 'new'"
                      >
                        {{ t('newCondition') }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Card 2: Price Range -->
                <div class="filter-card">
                  <div class="filter-card-header">
                    <VIcon icon="tabler-currency-dollar" class="filter-icon" />
                    <span class="filter-title">{{ t('priceRangeEG') }}</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="d-flex gap-2">
                      <VTextField
                        v-model="displayDraftPriceFrom"
                        :placeholder="t('min')"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                        @keypress="isNumberKey"
                        maxlength="11"
                      />
                      <VTextField
                        v-model="displayDraftPriceTo"
                        :placeholder="t('max')"
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
                    <span class="filter-title">{{ t('year') }}</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="d-flex gap-2">
                      <VSelect
                        v-model="draft.yearFrom"
                        :items="Array.from({ length: 26 }, (_, i) => 2025 - i)"
                        :label="t('from')"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                      />
                      <VSelect
                        v-model="draft.yearTo"
                        :items="Array.from({ length: 26 }, (_, i) => 2025 - i).filter(y => !draft.yearFrom || y >= draft.yearFrom)"
                        :label="t('to')"
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
                    <span class="filter-title">{{ t('mileageKM') }}</span>
                  </div>
                  <div class="filter-card-body">
                    <div class="d-flex gap-2">
                      <VTextField
                        v-model="displayDraftMileageFrom"
                        :placeholder="t('min')"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="premium-input-field"
                        maxlength="7"
                        @keypress="isNumberKey"
                      />
                      <VTextField
                        v-model="displayDraftMileageTo"
                        :placeholder="t('max')"
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
                    <span class="filter-title">{{ t('transmission') }}</span>
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
                    <span class="filter-title">{{ t('fuelType') }}</span>
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
                    <VIcon icon="tabler-car" class="filter-icon" />
                    <span class="filter-title">{{ t('drivetrain') }}</span>
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
                    <VIcon icon="tabler-tag" class="filter-icon" />
                    <span class="filter-title">{{ t('classification') }}</span>
                  </div>
                  <div class="filter-card-body">
                    <VSelect
                      v-model="draft.adCategory"
                      :items="[
                        { title: t('all'), value: '' },
                        { title: t('featuredOnly'), value: 'featured' },
                        { title: t('bestDealsOnly'), value: 'best_deal' },
                        { title: t('importedOnly'), value: 'imported' },
                        { title: t('availableForImport'), value: 'available_for_import' },
                        { title: t('localOnly'), value: 'local' }
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
              <div class="d-flex justify-center mt-6 pt-4 advanced-submit-row">
                <VBtn
                  color="primary"
                  height="46"
                  min-width="240"
                  class="horizontal-search-btn px-8"
                  prepend-icon="tabler-sparkles"
                  @click="applyFilters"
                >
                  {{ t('searchVehicles') }}
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

          <div
            class="premium-search-box"
            :class="[
              { 'is-open': isMobileFilterOpen },
              isDark ? 'search--dark' : 'search--light'
            ]"
          >
            <!-- Mobile Header -->
            <div class="mobile-filter-header d-md-none d-flex align-center justify-space-between mb-4">
              <span class="text-h6 font-weight-bold mobile-filter-title">{{ t('filters') }}</span>
              <VBtn icon="tabler-x" variant="text" class="mobile-filter-close" density="comfortable" @click="isMobileFilterOpen = false" />
            </div>

            <!-- Scrollable Content on Mobile -->
            <div class="filter-scroll-content">
              <!-- Global Text Search & Ad ID on Mobile -->
              <div class="mb-4 d-flex gap-2 align-center">
                <VTextField
                  v-model="draft.q"
                  :placeholder="t('searchByIdOrText')"
                  prepend-inner-icon="tabler-search"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="premium-input flex-grow-1"
                  @keyup.enter="handleApplyMobile"
                  @update:model-value="onTextSearchInput"
                  :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
                />
                <VTextField
                  v-model="draft.adId"
                  :placeholder="t('adIdPlaceholder')"
                  prepend-inner-icon="tabler-hash"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :loading="isSearchingId"
                  :disabled="isSearchingId"
                  class="premium-input ad-id-mobile-input"
                  @keyup.enter="handleApplyMobile"
                  @update:model-value="onAdIdInput"
                  dir="ltr"
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
                    {{ t('cars') }}
                  </button>
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: draft.type === 'motorcycle' }"
                    @click="draft.type = 'motorcycle'"
                  >
                    {{ t('bikes') }}
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
                    {{ t('all') }}
                  </button>
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: draft.condition === 'used' }"
                    @click="draft.condition = 'used'"
                  >
                    {{ t('used') }}
                  </button>
                  <button
                    type="button"
                    class="premium-toggle__btn"
                    :class="{ active: draft.condition === 'new' }"
                    @click="draft.condition = 'new'"
                  >
                    {{ t('new') }}
                  </button>
                </div>
              </div>

              <!-- Brand & Model -->
              <div class="mb-3">
                <div
                  class="filter-trigger-btn filter-trigger-btn--mobile mb-3"
                  :class="{ 'has-value': !!draft.brandId }"
                  @click="openBrandDialog"
                >
                  <div class="filter-trigger-content">
                    <div class="filter-trigger-texts">
                      <span class="filter-trigger-label">{{ t('brand') }}</span>
                      <span class="filter-trigger-value">{{ selectedBrandName || t('all') }}</span>
                    </div>
                  </div>
                  <VIcon
                    v-if="draft.brandId"
                    icon="tabler-x"
                    size="18"
                    class="filter-trigger-clear"
                    @click.stop="clearBrand"
                  />
                  <VIcon v-else icon="tabler-chevron-down" size="18" class="filter-trigger-arrow" />
                </div>

                <div
                  class="filter-trigger-btn filter-trigger-btn--mobile"
                  :class="{ 'has-value': !!draft.modelId, 'is-disabled': !draft.brandId }"
                  @click="openModelDialog"
                >
                  <div class="filter-trigger-content">
                    <div class="filter-trigger-texts">
                      <span class="filter-trigger-label">{{ t('model') }}</span>
                      <span class="filter-trigger-value">{{ selectedModelName || (draft.brandId ? t('all') : (locale === 'ar' ? 'اختر الماركة أولاً' : 'Select brand')) }}</span>
                    </div>
                  </div>
                  <VIcon
                    v-if="draft.modelId"
                    icon="tabler-x"
                    size="18"
                    class="filter-trigger-clear"
                    @click.stop="clearModel"
                  />
                  <VIcon v-else icon="tabler-chevron-down" size="18" class="filter-trigger-arrow" />
                </div>
              </div>

              <!-- Price -->
              <div class="mb-4">
                <div class="input-label-mini">{{ t('priceEG') }}</div>
                <VRow dense>
                  <VCol cols="6">
                    <VTextField
                      v-model="displayDraftPriceFrom"
                      :placeholder="t('min')"
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
                      :placeholder="t('max')"
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
                <div class="input-label-mini">{{ t('year') }}</div>
                <VRow dense>
                  <VCol cols="6">
                    <VSelect
                      v-model="draft.yearFrom"
                      :items="Array.from({ length: 26 }, (_, i) => 2025 - i)"
                      :label="t('from')"
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
                      :label="t('to')"
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
                <div class="input-label-mini mb-2">{{ t('technicalDetails') }}</div>
                
                <div class="technical-details-section">
                  <!-- Transmission -->
                  <div class="mb-4">
                    <VSelect
                      v-model="draft.transmission"
                      :items="transmissionOptions"
                      item-value="value"
                      item-title="title"
                      :label="t('transmission')"
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
                      :label="t('fuelType')"
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
                      :label="t('drivetrain')"
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
                        { title: t('all'), value: '' },
                        { title: t('featuredOnly'), value: 'featured' },
                        { title: t('bestDealsOnly'), value: 'best_deal' },
                        { title: t('importedOnly'), value: 'imported' },
                        { title: t('availableForImport'), value: 'available_for_import' },
                        { title: 'Local Only', value: 'local' }
                      ]"
                      item-value="value"
                      item-title="title"
                      :label="t('classification')"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      class="premium-input"
                    />
                  </div>
                </div>

                <div class="input-label-mini mb-1">{{ t('mileageKM') }}</div>
                <VRow dense class="mb-3">
                  <VCol cols="6">
                    <VTextField
                      v-model="displayDraftMileageFrom"
                      :placeholder="t('min')"
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
                      :placeholder="t('max')"
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
                {{ t('applyFilters') }}
              </VBtn>

              <VBtn block variant="text" color="secondary" size="small" @click="handleResetMobile">
                {{ t('resetAll') }}
              </VBtn>
            </div>
          </div>
        </VCol>

        <!-- Results -->
        <VCol cols="12">
          <VCard
            class="pa-6 results-container-card"
            :class="isDark ? 'results-card--dark' : 'results-card--light'"
            rounded="xl"
            elevation="0"
          >
            <div class="d-flex align-center justify-space-between mb-8">
              <div>
                <h1 class="text-h4 font-weight-black mb-1">
                  {{ draft.type === 'motorcycle' ? t('bikes') : t('cars') }}
                </h1>
                <p class="text-body-2 opacity-60 mb-0">
                  {{ draft.type === 'motorcycle'
                    ? (locale === 'ar' ? `${total.toLocaleString()} دراجة نارية متاحة` : `${total.toLocaleString()} motorcycles available`)
                    : t('carsAvailable', { count: total })
                  }}
                </p>
              </div>
              
              <VSelect
                v-model="sort"
                :items="[
                  { title: t('newest'), value: '-created_at' },
                  { title: t('priceLowToHigh'), value: 'price' },
                  { title: t('priceHighToLow'), value: '-price' },
                ]"
                :label="t('sortBy')"
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
              <VIcon :icon="draft.type === 'motorcycle' ? 'tabler-motorbike' : 'tabler-car-off'" size="80" class="mb-4 opacity-10" />
              <h3 class="text-h5 opacity-50 mb-2">
                {{ draft.type === 'motorcycle' ? (locale === 'ar' ? 'لم يتم العثور على دراجات نارية مطابقة' : 'No matching motorcycles found') : t('noMatchingVehiclesFound') }}
              </h3>
              <p class="text-body-1 opacity-40 mb-6">{{ t('tryAdjustingFilters') }}</p>
              <VBtn variant="flat" color="primary" @click="resetAll">{{ t('clearAllFilters') }}</VBtn>
            </div>

            <!-- User-initiated Load More Button (10 vehicles per click) -->
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
                <span>{{ locale === 'ar' ? (draft.type === 'motorcycle' ? 'عرض المزيد من الدراجات (+10)' : 'عرض المزيد من السيارات (+10)') : (draft.type === 'motorcycle' ? 'Load More Motorcycles (+10)' : 'Load More Vehicles (+10)') }}</span>
                <span class="ms-3 text-caption opacity-80 font-weight-bold">({{ cars.length }} / {{ total.toLocaleString() }})</span>
              </VBtn>
            </div>

            <div v-else-if="cars.length > 0 && !hasMore && !loading" class="text-center my-8 opacity-60 text-caption font-weight-bold">
              {{ locale === 'ar' ? (draft.type === 'motorcycle' ? `✨ تم عرض جميع الدراجات النارية المتاحة (${total})` : `✨ تم عرض جميع السيارات المتاحة (${total})`) : `✨ All ${total} ${draft.type === 'motorcycle' ? 'motorcycles' : 'vehicles'} loaded` }}
            </div>
          </VCard>
        </VCol>
      </VRow>
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

  <!-- Brand Selection Dialog Modal -->
  <VDialog
    v-model="brandDialogOpen"
    max-width="680"
    scrollable
    class="filter-dialog"
  >
    <VCard rounded="xl" class="filter-modal-card" :class="isDark ? 'modal--dark' : 'modal--light'">
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
                  <span class="brand-initials">{{ String(b.name?.en || b.name || '').slice(0, 2).toUpperCase() }}</span>
                </div>
                <div class="d-flex flex-column text-start overflow-hidden">
                  <span class="brand-tile-name font-weight-bold text-truncate">{{ _t(b.name) }}</span>
                  <span v-if="b.name?.en && locale === 'ar'" class="text-caption opacity-50 text-truncate">{{ b.name.en }}</span>
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

  <!-- Model Selection Dialog Modal -->
  <VDialog
    v-model="modelDialogOpen"
    max-width="580"
    scrollable
    class="filter-dialog"
  >
    <VCard rounded="xl" class="filter-modal-card" :class="isDark ? 'modal--dark' : 'modal--light'">
      <VCardTitle class="d-flex align-center justify-space-between pa-4 border-b">
        <div class="d-flex align-center gap-2">
          <VIcon icon="tabler-steering-wheel" color="primary" size="24" />
          <span class="font-weight-black text-h6">
            {{ locale === 'ar' ? 'اختر الموديل' : 'Select Model' }}
            <span v-if="selectedBrandName" class="text-primary text-subtitle-2 ms-1">({{ selectedBrandName }})</span>
          </span>
        </div>
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
            :class="{ active: draft.modelId === null }"
            @click="selectModel(null)"
          >
            <div class="d-flex align-center gap-3">
              <div class="brand-avatar-box">
                <VIcon icon="tabler-apps" size="20" />
              </div>
              <span class="brand-tile-name font-weight-bold">{{ locale === 'ar' ? 'جميع الموديلات' : 'All Models' }}</span>
            </div>
            <VIcon v-if="draft.modelId === null" icon="tabler-check" color="primary" size="20" />
          </div>

          <!-- Model Grid -->
          <div class="model-grid">
            <div
              v-for="m in modalFilteredModels"
              :key="m.id"
              class="brand-tile model-tile"
              :class="{ active: draft.modelId === m.id }"
              @click="selectModel(m)"
            >
              <div class="d-flex align-center gap-2 w-100">
                <VIcon icon="tabler-chevron-left" size="14" class="opacity-50" />
                <span class="brand-tile-name font-weight-bold text-truncate">{{ _t(m.name) }}</span>
              </div>
              <VIcon v-if="draft.modelId === m.id" icon="tabler-check" color="primary" size="18" class="ms-auto flex-shrink-0" />
            </div>
          </div>

          <div v-if="modalFilteredModels.length === 0" class="text-center py-8 opacity-60">
            <p class="mb-0">{{ locale === 'ar' ? 'لا توجد موديلات متاحة' : 'No models available' }}</p>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.cars-page { padding: 40px 0; min-height: 100vh; }

/* Premium Horizontal Search Deck Styles */
.premium-horizontal-search {
  background: rgba(15, 20, 32, 0.85);
  border: 1.5px solid rgba(255, 109, 0, 0.5) !important;
  border-radius: 24px;
  padding: 20px 24px;
  margin-bottom: 30px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 109, 0, 0.15) !important;
}

.premium-horizontal-search:hover {
  border-color: rgba(255, 109, 0, 0.8) !important;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 109, 0, 0.25) !important;
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
  flex: 1.6;
}

.ad-id-deck-input {
  width: 125px;
  min-width: 105px;
  max-width: 135px;
  flex-shrink: 0;
}

.ad-id-mobile-input {
  width: 115px;
  min-width: 100px;
  flex-shrink: 0;
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
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px !important;
  display: flex;
  align-items: center;
}

.premium-input-field :deep(.v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: rgba(var(--v-theme-on-surface), 0.1) !important;
  transition: color 0.3s ease;
}

.premium-input-field :deep(.v-field:hover .v-field__outline) {
  color: rgba(var(--v-theme-on-surface), 0.2) !important;
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
  color: rgba(var(--v-theme-on-surface), 0.9) !important;
  font-size: 14px;
}

.premium-input-field :deep(.v-label) {
  color: rgba(var(--v-theme-on-surface), 0.5) !important;
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
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Type Toggle Bar */
.horizontal-toggle {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
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
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
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
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  background: rgba(var(--v-theme-on-surface), 0.03) !important;
  color: rgba(var(--v-theme-on-surface), 0.8) !important;
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
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 18px;
  padding: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-card:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.15);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
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
  color: rgba(var(--v-theme-on-surface), 0.6);
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
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  height: 42px;
}

.fuel-type-btn:hover, .transmission-btn:hover, .drivetrain-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-color: rgba(var(--v-theme-on-surface), 0.15);
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.fuel-type-btn.active, .transmission-btn.active, .drivetrain-btn.active {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 1);
  color: rgba(var(--v-theme-on-surface), 0.9);
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
  background: rgba(var(--v-theme-surface), 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
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
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 10px;
}

.input-label-mini {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.5;
  margin-bottom: 8px;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  transition: all 0.3s ease;
  color: rgba(var(--v-theme-on-surface), 0.9) !important;
}

.premium-input :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 0.8) !important;
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
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
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  padding: 3px;
  gap: 3px;
  height: 42px;
}

.premium-toggle__btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
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

.filter-trigger-btn--mobile {
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
   Brand & Model Dialog Modals
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

.model-tile {
  padding: 8px 12px;
}

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

/* Default / Dark helpers */
.advanced-submit-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.mobile-filter-title {
  color: #ffffff !important;
}

.mobile-filter-close {
  color: #ffffff !important;
}

.results-card--dark {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

/* =========================================
   LIGHT THEME STYLING FOR SEARCH & FILTERS
   ========================================= */
.search--light.premium-horizontal-search,
:deep(.v-theme--light) .premium-horizontal-search,
.v-theme--light .premium-horizontal-search {
  background: #ffffff !important;
  border: 1.5px solid rgba(255, 109, 0, 0.35) !important;
  box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 0 20px rgba(255, 109, 0, 0.06) !important;
}

.search--light.premium-horizontal-search:hover,
:deep(.v-theme--light) .premium-horizontal-search:hover,
.v-theme--light .premium-horizontal-search:hover {
  border-color: rgba(255, 109, 0, 0.75) !important;
  box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.12), 0 0 25px rgba(255, 109, 0, 0.15) !important;
}

/* Inputs in Light Mode */
.search--light .premium-input-field :deep(.v-field),
:deep(.v-theme--light) .premium-input-field :deep(.v-field),
.v-theme--light .premium-input-field :deep(.v-field) {
  background: #f8fafc !important;
  box-shadow: none !important;
}

.search--light .premium-input-field :deep(.v-field__outline),
:deep(.v-theme--light) .premium-input-field :deep(.v-field__outline),
.v-theme--light .premium-input-field :deep(.v-field__outline) {
  color: #cbd5e1 !important;
  --v-field-border-opacity: 1 !important;
}

.search--light .premium-input-field :deep(.v-field:hover .v-field__outline),
:deep(.v-theme--light) .premium-input-field :deep(.v-field:hover .v-field__outline),
.v-theme--light .premium-input-field :deep(.v-field:hover .v-field__outline) {
  color: rgba(255, 109, 0, 0.5) !important;
}

.search--light .premium-input-field :deep(.v-field--focused),
:deep(.v-theme--light) .premium-input-field :deep(.v-field--focused),
.v-theme--light .premium-input-field :deep(.v-field--focused) {
  background: #ffffff !important;
}

.search--light .premium-input-field :deep(.v-field--focused .v-field__outline),
:deep(.v-theme--light) .premium-input-field :deep(.v-field--focused .v-field__outline),
.v-theme--light .premium-input-field :deep(.v-field--focused .v-field__outline) {
  color: #ff6d00 !important;
  box-shadow: 0 0 0 3px rgba(255, 109, 0, 0.12) !important;
}

.search--light .premium-input-field :deep(.v-field__input),
:deep(.v-theme--light) .premium-input-field :deep(.v-field__input),
.v-theme--light .premium-input-field :deep(.v-field__input) {
  color: #0f172a !important;
  font-weight: 600 !important;
}

.search--light .premium-input-field :deep(input::placeholder),
:deep(.v-theme--light) .premium-input-field :deep(input::placeholder),
.v-theme--light .premium-input-field :deep(input::placeholder) {
  color: #94a3b8 !important;
  opacity: 1 !important;
}

.search--light .premium-input-field :deep(.v-field__prepend-inner),
.search--light .premium-input-field :deep(.v-field__append-inner),
:deep(.v-theme--light) .premium-input-field :deep(.v-field__prepend-inner),
:deep(.v-theme--light) .premium-input-field :deep(.v-field__append-inner),
.v-theme--light .premium-input-field :deep(.v-field__prepend-inner),
.v-theme--light .premium-input-field :deep(.v-field__append-inner) {
  color: #64748b !important;
}

.search--light .premium-input-field :deep(.v-label),
:deep(.v-theme--light) .premium-input-field :deep(.v-label),
.v-theme--light .premium-input-field :deep(.v-label) {
  color: #64748b !important;
}

/* Horizontal Type Toggle in Light Mode */
.search--light .horizontal-toggle,
:deep(.v-theme--light) .horizontal-toggle,
.v-theme--light .horizontal-toggle {
  background: #f1f5f9 !important;
  border: 1px solid #cbd5e1 !important;
}

.search--light .horizontal-toggle-btn,
:deep(.v-theme--light) .horizontal-toggle-btn,
.v-theme--light .horizontal-toggle-btn {
  color: #475569 !important;
  font-weight: 700;
  opacity: 1;
}

.search--light .horizontal-toggle-btn:hover:not(.active),
:deep(.v-theme--light) .horizontal-toggle-btn:hover:not(.active),
.v-theme--light .horizontal-toggle-btn:hover:not(.active) {
  color: #0f172a !important;
  background: rgba(0, 0, 0, 0.05) !important;
}

.search--light .horizontal-toggle-btn.active,
:deep(.v-theme--light) .horizontal-toggle-btn.active,
.v-theme--light .horizontal-toggle-btn.active {
  background: #ff6d00 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(255, 109, 0, 0.35) !important;
}

/* Brand & Model Trigger Buttons in Light Mode */
.search--light .filter-trigger-btn,
:deep(.v-theme--light) .filter-trigger-btn,
.v-theme--light .filter-trigger-btn {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
}

.search--light .filter-trigger-label,
:deep(.v-theme--light) .filter-trigger-label,
.v-theme--light .filter-trigger-label {
  color: #64748b !important;
  opacity: 1 !important;
  font-weight: 700;
}

.search--light .filter-trigger-value,
:deep(.v-theme--light) .filter-trigger-value,
.v-theme--light .filter-trigger-value {
  color: #0f172a !important;
  font-weight: 700;
}

.search--light .filter-trigger-arrow,
:deep(.v-theme--light) .filter-trigger-arrow,
.v-theme--light .filter-trigger-arrow {
  color: #64748b !important;
}

.search--light .filter-trigger-btn:hover:not(.is-disabled),
:deep(.v-theme--light) .filter-trigger-btn:hover:not(.is-disabled),
.v-theme--light .filter-trigger-btn:hover:not(.is-disabled) {
  border-color: rgba(255, 109, 0, 0.6) !important;
  background: rgba(255, 109, 0, 0.04) !important;
}

.search--light .filter-trigger-btn.has-value,
:deep(.v-theme--light) .filter-trigger-btn.has-value,
.v-theme--light .filter-trigger-btn.has-value {
  border-color: rgba(255, 109, 0, 0.7) !important;
  background: rgba(255, 109, 0, 0.07) !important;
}

.search--light .filter-trigger-btn.has-value .filter-trigger-value,
:deep(.v-theme--light) .filter-trigger-btn.has-value .filter-trigger-value,
.v-theme--light .filter-trigger-btn.has-value .filter-trigger-value {
  color: #ff6d00 !important;
}

/* Reset and Advanced Filter Action Buttons in Light Mode */
.search--light .horizontal-reset-btn,
.search--light .horizontal-advanced-btn,
:deep(.v-theme--light) .horizontal-reset-btn,
:deep(.v-theme--light) .horizontal-advanced-btn,
.v-theme--light .horizontal-reset-btn,
.v-theme--light .horizontal-advanced-btn {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
  font-weight: 700 !important;
}

.search--light .horizontal-reset-btn:hover,
.search--light .horizontal-advanced-btn:hover,
:deep(.v-theme--light) .horizontal-reset-btn:hover,
:deep(.v-theme--light) .horizontal-advanced-btn:hover,
.v-theme--light .horizontal-reset-btn:hover,
.v-theme--light .horizontal-advanced-btn:hover {
  background: rgba(255, 109, 0, 0.08) !important;
  border-color: rgba(255, 109, 0, 0.6) !important;
  color: #ff6d00 !important;
}

.search--light .horizontal-advanced-btn.active,
:deep(.v-theme--light) .horizontal-advanced-btn.active,
.v-theme--light .horizontal-advanced-btn.active {
  background: rgba(255, 109, 0, 0.12) !important;
  border-color: #ff6d00 !important;
  color: #ff6d00 !important;
}

/* Advanced Collapsible Section in Light Mode */
.search--light .search-advanced-panel,
:deep(.v-theme--light) .search-advanced-panel,
.v-theme--light .search-advanced-panel {
  border-top: 1px solid #e2e8f0 !important;
}

.search--light .advanced-submit-row,
:deep(.v-theme--light) .advanced-submit-row,
.v-theme--light .advanced-submit-row {
  border-top: 1px solid #e2e8f0 !important;
}

.search--light .filter-card,
:deep(.v-theme--light) .filter-card,
.v-theme--light .filter-card {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

.search--light .filter-card:hover,
:deep(.v-theme--light) .filter-card:hover,
.v-theme--light .filter-card:hover {
  background: #ffffff !important;
  border-color: rgba(255, 109, 0, 0.35) !important;
  box-shadow: 0 8px 25px rgba(15, 23, 42, 0.05) !important;
}

.search--light .filter-card-header .filter-title,
:deep(.v-theme--light) .filter-card-header .filter-title,
.v-theme--light .filter-card-header .filter-title {
  color: #475569 !important;
  font-weight: 800;
}

.search--light .filter-card-header .filter-icon,
:deep(.v-theme--light) .filter-card-header .filter-icon,
.v-theme--light .filter-card-header .filter-icon {
  color: #ff6d00 !important;
}

.search--light .premium-toggle,
:deep(.v-theme--light) .premium-toggle,
.v-theme--light .premium-toggle {
  background: #edf2f7 !important;
  border: 1px solid #cbd5e1 !important;
}

.search--light .premium-toggle__btn,
:deep(.v-theme--light) .premium-toggle__btn,
.v-theme--light .premium-toggle__btn {
  color: #475569 !important;
  font-weight: 700;
  opacity: 1;
}

.search--light .premium-toggle__btn.active,
:deep(.v-theme--light) .premium-toggle__btn.active,
.v-theme--light .premium-toggle__btn.active {
  background: #ff6d00 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3) !important;
}

.search--light .transmission-btn,
.search--light .fuel-type-btn,
.search--light .drivetrain-btn,
:deep(.v-theme--light) .transmission-btn,
:deep(.v-theme--light) .fuel-type-btn,
:deep(.v-theme--light) .drivetrain-btn,
.v-theme--light .transmission-btn,
.v-theme--light .fuel-type-btn,
.v-theme--light .drivetrain-btn {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
}

.search--light .transmission-btn:hover,
.search--light .fuel-type-btn:hover,
.search--light .drivetrain-btn:hover,
:deep(.v-theme--light) .transmission-btn:hover,
:deep(.v-theme--light) .fuel-type-btn:hover,
:deep(.v-theme--light) .drivetrain-btn:hover,
.v-theme--light .transmission-btn:hover,
.v-theme--light .fuel-type-btn:hover,
.v-theme--light .drivetrain-btn:hover {
  background: #f1f5f9 !important;
  border-color: rgba(255, 109, 0, 0.4) !important;
  color: #0f172a !important;
}

.search--light .transmission-btn.active,
.search--light .fuel-type-btn.active,
.search--light .drivetrain-btn.active,
:deep(.v-theme--light) .transmission-btn.active,
:deep(.v-theme--light) .fuel-type-btn.active,
:deep(.v-theme--light) .drivetrain-btn.active,
.v-theme--light .transmission-btn.active,
.v-theme--light .fuel-type-btn.active,
.v-theme--light .drivetrain-btn.active {
  background: rgba(255, 109, 0, 0.1) !important;
  border-color: #ff6d00 !important;
  color: #ff6d00 !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 109, 0, 0.15) !important;
}

/* Modals (Brand & Model Pickers) in Light Mode */
.modal--light.filter-modal-card,
:deep(.v-theme--light) .filter-modal-card,
.v-theme--light .filter-modal-card {
  background: #ffffff !important;
  border: 1.5px solid rgba(255, 109, 0, 0.3) !important;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15), 0 0 30px rgba(255, 109, 0, 0.08) !important;
}

.modal--light .v-card-title,
:deep(.v-theme--light) .filter-modal-card .v-card-title,
.v-theme--light .filter-modal-card .v-card-title {
  color: #0f172a !important;
}

.modal--light .border-b,
:deep(.v-theme--light) .filter-modal-card .border-b,
.v-theme--light .filter-modal-card .border-b {
  border-bottom-color: #e2e8f0 !important;
}

.modal--light .modal-search-field :deep(.v-field),
:deep(.v-theme--light) .modal-search-field :deep(.v-field),
.v-theme--light .modal-search-field :deep(.v-field) {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

.modal--light .modal-search-field :deep(input),
:deep(.v-theme--light) .modal-search-field :deep(input),
.v-theme--light .modal-search-field :deep(input) {
  color: #0f172a !important;
}

.modal--light .modal-search-field :deep(input::placeholder),
:deep(.v-theme--light) .modal-search-field :deep(input::placeholder),
.v-theme--light .modal-search-field :deep(input::placeholder) {
  color: #94a3b8 !important;
}

.modal--light .brand-tile,
:deep(.v-theme--light) .brand-tile,
.v-theme--light .brand-tile {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

.modal--light .brand-tile:hover,
:deep(.v-theme--light) .brand-tile:hover,
.v-theme--light .brand-tile:hover {
  background: rgba(255, 109, 0, 0.06) !important;
  border-color: rgba(255, 109, 0, 0.4) !important;
}

.modal--light .brand-tile.active,
:deep(.v-theme--light) .brand-tile.active,
.v-theme--light .brand-tile.active {
  background: rgba(255, 109, 0, 0.1) !important;
  border-color: #ff6d00 !important;
  box-shadow: 0 4px 15px rgba(255, 109, 0, 0.15) !important;
}

.modal--light .brand-tile-name,
:deep(.v-theme--light) .brand-tile-name,
.v-theme--light .brand-tile-name {
  color: #0f172a !important;
}

.modal--light .brand-avatar-box,
:deep(.v-theme--light) .brand-avatar-box,
.v-theme--light .brand-avatar-box {
  background: #edf2f7 !important;
  border: 1px solid #cbd5e1 !important;
}

.modal--light .brand-initials,
:deep(.v-theme--light) .brand-initials,
.v-theme--light .brand-initials {
  color: #ff6d00 !important;
}

.modal--light .brand-tile--all,
:deep(.v-theme--light) .brand-tile--all,
.v-theme--light .brand-tile--all {
  border-color: #cbd5e1 !important;
}

/* Mobile Search Drawer in Light Mode */
.search--light.premium-search-box,
:deep(.v-theme--light) .premium-search-box,
.v-theme--light .premium-search-box {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 -10px 40px rgba(15, 23, 42, 0.15) !important;
}

.search--light .mobile-filter-title,
:deep(.v-theme--light) .mobile-filter-title,
.v-theme--light .mobile-filter-title {
  color: #0f172a !important;
}

.search--light .mobile-filter-close,
:deep(.v-theme--light) .mobile-filter-close,
.v-theme--light .mobile-filter-close {
  color: #0f172a !important;
}

.search--light .filter-actions,
:deep(.v-theme--light) .filter-actions,
.v-theme--light .filter-actions {
  background: #ffffff !important;
  border-top: 1px solid #e2e8f0 !important;
}

.search--light .input-label-mini,
:deep(.v-theme--light) .input-label-mini,
.v-theme--light .input-label-mini {
  color: #475569 !important;
  opacity: 1 !important;
}

.search--light .premium-input :deep(.v-field),
:deep(.v-theme--light) .premium-input :deep(.v-field),
.v-theme--light .premium-input :deep(.v-field) {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

.search--light .premium-input :deep(input),
:deep(.v-theme--light) .premium-input :deep(input),
.v-theme--light .premium-input :deep(input) {
  color: #0f172a !important;
}

.search--light .filter-trigger-btn--mobile,
:deep(.v-theme--light) .filter-trigger-btn--mobile,
.v-theme--light .filter-trigger-btn--mobile {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
}

/* Results Card in Light Mode */
.results-card--light,
:deep(.v-theme--light) .results-container-card {
  background: #ffffff !important;
  border: 1px solid rgba(203, 213, 225, 0.7) !important;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04) !important;
}
</style>
