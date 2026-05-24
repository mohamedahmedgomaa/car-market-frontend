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

const formatEngineCapacity = (val) => {
  if (!val) return '—'
  const s = String(val).trim()
  if (/[a-zA-Z\u0600-\u06FF]/.test(s)) {
    return s
  }
  const num = Number(s)
  if (!isNaN(num)) {
    if (num < 10) {
      return `${num}L`
    }
    return `${num} CC`
  }
  return `${s} CC`
}

const formatHorsepower = (val) => {
  if (!val) return '—'
  const s = String(val).trim()
  if (/[a-zA-Z\u0600-\u06FF]/.test(s)) {
    return s
  }
  return `${s} HP`
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
  if (p.startsWith('01') && p.length === 11) return '20' + p
  if (p.startsWith('201') && p.length === 13) return p

  // Saudi (+966)
  if (p.startsWith('05') && p.length === 10) return '966' + p.slice(1)
  if (p.startsWith('5') && p.length === 9) return '966' + p
  if (p.startsWith('9665') && p.length === 12) return p

  // Fallback: Just return numbers if they seem long enough for a phone
  return p.length >= 8 ? p : ''
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

// ✅ Gallery Keyboard Navigation
const nextImage = () => {
  if (!images.value.length) return
  const currentIndex = images.value.findIndex(img => img.url === activeImage.value)
  const nextIdx = (currentIndex + 1) % images.value.length
  selectImage(images.value[nextIdx].url)
}

const prevImage = () => {
  if (!images.value.length) return
  const currentIndex = images.value.findIndex(img => img.url === activeImage.value)
  const prevIdx = (currentIndex - 1 + images.value.length) % images.value.length
  selectImage(images.value[prevIdx].url)
}

// ✅ Lightbox
const showLightbox = ref(false)
const lightboxIndex = ref(0)

const openLightbox = () => {
  lightboxIndex.value = images.value.findIndex(img => img.url === activeImage.value)
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
}

// ✅ Call Dialog
const showCallDialog = ref(false)
const openCallDialog = () => { showCallDialog.value = true }
const closeCallDialog = () => { showCallDialog.value = false }

// ✅ Features Show More / Less Limit (8 * 3 = 24 items)
const showAllFeatures = ref(false)
const displayedFeatures = computed(() => {
  const all = car.value?.features || []
  if (showAllFeatures.value) return all
  return all.slice(0, 24)
})

const handleKeyDown = (e) => {
  if (showLightbox.value) {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowRight') {
      lightboxIndex.value = (lightboxIndex.value + 1) % images.value.length
    }
    if (e.key === 'ArrowLeft') {
      lightboxIndex.value = (lightboxIndex.value - 1 + images.value.length) % images.value.length
    }
  } else {
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }
}

onMounted(() => {
  fetchCar()
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', handleKeyDown)
})

