<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWindowScroll } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import carsUserApi from '@/api/user/carUserApi.js'
import { useCompareStore } from '@/stores/compare'
import { translateText } from '@/utils/brandTranslations.js'
import logoDark from '@images/logo/logo-dark.png'
import logoLight from '@images/logo/logo-light.png'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

definePage({
  meta: {
    layout: 'front',
    public: true,
  },
})

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const compareStore = useCompareStore()
const siteLogo = useGenerateImageVariant(logoLight, logoDark)
const API_BASE = import.meta.env.VITE_BASE_URL

const isAr = computed(() => (locale.value || 'ar') === 'ar')
const _t = (val, parentObj = null) => translateText(val, locale.value || 'ar', parentObj)

const loading = ref(false)
const error = ref('')
const cars = ref([])
const showDifferencesOnly = ref(false)
const copiedLink = ref(false)

// Sticky vehicle names bar when scrolling down past vehicle cards
const { y } = useWindowScroll()
const vehiclesPanelRef = ref(null)
const scrollContainerRef = ref(null)
const stickyScrollRef = ref(null)
const showStickyBar = ref(false)
const isNavLikelyHidden = ref(false)
let lastY = 0

watch(y, (currY) => {
  if (currY <= 50) {
    isNavLikelyHidden.value = false
    lastY = currY
  } else {
    const delta = currY - lastY
    if (delta > 6 && currY > 90) {
      isNavLikelyHidden.value = true
      lastY = currY
    } else if (delta < -5) {
      isNavLikelyHidden.value = false
      lastY = currY
    }
  }

  if (vehiclesPanelRef.value && cars.value.length >= 2) {
    const rect = vehiclesPanelRef.value.getBoundingClientRect()
    showStickyBar.value = rect.bottom < 85
  } else {
    showStickyBar.value = false
  }
})

const onTableHorizontalScroll = () => {
  if (scrollContainerRef.value && stickyScrollRef.value) {
    stickyScrollRef.value.scrollLeft = scrollContainerRef.value.scrollLeft
  }
}

const buildImg = (path) => {
  if (!path) return siteLogo.value
  const clean = String(path).replaceAll('\\', '/')
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
  if (!API_BASE) return clean
  return `${API_BASE.replace(/\/$/, '')}/${clean.replace(/^\//, '')}`
}

const getMainImage = (car) => {
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find(i => Number(i?.is_main) === 1) || imgs[0]
  return buildImg(main?.path)
}

const parseIdsFromQuery = () => {
  const raw = route.query.ids
  if (!raw) return []
  const str = Array.isArray(raw) ? raw.join(',') : String(raw)
  return [...new Set(
    str.split(',')
      .map(v => Number(v.trim()))
      .filter(n => Number.isInteger(n) && n > 0),
  )].slice(0, compareStore.maxCars)
}

const activeIds = computed(() => {
  const qIds = parseIdsFromQuery()
  return qIds.length ? qIds : compareStore.ids
})

