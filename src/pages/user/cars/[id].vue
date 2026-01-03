<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'

definePage({
  meta: {
    layout: 'front',
    public: true,
  },
})

const route = useRoute()
const router = useRouter()

const carId = computed(() => route.params.id)

const loading = ref(false)
const error = ref('')
const car = ref(null)

const API_BASE = import.meta.env.VITE_BASE_URL

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

/**
 * ✅ IMPORTANT:
 * أنت حالياً بتعمل:
 * return `${cleanPath}`
 * يعني بتتوقع الـ API يرجع URL كامل.
 * لو عندك صور storage على باك اند، رجّعها هنا:
 * return `${API_BASE}/storage/${cleanPath}`
 */
const buildImg = (path) => {
  if (!path) return 'https://via.placeholder.com/1200x675?text=Car'
  const cleanPath = String(path).replaceAll('\\', '/')
  return `${cleanPath}`
}

const images = computed(() => {
  const imgs = car.value?.images || []
  return imgs
    .filter(i => i?.path)
    .map(i => ({ ...i, url: buildImg(i.path) }))
})

const mainImage = computed(() => {
  const imgs = images.value
  const main = imgs.find(i => Number(i.is_main) === 1) || imgs[0]
  return main?.url || 'https://via.placeholder.com/1200x675?text=Car'
})

// ✅ thumbnail selection
const selectedImage = ref(null)
const activeImage = computed(() => selectedImage.value || mainImage.value)
const selectImage = (url) => { selectedImage.value = url }

const formatPrice = (price) => {
  const n = Number(price)
  if (Number.isNaN(n)) return price ?? '—'
  return n.toLocaleString()
}

// -------------------------
// ✅ Favorites (Details page)
// -------------------------
const getAuth = () => {
  const token = localStorage.getItem('user_token')
  let userId = null
  try {
    const u = JSON.parse(localStorage.getItem('user_data') || 'null')
    userId = u?.id ? Number(u.id) : null
  } catch {}
  return { token, userId }
}

const isFav = computed(() => !!car.value?.is_favorited)

const ensureFavFields = (c) => {
  if (!c) return c

  const { token, userId } = getAuth()
  const isAuthed = !!token

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
}

const toggleFavorite = async () => {
  const { token } = getAuth()
  if (!token) return router.push('/login')
  if (!car.value?.id) return

  try {
    const res = await carsUserApi.toggleFavorite(car.value.id)
    const payload = res?.data?.data ?? res?.data ?? {}

    const newFav = !!payload.is_favorited
    car.value.is_favorited = newFav

    if (payload.favorites_count !== undefined && payload.favorites_count !== null) {
      car.value.favorites_count = Number(payload.favorites_count)
    } else {
      const current = Number(car.value.favorites_count ?? 0)
      car.value.favorites_count = newFav ? current + 1 : Math.max(0, current - 1)
    }
  } catch (e) {
    console.error(e)
  }
}

