<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import carsUserApi from '@/api/user/carUserApi.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  title: { type: String, default: 'Cars' },
  subtitle: { type: String, default: '' },
  limit: { type: Number, default: 20 },
  params: { type: Object, default: () => ({}) },
  viewAllTo: { type: [String, Object], default: '/user/cars' },
  approvedOnly: { type: Boolean, default: true },
  embedded: { type: Boolean, default: false },

  // ✅ Controlled mode (Search page passes these)
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

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
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

const getMainImage = (car) => {
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find((i) => Number(i.is_main) === 1) || imgs[0]
  return buildUrl(main?.path, 'https://via.placeholder.com/640x420?text=Car')
}

const getSellerName = (car) => {
  return t(car?.seller?.store_name) || car?.seller?.name || 'Unknown seller'
}

// ✅ English "Time Ago" formatter with a 1 month ago cap
const formatDateTime = (val) => {
  if (!val) return '—'
  const iso = String(val).replace(' ', 'T')
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return val

  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Just now'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return '1 minute ago'
    return `${diffInMinutes} minutes ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    if (diffInHours === 1) return '1 hour ago'
    return `${diffInHours} hours ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    if (diffInWeeks === 1) return '1 week ago'
    return `${diffInWeeks} weeks ago`
  }

  return '1 month ago'
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

  // ✅ Apply Priority Sort: 1. is_global_ad, 2. is_featured, 3. created_at DESC
  return [...list].sort((a, b) => {
    // 1. Global Ad priority
    if (Number(b.is_global_ad) !== Number(a.is_global_ad)) {
      return Number(b.is_global_ad) - Number(a.is_global_ad)
    }
    
    // 2. Featured priority
    if (Number(b.is_featured) !== Number(a.is_featured)) {
      return Number(b.is_featured) - Number(a.is_featured)
    }

    // 3. Newest first (if dates are available)
    if (a.created_at && b.created_at) {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    return 0
  })
})
const displayLoading = computed(() => (props.loading !== null ? props.loading : localLoading.value))
const displayError = computed(() => (props.error !== null ? props.error : localError.value))

