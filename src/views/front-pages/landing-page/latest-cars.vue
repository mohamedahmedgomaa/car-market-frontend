<script setup>
import { onMounted, ref } from 'vue'
import carsUserApi from '@/api/user/carUserApi.js' // ✅ نفس مسارك

const props = defineProps({
  limit: { type: Number, default: 20 },
})

const loading = ref(false)
const error = ref('')
const cars = ref([])

// ✅ base url للصور
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ✅ ترجمة object {ar,en} أو string
const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

// ✅ يجيب الصورة الرئيسية is_main=1 ولو مش موجودة ياخد أول صورة
const getMainImage = (car) => {
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find(i => Number(i.is_main) === 1) || imgs[0]

  if (!main?.path) return 'https://via.placeholder.com/640x420?text=Car'

  const cleanPath = String(main.path).replaceAll('\\', '/')

  // أغلب Laravel storage: /storage/...
  return `${API_BASE}/storage/${cleanPath}`
}

// ✅ response عندك: { status: 200, data: [...] }
const normalizeCars = (payload) => {
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}
const fetchCars = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await carsUserApi.getAll({
      per_page: props.limit,
      status: 'approved',
    })

    const all = normalizeCars(res.data)
    cars.value = all.filter(c => c.status === 'approved')
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load cars'
  } finally {
    loading.value = false
  }
}
const formatPrice = (price) => {
  const n = Number(price)
  if (Number.isNaN(n)) return price ?? '—'
  return n.toLocaleString()
}

onMounted(fetchCars)
</script>

<template>
  <section class="cars-section">
    <VContainer>
      <!-- Header -->
      <div class="cars-section__header">
        <div>
          <h2 class="cars-section__title">Latest Cars</h2>
          <p class="cars-section__subtitle">Browse our newest listings</p>
        </div>

        <RouterLink class="cars-section__link" to="user/cars">
          View all
        </RouterLink>
      </div>

      <!-- States -->
      <div v-if="loading" class="cars-section__state">
        Loading cars...
      </div>

      <div v-else-if="error" class="cars-section__state error">
        {{ error }}
      </div>

      <div v-else-if="cars.length === 0" class="cars-section__state">
        No cars found.
      </div>

      <!-- Grid -->
      <div v-else class="cars-grid">
        <RouterLink
          v-for="car in cars"
          :key="car.id"
          class="car-card"
          :to="`/user/cars/${car.id}`"
        >
          <div class="car-card__image">
            <img
              :src="getMainImage(car)"
              :alt="t(car.title) || `Car #${car.id}`"
              loading="lazy"
            >
          </div>

          <div class="car-card__body">
            <h3 class="car-card__title">
              {{ t(car.title) || `Car #${car.id}` }}
            </h3>

            <div class="car-card__meta">
              <span>{{ t(car.brand?.name) }}</span>
              <span v-if="t(car.model?.name)">• {{ t(car.model?.name) }}</span>
              <span v-if="car.year">• {{ car.year }}</span>
            </div>

            <div class="car-card__footer">
              <div class="car-card__price">
                {{ formatPrice(car.price) }}
              </div>

              <div class="car-card__badge" v-if="car.status">
                {{ car.status }}
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </VContainer>
  </section>
</template>

<style scoped>
.cars-section {
  padding: 48px 0;
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

.car-card {
  display: block;
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.04);
  transition: transform 0.15s ease;
}

.car-card:hover {
  transform: translateY(-2px);
}

.car-card__image {
  aspect-ratio: 16 / 10;
  background: rgba(0, 0, 0, 0.15);
}

.car-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.car-card__body {
  padding: 14px;
}

.car-card__title {
  margin: 0 0 6px;
  font-size: 16px;
}

.car-card__meta {
  opacity: 0.75;
  font-size: 13px;
  margin-bottom: 10px;
}

.car-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.car-card__price {
  font-weight: 700;
}

.car-card__badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}
</style>