// -------------------------
// ✅ Fetch by id
// -------------------------
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

    car.value = ensureFavFields(data)
  } catch (e) {
    console.error(e)
    car.value = null
    error.value = 'Failed to load car details'
  } finally {
    loading.value = false
    requestAnimationFrame(updateThumbNav)
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

/* =========================
   ✅ Seller profile link
========================= */
const sellerId = computed(() => car.value?.seller?.id ?? car.value?.seller_id ?? null)

const sellerLink = computed(() => {
  if (!sellerId.value) return null
  return `/user/sellers/${sellerId.value}`
})

const goSeller = () => {
  if (!sellerId.value) return
  router.push(sellerLink.value)
}

/* =========================
   ✅ Thumbnails scroll controls
========================= */
const thumbsEl = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateThumbNav = () => {
  const el = thumbsEl.value
  if (!el) return
  const maxScrollLeft = el.scrollWidth - el.clientWidth
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft < maxScrollLeft - 2
}

const scrollThumbs = (dir) => {
  const el = thumbsEl.value
  if (!el) return
  const step = Math.max(220, el.clientWidth * 0.75)
  el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  setTimeout(updateThumbNav, 200)
}

const onThumbsScroll = () => updateThumbNav()
const onResize = () => updateThumbNav()

onMounted(() => {
  fetchCar()
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

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
    <!-- Loading -->
    <div v-if="loading" class="state">
      <div class="skeleton">
        <div class="sk-hero" />
        <div class="sk-line w60" />
        <div class="sk-line w40" />
        <div class="sk-grid">
          <div class="sk-card" v-for="i in 6" :key="i" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state error">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="!car" class="state">Car not found.</div>

    <!-- Content -->
    <div v-else class="details">
      <!-- LEFT: Gallery -->
      <div class="gallery">
        <div class="hero-img">
          <img :src="activeImage" :alt="t(car.title) || `Car #${car.id}`">

          <button
            class="fav-float"
            type="button"
            :aria-label="isFav ? 'Remove from favorites' : 'Add to favorites'"
            @click.prevent.stop="toggleFavorite"
          >
            <VIcon :icon="isFav ? 'tabler-heart-filled' : 'tabler-heart'" size="20" />
            <span class="fav-count">{{ car.favorites_count ?? 0 }}</span>
          </button>
        </div>

        <!-- ✅ Thumbnails -->
        <div v-if="images.length" class="thumbs-shell">
          <div class="fade fade-left" />
          <div class="fade fade-right" />

          <button
            v-show="canScrollLeft"
            class="thumb-nav left"
            type="button"
            aria-label="Scroll thumbnails left"
            @click="scrollThumbs('left')"
          >
            <VIcon icon="tabler-chevron-left" size="18" />
          </button>

          <div
            ref="thumbsEl"
            class="thumbs"
            @scroll.passive="onThumbsScroll"
          >
            <button
              v-for="img in images"
              :key="img.id"
              class="thumb"
              type="button"
              :class="{ active: img.url === activeImage }"
              @click="selectImage(img.url)"
            >
              <img :src="img.url" alt="">
            </button>
          </div>

          <button
            v-show="canScrollRight"
            class="thumb-nav right"
            type="button"
            aria-label="Scroll thumbnails right"
            @click="scrollThumbs('right')"
          >
            <VIcon icon="tabler-chevron-right" size="18" />
          </button>
        </div>
      </div>

      <!-- RIGHT: Info -->
      <div class="info">
        <div class="top">
          <div class="title-row">
            <h1 class="title">{{ t(car.title) || `Car #${car.id}` }}</h1>

            <button
              class="fav-inline"
              type="button"
              :aria-label="isFav ? 'Remove from favorites' : 'Add to favorites'"
              @click.prevent.stop="toggleFavorite"
            >
              <VIcon :icon="isFav ? 'tabler-heart-filled' : 'tabler-heart'" size="20" />
              <span class="fav-count">{{ car.favorites_count ?? 0 }}</span>
            </button>
          </div>

          <div class="price">{{ formatPrice(car.price) }}</div>

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

          <div class="spec">
            <span>Seller</span>

            <b
              v-if="sellerLink"
              class="seller-click"
              @click="goSeller"
              title="View seller profile"
            >
              {{ car.seller?.store_name ? t(car.seller.store_name) : (car.seller?.name || '—') }}
              <VIcon icon="tabler-external-link" size="16" class="ms-1" />
            </b>

            <b v-else>—</b>
          </div>
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
          <RouterLink v-if="sellerLink" class="profile-btn" :to="sellerLink">
            View Seller Profile
          </RouterLink>

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

/* Layout */
.details{
  display:grid;
  grid-template-columns: 1.4fr 1fr;
  gap:24px;
}
@media (max-width: 1000px){
  .details{ grid-template-columns: 1fr; }
}

/* Hero */
.gallery .hero-img{
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(255,255,255,.06), rgba(0,0,0,.45));
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}
@media (max-width: 600px){
  .gallery .hero-img{
    aspect-ratio: 4 / 3;
    max-height: 60vh;
  }
}
.gallery .hero-img img{
  width: 100%;
  height: 100%;
  object-fit: contain;
  display:block;
}

/* Favorite */
.fav-float{
  position:absolute;
  top:12px;
  right:12px;
  border:0;
  cursor:pointer;
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px 12px;
  border-radius: 14px;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(8px);
  color:#fff;
}
.fav-inline{
  border:0;
  cursor:pointer;
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 10px;
  border-radius: 14px;
  background: rgba(255,255,255,.08);
}
.fav-count{
  font-weight: 800;
  font-size: 13px;
  opacity: .95;
}

/* ✅ Thumbnails smaller */
.thumbs-shell{
  margin-top: 10px;
  position: relative;
  max-width: 820px;
  width: 100%;
  margin-inline: auto;
  border-radius: 16px;
  padding: 4px 0;
}

.thumbs{
  display:flex;
  gap:8px;
  overflow-x:auto;
  overflow-y:hidden;
  padding: 2px 40px 6px;
  scroll-behavior:smooth;
  scrollbar-width:none;
  scroll-snap-type:x mandatory;
}
.thumbs::-webkit-scrollbar{ display:none; }

.thumb{
  border:0;
  padding:0;
  background:transparent;
  width: 72px;
  height: 50px;
  border-radius: 12px;
  overflow:hidden;
  cursor:pointer;
  flex: 0 0 auto;
  outline: 2px solid transparent;
  transition: transform .15s ease, outline-color .15s ease, opacity .15s ease;
  opacity: .85;
  scroll-snap-align: start;
}
.thumb:hover{ transform: translateY(-1px); opacity: 1; }
.thumb.active{
  opacity: 1;
  outline-color: rgba(255,255,255,.35);
}
.thumb img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}

/* arrows smaller */
.thumb-nav{
  position:absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: 12px;
  border: 0;
  cursor: pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(8px);
  z-index: 3;
}
.thumb-nav.left{ left: 6px; }
.thumb-nav.right{ right: 6px; }
.thumb-nav:hover{ background: rgba(0,0,0,.6); }

/* fades thinner */
.fade{
  position:absolute;
  top: 0;
  bottom: 0;
  width: 42px;
  pointer-events: none;
  z-index: 2;
}
.fade-left{
  left: 0;
  background: linear-gradient(to right, rgba(27,31,48,.95), rgba(27,31,48,0));
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}
.fade-right{
  right: 0;
  background: linear-gradient(to left, rgba(27,31,48,.95), rgba(27,31,48,0));
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
}

/* responsive */
@media (max-width: 600px){
  .thumbs{ padding: 2px 36px 6px; gap: 7px; }
  .thumb{ width: 64px; height: 46px; border-radius: 10px; }
}

/* Info */
.info .title{ margin:0; font-size:28px; line-height: 1.2; }
.title-row{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}

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

.seller-click{
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:6px;
  text-decoration: underline;
  text-underline-offset: 4px;
  opacity: .95;
}
.seller-click:hover{ opacity: 1; }

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

.wa-btn, .profile-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 12px 16px;
  border-radius: 14px;
  text-decoration:none;
  font-weight:700;
  background: rgba(255,255,255,.08);
  transition: transform .15s ease, opacity .15s ease;
}
.profile-btn{ background: rgba(255,255,255,.06); }
.wa-btn:hover, .profile-btn:hover{ transform: translateY(-1px); opacity: 1; }

/* Skeleton */
.skeleton{ display:grid; gap:14px; }
.sk-hero{ border-radius: 16px; aspect-ratio: 16 / 9; background: rgba(255,255,255,.06); }
.sk-line{ height: 14px; border-radius: 10px; background: rgba(255,255,255,.06); }
.sk-line.w60{ width: 60%; }
.sk-line.w40{ width: 40%; }
.sk-grid{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; }
.sk-card{ height: 56px; border-radius: 14px; background: rgba(255,255,255,.05); }
</style>