const fetchCars = async () => {
  if (props.cars !== null) return

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

onMounted(fetchCars)

watch(
  () => props.params,
  () => fetchCars(),
  { deep: true },
)
watch(
  () => props.limit,
  () => fetchCars(),
)
watch(
  () => props.approvedOnly,
  () => fetchCars(),
)
</script>

<template>
  <section class="cars-section" :class="{ 'cars-section--embedded': embedded }">
    <component :is="embedded ? 'div' : 'VContainer'" class="cars-section__container">
      <div class="cars-section__header">
        <div>
          <h2 v-if="title" class="cars-section__title">{{ title }}</h2>
          <p class="cars-section__subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>

        <RouterLink v-if="showViewAll" class="cars-section__link" :to="viewAllTo">
          View all
        </RouterLink>
      </div>

      <div v-if="displayLoading" class="cars-section__state">Loading cars...</div>
      <div v-else-if="displayError" class="cars-section__state error">{{ displayError }}</div>
      <div v-else-if="displayCars.length === 0" class="cars-section__state">No cars found.</div>

      <div v-else class="cars-grid">
        <RouterLink
          v-for="car in displayCars"
          :key="car.id"
          class="car-card"
          :class="{
            'car-card--best-deal': Number(car.is_best_deal) === 1,
            'car-card--featured': Number(car.is_featured) === 1 && Number(car.is_best_deal) !== 1,
            'car-card--global': Number(car.is_global_ad) === 1 && Number(car.is_featured) !== 1 && Number(car.is_best_deal) !== 1,
            'car-card--import': Number(car.is_import) === 1 && Number(car.is_global_ad) !== 1 && Number(car.is_featured) !== 1 && Number(car.is_best_deal) !== 1
          }"
          :to="`/user/cars/${car.id}`"
        >
          <!-- ✅ صورة العربية اختيارية -->
          <div v-if="showImage" class="car-card__image">
            <img :src="getMainImage(car)" :alt="t(car.title) || `Car #${car.id}`" loading="lazy" />

            <!-- ✅ Badges Section -->
            <div class="car-card__badges">
              <!-- Best Deal Badge -->
              <div v-if="Number(car.is_best_deal) === 1" class="badge-item badge-best-deal">
                <VIcon icon="tabler-tag" size="12" class="me-1" />
                <span>Best Deal</span>
              </div>
              
              <!-- Featured Badge -->
              <div v-if="Number(car.is_featured) === 1" class="badge-item badge-featured">
                <VIcon icon="tabler-star" size="12" class="me-1" />
                <span>Featured</span>
              </div>

              <!-- Global Ad Badge -->
              <div v-if="Number(car.is_global_ad) === 1" class="badge-item badge-global">
                <VIcon icon="tabler-world" size="12" class="me-1" />
                <span>Ad</span>
              </div>

              <!-- Import Badge -->
              <div v-if="Number(car.is_import) === 1" class="badge-item badge-import">
                <VIcon icon="tabler-plane-arrival" size="12" class="me-1" />
                <span>Imported</span>
              </div>
            </div>

            <button
              class="fav-btn"
              type="button"
              :aria-label="isFav(car) ? 'Remove from favorites' : 'Add to favorites'"
              @click.prevent.stop="toggleFavorite(car)"
            >
              <VIcon :icon="isFav(car) ? 'tabler-heart-filled' : 'tabler-heart'" size="20" />
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
              <VIcon :icon="isFav(car) ? 'tabler-heart-filled' : 'tabler-heart'" size="20" />
            </button>
          </div>

          <div class="car-card__body d-flex flex-column text-white">
            <!-- Top Section: Title, Brand, Year -->
            <div>
              <h3
                class="car-card__title text-white font-weight-bold mb-1"
                style="min-height: 44px; line-height: 1.4"
              >
                {{ t(car.title) || `Car #${car.id}` }}
              </h3>

              <!-- ✅ Brand & Model -->
              <div class="car-card__meta mb-1 opacity-90">
                <span class="font-weight-bold">{{ t(car.brand?.name) }}</span>
                <span class="mx-1">•</span>
                <span>{{ t(car.model?.name) }}</span>
              </div>

              <!-- ✅ Year & Condition -->
              <div class="car-card__info mb-2 opacity-80">
                <span>{{ car.year }}</span>
                <span class="mx-2">|</span>
                <span :class="car.condition === 'new' ? 'text-primary' : 'text-white'">
                  {{ car.condition === 'new' ? 'New' : 'Used' }}
                </span>
                <template v-if="car.condition === 'used' && car.kilometers">
                  <span class="mx-2">•</span>
                  <span>{{ car.kilometers.toLocaleString() }} km</span>
                </template>
              </div>
            </div>

            <!-- ✅ Flexible Spacer to push price down -->
            <div class="flex-grow-1"></div>

            <!-- ✅ Bottom Section: Price & Seller (Fixed Position) -->
            <div class="d-flex align-center justify-space-between mb-3 pt-2">
              <div class="car-card__price">
                {{ formatPrice(car.price) }}
                <span class="text-caption text-white opacity-60">EG</span>
              </div>

              <div class="d-flex align-center gap-1 opacity-90 text-white" style="font-size: 11px">
                <VIcon icon="tabler-building-store" size="14" color="white" />
                <span class="text-truncate" style="max-width: 80px">
                  {{ getSellerName(car) }}
                </span>
              </div>
            </div>

            <!-- ✅ Location & Time -->
            <div class="car-card__footer pt-2 border-t border-white-opacity-10 opacity-70">
              <div class="car-card__location d-flex align-center">
                <VIcon icon="tabler-map-pin" size="14" class="me-1" />
                <span>{{ t(car.city?.name) || 'Cairo' }}</span>
              </div>

              <div class="car-card__date d-flex align-center">
                <VIcon icon="tabler-clock" size="14" class="me-1" />
                <span>{{ formatDateTime(car.created_at) }}</span>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </component>
  </section>
