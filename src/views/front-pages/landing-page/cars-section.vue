<script setup>
import { onMounted, ref, watch } from 'vue'
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

  // ✅ for embedding inside another layout (Profile page)
  embedded: { type: Boolean, default: false },
})

const loading = ref(false)
const error = ref('')
const cars = ref([])

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const favIds = ref(new Set())
const isFav = (car) => !!car?.is_favorited

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
  return `${API_BASE}/storage/${cleanPath}`
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

const toggleFavorite = async (car) => {
  const token = localStorage.getItem('user_token')
  if (!token) return router.push('/login')

  try {
    const res = await carsUserApi.toggleFavorite(car.id)
    const payload = res?.data?.data ?? res?.data ?? {}

    const newFav = !!payload.is_favorited
    car.is_favorited = newFav

    // ✅ count (prefer backend count if exists)
    if (payload.favorites_count !== undefined && payload.favorites_count !== null) {
      car.favorites_count = Number(payload.favorites_count)
    } else {
      const current = Number(car.favorites_count ?? 0)
      car.favorites_count = newFav ? current + 1 : Math.max(0, current - 1)
    }

    if (newFav) favIds.value.add(car.id)
    else favIds.value.delete(car.id)
  } catch (e) {
    console.error(e)
  }
}

const fetchCars = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await carsUserApi.getAll({
      per_page: props.limit,
      ...(props.approvedOnly ? { 'filter[status]': 'approved' } : {}),
      ...props.params,
    })

    const all = normalizeCars(res.data)
    const list = props.approvedOnly ? all.filter(c => c.status === 'approved') : all

    // ✅ normalize favorites from LIST api
    const normalized = list.map(c => {
      const favArr = Array.isArray(c.favorites) ? c.favorites : []

      const favorites_count =
        (c.favorites_count !== undefined && c.favorites_count !== null)
          ? Number(c.favorites_count)
          : favArr.length

      const is_favorited =
        (c.is_favorited !== undefined && c.is_favorited !== null)
          ? !!c.is_favorited
          : favArr.length > 0

      return { ...c, favorites_count, is_favorited }
    })

    cars.value = normalized
    favIds.value = new Set(normalized.filter(x => x.is_favorited).map(x => x.id))
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load cars'
    cars.value = []
    favIds.value = new Set()
  } finally {
    loading.value = false
  }
}

onMounted(fetchCars)
watch(() => props.params, fetchCars, { deep: true })
watch(() => props.limit, fetchCars)
</script>

<template>
  <section class="cars-section" :class="{ 'cars-section--embedded': embedded }">
    <component :is="embedded ? 'div' : 'VContainer'" class="cars-section__container">
      <div class="cars-section__header">
        <div>
          <h2 class="cars-section__title">{{ title }}</h2>
          <p class="cars-section__subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>

        <RouterLink class="cars-section__link" :to="viewAllTo">
          View all
        </RouterLink>
      </div>

      <div v-if="loading" class="cars-section__state">Loading cars...</div>
      <div v-else-if="error" class="cars-section__state error">{{ error }}</div>
      <div v-else-if="cars.length === 0" class="cars-section__state">No cars found.</div>

      <div v-else class="cars-grid">
        <RouterLink
          v-for="car in cars"
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

/* ✅ default (Home): 4 columns */
.cars-grid {
  display:grid;
  gap:16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
@media (max-width:1200px){ .cars-grid{ grid-template-columns:repeat(3, minmax(0, 1fr)); } }
@media (max-width:900px){ .cars-grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@media (max-width:560px){ .cars-grid{ grid-template-columns:1fr; } }

/* ✅ embedded (Profile داخل كارد): 3 columns */
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
