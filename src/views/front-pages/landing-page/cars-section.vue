<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import carsUserApi from '@/api/user/carUserApi.js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { translateText } from '@/utils/brandTranslations.js'
import { useCompareStore } from '@/stores/compare'
import logoDark from '@images/logo/logo-dark.png'
import logoLight from '@images/logo/logo-light.png'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const siteLogo = useGenerateImageVariant(logoDark, logoLight)
const compareStore = useCompareStore()
const isAr = computed(() => (locale.value || 'ar') === 'ar')

const isCompareMode = computed(() => compareStore.isCompareMode)
const baseCompareCarName = computed(() => {
  const base = compareStore.cars[0]
  if (!base) return ''
  return _t(base.model?.name, base.model) || _t(base.brand?.name, base.brand) || _t(base.title, base)
})
const isInCompare = (car) => compareStore.hasCar(car?.id)
const isCompareTypeMismatch = (car) => {
  if (!isCompareMode.value || !compareStore.activeType) return false
  if (compareStore.cars.length === 1 && compareStore.replacingIndex === 0) return false
  return (car?.type || 'car') !== compareStore.activeType
}

const compareAlert = ref('')
const handleCardClick = (e, car) => {
  if (!isCompareMode.value) return
  e.preventDefault()

  if (isCompareTypeMismatch(car)) {
    compareAlert.value = isAr.value
      ? 'يمكن مقارنة نفس نوع المركبة فقط (سيارة مع سيارة أو دراجة مع دراجة).'
      : 'You can only compare vehicles of the same type.'
    setTimeout(() => { compareAlert.value = '' }, 3200)
    return
  }

  if (isInCompare(car)) {
    if (compareStore.canCompare) {
      compareStore.cancelCompareMode()
      router.push(compareStore.compareRoute)
    }
    return
  }

  const res = compareStore.selectCarInCompareMode(car)
  if (res?.ok && res?.shouldNavigateToCompare) {
    router.push(compareStore.compareRoute)
  }
}

const previewCarInCompareMode = (car) => {
  router.push(`/user/cars/${car.id}`)
}

const props = defineProps({
  title: { type: String, default: 'Cars' },
  subtitle: { type: String, default: '' },
  limit: { type: Number, default: 20 },
  params: { type: Object, default: () => ({}) },
  viewAllTo: { type: [String, Object], default: '/user/cars' },
  approvedOnly: { type: Boolean, default: true },
  embedded: { type: Boolean, default: false },

  // ✅ Controlled mode (Search page or Home page passes these)
  controlled: { type: Boolean, default: false },
  cars: { type: Array, default: null }, // null => uncontrolled, array => controlled
  loading: { type: Boolean, default: null },
  error: { type: String, default: null },
  showViewAll: { type: Boolean, default: true },

  // ✅ optional: لو الصور بتبوّظ الشكل اقفلها
  showImage: { type: Boolean, default: true },
})

const localLoading = ref(false)
const localError = ref('')
const localCars = ref([])

const API_BASE = import.meta.env.VITE_BASE_URL

const _t = (val, parentObj = null) => {
  return translateText(val, locale.value || 'ar', parentObj)
}

// ✅ لو الصورة جاية URL كامل (cloudinary / http) سيبها
// ✅ لو جاية path (storage/..) ركّبها على API_BASE
const buildUrl = (path, fallback) => {
  if (!path) return fallback
  const clean = String(path).replaceAll('\\', '/')
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
  if (!API_BASE) return clean
  return `${API_BASE.replace(/\/$/, '')}/${clean.replace(/^\//, '')}`
}

const brokenImages = ref(new Set())

const onImgError = (carId) => {
  if (carId) {
    brokenImages.value.add(carId)
  }
}

const hasValidImage = (car) => {
  if (!car) return false
  if (brokenImages.value.has(car.id)) return false
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find((i) => Number(i.is_main) === 1) || imgs[0]
  if (!main?.path) return false
  const pathStr = String(main.path).trim()
  if (!pathStr || pathStr.includes('via.placeholder.com')) return false
  return true
}

const getMainImage = (car) => {
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find((i) => Number(i.is_main) === 1) || imgs[0]
  return buildUrl(main?.path, siteLogo.value)
}