</template>

<style scoped>
.cars-section {
  padding: 48px 0;
}
.cars-section--embedded {
  padding: 0;
}
.cars-section__container {
  width: 100%;
}

.cars-section__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.cars-section__title {
  font-size: 24px;
  margin: 0;
}
.cars-section__subtitle {
  margin: 6px 0 0;
  opacity: 0.75;
}
.cars-section__link {
  text-decoration: none;
  font-weight: 600;
}
.cars-section__state {
  padding: 18px 0;
  opacity: 0.8;
}
.cars-section__state.error {
  opacity: 1;
}

/* default: 4 columns */
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
@media (max-width: 560px) {
  .cars-grid {
    grid-template-columns: 1fr;
  }
}

/* embedded: 3 columns */
.cars-section--embedded .cars-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
@media (max-width: 1200px) {
  .cars-section--embedded .cars-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .cars-section--embedded .cars-grid {
    grid-template-columns: 1fr;
  }
}

.car-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
}
.car-card:hover {
  transform: translateY(-8px) scale(1.01);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

/* ✅ Best Deal Border */
.car-card--best-deal {
  border-color: #ff4d4d !important;
  box-shadow: 0 0 20px rgba(255, 77, 77, 0.15);
}
.car-card--best-deal:hover {
  box-shadow: 0 0 30px rgba(255, 77, 77, 0.3);
}

/* ✅ Featured Border */
.car-card--featured {
  border-color: #f1c40f !important;
  box-shadow: 0 0 20px rgba(241, 196, 15, 0.15);
}
.car-card--featured:hover {
  box-shadow: 0 0 30px rgba(241, 196, 15, 0.3);
}

/* ✅ Global Ad Border (Orange) */
.car-card--global {
  border-color: #ff9f43 !important;
  box-shadow: 0 0 20px rgba(255, 159, 67, 0.2);
}
.car-card--global:hover {
  box-shadow: 0 0 30px rgba(255, 159, 67, 0.4);
}

/* ✅ Import Border */
.car-card--import {
  border-color: #00d2ff !important;
  box-shadow: 0 0 20px rgba(0, 210, 255, 0.15);
}
.car-card--import:hover {
  box-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
}

.car-card__image {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: rgba(0, 0, 0, 0.15);
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
}

/* لو مفيش صورة */
.car-card__top {
  position: relative;
  padding: 10px 10px 0;
  min-height: 48px;
}

.car-card__body {
  padding: 14px;
  flex-grow: 1;
}
.car-card__title {
  margin: 0 0 8px;
  font-size: 16px;
}

.car-card__meta {
  font-size: 14px;
  color: #fff;
  opacity: 0.9;
}
.car-card__info {
  font-size: 13px;
  color: #fff;
  opacity: 0.8;
  display: flex;
  align-items: center;
}
.border-t {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.car-card__location {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #fff;
  opacity: 0.7;
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
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #28a745, #51cf66);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.car-card__date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff; /* Return to white */
  opacity: 0.7;
  font-size: 11px;
  white-space: nowrap;
}
.car-card__dateIcon {
  opacity: 0.8;
}

/* fav */
.fav-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  color: #fff;
}
.fav-btn--static {
  position: static;
  margin-left: auto;
}

/* ✅ Badges Styles */
.car-card__badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;
}

.badge-item {
  display: flex;
  align-items: center;
  padding: 4px 10px; /* More compact */
  border-radius: 6px 20px 20px 6px;
  font-size: 10px; /* Smaller font */
  font-weight: 800;
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.badge-best-deal {
  background: linear-gradient(135deg, #ff4d4d, #d63031);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(214, 48, 49, 0.4);
}

.badge-featured {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: #000;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
}

.badge-import {
  background: linear-gradient(135deg, #00d2ff, #3a7bd5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.badge-global {
  background: linear-gradient(135deg, #ff9f43, #ff6b6b);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(255, 159, 67, 0.5);
  color: #fff;
}
</style>