const fetchCompareCars = async () => {
  const ids = activeIds.value
  if (!ids.length) {
    cars.value = []
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await carsUserApi.compare(ids)
    const list = res?.data?.data ?? res?.data ?? []
    cars.value = Array.isArray(list) ? list : []
    if (cars.value.length) {
      compareStore.syncCarsFromApi(cars.value)
    }
  } catch (err) {
    console.error('Failed to load comparison:', err)
    error.value = err?.response?.data?.message || (isAr.value ? 'تعذر تحميل بيانات المقارنة' : 'Failed to load comparison data')
    cars.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query.ids,
  () => {
    fetchCompareCars()
  },
)

onMounted(() => {
  compareStore.cancelCompareMode()
  const qIds = parseIdsFromQuery()
  if (!qIds.length && compareStore.ids.length) {
    router.replace({ query: { ids: compareStore.ids.join(',') } })
  } else {
    fetchCompareCars()
  }
})

// Numeric parser for highlighting winners
const parseNum = (val) => {
  if (val === null || val === undefined || val === '') return null
  const str = String(val).replace(/,/g, '')
  const match = str.match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const num = Number(match[0])
  return Number.isNaN(num) ? null : num
}

const getWinnerIds = (getter, mode = 'max') => {
  if (cars.value.length < 2) return new Set()
  const entries = cars.value
    .map(c => ({ id: c.id, val: parseNum(getter(c)) }))
    .filter(e => e.val !== null)

  if (entries.length < 2) return new Set()
  const values = entries.map(e => e.val)
  const target = mode === 'min' ? Math.min(...values) : Math.max(...values)
  const allEqual = values.every(v => v === target)
  if (allEqual) return new Set()

  return new Set(entries.filter(e => e.val === target).map(e => e.id))
}

const formatPrice = (val, currency = 'EGP') => {
  const n = Number(val)
  if (Number.isNaN(n)) return '—'
  return `${n.toLocaleString()} ${currency || 'EGP'}`
}

const formatMileage = (car) => {
  if (car.condition === 'new') return isAr.value ? '0 كم (زيرو)' : '0 Km (New)'
  if (car.mileage === null || car.mileage === undefined) return '—'
  return `${Number(car.mileage).toLocaleString()} ${isAr.value ? 'كم' : 'Km'}`
}

const formatImport = (car) => {
  const val = car?.is_import
  if (val === 'available_for_import' || val === 'available' || val === 2 || String(val) === '2') {
    return t('availableForImport')
  }
  if (val === true || val === 1 || String(val) === '1' || val === 'imported') {
    return t('imported')
  }
  return t('local')
}

const formatTransmission = (val) => {
  if (!val) return '—'
  const v = String(val).toLowerCase()
  if (v === 'automatic') return isAr.value ? 'أوتوماتيك' : 'Automatic'
  if (v === 'manual') return isAr.value ? 'مانيوال' : 'Manual'
  return val
}

const formatFuel = (val) => {
  if (!val) return '—'
  const map = {
    petrol: { ar: 'بنزين', en: 'Petrol' },
    diesel: { ar: 'ديزل', en: 'Diesel' },
    electric: { ar: 'كهرباء (EV)', en: 'Electric (EV)' },
    hybrid: { ar: 'هايبرد', en: 'Hybrid' },
    mild_hybrid: { ar: 'مايلد هايبرد', en: 'Mild Hybrid' },
    reev: { ar: 'REEV', en: 'REEV' },
  }
  const entry = map[String(val).toLowerCase()]
  return entry ? (isAr.value ? entry.ar : entry.en) : val
}

const formatDrivetrain = (val) => {
  if (!val) return '—'
  return String(val).toUpperCase()
}

const has360 = (car) => {
  const ext = Array.isArray(car?.exterior_360_images) && car.exterior_360_images.length > 0
  return ext || !!car?.interior_360_url || !!car?.model_3d_url
}

const getSellerName = (car) => {
  if (!car?.seller) return '—'
  return _t(car.seller.store_name, car.seller) || car.seller.name || '—'
}

const normalizePhone = (phone) => {
  if (!phone) return ''
  let p = String(phone).replace(/\D/g, '')
  if (p.startsWith('00')) p = p.slice(2)
  if (p.startsWith('01') && p.length === 11) return '20' + p.slice(1)
  if (p.startsWith('201') && p.length === 12) return p
  return p.length >= 8 ? p : ''
}

const getWhatsappUrl = (car) => {
  const raw = car?.whatsapp_number || car?.seller?.phone
  const phone = normalizePhone(raw)
  if (!phone) return ''
  const title = _t(car.title, car)
  const msg = isAr.value
    ? `مرحباً، مهتم بالسيارة: ${title} (رقم الإعلان: ${car.id})`
    : `Hi, I'm interested in: ${title} (Ad ID: ${car.id})`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

// Structured Comparison Sections
const sections = computed(() => {
  const defs = [
    {
      key: 'overview',
      title: isAr.value ? 'الأسعار والبيانات الأساسية' : 'Pricing & Overview',
      icon: 'tabler-tag',
      rows: [
        {
          key: 'price',
          label: isAr.value ? 'السعر' : 'Price',
          bestMode: 'min',
          rawValue: c => c.price,
          display: c => formatPrice(c.price, c.currency),
          isHighlight: true,
        },
        {
          key: 'old_price',
          label: isAr.value ? 'السعر قبل الخصم' : 'Previous Price',
          rawValue: c => c.old_price,
          display: c => (c.old_price ? formatPrice(c.old_price, c.currency) : '—'),
        },
        {
          key: 'condition',
          label: isAr.value ? 'الحالة' : 'Condition',
          rawValue: c => c.condition,
          display: c => (c.condition === 'new' ? t('newCondition') : t('usedCondition')),
        },
        {
          key: 'source',
          label: isAr.value ? 'المصدر' : 'Source',
          rawValue: c => formatImport(c),
          display: c => formatImport(c),
        },
        {
          key: 'brand',
          label: isAr.value ? 'الماركة' : 'Brand',
          rawValue: c => _t(c.brand?.name, c.brand),
          display: c => _t(c.brand?.name, c.brand) || '—',
        },
        {
          key: 'model',
          label: isAr.value ? 'الموديل' : 'Model',
          rawValue: c => _t(c.model?.name, c.model),
          display: c => _t(c.model?.name, c.model) || '—',
        },
        {
          key: 'year',
          label: isAr.value ? 'سنة الصنع' : 'Year',
          bestMode: 'max',
          rawValue: c => c.year,
          display: c => c.year || '—',
        },
        {
          key: 'mileage',
          label: isAr.value ? 'المسافة المقطوعة' : 'Mileage',
          bestMode: 'min',
          rawValue: c => (c.condition === 'new' ? 0 : c.mileage),
          display: c => formatMileage(c),
        },
        {
          key: 'color',
          label: isAr.value ? 'اللون' : 'Color',
          rawValue: c => c.color || '',
          display: c => c.color || '—',
        },
        {
          key: 'location',
          label: isAr.value ? 'الموقع' : 'Location',
          rawValue: c => `${_t(c.governorate?.name)} ${_t(c.city?.name)}`.trim(),
          display: (c) => {
            const gov = _t(c.governorate?.name, c.governorate)
            const city = _t(c.city?.name, c.city)
            return [city, gov].filter(Boolean).join('، ') || '—'
          },
        },
        {
          key: 'seller',
          label: isAr.value ? 'المعرض / البائع' : 'Showroom / Seller',
          rawValue: c => getSellerName(c),
          display: c => getSellerName(c),
        },
      ],
    },
    {
      key: 'specs',
      title: isAr.value ? 'الأداء والمواصفات الفنية' : 'Performance & Technical Specs',
      icon: 'tabler-engine',
      rows: [
        {
          key: 'horsepower',
          label: isAr.value ? 'القوة الحصانية' : 'Horsepower',
          bestMode: 'max',
          rawValue: c => c.horsepower,
          display: c => (c.horsepower ? `${c.horsepower} HP` : '—'),
        },
        {
          key: 'engine_capacity',
          label: isAr.value ? 'سعة المحرك' : 'Engine Capacity',
          bestMode: 'max',
          rawValue: c => c.engine_capacity,
          display: c => (c.engine_capacity ? (isNaN(Number(c.engine_capacity)) ? c.engine_capacity : `${c.engine_capacity} CC`) : '—'),
        },
        {
          key: 'cylinders',
          label: isAr.value ? 'عدد السلندرات' : 'Cylinders',
          rawValue: c => c.cylinders,
          display: c => c.cylinders || '—',
        },
        {
          key: 'torque',
          label: isAr.value ? 'عزم الدوران' : 'Torque',
          bestMode: 'max',
          rawValue: c => c.torque,
          display: c => (c.torque ? `${c.torque}` : '—'),
        },
        {
          key: 'acceleration',
          label: isAr.value ? 'التسارع (0-100)' : 'Acceleration (0-100)',
          bestMode: 'min',
          rawValue: c => c.acceleration,
          display: c => (c.acceleration ? `${c.acceleration}` : '—'),
        },
        {
          key: 'weight',
          label: isAr.value ? 'الوزن' : 'Weight',
          bestMode: 'min',
          rawValue: c => c.weight,
          display: c => (c.weight ? `${c.weight}` : '—'),
        },
        {
          key: 'transmission',
          label: isAr.value ? 'ناقل الحركة' : 'Transmission',
          rawValue: c => c.transmission,
          display: c => formatTransmission(c.transmission),
        },
        {
          key: 'fuel_type',
          label: isAr.value ? 'نوع الوقود' : 'Fuel Type',
          rawValue: c => c.fuel_type,
          display: c => formatFuel(c.fuel_type),
        },
        {
          key: 'drivetrain',
          label: isAr.value ? 'نظام الدفع' : 'Drivetrain',
          rawValue: c => c.drivetrain,
          display: c => formatDrivetrain(c.drivetrain),
        },
      ],
    },
    {
      key: 'media',
      title: isAr.value ? 'المعاينة والوسائط' : 'Inspection & Media',
      icon: 'tabler-view-360',
      rows: [
        {
          key: 'has_360',
          label: isAr.value ? 'معاينة 360° / 3D' : '360° / 3D View',
          rawValue: c => (has360(c) ? '1' : '0'),
          display: c => (has360(c) ? (isAr.value ? 'متوفر' : 'Available') : (isAr.value ? 'غير متوفر' : 'Not Available')),
        },
        {
          key: 'has_video',
          label: isAr.value ? 'فيديو مراجعة' : 'Video Review',
          rawValue: c => ((c.youtube_url || c.instagram_url) ? '1' : '0'),
          display: c => ((c.youtube_url || c.instagram_url) ? (isAr.value ? 'متوفر' : 'Available') : (isAr.value ? 'غير متوفر' : 'Not Available')),
        },
        {
          key: 'images_count',
          label: isAr.value ? 'عدد الصور' : 'Photos Count',
          bestMode: 'max',
          rawValue: c => (Array.isArray(c.images) ? c.images.length : 0),
          display: c => `${Array.isArray(c.images) ? c.images.length : 0}`,
        },
      ],
    },
  ]

  return defs
    .map((sec) => {
      const rows = sec.rows
        .map((row) => {
          const formatted = cars.value.map(c => row.display(c))
          const normalized = cars.value.map(c => String(row.rawValue(c) ?? '').trim().toLowerCase())
          const isDifferent = new Set(normalized).size > 1
          const winners = row.bestMode ? getWinnerIds(row.rawValue, row.bestMode) : new Set()
          return {
            ...row,
            formatted,
            isDifferent,
            winners,
          }
        })
        .filter(r => !showDifferencesOnly.value || r.isDifferent)

      return { ...sec, rows }
    })
    .filter(sec => sec.rows.length > 0)
})

// Union of all car features across compared vehicles
const featureMatrix = computed(() => {
  const map = new Map()
  for (const c of cars.value) {
    const feats = Array.isArray(c.features) ? c.features : []
    for (const f of feats) {
      if (!map.has(f.id)) {
        map.set(f.id, f)
      }
    }
  }

  return [...map.values()]
    .map((feat) => {
      const presence = cars.value.map(c => (c.features || []).some(f => Number(f.id) === Number(feat.id)))
      const isDifferent = new Set(presence).size > 1
      return {
        id: feat.id,
        name: _t(feat.name, feat),
        presence,
        isDifferent,
      }
    })
    .filter(row => !showDifferencesOnly.value || row.isDifferent)
})

// Quick verdict badges
const cheapestCar = computed(() => {
  const winners = getWinnerIds(c => c.price, 'min')
  const id = [...winners][0]
  return cars.value.find(c => c.id === id) || null
})
const newestCar = computed(() => {
  const winners = getWinnerIds(c => c.year, 'max')
  const id = [...winners][0]
  return cars.value.find(c => c.id === id) || null
})
const lowestMileageCar = computed(() => {
  const winners = getWinnerIds(c => (c.condition === 'new' ? 0 : c.mileage), 'min')
  const id = [...winners][0]
  return cars.value.find(c => c.id === id) || null
})
const highestHpCar = computed(() => {
  const winners = getWinnerIds(c => c.horsepower, 'max')
  const id = [...winners][0]
  return cars.value.find(c => c.id === id) || null
})

// Actions
const handleAddThirdCar = () => {
  const target = compareStore.enterAddCarMode()
  if (target) router.push(target)
}

const handleReplaceCar = (index) => {
  const target = compareStore.enterReplaceCarMode(index)
  if (target) router.push(target)
}

const handleRemoveCar = (id) => {
  compareStore.removeCar(id)
  const remaining = compareStore.ids
  if (remaining.length) {
    router.replace({ query: { ids: remaining.join(',') } })
  } else {
    router.replace({ query: {} })
    cars.value = []
  }
}

const handleClearAll = () => {
  compareStore.clearAll()
  cars.value = []
  router.replace({ query: {} })
}

const startPickingFromScratch = () => {
  compareStore.isCompareMode = true
  compareStore.persist()
  router.push(compareStore.getBrowseRoute())
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copiedLink.value = true
    setTimeout(() => { copiedLink.value = false }, 2200)
  } catch {
    // ignore clipboard fallback
  }
}

const gridColumnsStyle = computed(() => {
  const cols = cars.value.length + (cars.value.length < compareStore.maxCars ? 1 : 0)
  return {
    '--compare-cols': Math.max(cols, 2),
  }
})
</script>

<template>
  <section class="compare-page py-8 py-md-12">
    <VContainer>
      <!-- Page Header -->
      <div class="compare-hero-bar pa-5 pa-md-6 rounded-2xl mb-6">
        <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-4">
          <div>
            <div class="d-inline-flex align-center gap-2 compare-eyebrow mb-2">
              <VIcon icon="tabler-arrows-diff" size="16" />
              <span>{{ isAr ? 'مقارنة ذكية جنباً إلى جنب' : 'Smart Side-by-Side Comparison' }}</span>
            </div>
            <h1 class="text-h4 text-md-h3 font-weight-black mb-1">
              {{ t('compareVehicles') }}
            </h1>
            <p class="text-body-2 opacity-75 mb-0">
              {{
                isAr
                  ? 'قارن الأسعار، الأداء، التجهيزات والكماليات بين السيارات الحقيقية المتاحة على المنصة.'
                  : 'Compare real vehicles on the marketplace across pricing, specs, performance, and features.'
              }}
            </p>
          </div>

          <div v-if="cars.length >= 2" class="d-flex flex-wrap align-center gap-3">
            <VSwitch
              v-model="showDifferencesOnly"
              color="primary"
              hide-details
              density="compact"
              :label="isAr ? 'الاختلافات فقط' : 'Differences Only'"
              class="compare-diff-switch"
            />

            <VBtn
              v-if="cars.length < compareStore.maxCars"
              color="info"
              variant="elevated"
              rounded="pill"
              prepend-icon="tabler-plus"
              class="font-weight-bold"
              @click="handleAddThirdCar"
            >
              {{ isAr ? 'إضافة سيارة ثالثة' : 'Add 3rd Vehicle' }}
            </VBtn>

            <VBtn
              variant="tonal"
              color="primary"
              rounded="pill"
              :prepend-icon="copiedLink ? 'tabler-check' : 'tabler-share'"
              @click="copyShareUrl"
            >
              {{ copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مشاركة' : 'Share') }}
            </VBtn>

            <VBtn
              variant="text"
              color="error"
              rounded="pill"
              prepend-icon="tabler-trash"
              @click="handleClearAll"
            >
              {{ isAr ? 'مسح' : 'Clear' }}
            </VBtn>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="46" width="4" class="mb-4" />
        <div class="text-body-1 font-weight-bold opacity-75">
          {{ isAr ? 'جاري تجهيز المقارنة...' : 'Loading comparison...' }}
        </div>
      </div>

      <!-- Error -->
      <VAlert v-else-if="error" type="error" variant="tonal" rounded="xl" class="mb-6">
        {{ error }}
      </VAlert>

      <!-- Less than 2 vehicles state -->
      <div v-else-if="cars.length < 2" class="compare-empty-card pa-8 pa-md-12 rounded-2xl text-center">
        <template v-if="cars.length === 1">
          <div class="d-flex flex-column align-center max-w-600 mx-auto">
            <img
              :src="getMainImage(cars[0])"
              :alt="_t(cars[0].title, cars[0])"
              class="single-car-thumb mb-4"
            />
            <VChip color="info" variant="tonal" size="small" class="mb-2 font-weight-bold">
              {{ isAr ? 'السيارة الأساسية جاهزة' : 'Base Vehicle Ready' }}
            </VChip>
            <h2 class="text-h5 font-weight-bold mb-2">
              {{ _t(cars[0].title, cars[0]) }}
            </h2>
            <p class="text-body-2 opacity-75 mb-6">
              {{
                isAr
                  ? 'اختر السيارة الثانية من صفحات الموقع بوضع المقارنة لعرض المقارنة الكاملة جنباً إلى جنب.'
                  : 'Pick a 2nd vehicle directly from the marketplace in Compare Mode to see them side by side.'
              }}
            </p>
            <div class="d-flex flex-wrap justify-center gap-3">
              <VBtn
                color="info"
                size="large"
                rounded="pill"
                prepend-icon="tabler-arrows-diff"
                class="font-weight-bold px-6"
                @click="startPickingFromScratch"
              >
                {{ isAr ? 'اختر السيارة الثانية الآن' : 'Pick 2nd Vehicle Now' }}
              </VBtn>
              <VBtn
                variant="tonal"
                color="error"
                size="large"
                rounded="pill"
                @click="handleClearAll"
              >
                {{ isAr ? 'إلغاء' : 'Cancel' }}
              </VBtn>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="empty-icon-box mx-auto mb-5">
            <VIcon icon="tabler-arrows-diff" size="42" color="info" />
          </div>
          <h2 class="text-h5 font-weight-bold mb-2">
            {{ isAr ? 'لم تختر سيارات للمقارنة بعد' : 'No Vehicles Selected Yet' }}
          </h2>
          <p class="text-body-1 opacity-75 mb-6 mx-auto" style="max-width: 520px;">
            {{
              isAr
                ? 'افتح أي سيارة تعجبك واضغط على "قارن بهذه السيارة" للدخول في وضع المقارنة واختيار السيارة الثانية مباشرة من الموقع.'
                : 'Open any listing and click "Compare" to enter Compare Mode and pick another real listing from the site.'
            }}
          </p>
          <VBtn
            color="primary"
            size="large"
            rounded="pill"
            prepend-icon="tabler-car"
            to="/user/cars"
            class="font-weight-bold px-8"
          >
            {{ t('browseCarsBtn') }}
          </VBtn>
        </template>
      </div>

      <!-- Full Comparison View (2 or 3 cars) -->
      <template v-else>
        <!-- Quick Smart Verdict Strip -->
        <div
          v-if="cheapestCar || newestCar || lowestMileageCar || highestHpCar"
          class="verdict-strip mb-6"
        >
          <div v-if="cheapestCar" class="verdict-chip verdict-chip--price">
            <VIcon icon="tabler-coin" size="18" />
            <div>
              <div class="verdict-chip__label">{{ isAr ? 'الأفضل سعراً' : 'Best Price' }}</div>
              <div class="verdict-chip__val text-truncate">{{ _t(cheapestCar.title, cheapestCar) }}</div>
            </div>
          </div>

          <div v-if="newestCar" class="verdict-chip verdict-chip--year">
            <VIcon icon="tabler-calendar-star" size="18" />
            <div>
              <div class="verdict-chip__label">{{ isAr ? 'الأحدث موديلاً' : 'Newest Year' }}</div>
              <div class="verdict-chip__val text-truncate">{{ _t(newestCar.title, newestCar) }} ({{ newestCar.year }})</div>
            </div>
          </div>

          <div v-if="lowestMileageCar" class="verdict-chip verdict-chip--mileage">
            <VIcon icon="tabler-gauge" size="18" />
            <div>
              <div class="verdict-chip__label">{{ isAr ? 'الأقل عداداً' : 'Lowest Mileage' }}</div>
              <div class="verdict-chip__val text-truncate">{{ _t(lowestMileageCar.title, lowestMileageCar) }}</div>
            </div>
          </div>

          <div v-if="highestHpCar" class="verdict-chip verdict-chip--hp">
            <VIcon icon="tabler-bolt" size="18" />
            <div>
              <div class="verdict-chip__label">{{ isAr ? 'الأقوى أداءً' : 'Highest Power' }}</div>
              <div class="verdict-chip__val text-truncate">{{ _t(highestHpCar.title, highestHpCar) }} ({{ highestHpCar.horsepower }} HP)</div>
            </div>
          </div>
        </div>

        <!-- Sticky Floating Vehicle Names Header on Scroll -->
        <Transition name="sticky-fade">
          <div
            v-if="showStickyBar"
            class="compare-sticky-bar-wrap"
            :style="{ top: isNavLikelyHidden ? '10px' : '74px' }"
          >
            <VContainer class="py-0">
              <div ref="stickyScrollRef" class="compare-sticky-scroller">
                <div class="compare-sticky-row" :style="gridColumnsStyle">
                  <div class="compare-sticky-label">
                    <VIcon icon="tabler-arrows-diff" size="16" color="info" />
                    <span>{{ isAr ? 'المقارنة' : 'Comparing' }}</span>
                  </div>

                  <div
                    v-for="car in cars"
                    :key="`sticky-${car.id}`"
                    class="compare-sticky-car"
                  >
                    <img :src="getMainImage(car)" :alt="_t(car.title, car)" class="compare-sticky-car__img" />
                    <div class="compare-sticky-car__info">
                      <RouterLink
                        :to="`/user/cars/${car.id}`"
                        class="compare-sticky-car__title text-truncate text-decoration-none d-block"
                      >
                        {{ _t(car.title, car) }}
                      </RouterLink>
                      <div class="compare-sticky-car__price">
                        {{ formatPrice(car.price, car.currency) }}
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="cars.length < compareStore.maxCars"
                    type="button"
                    class="compare-sticky-add"
                    @click="handleAddThirdCar"
                  >
                    <VIcon icon="tabler-plus" size="16" />
                    <span>{{ isAr ? 'أضف ثالثة' : 'Add 3rd' }}</span>
                  </button>
                </div>
              </div>
            </VContainer>
          </div>
        </Transition>

        <!-- Vehicles Wrapper Card with Title Header -->
        <div ref="scrollContainerRef" class="compare-scroll-container" @scroll.passive="onTableHorizontalScroll">
          <div ref="vehiclesPanelRef" class="compare-vehicles-panel mb-6">
            <div class="compare-vehicles-panel__header">
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-cars" size="20" color="primary" />
                <h2 class="compare-vehicles-panel__title">
                  {{ isAr ? 'المركبات المختارة للمقارنة' : 'Selected Vehicles' }}
                </h2>
              </div>
              <VChip color="info" variant="tonal" size="small" class="font-weight-black">
                {{ cars.length }} / {{ compareStore.maxCars }}
              </VChip>
            </div>

            <div class="compare-cards-grid" :style="gridColumnsStyle">
              <div
                v-for="(car, idx) in cars"
                :key="car.id"
                class="compare-vehicle-card"
              >
              <div class="compare-vehicle-card__media">
                <RouterLink :to="`/user/cars/${car.id}`">
                  <img :src="getMainImage(car)" :alt="_t(car.title, car)" />
                </RouterLink>

                <button
                  type="button"
                  class="compare-vehicle-card__remove"
                  :title="isAr ? 'إزالة من المقارنة' : 'Remove'"
                  @click="handleRemoveCar(car.id)"
                >
                  <VIcon icon="tabler-x" size="15" />
                </button>

                <span class="compare-vehicle-card__badge">
                  {{ car.condition === 'new' ? t('newCondition') : t('usedCondition') }}
                </span>
              </div>

              <div class="compare-vehicle-card__body">
                <div class="text-caption font-weight-bold text-primary mb-1">
                  {{ _t(car.brand?.name, car.brand) }} • {{ _t(car.model?.name, car.model) }} • {{ car.year }}
                </div>

                <RouterLink
                  :to="`/user/cars/${car.id}`"
                  class="compare-vehicle-card__title text-decoration-none d-block mb-2"
                >
                  {{ _t(car.title, car) }}
                </RouterLink>

                <div class="compare-vehicle-card__price mb-3">
                  {{ formatPrice(car.price, car.currency) }}
                </div>

                <div class="d-flex flex-wrap gap-2 mt-auto">
                  <VBtn
                    size="x-small"
                    variant="tonal"
                    color="info"
                    rounded="pill"
                    prepend-icon="tabler-refresh"
                    class="font-weight-bold"
                    @click="handleReplaceCar(idx)"
                  >
                    {{ isAr ? 'تغيير' : 'Replace' }}
                  </VBtn>

                  <VBtn
                    v-if="getWhatsappUrl(car)"
                    size="x-small"
                    variant="tonal"
                    color="success"
                    rounded="pill"
                    prepend-icon="tabler-brand-whatsapp"
                    :href="getWhatsappUrl(car)"
                    target="_blank"
                    class="font-weight-bold"
                  >
                    {{ t('whatsappBtn') }}
                  </VBtn>

                  <VBtn
                    size="x-small"
                    variant="text"
                    color="default"
                    rounded="pill"
                    :to="`/user/cars/${car.id}`"
                  >
                    {{ isAr ? 'التفاصيل' : 'Details' }}
                  </VBtn>
                </div>
              </div>
            </div>

            <!-- Add 3rd Car Slot -->
            <button
              v-if="cars.length < compareStore.maxCars"
              type="button"
              class="compare-add-slot"
              @click="handleAddThirdCar"
            >
              <div class="compare-add-slot__icon">
                <VIcon icon="tabler-plus" size="28" />
              </div>
              <div class="font-weight-bold text-body-1 mt-2">
                {{ isAr ? 'أضف سيارة ثالثة' : 'Add 3rd Vehicle' }}
              </div>
              <div class="text-caption opacity-70 mt-1">
                {{ isAr ? 'اختر مباشرة من الموقع بوضع المقارنة' : 'Pick directly from site in Compare Mode' }}
              </div>
            </button>
            </div>
          </div>

          <!-- Comparison Spec Sections -->
          <div
            v-for="sec in sections"
            :key="sec.key"
            class="compare-section-card mb-6"
          >
            <div class="compare-section-card__header">
              <VIcon :icon="sec.icon" size="20" color="primary" />
              <h3>{{ sec.title }}</h3>
            </div>

            <div class="compare-table">
              <div
                v-for="row in sec.rows"
                :key="row.key"
                class="compare-row"
                :class="{ 'compare-row--different': row.isDifferent }"
                :style="gridColumnsStyle"
              >
                <div class="compare-row__label">
                  <span>{{ row.label }}</span>
                </div>

                <div
                  v-for="(car, idx) in cars"
                  :key="`${row.key}-${car.id}`"
                  class="compare-row__cell"
                  :class="{
                    'compare-row__cell--winner': row.winners.has(car.id),
                    'compare-row__cell--price': row.isHighlight,
                  }"
                >
                  <span>{{ row.formatted[idx] }}</span>
                  <VIcon
                    v-if="row.winners.has(car.id)"
                    icon="tabler-crown"
                    size="15"
                    class="winner-crown ms-1"
                  />
                </div>

                <div
                  v-if="cars.length < compareStore.maxCars"
                  class="compare-row__cell compare-row__cell--empty"
                >
                  —
                </div>
              </div>
            </div>
          </div>

          <!-- Features Matrix -->
          <div v-if="featureMatrix.length" class="compare-section-card mb-6">
            <div class="compare-section-card__header">
              <VIcon icon="tabler-checklist" size="20" color="primary" />
              <h3>{{ isAr ? 'التجهيزات والكماليات' : 'Features & Equipment' }}</h3>
            </div>

            <div class="compare-table">
              <div
                v-for="feat in featureMatrix"
                :key="feat.id"
                class="compare-row"
                :class="{ 'compare-row--different': feat.isDifferent }"
                :style="gridColumnsStyle"
              >
                <div class="compare-row__label">
                  <span>{{ feat.name }}</span>
                </div>

                <div
                  v-for="(hasFeat, idx) in feat.presence"
                  :key="`${feat.id}-${idx}`"
                  class="compare-row__cell"
                >
                  <VIcon
                    :icon="hasFeat ? 'tabler-circle-check-filled' : 'tabler-circle-x'"
                    :color="hasFeat ? 'success' : 'default'"
                    :class="{ 'opacity-35': !hasFeat }"
                    size="20"
                  />
                </div>

                <div
                  v-if="cars.length < compareStore.maxCars"
                  class="compare-row__cell compare-row__cell--empty"
                >
                  —
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="showDifferencesOnly && sections.length === 0 && featureMatrix.length === 0"
            class="compare-empty-card pa-8 rounded-2xl text-center"
          >
            <VIcon icon="tabler-equal" size="36" color="info" class="mb-2" />
            <div class="text-h6 font-weight-bold">
              {{ isAr ? 'جميع المواصفات المعروضة متطابقة!' : 'All displayed specifications match!' }}
            </div>
          </div>
        </div>
      </template>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.compare-hero-bar {
  background: rgba(var(--v-theme-surface), 0.78);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  backdrop-filter: blur(12px);
}

.compare-eyebrow {
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  color: #0ea5e9;
  font-size: 0.78rem;
  font-weight: 800;
}

.compare-empty-card {
  background: rgba(var(--v-theme-surface), 0.78);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.empty-icon-box {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.12);
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.single-car-thumb {
  width: 220px;
  height: 140px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(14, 165, 233, 0.45);
}

.verdict-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.verdict-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.85);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);

  &--price { border-color: rgba(16, 185, 129, 0.35); color: #10b981; }
  &--year { border-color: rgba(14, 165, 233, 0.35); color: #0ea5e9; }
  &--mileage { border-color: rgba(245, 158, 11, 0.35); color: #f59e0b; }
  &--hp { border-color: rgba(255, 107, 0, 0.35); color: #ff6b00; }

  > div {
    min-width: 0;
  }
}

.verdict-chip__label {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  opacity: 0.85;
}

.verdict-chip__val {
  font-size: 0.88rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.compare-scroll-container {
  overflow-x: auto;
  padding-bottom: 8px;
}

.compare-vehicles-panel {
  border-radius: 22px;
  padding: 18px;
  background: rgba(var(--v-theme-surface), 0.88);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  min-width: 720px;
}

.compare-vehicles-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.compare-vehicles-panel__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
}

.compare-cards-grid {
  display: grid;
  grid-template-columns: repeat(var(--compare-cols, 2), minmax(220px, 1fr));
  gap: 14px;
}

.compare-vehicle-card {
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  background: rgba(var(--v-theme-surface), 0.9);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  display: flex;
  flex-direction: column;
}

.compare-vehicle-card__media {
  position: relative;
  width: 100%;
  height: 205px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);

  a {
    display: block;
    width: 100%;
    height: 100%;
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.compare-vehicle-card__remove {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #ef4444;
  }
}

.compare-vehicle-card__badge {
  position: absolute;
  bottom: 10px;
  inset-inline-start: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  backdrop-filter: blur(6px);
}

.compare-vehicle-card__body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.compare-vehicle-card__title {
  font-size: 1rem;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.35;

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
}

.compare-vehicle-card__price {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ff6b00;
}

.compare-add-slot {
  border-radius: 20px;
  border: 2px dashed rgba(14, 165, 233, 0.45);
  background: rgba(14, 165, 233, 0.05);
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(14, 165, 233, 0.12);
    border-color: #0ea5e9;
    transform: translateY(-2px);
  }
}

.compare-add-slot__icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.16);
  color: #0ea5e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compare-section-card {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.88);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  min-width: 720px;
}

.compare-section-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);

  h3 {
    margin: 0;
    font-size: 1.02rem;
    font-weight: 800;
  }
}