const getSellerName = (car) => {
  if (!car?.seller) return t('unknownSeller')
  const s = car.seller
  const isAr = (locale.value || 'ar') === 'ar'
  if (isAr && s.store_name_ar) return s.store_name_ar
  if (!isAr && s.store_name_en) return s.store_name_en
  return _t(s.store_name, s) || s.name || t('unknownSeller')
}

const getSellerLogo = (car) => {
  if (car?.seller?.store_logo) return car.seller.store_logo
  if (car?.seller?.logo) return car.seller.logo
  const name = getSellerName(car)
  if (name?.toLowerCase().includes('negm') || car?.seller_id === 1 || car?.seller?.id === 1) {
    return 'https://res.cloudinary.com/dtueexptj/image/upload/v1788439123/store_logos/tsxfpmer2hnchhssmlk8.png'
  }
  return ''
}

// ✅ Localized "Time Ago" formatter
const formatDateTime = (val) => {
  if (!val) return '—'
  const iso = String(val).replace(' ', 'T')
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return val

  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  const isAr = (locale.value || 'ar') === 'ar'

  if (diffInSeconds < 60) return isAr ? 'الآن' : 'Just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    if (isAr) return `منذ ${diffInMinutes} دقيقة`
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    if (isAr) return `منذ ${diffInHours} ساعة`
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    if (isAr) return `منذ ${diffInDays} يوم`
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    if (isAr) return `منذ ${diffInWeeks} أسبوع`
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`
  }

  return isAr ? 'منذ شهر' : '1 month ago'
}

const isAvailableForImport = (car) => {
  if (!car) return false
  const val = car.is_import
  return val === 'available_for_import' || val === 'available' || val === 2 || String(val) === '2'
}

const getSourceText = (car) => {
  if (!car) return t('local')
  const val = car.is_import
  if (val === 'available_for_import' || val === 'available' || val === 2 || String(val) === '2') {
    return t('availableForImport')
  }
  if (val === true || val === 1 || String(val) === '1' || val === 'imported') {
    return t('imported')
  }
  return t('local')
}

const formatPrice = (price) => {
  const n = Number(price)
  if (Number.isNaN(n)) return price ?? '—'
  return n.toLocaleString()
}

const normalizeCars = (payload) => {
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  if (Array.isArray(payload)) return payload
  return []
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

const isFav = (car) => !!car?.is_favorited

const toggleFavorite = async (car) => {
  const { token } = getAuth()
  if (!token) return router.push('/login')

  try {
    const res = await carsUserApi.toggleFavorite(car.id)
    const payload = res?.data?.data ?? res?.data ?? {}

    const newFav = !!payload.is_favorited
    car.is_favorited = newFav

    // ✅ مش بنعرض favorites_count خلاص
    if (payload.favorites_count !== undefined && payload.favorites_count !== null) {
      car.favorites_count = Number(payload.favorites_count)
    }
  } catch (e) {
    console.error(e)
  }
}

// ✅ Controlled/uncontrolled display with Sorting
const displayCars = computed(() => {
  const list = props.cars !== null ? props.cars : localCars.value
  if (!list || !Array.isArray(list)) return []

  // ✅ Apply Priority Sort: 1. is_global_ad, 2. is_featured, 3. is_best_deal, 4. is_import, 5. created_at DESC
  return [...list].sort((a, b) => {
    // 1. Global Ad priority
    if (Number(b.is_global_ad) !== Number(a.is_global_ad)) {
      return Number(b.is_global_ad) - Number(a.is_global_ad)
    }
    
    // 2. Featured priority
    if (Number(b.is_featured) !== Number(a.is_featured)) {
      return Number(b.is_featured) - Number(a.is_featured)
    }

    // 3. Best Deal priority
    if (Number(b.is_best_deal) !== Number(a.is_best_deal)) {
      return Number(b.is_best_deal) - Number(a.is_best_deal)
    }

    // 4. Import priority
    if (Number(b.is_import) !== Number(a.is_import)) {
      return Number(b.is_import) - Number(a.is_import)
    }

    // 5. Newest first (if dates are available)
    if (a.created_at && b.created_at) {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    return 0
  })
})
const displayLoading = computed(() => (props.loading !== null ? props.loading : localLoading.value))
const displayError = computed(() => (props.error !== null ? props.error : localError.value))

const fetchCars = async () => {
  if (props.controlled || props.cars !== null) return

  localLoading.value = true
  localError.value = ''

  const { token, userId } = getAuth()
  const isAuthed = !!token

  try {
    const res = await carsUserApi.getAll({
      per_page: props.limit,
      ...(props.approvedOnly ? { 'filter[status]': 'approved' } : {}),
      ...props.params,
    })

    const all = normalizeCars(res.data)
    const list = props.approvedOnly ? all.filter((c) => c.status === 'approved') : all

    // ✅ Limit to max items
    const limitedList = list.slice(0, props.limit)

    const normalized = limitedList.map((c) => {
      const favArr = Array.isArray(c.favorites) ? c.favorites : []

      let is_favorited = false
      if (!isAuthed) {
        is_favorited = false
      } else if (c.is_favorited !== undefined && c.is_favorited !== null) {
        is_favorited = !!c.is_favorited
      } else if (userId && favArr.length) {
        is_favorited = favArr.some((f) => {
          const id = Number(f?.id) || Number(f?.user_id) || Number(f?.pivot?.user_id)
          return id === userId
        })
      }

      const favorites_count =
        c.favorites_count !== undefined && c.favorites_count !== null
          ? Number(c.favorites_count)
          : favArr.length

      return { ...c, favorites_count, is_favorited }
    })

    localCars.value = normalized
  } catch (e) {
    console.error(e)
    localError.value = 'Failed to load cars'
    localCars.value = []
  } finally {
    localLoading.value = false
  }
}

watch(
  () => props.cars,
  (val) => {
    if (val && Array.isArray(val)) {
      localCars.value = val
    }
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  if (props.controlled) return
  fetchCars()
})

watch(
  () => props.params,
  () => {
    if (!props.controlled) fetchCars()
  },
  { deep: true },
)
watch(
  () => props.limit,
  () => {
    if (!props.controlled) fetchCars()
  },
)
watch(
  () => props.approvedOnly,
  () => {
    if (!props.controlled) fetchCars()
  },
)
</script>

<template>
  <section class="cars-section" :class="{ 'cars-section--embedded': embedded }">
    <div class="cars-section__container" :class="{ 'v-container': !embedded }">
      <div class="cars-section__header">
        <div>
          <h2 v-if="title" class="cars-section__title">{{ title }}</h2>
          <p class="cars-section__subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>

        <RouterLink v-if="showViewAll" class="cars-section__link" :to="viewAllTo">
          {{ t('viewAll') }}
        </RouterLink>
      </div>

      <div v-if="compareAlert" class="compare-inline-alert mb-4">
        <VIcon icon="tabler-info-circle" size="18" />
        <span>{{ compareAlert }}</span>
      </div>

      <div v-if="displayLoading" class="cars-section__state"><VProgressCircular indeterminate size="18" width="2" color="primary" class="me-2" /><span>{{ t('loadingCars') }}</span></div>
      <div v-else-if="displayError" class="cars-section__state error"><span>{{ t('failedToLoadCars') }}</span></div>
      <div v-else-if="displayCars.length === 0" class="cars-section__state"><span>{{ t('noCarsFound') }}</span></div>

      <div v-else class="cars-grid">
        <RouterLink
          v-for="car in displayCars"
          :key="car.id"
          class="car-card"
          :class="{
            'car-card--best-deal': Number(car.is_best_deal) === 1,
            'car-card--featured': Number(car.is_featured) === 1 && Number(car.is_best_deal) !== 1,
            'car-card--global': Number(car.is_global_ad) === 1 && Number(car.is_featured) !== 1 && Number(car.is_best_deal) !== 1,
            'car-card--compare-mode': isCompareMode && !isCompareTypeMismatch(car),
            'car-card--compare-selected': isCompareMode && isInCompare(car),
            'car-card--compare-disabled': isCompareMode && isCompareTypeMismatch(car),
          }"
          :to="`/user/cars/${car.id}`"
          @click="handleCardClick($event, car)"
        >
          <!-- ✅ صورة العربية اختيارية -->
          <div v-if="showImage" class="car-card__image">
            <img
              v-if="hasValidImage(car)"
              :src="getMainImage(car)"
              :alt="_t(car.title) || `Car #${car.id}`"
              loading="lazy"
              @error="onImgError(car.id)"
            />
            <div v-else class="car-card__no-image">
              <div class="no-image-watermark">
                <div class="no-image-badge">
                  <img :src="siteLogo" alt="NegmCars" class="no-image-logo" />
                </div>
                <div class="no-image-text font-weight-black">
                  <span class="logo-brand-text">Negm</span><span class="logo-accent-text">Cars</span>
                </div>
              </div>
            </div>

            <!-- ✅ Badges Section -->
            <div class="car-card__badges">
              <!-- VS Arena Badge in Compare Mode -->
              <div v-if="isCompareMode && !isCompareTypeMismatch(car)" class="badge-item" :class="isInCompare(car) ? 'badge-compare-base' : 'badge-compare-vs'">
                <VIcon :icon="isInCompare(car) ? 'tabler-check' : 'tabler-swords'" size="12" class="me-1" />
                <span>{{ isInCompare(car) ? (isAr ? 'الأساسية' : 'BASE') : 'VS' }}</span>
              </div>

              <!-- Best Deal Badge -->
              <div v-if="Number(car.is_best_deal) === 1" class="badge-item badge-best-deal">
                <VIcon icon="tabler-tag" size="12" class="me-1" />
                <span>{{ t('bestDealBadge') }}</span>
              </div>
              
              <!-- Featured Badge -->
              <div v-if="Number(car.is_featured) === 1" class="badge-item badge-featured">
                <VIcon icon="tabler-star" size="12" class="me-1" />
                <span>{{ t('featuredBadge') }}</span>
              </div>

              <!-- Global Ad Badge -->
              <div v-if="Number(car.is_global_ad) === 1" class="badge-item badge-global">
                <VIcon icon="tabler-world" size="12" class="me-1" />
                <span>Ad</span>
              </div>
            </div>

            <button
              class="fav-btn"
              type="button"
              :aria-label="isFav(car) ? 'Remove from favorites' : 'Add to favorites'"
              @click.prevent.stop="toggleFavorite(car)"
            >
              <VIcon :icon="isFav(car) ? 'tabler-heart-filled' : 'tabler-heart'" size="20" :color="isFav(car) ? 'error' : undefined" />
            </button>
          </div>

          <!-- ✅ لو قفلت الصورة نخلي زرار الفافوريت هنا -->
          <div v-else class="car-card__top">
            <button
              class="fav-btn fav-btn--static"
              type="button"
              :aria-label="isFav(car) ? 'Remove from favorites' : 'Add to favorites'"
              @click.prevent.stop="toggleFavorite(car)"
            >
              <VIcon :icon="isFav(car) ? 'tabler-heart-filled' : 'tabler-heart'" size="20" :color="isFav(car) ? 'error' : undefined" />
            </button>
          </div>

          <div class="car-card__body d-flex flex-column">
            <!-- Top Section: Title, Brand, Year -->
            <div>
              <h3 class="car-card__title font-weight-bold mb-1">
                {{ _t(car.title, car) || `Car #${car.id}` }}
              </h3>

              <!-- ✅ Brand & Model -->
              <div class="car-card__meta mb-1 opacity-90">
                <span class="font-weight-bold">{{ _t(car.brand?.name, car.brand) }}</span>
                <span class="mx-2">|</span>
                <span>{{ _t(car.model?.name, car.model) }}</span>
                <span class="mx-2">|</span>
                <span>{{ getSourceText(car) }}</span>
              </div>

              <!-- ✅ Year & Condition -->
              <div class="car-card__info mb-2 opacity-100">
                <span>{{ car.year }}</span>
                <span class="mx-2">|</span>
                <span>
                  {{ car.condition === 'new' ? t('newCondition') : t('usedCondition') }}
                </span>
                <template v-if="car.condition === 'used' && car.mileage">
                  <span class="mx-2">|</span>
                  <span>{{ Number(car.mileage).toLocaleString() }}</span>
                </template>
              </div>
            </div>

            <!-- ✅ Flexible Spacer to push price down -->
            <div class="flex-grow-1"></div>

            <!-- ✅ Bottom Section: Price & Location -->
            <div class="d-flex flex-wrap align-center justify-space-between gap-x-2 gap-y-1 mb-3 pt-2">
              <div class="car-card__price">
                {{ formatPrice(car.price) }}
                <span class="text-caption price-currency opacity-60">EG</span>
              </div>

              <!-- Location shown next to price (or wrapped below if no space) -->
              <div v-if="_t(car.city?.name, car.city)" class="car-card__location d-flex align-center gap-1 opacity-90 text-subtitle-2 font-weight-bold">
                <VIcon icon="tabler-map-pin" size="16" class="car-card__location-icon" />
                <span class="text-truncate">{{ _t(car.city?.name, car.city) }}</span>
              </div>
            </div>

            <!-- ✅ Footer Section: Seller Name with Logo & Time Ago -->
            <div class="car-card__footer pt-2 border-t opacity-100">
              <!-- Seller details (Name & Logo next to name) -->
              <div class="d-flex align-center gap-2 overflow-hidden">
                <!-- Seller Logo Wrapper with tier-colored border -->
                <div 
                  v-if="getSellerLogo(car)"
                  class="d-flex align-center justify-center bg-white rounded flex-shrink-0"
                  style="width: 24px; height: 24px; padding: 1px; border: 1.5px solid;"
                  :style="{
                    borderColor: car.seller?.tier?.toLowerCase() === 'diamond' ? '#00d2ff' :
                                 (car.seller?.tier?.toLowerCase() === 'platinum' ? '#8E2DE2' :
                                 (car.seller?.tier?.toLowerCase() === 'gold' ? '#DAA520' : '#78909C')),
                    boxShadow: car.seller?.tier?.toLowerCase() === 'diamond' ? '0 0 10px rgba(0, 210, 255, 0.6)' :
                               (car.seller?.tier?.toLowerCase() === 'platinum' ? '0 0 10px rgba(142, 45, 226, 0.5)' :
                               (car.seller?.tier?.toLowerCase() === 'gold' ? '0 0 6px rgba(218, 165, 32, 0.2)' : '0 0 6px rgba(120, 144, 156, 0.2)'))
                  }"
                >
                  <img :src="getSellerLogo(car)" alt="logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 2px;" />
                </div>
                <span 
                  class="text-truncate font-weight-black text-caption" 
                  :class="{
                    'text-diamond': car.seller?.tier?.toLowerCase() === 'diamond',
                    'text-gold': car.seller?.tier?.toLowerCase() === 'gold',
                    'text-platinum': car.seller?.tier?.toLowerCase() === 'platinum',
                    'text-silver': !car.seller?.tier || car.seller?.tier?.toLowerCase() === 'silver'
                  }"
                >
                  {{ getSellerName(car) }}
                </span>
                <VIcon 
                  v-if="car.seller?.is_verified"
                  icon="tabler-discount-check-filled"
                  size="12"
                  :class="{
                    'text-diamond': car.seller?.tier?.toLowerCase() === 'diamond',
                    'text-gold': car.seller?.tier?.toLowerCase() === 'gold',
                    'text-platinum': car.seller?.tier?.toLowerCase() === 'platinum',
                    'text-silver': car.seller?.tier?.toLowerCase() === 'silver' || !car.seller?.tier || car.seller?.tier?.toLowerCase() === 'none'
                  }"
                />
              </div>

              <!-- Time Ago -->
              <div class="car-card__date d-flex align-center font-weight-bold opacity-80">
                <VIcon icon="tabler-clock" size="14" class="me-1 text-medium-emphasis" />
                <span>{{ formatDateTime(car.created_at) }}</span>
              </div>
            </div>

            <!-- ✅ Compare Mode Card Action Bar -->
            <div v-if="isCompareMode" class="car-card__compare-bar mt-3 pt-2">
              <div
                v-if="isInCompare(car)"
                class="compare-card-pill compare-card-pill--selected"
              >
                <VIcon icon="tabler-check" size="15" />
                <span>{{ isAr ? 'السيارة الأساسية / مختارة' : 'Selected for Compare' }}</span>
              </div>
              <div
                v-else-if="isCompareTypeMismatch(car)"
                class="compare-card-pill compare-card-pill--disabled"
              >
                <VIcon icon="tabler-ban" size="15" />
                <span>{{ isAr ? 'نوع مركبة مختلف' : 'Different Type' }}</span>
              </div>
              <div v-else class="d-flex align-center gap-2 w-100">
                <div class="compare-card-pill compare-card-pill--pick flex-grow-1">
                  <span class="vs-mini-chip">VS</span>
                  <span class="text-truncate">
                    {{
                      baseCompareCarName
                        ? (isAr ? `قارن مع ${baseCompareCarName}` : `Compare vs ${baseCompareCarName}`)
                        : (isAr ? 'قارن مع هذه السيارة' : 'Compare This Vehicle')
                    }}
                  </span>
                </div>
                <button
                  type="button"
                  class="compare-preview-btn"
                  :title="isAr ? 'معاينة التفاصيل' : 'View Details'"
                  @click.prevent.stop="previewCarInCompareMode(car)"
                >
                  <VIcon icon="tabler-eye" size="16" />
                </button>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cars-section {
  padding: 48px 0;
  @media (max-width: 600px) {
    padding: 24px 0;
  }
}
.cars-section--embedded {
  padding: 0;
}
.cars-section__container {
  width: 100%;
  max-width: 1340px !important;
  margin-inline: auto;
  box-sizing: border-box;
}
.cars-section:not(.cars-section--embedded) .cars-section__container {
  padding-inline: 16px;
}
@media (max-width: 960px) and (min-width: 600px) {
  .cars-section:not(.cars-section--embedded) .cars-section__container {
    padding-inline: 2rem;
  }
}
@media (max-width: 600px) {
  .cars-section:not(.cars-section--embedded) .cars-section__container {
    padding-inline: 12px;
  }
}