// ✅ Auto-scroll thumbnails when active image changes
const thumbRefs = ref([])
watch(activeImage, () => {
  nextTick(() => {
    const activeEl = thumbRefs.value.find(el => el?.dataset?.url === activeImage.value)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
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
    <!-- Content -->
    <div v-else class="details-layout">
      <!-- TOP: Gallery Section -->
      <section class="gallery-section mb-10">
        <div class="gallery-container">
          <!-- Thumbnails (Vertical on side) -->
          <div v-if="images.length > 1" class="vertical-thumbs">
            <div
              v-for="img in images"
              :key="img.id"
              ref="thumbRefs"
              :data-url="img.url"
              class="thumb-item"
              :class="{ active: img.url === activeImage }"
              @click="selectImage(img.url)"
            >
              <img :src="img.url" alt="">
            </div>
          </div>

          <!-- Main Image -->
          <div class="gallery-hero" @click="openLightbox">
            <Transition name="fade" mode="out-in">
              <img :key="activeImage" :src="activeImage" :alt="t(car.title)" class="main-img">
            </Transition>

            <!-- Nav Arrows -->
            <button class="nav-arrow left" @click.stop="prevImage">
              <VIcon icon="tabler-chevron-left" />
            </button>
            <button class="nav-arrow right" @click.stop="nextImage">
              <VIcon icon="tabler-chevron-right" />
            </button>
            
            <div class="expand-hint">
              <VIcon icon="tabler-arrows-maximize" size="18" />
              <span>Click to enlarge</span>
            </div>

            <button
              class="fav-float"
              type="button"
              @click.prevent.stop="toggleFavorite"
            >
              <VIcon :icon="isFav ? 'tabler-heart-filled' : 'tabler-heart'" size="22" />
              <span class="fav-count">{{ car.favorites_count ?? 0 }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ✅ Lightbox Overlay -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showLightbox" class="lightbox-overlay" @click.self="closeLightbox">
            <div class="lightbox-content">
              <img :src="images[lightboxIndex]?.url" class="lightbox-img">
              
              <button class="lightbox-close" @click="closeLightbox">
                <VIcon icon="tabler-x" size="24" />
              </button>

              <button class="lightbox-nav left" @click="lightboxIndex = (lightboxIndex - 1 + images.length) % images.length">
                <VIcon icon="tabler-chevron-left" size="32" />
              </button>

              <button class="lightbox-nav right" @click="lightboxIndex = (lightboxIndex + 1) % images.length">
                <VIcon icon="tabler-chevron-right" size="32" />
              </button>

              <div class="lightbox-counter">
                {{ lightboxIndex + 1 }} / {{ images.length }}
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- BOTTOM: Detailed Info -->
      <div class="content-section">
        <div class="main-content">
          <!-- Header Area -->
          <div class="info-header mb-8">
            <div class="d-flex justify-space-between align-center flex-wrap gap-4">
              <div>
                <h1 class="text-h3 font-weight-bold mb-2">{{ t(car.title) }}</h1>
                <div class="text-h6 opacity-70">
                  {{ t(car.brand?.name) }} <span class="mx-2">•</span> {{ t(car.model?.name) }} <span class="mx-2">•</span> {{ car.year }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-h3 font-weight-black text-primary mb-1">{{ formatPrice(car.price) }} EG</div>
                <div class="d-flex align-center justify-end gap-2 opacity-60">
                   <VIcon icon="tabler-map-pin" size="16" />
                   <span>{{ t(car.city?.name) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Specs Grid -->
          <div class="specs-grid mb-8">
            <!-- Condition -->
            <div class="spec-card">
              <VIcon icon="tabler-award" class="mb-2" color="primary" />
              <span class="label">Condition</span>
              <span class="val">{{ car.condition === 'new' ? 'New' : 'Used' }}</span>
            </div>

            <!-- Mileage -->
            <div class="spec-card">
              <VIcon icon="tabler-gauge" class="mb-2" color="primary" />
              <span class="label">Mileage</span>
              <span class="val">
                {{ car.condition === 'new' ? '0 Km' : (car.mileage ? car.mileage.toLocaleString() + ' Km' : '—') }}
              </span>
            </div>

            <!-- Engine CC -->
            <div class="spec-card">
              <VIcon icon="tabler-engine" class="mb-2" color="primary" />
              <span class="label">Engine Capacity</span>
              <span class="val">{{ formatEngineCapacity(car.engine_capacity) }}</span>
            </div>

            <!-- Horsepower -->
            <div class="spec-card">
              <VIcon icon="tabler-horse-toy" class="mb-2" color="primary" />
              <span class="label">Horsepower</span>
              <span class="val">{{ formatHorsepower(car.horsepower) }}</span>
            </div>

            <!-- Cylinders -->
            <div class="spec-card">
              <VIcon icon="tabler-engine" class="mb-2" color="primary" />
              <span class="label">Cylinders</span>
              <span class="val">{{ car.cylinders || '—' }}</span>
            </div>

            <!-- Transmission -->
            <div class="spec-card">
              <VIcon icon="tabler-manual-gearbox" class="mb-2" color="primary" />
              <span class="label">Transmission</span>
              <span class="val text-capitalize">{{ car.transmission || '—' }}</span>
            </div>

            <!-- Fuel Type -->
            <div class="spec-card">
              <VIcon icon="tabler-gas-station" class="mb-2" color="primary" />
              <span class="label">Fuel Type</span>
              <span class="val text-capitalize">{{ car.fuel_type || '—' }}</span>
            </div>

            <!-- Drivetrain -->
            <div class="spec-card">
              <VIcon icon="tabler-circles-relation" class="mb-2" color="primary" />
              <span class="label">Drivetrain</span>
              <span class="val text-uppercase">{{ car.drivetrain || '—' }}</span>
            </div>

            <!-- Color -->
            <div class="spec-card">
              <VIcon icon="tabler-palette" class="mb-2" color="primary" />
              <span class="label">Color</span>
              <div class="d-flex align-center gap-2 val justify-center">
                <div class="color-dot" :style="{ background: car.color || '#ccc' }" />
                <span>{{ car.color || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <VCard variant="tonal" class="desc-card mb-8 pa-6" v-if="t(car.description)">
            <h3 class="text-h5 font-weight-bold mb-4 d-flex align-center gap-2">
              <VIcon icon="tabler-align-left" color="primary" />
              Description
            </h3>
            <p class="text-body-1 opacity-80 leading-relaxed">{{ t(car.description) }}</p>
          </VCard>

          <!-- Features -->
          <div class="features-section mb-8" v-if="car.features?.length">
            <h3 class="text-h5 font-weight-bold mb-4 d-flex align-center gap-2">
              <VIcon icon="tabler-list-check" color="primary" />
              Features & Equipment
            </h3>
            <div class="features-grid">
              <div v-for="f in displayedFeatures" :key="f.id" class="feature-item">
                <VIcon icon="tabler-check" size="18" class="me-2 text-primary" />
                {{ t(f.name) }}
              </div>
            </div>

            <!-- Show More / Less button -->
            <div v-if="car.features.length > 24" class="text-center mt-6">
              <VBtn
                variant="tonal"
                color="primary"
                class="rounded-xl px-6 font-weight-bold"
                height="44"
                @click="showAllFeatures = !showAllFeatures"
              >
                <VIcon :icon="showAllFeatures ? 'tabler-chevron-up' : 'tabler-chevron-down'" class="me-2" />
                <span>{{ showAllFeatures ? 'Show Less / عرض أقل' : 'Show More / عرض المزيد (+' + (car.features.length - 24) + ')' }}</span>
              </VBtn>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="sidebar-content">
          <VCard class="seller-card pa-6 mb-6">
            <div class="text-overline mb-4 opacity-60">Listing Owner</div>
            
            <!-- Seller Profile Link -->
            <RouterLink 
              v-if="sellerLink" 
              :to="sellerLink" 
              class="d-flex align-center gap-4 mb-8 text-decoration-none text-high-emphasis seller-profile-header"
            >
               <VAvatar color="primary" size="64" class="text-h4 font-weight-bold elevation-4 overflow-hidden">
                 <img v-if="car.seller?.store_logo" :src="car.seller.store_logo" alt="Seller Logo" class="w-100 h-100" style="object-fit: contain; padding: 4px;" />
                 <span v-else>{{ (car.seller?.store_name ? t(car.seller.store_name) : car.seller?.name)?.charAt(0)?.toUpperCase() }}</span>
               </VAvatar>
               <div>
                 <div class="font-weight-bold text-h5 mb-1">{{ car.seller?.store_name ? t(car.seller.store_name) : car.seller?.name }}</div>
                 <div class="d-flex align-center gap-1 text-success text-caption">
                    <VIcon icon="tabler-circle-check-filled" size="14" />
                    Verified Dealer
                 </div>
               </div>
            </RouterLink>

            <div class="d-flex gap-2 w-100">
              <!-- Phone Call -->
              <VBtn
                v-if="car.seller?.phone"
                variant="flat"
                color="primary"
                class="contact-btn flex-1-1-0"
                height="54"
                @click="openCallDialog"
              >
                <VIcon icon="tabler-phone" size="22" class="me-1" />
                Call
              </VBtn>

              <!-- WhatsApp -->
              <VBtn
                v-if="car.seller?.phone"
                color="#25D366"
                class="contact-btn text-white flex-1-1-0"
                height="54"
                elevation="0"
                :href="whatsappLink"
                target="_blank"
              >
                <VIcon icon="tabler-brand-whatsapp" size="24" class="me-1" />
                WhatsApp
              </VBtn>
            </div>
          </VCard>

          <!-- ✅ Call Confirmation Dialog -->
          <VDialog v-model="showCallDialog" max-width="400">
            <VCard class="pa-6 text-center">
              <VAvatar color="primary" variant="tonal" size="70" class="mb-4">
                <VIcon icon="tabler-phone-calling" size="40" />
              </VAvatar>
              
              <h3 class="text-h5 font-weight-bold mb-2">Call Seller</h3>
              <p class="text-body-1 opacity-70 mb-6">
                Contact <strong>{{ car.seller?.store_name ? t(car.seller.store_name) : car.seller?.name }}</strong> directly at:
              </p>

              <div class="phone-display mb-8">
                {{ car.seller?.phone }}
              </div>

              <div class="d-flex flex-column gap-3">
                <VBtn
                  color="primary"
                  block
                  height="50"
                  size="large"
                  class="font-weight-bold"
                  :href="`tel:${car.seller?.phone}`"
                  @click="closeCallDialog"
                >
                  <VIcon icon="tabler-phone" class="me-2" />
                  Call Now
                </VBtn>

                <VBtn
                  variant="text"
                  block
                  height="50"
                  @click="closeCallDialog"
                >
                  Cancel
                </VBtn>
              </div>
            </VCard>
          </VDialog>

          <VCard variant="flat" class="pa-5 text-center rounded-xl metadata-card mb-4" style="background: rgba(var(--v-theme-surface), 0.5); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex align-center justify-center gap-2">
                <VIcon icon="tabler-hash" size="18" color="primary" />
                <span class="text-subtitle-2 font-weight-black">Listing ID: #{{ car.id }}</span>
              </div>
              <VDivider opacity="0.1" />
              <div class="d-flex align-center justify-center gap-2 opacity-70">
                <VIcon icon="tabler-calendar-event" size="18" />
                <span class="text-caption font-weight-medium">
                  {{ car.created_at ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(car.created_at)) : '—' }}
                </span>
              </div>
            </div>
          </VCard>
        </div>
      </div>
    </div>
  </VContainer>
</template>

<style scoped>
.details-layout {
  max-width: 1100px;
  margin: 0 auto;
}

.gallery-section {
  width: 100%;
}

.gallery-container {
  display: flex;
  gap: 16px;
  height: 480px; /* Smaller height to show content below */
}

@media (max-width: 900px) {
  .gallery-container {
    flex-direction: column-reverse;
    height: auto;
  }
}

.gallery-hero {
  position: relative;
  flex: 1;
  background: #000;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0,0,0,0.4);
  cursor: pointer;
}

.main-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
  z-index: 2;
}

.gallery-hero:hover .nav-arrow {
  opacity: 1;
}

.seller-profile-header {
  transition: transform 0.2s;
}

.seller-profile-header:hover {
  transform: translateX(4px);
}

.seller-profile-header:hover .text-h5 {
  color: rgb(var(--v-theme-primary));
}

.contact-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 14px;
  text-transform: none;
}

.phone-display {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 28px;
  font-weight: 900;
  padding: 16px;
  border-radius: 16px;
  letter-spacing: 1px;
}

.nav-arrow:hover {
  background: rgba(var(--v-theme-primary), 0.8);
}

.nav-arrow.left { left: 20px; }
.nav-arrow.right { right: 20px; }

.expand-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 999px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 2;
}

.gallery-hero:hover .expand-hint {
  opacity: 1;
}

.fav-float {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  cursor: pointer;
  z-index: 3;
}

/* Lightbox Styles */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.lightbox-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

.lightbox-close {
  position: fixed;
  top: 30px;
  right: 30px;
  color: #fff;
  background: rgba(255,255,255,0.1);
  border: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 100;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #fff;
  background: rgba(255,255,255,0.05);
  border: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.lightbox-nav:hover { background: rgba(255,255,255,0.15); }
.lightbox-nav.left { left: 0; }
.lightbox-nav.right { right: 0; }

.lightbox-counter {
  position: absolute;
  bottom: -40px;
  color: #fff;
  font-weight: 700;
  opacity: 0.7;
}

.vertical-thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Custom scrollbar for vertical thumbs */
.vertical-thumbs::-webkit-scrollbar {
  width: 4px;
}
.vertical-thumbs::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
}

@media (max-width: 900px) {
  .vertical-thumbs {
    flex-direction: row;
    width: 100%;
    overflow-x: auto;
    height: 70px;
  }
  .gallery-hero {
     aspect-ratio: 16/9;
  }
}

.thumb-item {
  flex: 0 0 65px; /* Smaller thumb height */
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  opacity: 0.5;
  transition: all 0.2s;
}

.vertical-thumbs .thumb-item {
  height: 65px;
}

.thumb-item.active {
  border-color: rgb(var(--v-theme-primary));
  opacity: 1;
  transform: scale(1.02);
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Content */
.content-section {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
}

@media (max-width: 900px) {
  .content-section { grid-template-columns: 1fr; }
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.spec-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.spec-card:hover {
  background: rgba(255,255,255,0.06);
  transform: translateY(-4px);
}

.spec-card .label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.5;
  margin-bottom: 4px;
}

.spec-card .val {
  font-size: 15px;
  font-weight: 700;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.feature-item {
  background: rgba(255,255,255,0.03);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.seller-card {
  position: sticky;
  top: 110px;
  background-color: #25293c !important;
  opacity: 1 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  z-index: 100 !important;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.leading-relaxed { line-height: 1.8; }
</style>
