<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'

definePage({
  meta: {
    layout: 'front',
    public: true,
  },
})

const route = useRoute()
const carId = computed(() => route.params.id)

const loading = ref(false)
const error = ref('')
const car = ref(null)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const buildImg = (path) => {
  if (!path) return 'https://via.placeholder.com/960x640?text=Car'
  const cleanPath = String(path).replaceAll('\\', '/')
  return `${API_BASE}/storage/${cleanPath}`
}

const images = computed(() => {
  const imgs = car.value?.images || []
  return imgs.map(i => ({
    ...i,
    url: buildImg(i.path),
  }))
})

const mainImage = computed(() => {
  const imgs = images.value
  const main = imgs.find(i => Number(i.is_main) === 1) || imgs[0]
  return main?.url || 'https://via.placeholder.com/960x640?text=Car'
})

const formatPrice = (price) => {
  const n = Number(price)
  if (Number.isNaN(n)) return price ?? '—'
  return n.toLocaleString()
}

// لو حابب thumbnail selection
const selectedImage = ref(null)
const activeImage = computed(() => selectedImage.value || mainImage.value)
const selectImage = (url) => { selectedImage.value = url }

// ✅ Fetch by id (works on same component reuse)
const fetchCar = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await carsUserApi.getById(carId.value)
    const data = res.data?.data ?? res.data

    if (!data || data.status !== 'approved') {
      car.value = null
      error.value = 'This car is not available.'
      return
    }

    car.value = data
  } catch (e) {
    console.error(e)
    car.value = null
    error.value = 'Failed to load car details'
  } finally {
    loading.value = false
  }
}

const normalizePhone = (phone) => {
  if (!phone) return ''
  let p = String(phone).replace(/\D/g, '')
  if (p.startsWith('00')) p = p.slice(2)

  // Egypt (+20)
  if (p.startsWith('01') && p.length === 11) p = '20' + p
  if (p.startsWith('201') && p.length === 13) return '+' + p

  // Saudi (+966)
  if (p.startsWith('05') && p.length === 10) p = '966' + p.slice(1)
  if (p.startsWith('5') && p.length === 9) p = '966' + p
  if (p.startsWith('9665') && p.length === 12) return '+' + p

  return ''
}

const whatsappLink = computed(() => {
  const phone = normalizePhone(car.value?.seller?.phone)
  if (!phone) return ''

  const msg = `Hi, I'm interested in your car: ${t(car.value?.title)} (ID: ${car.value?.id}).`
  return `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(msg)}`
})

onMounted(fetchCar)