.cars-section__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  @media (max-width: 600px) {
    margin-bottom: 12px;
    align-items: center;
  }
}
.cars-section__title {
  font-size: 24px;
  margin: 0;
  @media (max-width: 600px) {
    font-size: 19px;
  }
}
.cars-section__subtitle {
  margin: 6px 0 0;
  opacity: 0.75;
  @media (max-width: 600px) {
    font-size: 12px;
    margin-top: 2px;
  }
}
.cars-section__link {
  text-decoration: none;
  font-weight: 600;
  @media (max-width: 600px) {
    font-size: 13px;
  }
}
.cars-section__state {
  display: flex;
  align-items: center;
  padding: 18px 0;
  opacity: 0.8;
}
.car-card__location-icon {
  color: #ff6b00;
}
.cars-section__state.error {
  opacity: 1;
}

/* default: 4 columns across all pages */
.cars-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
@media (max-width: 1200px) {
  .cars-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .cars-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .cars-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* embedded: 4 columns on desktop just like home page */
.cars-section--embedded .cars-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
@media (max-width: 1200px) {
  .cars-section--embedded .cars-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .cars-section--embedded .cars-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .cars-section--embedded .cars-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* Card Colors by Theme */
.v-theme--light .car-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(203, 213, 225, 0.7);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);
}
.v-theme--light .car-card:hover {
  background: #ffffff;
  border-color: rgba(255, 107, 0, 0.4);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 0 0 20px rgba(255, 107, 0, 0.15);
}
.v-theme--light .car-card__title {
  color: #0F172A !important;
}
.v-theme--light .car-card__meta {
  color: #475569 !important;
}
.v-theme--light .car-card__info {
  color: #64748B !important;
}
.v-theme--light .car-card__location,
.v-theme--light .car-card__date {
  color: #334155 !important;
}
.v-theme--light .border-t {
  border-top-color: rgba(203, 213, 225, 0.6) !important;
}

