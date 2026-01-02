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

const getMainImage = (car) => {
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find(i => Number(i.is_main) === 1) || imgs[0]
  if (!main?.path) return 'https://via.placeholder.com/640x420?text=Car'
  const cleanPath = String(main.path).replaceAll('\\', '/')
  return `${cleanPath}`
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

    if (payload.favorites_count !== undefined && payload.favorites_count !== null) {
      car.favorites_count = Number(payload.favorites_count)
    } else {
      const current = Number(car.favorites_count ?? 0)
      car.favorites_count = newFav ? current + 1 : Math.max(0, current - 1)
    }
  } catch (e) {
    console.error(e)
  }
}

// ✅ Controlled/uncontrolled display
const displayCars = computed(() => (props.cars !== null ? props.cars : localCars.value))
const displayLoading = computed(() => (props.loading !== null ? props.loading : localLoading.value))
const displayError = computed(() => (props.error !== null ? props.error : localError.value))

const fetchCars = async () => {
  // ✅ if controlled, DO NOT fetch
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
    const list = props.approvedOnly ? all.filter(c => c.status === 'approved') : all

    const normalized = list.map(c => {
      const favArr = Array.isArray(c.favorites) ? c.favorites : []

      const favorites_count =
        (c.favorites_count !== undefined && c.favorites_count !== null)
          ? Number(c.favorites_count)
          : favArr.length

      let is_favorited = false
      if (!isAuthed) {
        is_favorited = false
      } else if (c.is_favorited !== undefined && c.is_favorited !== null) {
        is_favorited = !!c.is_favorited
      } else if (userId && favArr.length) {
        is_favorited = favArr.some(f => {
          const id =
            Number(f?.id) ||
            Number(f?.user_id) ||
            Number(f?.pivot?.user_id)
          return id === userId
        })
      }

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

// uncontrolled only watches
watch(
  () => props.params,
  () => fetchCars(),
  { deep: true }
)
watch(
  () => props.limit,
  () => fetchCars()
)
watch(
  () => props.approvedOnly,
  () => fetchCars()
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

        <RouterLink
          v-if="showViewAll"
          class="cars-section__link"
          :to="viewAllTo"
        >
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
          :to="`/user/cars/${car.id}`"
        >
          <div class="car-card__image">
            <img :src="getMainImage(car)" :alt="t(car.title) || `Car #${car.id}`" loading="lazy">

            <button
              class="fav-btn"
              type="button"
              :aria-label="isFav(car) ? 'Remove from favorites' : 'Add to favorites'"
              @click.prevent.stop="toggleFavorite(car)"
            >
              <VIcon :icon="isFav(car) ? 'tabler-heart-filled' : 'tabler-heart'" size="20" />
            </button>
          </div>

          <div class="car-card__body">
            <h3 class="car-card__title">{{ t(car.title) || `Car #${car.id}` }}</h3>

            <div class="car-card__meta">
              <span>{{ t(car.brand?.name) }}</span>
              <span v-if="t(car.model?.name)">• {{ t(car.model?.name) }}</span>
              <span v-if="car.year">• {{ car.year }}</span>
            </div>

            <div class="car-card__footer">
              <div class="car-card__price">{{ formatPrice(car.price) }}</div>
              <div class="car-card__badge">❤️ {{ car.favorites_count ?? 0 }}</div>
            </div>
          </div>
        </RouterLink>
      </div>
    </component>
  </section>
</template>

<style scoped>
.cars-section { padding: 48px 0; }
.cars-section--embedded { padding: 0; }
.cars-section__container { width: 100%; }

.cars-section__header { display:flex; align-items:end; justify-content:space-between; gap:16px; margin-bottom:18px; }
.cars-section__title { font-size:24px; margin:0; }
.cars-section__subtitle { margin:6px 0 0; opacity:.75; }
.cars-section__link { text-decoration:none; font-weight:600; }
.cars-section__state { padding:18px 0; opacity:.8; }
.cars-section__state.error { opacity:1; }

/* default: 4 columns */
.cars-grid { display:grid; gap:16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (max-width:1200px){ .cars-grid{ grid-template-columns:repeat(3, minmax(0, 1fr)); } }
@media (max-width:900px){ .cars-grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@media (max-width:560px){ .cars-grid{ grid-template-columns:1fr; } }

/* embedded: 3 columns */
.cars-section--embedded .cars-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (max-width:1200px){ .cars-section--embedded .cars-grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@media (max-width:600px){ .cars-section--embedded .cars-grid{ grid-template-columns:1fr; } }

.car-card { display:block; border-radius:14px; overflow:hidden; text-decoration:none; background:rgba(255,255,255,.04); transition:transform .15s ease; }
.car-card:hover { transform:translateY(-2px); }
.car-card__image { aspect-ratio:16/10; background:rgba(0,0,0,.15); position:relative; }
.car-card__image img { width:100%; height:100%; object-fit:cover; display:block; }
.car-card__body { padding:14px; }
.car-card__title { margin:0 0 6px; font-size:16px; }
.car-card__meta { opacity:.75; font-size:13px; margin-bottom:10px; }
.car-card__footer { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.car-card__price { font-weight:700; }
.car-card__badge { font-size:12px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,.08); }

.fav-btn {
  position:absolute; top:10px; right:10px;
  width:38px; height:38px; border-radius:12px; border:0;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,.40); backdrop-filter:blur(6px); color:#fff;
}
</style>