.compare-row {
  display: grid;
  grid-template-columns: 200px repeat(var(--compare-cols, 2), minmax(240px, 1fr));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);

  &:last-child {
    border-bottom: none;
  }

  &--different {
    background: rgba(14, 165, 233, 0.035);
  }

  @media (max-width: 959px) {
    grid-template-columns: 140px repeat(var(--compare-cols, 2), minmax(200px, 1fr));
  }
}

.compare-row__label {
  padding: 13px 16px;
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.72);
  display: flex;
  align-items: center;
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.compare-row__cell {
  padding: 13px 16px;
  font-size: 0.92rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 0.05);

  &:last-child {
    border-inline-end: none;
  }

  &--price {
    font-weight: 900;
    color: #ff6b00;
  }

  &--winner {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    font-weight: 800;
  }

  &--empty {
    opacity: 0.35;
  }
}

.winner-crown {
  color: #10b981;
  flex-shrink: 0;
}

.sticky-fade-enter-active,
.sticky-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.sticky-fade-enter-from,
.sticky-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.compare-sticky-bar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1002;
  transition: top 0.25s ease;
  pointer-events: none;
}

.compare-sticky-scroller {
  pointer-events: auto;
  overflow-x: hidden;
  border-radius: 16px;
  background: rgba(11, 22, 38, 0.94);
  border: 1.5px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 14px 36px rgba(2, 6, 23, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.v-theme--light .compare-sticky-scroller {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(14, 165, 233, 0.45);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
}

.compare-sticky-row {
  display: grid;
  grid-template-columns: 200px repeat(var(--compare-cols, 2), minmax(240px, 1fr));
  min-width: 720px;

  @media (max-width: 959px) {
    grid-template-columns: 140px repeat(var(--compare-cols, 2), minmax(200px, 1fr));
  }
}

.compare-sticky-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 0.84rem;
  font-weight: 800;
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.compare-sticky-car {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  min-width: 0;
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 0.06);

  &:last-child {
    border-inline-end: none;
  }
}

.compare-sticky-car__img {
  width: 46px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.compare-sticky-car__info {
  min-width: 0;
  flex: 1;
}

.compare-sticky-car__title {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
}

.compare-sticky-car__price {
  font-size: 0.76rem;
  font-weight: 800;
  color: #ff6b00;
}

.compare-sticky-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  background: rgba(14, 165, 233, 0.1);
  color: #38bdf8;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: rgba(14, 165, 233, 0.2);
  }
}
</style>