.v-theme--dark .car-card {
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
}
.v-theme--dark .car-card:hover {
  background: rgba(26, 26, 26, 0.95);
  border-color: rgba(255, 107, 0, 0.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 107, 0, 0.2);
}
.v-theme--dark .car-card__title {
  color: #FFFFFF !important;
}
.v-theme--dark .car-card__meta {
  color: rgba(255, 255, 255, 0.8) !important;
}
.v-theme--dark .car-card__info {
  color: rgba(255, 255, 255, 0.65) !important;
}
.v-theme--dark .car-card__location,
.v-theme--dark .car-card__date {
  color: rgba(255, 255, 255, 0.9) !important;
}
.v-theme--dark .border-t {
  border-top-color: rgba(255, 255, 255, 0.1) !important;
}

/* ✅ Brand Themes Card Overrides */
.v-theme--amberLight .car-card {
  background: linear-gradient(145deg, #fffdfb 0%, #fdf5ee 100%);
  border: 1px solid rgba(255, 107, 0, 0.15);
  box-shadow: 0 6px 22px rgba(124, 60, 20, 0.06);
}
.v-theme--amberLight .car-card:hover {
  background: #ffffff;
  border-color: rgba(255, 107, 0, 0.45);
  box-shadow: 0 20px 40px rgba(255, 107, 0, 0.14);
}
.v-theme--amberLight .car-card__title {
  color: #1E120D !important;
}

.v-theme--emberDark .car-card {
  background: rgba(28, 15, 11, 0.88);
  border: 1px solid rgba(255, 120, 50, 0.16);
  box-shadow: 0 10px 30px rgba(8, 2, 1, 0.65);
}
.v-theme--emberDark .car-card:hover {
  background: rgba(38, 19, 14, 0.96);
  border-color: rgba(255, 107, 0, 0.55);
  box-shadow: 0 20px 40px rgba(8, 2, 1, 0.85), 0 0 26px rgba(255, 90, 20, 0.22);
}
.v-theme--emberDark .border-t {
  border-top-color: rgba(255, 130, 67, 0.14) !important;
}

.car-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  color: rgb(var(--v-theme-on-surface));
}
.car-card__title {
  color: rgb(var(--v-theme-on-surface));
}
.car-card__meta {
  color: rgba(var(--v-theme-on-surface), 0.78);
}
.car-card__info {
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.car-card__location,
.car-card__date {
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.car-card:hover {
  transform: translateY(-6px);
}

/* ✅ Best Deal Border */
.car-card--best-deal {
  border-color: #ff4d4d !important;
  box-shadow: 0 0 20px rgba(255, 77, 77, 0.1);
}
.car-card--best-deal:hover {
  box-shadow: 0 0 30px rgba(255, 77, 77, 0.2);
}

/* ✅ Featured Border */
.car-card--featured {
  border-color: #FF6B00 !important;
  box-shadow: 0 0 20px rgba(255, 107, 0, 0.1);
}
.car-card--featured:hover {
  box-shadow: 0 0 30px rgba(255, 107, 0, 0.25);
}

/* ✅ Global Ad Border (Orange) */
.car-card--global {
  border-color: #ff9f43 !important;
  box-shadow: 0 0 20px rgba(255, 159, 67, 0.1);
}
.car-card--global:hover {
  box-shadow: 0 0 30px rgba(255, 159, 67, 0.25);
}

/* ✅ Import Border */
.car-card--import {
  border-color: #00d2ff !important;
  box-shadow: 0 0 20px rgba(0, 210, 255, 0.1);
}
.car-card--import:hover {
  box-shadow: 0 0 30px rgba(0, 210, 255, 0.2);
}

.car-card__image {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
  overflow: hidden;
}
.car-card__image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.car-card:hover .car-card__image img {
  transform: scale(1.06);
}

/* Placeholder when image does not exist or fails */
.car-card__no-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(255, 109, 0, 0.08) 0%, rgba(20, 24, 36, 0.95) 100%);
  user-select: none;
  overflow: hidden;
}