// ✅ أهم حل للمشكلة: لو الـ id اتغير، هات بيانات جديدة + reset الصور + scroll top
watch(
  () => route.params.id,
  async () => {
    selectedImage.value = null
    await fetchCar()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
)
</script>

<template>
  <VContainer class="py-10">
    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="!car" class="state">Car not found.</div>

    <div v-else class="details">
      <!-- LEFT: Gallery -->
      <div class="gallery">
        <div class="hero-img">
          <img :src="activeImage" :alt="t(car.title) || `Car #${car.id}`">
        </div>

        <div v-if="images.length" class="thumbs">
          <button
            v-for="img in images"
            :key="img.id"
            class="thumb"
            type="button"
            @click="selectImage(img.url)"
          >
            <img :src="img.url" alt="">
          </button>
        </div>
      </div>

      <!-- RIGHT: Info -->
      <div class="info">
        <div class="top">
          <h1 class="title">{{ t(car.title) || `Car #${car.id}` }}</h1>

          <div class="price">
            {{ formatPrice(car.price) }}
          </div>

          <div class="meta">
            <span>{{ t(car.brand?.name) }}</span>
            <span v-if="t(car.model?.name)">• {{ t(car.model?.name) }}</span>
            <span v-if="car.year">• {{ car.year }}</span>
            <span v-if="t(car.city?.name)">• {{ t(car.city?.name) }}</span>
          </div>

          <div class="badges">
            <span v-if="car.transmission" class="badge">{{ car.transmission }}</span>
            <span v-if="car.fuel_type" class="badge">{{ car.fuel_type }}</span>
            <span v-if="car.drivetrain" class="badge">{{ car.drivetrain }}</span>
            <span v-if="car.condition" class="badge">{{ car.condition }}</span>
            <span v-if="car.status" class="badge">{{ car.status }}</span>
          </div>
        </div>

        <div class="specs">
          <div class="spec"><span>Mileage</span><b>{{ car.mileage ?? '—' }}</b></div>
          <div class="spec">
            <span>Color</span>
            <b><span class="color" :style="{ background: car.color || '#ccc' }" /></b>
          </div>
          <div class="spec"><span>Seller</span><b>{{ car.seller?.store_name ? t(car.seller.store_name) : (car.seller?.name || '—') }}</b></div>
        </div>

        <div class="desc" v-if="t(car.description)">
          <h3>Description</h3>
          <p>{{ t(car.description) }}</p>
        </div>

        <div class="features" v-if="Array.isArray(car.features) && car.features.length">
          <h3>Features</h3>
          <div class="feature-list">
            <span v-for="f in car.features" :key="f.id" class="feature">
              {{ t(f.name) }}
            </span>
          </div>
        </div>

        <div class="actions">
          <a
            v-if="whatsappLink"
            class="wa-btn"
            :href="whatsappLink"
            target="_blank"
            rel="noopener"
          >
            Contact Seller on WhatsApp
          </a>

          <div v-else class="state">
            Seller phone not available.
          </div>
        </div>
      </div>
    </div>
  </VContainer>
</template>

<style scoped>
.state { padding: 24px 0; opacity: .85; }
.state.error { opacity: 1; }

.details{
  display:grid;
  grid-template-columns: 1.2fr .8fr;
  gap:24px;
}
@media (max-width: 1000px){
  .details{ grid-template-columns: 1fr; }
}

.gallery .hero-img{
  border-radius: 16px;
  overflow: hidden;
  background: rgba(0,0,0,.12);
  aspect-ratio: 16/10;
}
.gallery .hero-img img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}

.thumbs{
  margin-top: 12px;
  display:flex;
  gap:10px;
  overflow:auto;
  padding-bottom: 4px;
}
.thumb{
  border:0;
  padding:0;
  background:transparent;
  width: 92px;
  height: 64px;
  border-radius: 12px;
  overflow:hidden;
  cursor:pointer;
  flex: 0 0 auto;
}
.thumb img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}

.info .title{ margin:0; font-size:28px; }
.price{ font-size:22px; font-weight:800; margin-top: 8px; }
.meta{ opacity:.75; margin-top: 6px; display:flex; flex-wrap:wrap; gap:8px; }

.badges{ margin-top: 12px; display:flex; flex-wrap:wrap; gap:8px; }
.badge{
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
}

.specs{
  margin-top: 18px;
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap:12px;
}
@media (max-width: 600px){
  .specs{ grid-template-columns: 1fr; }
}
.spec{
  padding: 12px;
  border-radius: 14px;
  background: rgba(255,255,255,.04);
}
.spec span{ opacity:.7; font-size: 13px; }
.spec b{ display:block; margin-top: 4px; font-size: 14px; }

.color{
  width: 18px;
  height: 18px;
  border-radius: 6px;
  display:inline-block;
  border: 1px solid rgba(255,255,255,.25);
}

.desc, .features{ margin-top: 18px; }
.desc h3, .features h3{ margin: 0 0 8px; }
.desc p{ margin:0; opacity:.85; line-height: 1.7; }

.feature-list{ display:flex; flex-wrap:wrap; gap:8px; }
.feature{
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
}

.actions{
  margin-top: 22px;
  display:flex;
  gap:12px;
  flex-wrap: wrap;
}
.wa-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 12px 16px;
  border-radius: 14px;
  text-decoration:none;
  font-weight:700;
  background: rgba(255,255,255,.08);
}
.wa-btn:hover{ transform: translateY(-1px); }
</style>