.no-image-watermark {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.car-card:hover .no-image-watermark {
  transform: scale(1.08);
}

.no-image-badge {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 8px;
  background: rgba(20, 24, 34, 0.85);
  border: 1.5px solid rgba(255, 109, 0, 0.35);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 109, 0, 0.18);
  backdrop-filter: blur(8px);
}

.no-image-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.no-image-text {
  font-size: 14px;
  letter-spacing: 0.5px;
}

.no-image-text .logo-brand-text {
  color: #ffffff;
}

.no-image-text .logo-accent-text {
  color: #ff6d00;
}

/* Light mode overrides for placeholder */
.v-theme--light .car-card__no-image {
  background: radial-gradient(circle at center, rgba(255, 109, 0, 0.06) 0%, #f1f5f9 100%);
}

.v-theme--light .no-image-badge {
  background: #ffffff;
  border: 1.5px solid rgba(255, 109, 0, 0.4);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 0 16px rgba(255, 109, 0, 0.12);
}

.v-theme--light .no-image-text .logo-brand-text {
  color: #0f172a;
}

/* لو مفيش صورة */
.car-card__top {
  position: relative;
  padding: 10px 10px 0;
  min-height: 48px;
}

.car-card__body {
  padding: 16px 18px;
  flex-grow: 1;
}
.car-card__title {
  margin: 0 0 8px;
  font-size: 15.5px;
  font-weight: 800;
  line-height: 1.4;
  min-height: 44px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 600px) {
  .car-card {
    border-radius: 18px !important;
  }
  .car-card__body {
    padding: 12px 14px !important;
  }
  .car-card__title {
    font-size: 14.5px !important;
    margin-bottom: 6px !important;
    min-height: auto !important;
  }
  .car-card__meta {
    font-size: 11.5px !important;
  }
  .car-card__info {
    font-size: 11.5px !important;
  }
  .car-card__price {
    font-size: 17px !important;
  }
  .fav-btn {
    top: 8px !important;
    right: 8px !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 10px !important;
  }
  .car-card__badges {
    top: 8px !important;
    left: 8px !important;
    gap: 4px !important;
  }
  .badge-item {
    padding: 3px 8px !important;
    font-size: 8px !important;
  }
}

.car-card__meta {
  font-size: 12.5px;
  opacity: 0.8;
}

.car-card__info {
  font-size: 12.5px;
  display: flex;
  align-items: center;
  font-weight: 700;
}
.border-t {
  border-top: 1px solid transparent;
}
.car-card__location {
  display: flex;
  align-items: center;
  font-size: 11px;
  white-space: nowrap;
}

/* ✅ footer: price + date */
.car-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.car-card__price {
  font-weight: 900;
  font-size: 19px;
  color: #FF6B00;
  background: linear-gradient(135deg, #FF6B00, #FFA800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.car-card__date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  white-space: nowrap;
}
.car-card__dateIcon {
  opacity: 0.7;
}

/* fav */
.fav-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 17, 26, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fav-btn:hover {
  background: rgba(255, 107, 0, 0.15);
  border-color: rgba(255, 107, 0, 0.3);
  color: #FF6B00;
  transform: scale(1.05);
}
.fav-btn--static {
  position: static;
  margin-left: auto;
}

/* ✅ Badges Styles */
.car-card__badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 5;
}

.badge-item {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px 14px 14px 6px;
  font-size: 9px;
  font-weight: 850;
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
  text-transform: uppercase;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.badge-best-deal {
  background: linear-gradient(135deg, #ff4d4d, #d63031);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(214, 48, 49, 0.35);
}

.badge-featured {
  background: linear-gradient(135deg, #FF6B00, #FFA800);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.35);
}

.badge-import {
  background: linear-gradient(135deg, #00d2ff, #3a7bd5);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.badge-global {
  background: linear-gradient(135deg, #ff9f43, #ff6b6b);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(255, 159, 67, 0.4);
  color: #fff;
}

.text-diamond { color: #00d2ff !important; text-shadow: 0 0 12px rgba(0, 210, 255, 0.7); }
.text-gold { color: #DAA520 !important; }
.text-platinum { color: #8E2DE2 !important; text-shadow: 0 0 12px rgba(142, 45, 226, 0.6); }
.v-theme--dark .text-platinum { color: #8E2DE2 !important; text-shadow: 0 0 12px rgba(142, 45, 226, 0.6); }
.text-silver { color: #78909C !important; }

/* ✅ Compare Mode Card Styles */
.compare-inline-alert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #ef4444;
  font-size: 0.88rem;
  font-weight: 700;
}

.car-card--compare-mode {
  cursor: pointer;
  border: 2px solid rgba(56, 189, 248, 0.5) !important;
  box-shadow: 0 8px 26px rgba(14, 165, 233, 0.16) !important;
}

.car-card--compare-mode:hover {
  border-color: #38bdf8 !important;
  box-shadow: 0 14px 36px rgba(14, 165, 233, 0.36), 0 0 0 3px rgba(56, 189, 248, 0.18) !important;
}

.car-card--compare-selected {
  border: 2.5px solid #10b981 !important;
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.32), 0 0 0 3px rgba(16, 185, 129, 0.16) !important;
}

.badge-compare-vs {
  background: linear-gradient(135deg, #0284c7, #06b6d4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.45);
}

.badge-compare-base {
  background: linear-gradient(135deg, #059669, #10b981);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
}

.vs-mini-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 0.68rem;
  font-weight: 950;
  font-style: italic;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.car-card--compare-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.car-card__compare-bar {
  border-top: 1px dashed rgba(14, 165, 233, 0.3);
}

.compare-card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 7px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 800;
  transition: all 0.2s ease;
}

.compare-card-pill--pick {
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
  color: #fff;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.32);
}

.compare-card-pill--selected {
  background: rgba(16, 185, 129, 0.16);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.compare-card-pill--disabled {
  background: rgba(148, 163, 184, 0.16);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.car-card--compare-mode:hover .compare-card-pill--pick {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.45);
}

.compare-preview-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.compare-preview-btn:hover {
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.45);
  color: #0ea5e9;
}
</style>
