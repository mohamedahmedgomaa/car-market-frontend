<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import carsUserApi from '@/api/user/carUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import api from '@/api/index.js'

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
import { useI18n } from 'vue-i18n'
const { t: _t } = useI18n()

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
  return imgs.filter((i) => i?.path).map((i) => ({ ...i, url: buildImg(i.path) }))
})

const mainImage = computed(() => {
  const imgs = images.value
  const main = imgs.find((i) => Number(i.is_main) === 1) || imgs[0]
  return main?.url || 'https://via.placeholder.com/1200x675?text=Car'
})

// ✅ thumbnail selection
const selectedImage = ref(null)
const activeImage = computed(() => selectedImage.value || mainImage.value)
const selectImage = (url) => {
  selectedImage.value = url
}

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

const getEngineCapacityDetails = (val) => {
  if (!val) return { cc: '—', l: '' }
  const s = String(val).trim()
  if (/[a-zA-Z\u0600-\u06FF]/.test(s)) {
    return { cc: s, l: '' }
  }
  const num = Number(s)
  if (!isNaN(num)) {
    if (num < 10) {
      return {
        cc: `${Math.round(num * 1000)} CC`,
        l: `${num}L`,
      }
    }
    return {
      cc: `${num} CC`,
      l: `${(num / 1000).toFixed(1)}L`,
    }
  }
  return { cc: `${s} CC`, l: '' }
}

const formatDrivetrain = (val) => {
  if (!val) return '—'
  const dt = String(val).toLowerCase().trim()
  if (dt.includes('fwd')) return 'FWD'
  if (dt.includes('rwd')) return 'RWD'
  if (dt.includes('4wd')) return '4WD'
  if (dt.includes('awd')) return 'AWD'
  if (dt.includes('4x4')) return '4x4'
  return val
}

const drivetrainLower = computed(() =>
  String(car.value?.drivetrain || '')
    .toLowerCase()
    .trim(),
)
const isFrontActive = computed(() => {
  const dt = drivetrainLower.value
  return dt.includes('fwd') || dt.includes('4wd') || dt.includes('awd') || dt.includes('4x4')
})
const isRearActive = computed(() => {
  const dt = drivetrainLower.value
  return dt.includes('rwd') || dt.includes('4wd') || dt.includes('awd') || dt.includes('4x4')
})

const formatCylinders = (val) => {
  if (!val) return '—'
  const s = String(val).trim()
  if (isNaN(Number(s))) {
    return s
  }
  return `${s} Cylinders`
}

const parsedCylinders = computed(() => {
  const val = car.value?.cylinders
  if (!val) return { count: 0, layout: 'unknown', text: '—' }
  const s = String(val).trim().toUpperCase()

  if (
    s.includes('ELECTRIC') ||
    s.includes('EV') ||
    s === '0' ||
    s.includes('HYBRID') ||
    s.includes('كهربا')
  ) {
    return { count: 0, layout: 'electric', text: 'EV' }
  }

  const match = s.match(/\d+/)
  const count = match ? parseInt(match[0], 10) : 4

  let layout = 'inline'
  if (s.includes('V') || count >= 6) {
    layout = 'v'
  } else if (s.includes('I') || s.includes('INLINE') || s.includes('L') || count < 6) {
    layout = 'inline'
  }

  return {
    count,
    layout,
    text: isNaN(Number(s)) ? s : `${s} Cylinders`,
  }
})

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
    c.favorites_count !== undefined && c.favorites_count !== null
      ? Number(c.favorites_count)
      : favArr.length

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

    // ✅ Fetch suggestions right after car is loaded successfully
    await fetchSuggestedCars()
  } catch (e) {
    console.error(e)
    car.value = null
    error.value = 'Failed to load car details'
  } finally {
    loading.value = false
    requestAnimationFrame(updateThumbNav)
  }
}

// -------------------------
// ✅ Suggested / Similar Price Cars
// -------------------------
const suggestedCars = ref([])
const loadingSuggested = ref(false)
const errorSuggested = ref('')

const fetchSuggestedCars = async () => {
  if (!car.value || !car.value.price) {
    suggestedCars.value = []
    return
  }

  loadingSuggested.value = true
  errorSuggested.value = ''

  try {
    const currentPrice = Number(car.value.price)
    // 10% range (more precise for "similar price" cars)
    const minPrice = Math.max(0, Math.round(currentPrice * 0.9))
    const maxPrice = Math.round(currentPrice * 1.1)

    const res = await carsUserApi.getAll({
      'filter[price_between]': `${minPrice}.${maxPrice}`,
      'filter[status]': 'approved',
      perPage: 9,
    })

    let list = []
    const payload = res.data
    if (payload?.data && Array.isArray(payload.data)) {
      list = payload.data
    } else if (payload?.data?.data && Array.isArray(payload.data.data)) {
      list = payload.data.data
    } else if (Array.isArray(payload)) {
      list = payload
    }

    // Filter out current car
    const currentCarId = Number(car.value.id)
    const filteredList = list.filter(
      (c) => Number(c.id) !== currentCarId && c.status === 'approved',
    )

    // Take first 3 suggestions for the 3-column layout
    suggestedCars.value = filteredList.slice(0, 3)
  } catch (e) {
    console.error('Failed to fetch suggested cars:', e)
    errorSuggested.value = 'Failed to load suggested cars'
    suggestedCars.value = []
  } finally {
    loadingSuggested.value = false
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
  const currentIndex = images.value.findIndex((img) => img.url === activeImage.value)
  const nextIdx = (currentIndex + 1) % images.value.length
  selectImage(images.value[nextIdx].url)
}

const prevImage = () => {
  if (!images.value.length) return
  const currentIndex = images.value.findIndex((img) => img.url === activeImage.value)
  const prevIdx = (currentIndex - 1 + images.value.length) % images.value.length
  selectImage(images.value[prevIdx].url)
}

// ✅ Lightbox
const showLightbox = ref(false)
const lightboxIndex = ref(0)

const openLightbox = () => {
  lightboxIndex.value = images.value.findIndex((img) => img.url === activeImage.value)
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
}

// ✅ Call Dialog
const showCallDialog = ref(false)
const openCallDialog = () => {
  showCallDialog.value = true
}
const closeCallDialog = () => {
  showCallDialog.value = false
}

// ✅ Features Show More / Less Limit (8 * 3 = 24 items)
const showAllFeatures = ref(false)

const HIGHLIGHT_KEYWORDS = [
  'استيراد الخارج',
  'imported',
  'وارد الخارج',
  'ذوي الهمم',
  'people of determination',
  'معاقين',
  'حوادث',
  'accident history',
  'حادث',
  'accident',
  'تاكسي',
  'taxi',
  'أجرة',
  'اجره',
  'كسر زيرو',
  'like new',
  'mint',
  'زيرو',
  'فابريكا بالكامل',
  'original paint',
  'فابريكا',
  'فبريكا',
  'قابلة للبدل',
  'exchangeable',
  'بدل',
  'exchange',
  'تكملة أقساط',
  'tkmlet aqsat',
  'تكملة اقساط',
  'أقساط',
  'اقساط',
  'تجاري',
  'commercial',
  'فان',
  'اتوبيس',
  'أتوبيس',
  'في الضمان',
  'under warranty',
  'ضمان',
  'الضمان',
  'warranty',
  'صيانات توكيل',
  'dealer maintained',
  'صيانة توكيل',
  'توكيل',
  'إطارات جديدة',
  'new tires',
  'كاوتش جديد',
  'اطارات جديدة',
  'تيل فرامل جديد',
  'new brake pads',
  'تيل جديد',
  'صيانة حديثة',
  'recent service',
  'سيرفيس كامل',
  'أول مالك',
  'first owner',
  'اول مالك',
  'رخصة باسم البائع',
  'license in seller',
  'رخصة باسمي',
  'رخصه باسم البائع',
  'فيلم حماية',
  'protection film',
  'ppf',
  'فيلم حمايه',
  'حماية',
  'نانو سيراميك',
  'nano ceramic',
  'نانو',
]

const carHighlights = computed(() => {
  const all = car.value?.features || []
  return all.filter((f) => {
    const en = (f.name?.en || f.name || '').toLowerCase()
    const ar = (f.name?.ar || f.name || '').toLowerCase()
    return HIGHLIGHT_KEYWORDS.some(
      (k) => en.includes(k) || ar.includes(k) || k.includes(en) || k.includes(ar),
    )
  })
})

const carStandardFeatures = computed(() => {
  const all = car.value?.features || []
  const highlightIds = carHighlights.value.map((h) => h.id)
  return all.filter((f) => !highlightIds.includes(f.id))
})

const displayedFeatures = computed(() => {
  const all = carStandardFeatures.value
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

// -------------------------
// ✅ Sidebar Ad Space
// -------------------------
const adSlides = ref([])
const adSlideIndex = ref(0)
let adTimer = null

const fetchAdBanners = async () => {
  try {
    const res = await api.get('/user/banners', { params: { type: 'sidebar' } })
    if (res.data && res.data.data && res.data.data.length > 0) {
      adSlides.value = res.data.data.map((b) => ({
        image: b.image_path,
        link: b.link || '#',
      }))
    }
  } catch (err) {
    console.error('Error fetching sidebar ads:', err)
  }
}

const nextAdSlide = () => {
  if (adSlides.value.length === 0) return
  adSlideIndex.value = (adSlideIndex.value + 1) % adSlides.value.length
}

onMounted(() => {
  fetchCar()
  fetchAdBanners()
  adTimer = window.setInterval(nextAdSlide, 5000)
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (adTimer) window.clearInterval(adTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', handleKeyDown)
})

// ✅ Auto-scroll thumbnails when active image changes
const thumbRefs = ref([])
watch(activeImage, () => {
  nextTick(() => {
    const activeEl = thumbRefs.value.find((el) => el?.dataset?.url === activeImage.value)
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
  },
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
              <img :src="img.url" alt="" />
            </div>
          </div>

          <!-- Main Image -->
          <div class="gallery-hero" @click="openLightbox">
            <Transition name="fade" mode="out-in">
              <img :key="activeImage" :src="activeImage" :alt="t(car.title)" class="main-img" />
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

            <button class="fav-float" type="button" @click.prevent.stop="toggleFavorite">
              <VIcon :icon="isFav ? 'tabler-heart-filled' : 'tabler-heart'" size="22" :color="isFav ? 'error' : undefined" />
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
              <img :src="images[lightboxIndex]?.url" class="lightbox-img" />

              <button class="lightbox-close" @click="closeLightbox">
                <VIcon icon="tabler-x" size="24" />
              </button>

              <button
                class="lightbox-nav left"
                @click="lightboxIndex = (lightboxIndex - 1 + images.length) % images.length"
              >
                <VIcon icon="tabler-chevron-left" size="32" />
              </button>

              <button
                class="lightbox-nav right"
                @click="lightboxIndex = (lightboxIndex + 1) % images.length"
              >
                <VIcon icon="tabler-chevron-right" size="32" />
              </button>

              <div class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ images.length }}</div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- BOTTOM: Detailed Info -->
      <div class="content-section">
        <div class="main-content">
          <!-- Header Area -->
          <div class="info-header mb-8">
            <div class="d-flex flex-column gap-4">
              <!-- Top Row: Title & Info -->
              <div>
                <h1 class="text-h3 font-weight-bold mb-2">{{ t(car.title) }}</h1>
                <div class="text-h6 opacity-70 d-inline-flex align-center flex-wrap gap-1">
                  <span>{{ t(car.brand?.name) }}</span>
                  <span class="mx-2">•</span>
                  <span>{{ t(car.model?.name) }}</span>
                  <span class="mx-2">•</span>
                  <span>{{ car.year }}</span>
                  <template v-if="car.city?.name">
                    <span class="mx-2">•</span>
                    <span class="d-inline-flex align-center gap-1">
                      <VIcon icon="tabler-map-pin" size="16" color="primary" class="mt-n0_5" />
                      <span>{{ t(car.city?.name) }}</span>
                    </span>
                  </template>
                </div>
              </div>

              <!-- Bottom Row: Price & Actions -->
              <div class="d-flex flex-column flex-md-row justify-space-between align-md-center gap-4 pa-4 rounded-xl" style="background: rgba(var(--v-theme-surface), 0.5); border: 1px solid rgba(var(--v-border-color), 0.1);">
                <div class="text-h2 font-weight-black text-primary mb-0">
                  {{ formatPrice(car.price) }} EG
                </div>
                
                <!-- Contact Actions -->
                <div class="d-flex gap-3">
                  <VBtn
                    v-if="car.seller?.phone"
                    variant="elevated"
                    color="primary"
                    class="font-weight-bold shadow-primary px-8"
                    height="50"
                    rounded="pill"
                    @click.stop.prevent="openCallDialog"
                  >
                    <VIcon icon="tabler-phone" size="20" class="me-2" />
                    {{ _t('callBtn') || 'Call' }}
                  </VBtn>

                  <VBtn
                    v-if="car.seller?.phone"
                    variant="elevated"
                    color="success"
                    class="font-weight-bold shadow-success px-8"
                    height="50"
                    rounded="pill"
                    :href="whatsappLink"
                    target="_blank"
                  >
                    <VIcon icon="tabler-brand-whatsapp" size="20" class="me-2" />
                    {{ _t('whatsappBtn') || 'WhatsApp' }}
                  </VBtn>
                </div>
              </div>
            </div>
          </div>

          <!-- Specs Grid -->
          <div class="specs-grid mb-8">
            <!-- Condition -->
            <div class="spec-card">
              <VIcon icon="tabler-shield-check" class="mb-2" color="primary" />
              <span class="label">Condition</span>
              <span class="val">{{ car.condition === 'new' ? 'New' : 'Used' }}</span>
            </div>

            <!-- Mileage -->
            <div class="spec-card d-flex flex-column align-center justify-center">
              <svg
                class="mileage-road-svg mb-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <!-- Left solid lane boundary -->
                <path
                  d="M5 20L10 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <!-- Right solid lane boundary -->
                <path
                  d="M19 20L14 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <!-- Center dashed lane divider with perspective spacing -->
                <path
                  d="M12 20V15"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M12 12V9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M12 6V5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <span class="label">Mileage</span>
              <span class="val">
                {{
                  car.condition === 'new'
                    ? '0 Km'
                    : car.mileage
                      ? car.mileage.toLocaleString() + ' Km'
                      : '—'
                }}
              </span>
            </div>

            <!-- Engine CC -->
            <div class="spec-card">
              <VIcon icon="tabler-engine" class="mb-2" color="primary" />
              <span class="label">Engine Capacity</span>
              <div class="d-flex flex-column align-center">
                <span class="val">{{ getEngineCapacityDetails(car.engine_capacity).cc }}</span>
                <span
                  v-if="getEngineCapacityDetails(car.engine_capacity).l"
                  class="text-caption opacity-80 font-weight-bold mt-1"
                  style="font-size: 14px !important; color: #ffffff"
                >
                  {{ getEngineCapacityDetails(car.engine_capacity).l }}
                </span>
              </div>
            </div>

            <!-- Horsepower -->
            <div class="spec-card d-flex flex-column align-center justify-center">
              <!-- Custom Rearing/Prancing Horse SVG standing on hind legs with front legs in the air, facing right -->
              <svg
                class="horse-svg mb-2"
                viewBox="0 0 2700 3494"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="matrix(1.2638539,0,0,1.2638539,-536.6929,-607.19342)">
                  <path d="M 1516.88,1507.69 C 1513.2221,1502.0536 1509.9718,1463.7296 1506.9104,1462.9668 C 1525.8804,1443.6704 1528.9969,1451.3689 1539.0128,1454.5266 C 1552.0663,1458.646 1570.1735,1469.1871 1588.8634,1454.8956 C 1589.4762,1477.0809 1582.149,1486.3702 1568.6653,1493.072 C 1550.5769,1502.0624 1525.3102,1484.2004 1516.8801,1507.69 L 1516.88,1507.69 z" />
                  <path d="M 1488.3,1428.56 C 1463.9962,1431.2375 1450.7526,1412.0486 1414.6697,1419.8347 C 1419.1405,1379.0346 1443.7694,1357.6972 1489.0691,1347.7463 C 1510.0938,1343.1267 1547.7538,1378.1804 1579.4309,1359.064 C 1576.5646,1393.8451 1568.2957,1406.1646 1544.7348,1408.5419 C 1518.2963,1411.2106 1499.8528,1394.5917 1488.2999,1428.5599 L 1488.3,1428.56 z" />
                  <path d="M 1493.09,1380.7 C 1469.2952,1386.3276 1453.8056,1368.902 1418.9444,1381.0402 C 1418.3941,1339.9999 1440.2318,1315.8113 1483.9745,1300.3979 C 1504.2764,1293.2433 1545.9394,1323.4311 1575.0417,1300.5842 C 1576.4498,1335.4553 1569.748,1348.694 1546.6548,1353.9339 C 1520.7403,1359.8141 1500.4046,1345.5738 1493.09,1380.7 L 1493.09,1380.7 z" />
                  <path d="M 1488.17,1327.69 C 1464.3752,1333.3176 1448.8856,1315.892 1414.0244,1328.0302 C 1413.4741,1286.9899 1435.3118,1262.8013 1479.0545,1247.3879 C 1499.3564,1240.2333 1541.0194,1270.4211 1570.1217,1247.5742 C 1571.5298,1282.4453 1564.828,1295.684 1541.7348,1300.9239 C 1515.8203,1306.8041 1495.4846,1292.5638 1488.17,1327.69 L 1488.17,1327.69 z" />
                  <path d="M 1479.29,1280.72 C 1455.4952,1286.3476 1440.0056,1268.922 1405.1444,1281.0602 C 1404.5941,1240.0199 1426.4318,1215.8313 1470.1745,1200.4179 C 1490.4764,1193.2633 1532.1394,1223.4511 1561.2417,1200.6042 C 1562.6498,1235.4753 1555.948,1248.714 1532.8548,1253.9539 C 1506.9403,1259.8341 1486.6046,1245.5938 1479.29,1280.72 L 1479.29,1280.72 z" />
                  <path d="M 1498.33,1485.09 C 1474.5352,1490.7176 1459.0456,1473.292 1424.1844,1485.4302 C 1423.6341,1444.3899 1445.4718,1420.2013 1489.2145,1404.7879 C 1509.5164,1397.6333 1551.1794,1427.8211 1580.2817,1404.9742 C 1581.6898,1439.8453 1574.988,1453.084 1551.8948,1458.3239 C 1525.9803,1464.2041 1505.6446,1449.9638 1498.33,1485.09 L 1498.33,1485.09 z" />
                  <path d="M 1461.52,1227.41 C 1437.7252,1233.0376 1422.2356,1215.612 1387.3744,1227.7502 C 1386.8241,1186.7099 1408.6618,1162.5213 1452.4045,1147.1079 C 1472.7064,1139.9533 1514.3694,1170.1411 1543.4717,1147.2942 C 1544.8798,1182.1653 1538.178,1195.404 1515.0848,1200.6439 C 1489.1703,1206.5241 1468.8346,1192.2838 1461.52,1227.41 L 1461.52,1227.41 z" />
                  <path d="M 1445.88,1182.9 C 1422.4604,1189.9245 1405.9678,1173.4444 1371.8857,1187.6209 C 1368.9106,1146.6844 1389.28,1121.2477 1432.036,1103.2769 C 1451.8802,1094.9343 1495.254,1122.6071 1522.9556,1098.082 C 1526.4209,1132.8081 1520.5132,1146.4194 1497.7702,1153.0149 C 1472.2484,1160.4171 1451.1061,1147.4023 1445.8799,1182.9 L 1445.88,1182.9 z" />
                  <path d="M 1412.68,1135.97 C 1389.2604,1142.9945 1372.7678,1126.5144 1338.6857,1140.6909 C 1335.7106,1099.7544 1356.08,1074.3177 1398.836,1056.3469 C 1418.6802,1048.0043 1462.054,1075.6771 1489.7556,1051.152 C 1493.2209,1085.8781 1487.3132,1099.4894 1464.5702,1106.0849 C 1439.0484,1113.4871 1417.9061,1100.4723 1412.6799,1135.97 L 1412.68,1135.97 z" />
                  <path d="M 1406.99,1080.68 C 1384.2232,1097.5828 1372.868,1103.6594 1346.1781,1113.3626 C 1331.6201,1074.9861 1321.7143,1061.0721 1356.2528,1030.1178 C 1396.7103,993.861 1444.2448,1028.986 1450.3889,995.3317 C 1475.3492,1022.4192 1470.2956,1037.7638 1450.3864,1050.5873 C 1428.0461,1064.979 1433.6374,1042.94 1406.9901,1080.68 L 1406.99,1080.68 z" />
                  <path d="M 1364.74,1040.33 C 1338.4328,1051.0237 1312.2207,1029.5225 1294.8176,1062.7929 C 1287.0415,1022.4905 1284.404,1002.8301 1320.9622,974.2869 C 1337.0822,961.7011 1384.1852,983.11474 1408.8054,955.497 C 1428.7621,986.4576 1422.9907,1003.6318 1401.1781,1012.8598 C 1376.703,1023.2146 1382.532,1016.584 1364.74,1040.33 L 1364.74,1040.33 z" />
                  <path d="M 1310.61,1003.76 C 1300.813,1003.4774 1285.4609,998.17241 1261.8712,1007.488 C 1256.8038,970.57338 1265.5054,932.22068 1306.5219,925.05978 C 1326.67,921.5419 1346.6792,949.34848 1378.3351,930.19591 C 1383.974,958.45401 1373.1302,972.70931 1354.1677,982.77771 C 1330.6956,995.23971 1322.1266,979.81759 1310.61,1003.7599 L 1310.61,1003.76 z" />
                  <path d="M 1239.28,1035.52 C 1232.7932,1018.9636 1232.4843,999.8885 1211.3108,985.298 C 1213.6581,948.112 1212.6902,911.7452 1258.0562,902.077 C 1282.0523,896.96213 1301.44,916.0797 1324.1593,901.68432 C 1326.8993,938.41632 1299.0252,953.46832 1276.6923,961.36322 C 1252.2035,970.01723 1257.3734,1019.1462 1239.28,1035.52 L 1239.28,1035.52 z" />
                  <path d="M 1196.55,1016.33 C 1188.3012,1000.5765 1179.7972,985.4945 1157.163,973.2926 C 1155.4522,936.0729 1156.6578,896.1819 1200.7032,881.6364 C 1224.0002,873.94159 1244.6761,889.78767 1268.3295,881.69643 C 1275.0476,917.91443 1247.0196,928.26673 1225.676,938.54403 C 1202.2739,949.81173 1212.7563,998.08533 1196.55,1016.33 L 1196.55,1016.33 z" />
                  <path d="M 1152.01,995.526 C 1143.0659,980.1576 1139.8419,961.3539 1116.6849,950.175 C 1113.3133,913.0678 1106.7928,877.28 1150.1441,860.7811 C 1173.076,852.05331 1194.4371,866.96146 1217.7054,857.82223 C 1226.0343,893.70263 1198.4965,905.29793 1177.6331,916.51693 C 1154.7575,928.81883 1167.3846,976.57603 1152.01,995.52603 L 1152.01,995.526 z" />
                  <path d="M 1121.69,1376.8 L 1101.5482,1374.729 L 1102.156,1341.0359 C 1114.663,1350.1151 1118.5673,1364.1929 1121.69,1376.8 L 1121.69,1376.8 z" />
                  <path d="M 1094.8,1563.64 C 1078.1298,1534.9617 1058.6495,1526.7467 1037.7461,1505.6694 C 1034.4346,1495.2971 1032.0109,1478.7807 1022.9755,1472.8755 C 994.381,1467.8982 999.4046,1474.2761 971.6292,1476.7735 C 962.77885,1477.5689 947.9107,1497.0166 936.2616,1503.3183 C 883.1358,1532.0616 793.4126,1599.2527 761.8046,1621.1083 C 749.0299,1629.4259 713.2159,1625.0702 713.456,1648.1658 C 706.59157,1662.4262 689.6325,1665.4688 686.5873,1684.6614 C 684.25872,1695.9366 661.0005,1723.2618 658.6719,1734.537 C 673.2862,1765.1312 720.7944,1742.9497 747.0378,1744.5029 C 746.5013,1726.4796 752.99306,1691.7835 751.04215,1674.6993 C 748.63604,1653.6245 762.91265,1660.1276 768.93295,1654.7238 C 776.1588,1664.826 785.36805,1664.8485 802.36845,1648.8398 C 823.46195,1630.5026 913.43245,1596.8807 943.84745,1563.2752 C 952.06626,1554.1948 984.97775,1542.8945 990.08765,1559.2971 C 1009.9631,1623.0616 1049.8765,1690.1391 1059.8649,1751.5071 C 1069.8521,1812.8755 1111.47,1592.3181 1094.7998,1563.6401 L 1094.8,1563.64 z" />
                  <path d="M 1998.59,2215.29 C 2000.4246,2225.9249 2012.9642,2283.2327 2006.5424,2298.8674 C 1952.9776,2429.2594 1963.3837,2457.8714 1946.4033,2576.9374 C 1944.3424,2591.4116 1923.9404,2585.4251 1913.9908,2577.9666 C 1907.3202,2602.2541 1893.5451,2620.8152 1887.3147,2643.5019 C 1880.254,2669.205 1880.0414,2683.3829 1872.4803,2710.9094 C 1835.8258,2715.374 1805.962,2707.8855 1778.378,2698.5587 C 1775.7893,2688.9806 1809.4449,2645.9644 1827.8034,2642.1839 C 1851.6807,2582.45 1903.6248,2533.3459 1911.1745,2474.5559 C 1920.5714,2401.3795 1931.2413,2338.9509 1909.5901,2298.7049 C 1898.8114,2253.9117 1800.8651,2232.603 1738.4131,2141.5919 C 1695.6546,2079.2818 1675.3914,2009.6319 1668.627,1987.0329 C 1632.9305,1870.3549 1964.311,2016.5803 1998.59,2215.2899 L 1998.59,2215.29 z" />
                  <path d="M 2088.23,1739.6 C 2030.3032,1666.0359 1931.147,1637.46 1847.373,1624.413 C 1766.3893,1595.5584 1683.153,1572.3752 1604.423,1537.8454 C 1576.2812,1525.5034 1556.4008,1506.0419 1531.2679,1488.355 C 1498.9092,1326.859 1443.4135,1121.723 1357.9879,1029.599 C 1268.6303,933.2356 1126.4579,935.1515 1062.6729,956.9991 C 1047.0794,948.76654 1026.3611,926.7538 987.2742,926.2811 C 999.2297,946.3892 1017.0555,964.4488 1015.1996,987.717 C 1007.7536,1039.8449 992.0351,1075.8503 992.8593,1144.098 C 993.01687,1157.129 1007.1634,1162.928 1012.4071,1169.2309 C 1017.0618,1212.0507 1008.5853,1278.1089 1023.007,1325.1119 C 1016.4927,1334.4212 1009.0555,1344.172 1004.9174,1357.9921 C 998.41314,1379.7247 1033.3068,1380.5613 1045.4061,1388.0072 C 1047.976,1359.3915 1054.0313,1332.1701 1088.6936,1330.0666 C 1122.1904,1350.5486 1122.1966,1375.215 1122.2041,1399.8802 C 1135.6966,1392.4305 1154.7717,1387.0743 1141.7519,1360.7846 C 1134.8012,1328.4384 1160.8745,1273.2528 1163.2031,1244.6296 C 1197.6215,1303.2743 1178.5039,1399.8806 1147.337,1461.3166 C 1107.7862,1531.6091 1079.907,1590.4516 1076.6355,1702.6046 C 1049.1753,1683.9935 1018.0434,1681.8137 990.0667,1671.8866 C 982.58449,1663.9767 970.7753,1653.1842 960.0728,1651.7835 C 932.1486,1659.6984 937.206,1666.6641 913.2611,1680.9645 C 905.62757,1685.5204 905.67759,1708.6273 897.9127,1719.3598 C 869.1069,1759.1807 837.9224,1798.0975 808.5513,1836.6468 C 797.3824,1856.1946 802.25839,1875.7424 775.042,1895.2902 C 767.13709,1908.3237 770.3936,1922.0551 780.62709,1942.7622 C 780.62709,1958.5883 775.04451,1971.6206 780.62709,1990.2354 C 783.41963,2001.4056 786.21218,2012.5757 789.00472,2023.7459 C 813.20722,2027.4626 837.29082,2011.3877 861.60962,2001.4056 C 857.02875,1992.5715 845.46962,1985.1281 840.89002,1976.294 C 837.32712,1969.4221 840.73745,1961.152 837.17705,1954.2826 C 832.29104,1944.857 827.40252,1935.4314 822.51405,1926.007 C 827.96157,1920.6595 825.46417,1908.7202 841.73165,1901.7095 C 852.78555,1876.0376 914.02885,1802.2735 926.86485,1758.8035 C 933.81807,1735.2538 942.73215,1739.3357 962.89405,1739.3357 C 971.14162,1739.3357 971.93949,1728.6458 978.90025,1727.7428 C 982.19302,1727.3176 991.20965,1723.1782 992.85925,1724.9453 C 1038.4204,1773.7867 1108.0412,1824.779 1143.6553,1875.7423 C 1187.6407,1893.6531 1241.3718,1915.1605 1290.2403,1890.5116 C 1399.6372,1951.9263 1529.9832,1991.6036 1718.9162,1973.48 C 1733.8607,2074.466 1872.4952,2256.64 2011.6282,2310.178 C 2034.8902,2339.5091 2045.9567,2469.563 2039.5537,2525.518 C 2034.4088,2570.4701 1996.7351,2618.6023 1975.3252,2665.144 C 1957.1493,2668.9945 1926.6552,2717.9397 1929.6303,2725.0567 C 1957.5557,2730.6417 1990.5573,2733.6882 2017.2133,2726.5799 C 2023.64,2705.3188 2021.9417,2682.7584 2027.9445,2662.9042 C 2033.2394,2645.3798 2046.238,2630.5767 2051.9106,2611.8143 C 2062.149,2616.9329 2082.7649,2620.3745 2084.2342,2609.2943 C 2096.3362,2518.1671 2074.7274,2381.0423 2122.8985,2279.3693 C 2128.6724,2267.1812 2129.5053,2253.6224 2121.5991,2251.1787 C 2047.321,2228.2343 2026.7977,2092.5717 2034.4725,2040.5007 C 2047.9387,1949.1497 2112.815,1833.9577 2104.2861,1772.4177 C 2095.7572,1710.878 2107.3475,1763.8788 2088.2299,1739.6 L 2088.23,1739.6 z" />
                  <path d="M 1046.83,1378.85 L 1067.352,1379.9042 L 1072.5044,1334.2418 C 1056.7171,1338.2637 1048.0906,1358.1641 1046.83,1378.85 L 1046.83,1378.85 z" />
                  <path d="M 1062.67,956.996 C 1067.5985,932.1645 1064.6484,912.6767 1077.5519,890.8979 C 1092.4638,865.735 1127.9465,850.2666 1142.0267,823.064 C 1167.3609,886.821 1130.3263,977.379 1062.67,956.996 z" />
                  <path d="M 1036.6,1016.64 C 1019.5721,1010.2258 1014.7274,980.8234 1014.8012,977.6682 C 991.1765,990.8593 979.7775,1011.3388 980.1752,1021.8311 C 980.69419,1035.5074 985.97914,1055.0427 976.41596,1074.8882 C 997.64826,1081.3462 1003.6624,1067.6674 1013.6895,1056.4359 C 1027.1432,1041.3702 1011.7173,1018.5571 1036.6001,1016.64 L 1036.6,1016.64 z" />
                  <path d="M 1013.9,978.179 C 1013.8175,994.9167 998.1502,1001.4185 1004.3418,1017.2258 C 1011.4951,1035.4905 1031.0242,1042.395 1037.2683,1061.8727 C 1065.2125,1023.8976 1022.1688,1013.7267 1013.9,978.179 L 1013.9,978.179 z" />
                  <path d="M 1034.81,1371.68 C 1031.1283,1360.3272 1036.7571,1348.6368 1033.4144,1336.0973 C 1018.106,1358.4226 1011.2141,1357.1596 1034.81,1371.68 z" />
                  <path d="M 1041.29,1137.31 C 1045.5395,1135.9906 1053.0029,1139.1634 1054.3398,1144.6059 C 1053.5494,1148.4927 1053.118,1151.2877 1049.3888,1163.7835 C 1045.0317,1164.3562 1036.4078,1162.7455 1033.0325,1159.3714 C 1034.7645,1152.2531 1037.1931,1145.7438 1041.29,1137.3099 L 1041.29,1137.31 z" />
                  <path d="M 2191.42,1941.79 C 2197.1752,1929.852 2281.4167,2056.169 2293.499,2105.468 C 2299.922,2131.6889 2290.0387,2213.511 2333.2674,2230.385 C 2185.6644,2246.7351 2199.3004,2029.586 2191.4204,1941.79 L 2191.42,1941.79 z" />
                  <path d="M 2180.47,1875.93 C 2190.7085,1854.6989 2280.2862,1995.403 2287.632,2025.377 C 2294.055,2051.5966 2279.7796,2133.507 2323.0084,2150.381 C 2186.8194,2192.0953 2204.5894,1963.896 2180.4704,1875.93 L 2180.47,1875.93 z" />
                  <path d="M 2173.59,1844.96 C 2183.1669,1825.0996 2275.53,1932.388 2282.704,1961.667 C 2289.127,1987.8866 2276.2473,2074.02 2319.476,2090.894 C 2209.281,2103.4398 2191.799,1915.859 2173.59,1844.96 L 2173.59,1844.96 z" />
                  <path d="M 2146.17,1796.21 C 2145.561,1789.0804 2230.6053,1751.3567 2275.42,1906.851 C 2286.0162,1927.7844 2273.2277,2013.168 2316.4565,2030.042 C 2214.5045,2059.707 2191.4195,1838.98 2146.1705,1796.21 L 2146.17,1796.21 z" />
                  <path d="M 2138.73,1788.54 C 2150.144,1763.6135 2240.054,1781.7506 2249.386,1821.8529 C 2285.8992,1849.1305 2263.7527,1945.4349 2304.8017,1962.3089 C 2235.0844,2009.7284 2196.2067,1842.3219 2138.7297,1788.5399 L 2138.73,1788.54 z" />
                  <path d="M 2126.25,1782.91 C 2127.0204,1771.9687 2205.7355,1765.3406 2230.985,1803.2432 C 2260.3661,1819.5808 2275.9596,1892.986 2313.0192,1894.1365 C 2240.7045,1952.9575 2169.8602,1792.3985 2126.2502,1782.9105 L 2126.25,1782.91 z" />
                  <path d="M 2105.75,1782.27 C 2107.0343,1767.233 2187.2302,1753.638 2201.1529,1770.9035 C 2213.6187,1786.3669 2259.8126,1839.7754 2296.8722,1840.7246 C 2236.7018,1899.0891 2148.0392,1764.5718 2105.7502,1782.27 L 2105.75,1782.27 z" />
                  <path d="M 2105.83,1780.05 C 2103.2813,1766.3374 2186.4761,1746.5407 2202.5023,1758.385 C 2216.8539,1768.9924 2252.0465,1808.0217 2283.8087,1799.4778 C 2243.9315,1863.3611 2159.4797,1770.1205 2105.8297,1780.0501 L 2105.83,1780.05 z" />
                  <path d="M 2105.49,1782.36 C 2102.81,1774.9328 2150.8823,1745.5467 2147.018,1743.8934 C 2144.4531,1744.9852 2146.6528,1757.3321 2197.4201,1747.0524 C 2213.5401,1755.1036 2245.2522,1788.2202 2276.6093,1776.4573 C 2251.2501,1839.2826 2138.4243,1770.2544 2105.4903,1782.36 L 2105.49,1782.36 z" />
                  <path d="M 2105.05,1783.41 C 2109.1369,1776.6681 2096.6173,1740.1925 2088.2272,1739.5997 C 2120.1207,1719.3928 2125.1706,1726.9351 2142.0108,1730.2429 C 2177.0108,1755.5471 2206.1392,1752.5845 2231.6348,1728.0756 C 2232.6653,1751.3089 2219.2441,1763.0981 2201.1532,1770.9029 C 2159.4151,1788.9125 2119.224,1758.8098 2105.05,1783.4099 L 2105.05,1783.41 z" />
                  <path d="M 2105.05,1783.4 C 2105.6978,1767.3213 2100.0177,1750.9862 2088.2272,1739.596 C 2110.7251,1719.149 2120.0382,1723.6736 2131.9162,1727.0214 C 2147.3984,1731.3847 2168.8733,1742.5561 2191.0411,1727.4116 C 2191.7677,1750.92 2183.0762,1760.7658 2167.085,1767.8653 C 2145.6326,1777.3909 2115.0472,1758.5085 2105.05,1783.4 L 2105.05,1783.4 z" />
                  <path d="M 994.625,931.047 C 1009.3206,935.16891 1030.9831,941.4656 1049.4691,967.4976 C 1059.1786,981.1727 1051.8677,993.212 1040.5862,990.0105 C 1032.2461,987.64315 1031.921,972.2573 1026.0032,965.9168 C 1028.9621,975.42745 1029.795,990.3156 1031.7096,999.5211 C 1020.5082,977.1182 1008.3625,949.0115 994.62493,931.0469 L 994.625,931.047 z" />
                </g>
              </svg>
              <span class="label">Horsepower</span>
              <span class="val">{{ formatHorsepower(car.horsepower) }}</span>
            </div>

            <!-- Cylinders -->
            <div class="spec-card d-flex flex-column align-center justify-center">
              <!-- Engine Cylinders Graphic Visual -->
              <div class="cylinders-graphic-container mb-2">
                <!-- Electric / EV Layout -->
                <div v-if="parsedCylinders.layout === 'electric'" class="flat-ev-engine">
                  <svg
                    class="ev-icon"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="3" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="2" />
                    <rect x="19" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
                    <path d="M12 8L9.5 12H11.5L11 15L14.5 10H12.5L13 8H12Z" fill="currentColor" stroke="currentColor" stroke-width="0.5" />
                  </svg>
                </div>

                <!-- Professional 2-Cylinder V-Twin Layout (Combustion Engines) -->
                <div v-else class="flat-v2-engine">
                  <svg
                    class="v2-engine-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <mask id="piston-mask">
                        <!-- Keep everything in the piston area -->
                        <rect x="-4" y="-18" width="8" height="8" fill="white" />
                        <!-- Cut out the wrist pin hole -->
                        <circle cx="0" cy="-11.8" r="0.8" fill="black" />
                        <!-- Cut out the piston ring grooves -->
                        <rect x="-4" y="-14.6" width="8" height="0.6" fill="black" />
                        <rect x="-4" y="-13.3" width="8" height="0.6" fill="black" />
                      </mask>
                    </defs>

                    <!-- Left Bank (Rotated -35 deg) -->
                    <g transform="translate(12, 19) rotate(-35)">
                      <!-- Cylinder Liner (Dashed Outline) -->
                      <rect x="-4.5" y="-18" width="9" height="13" rx="1.5" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 1.5" opacity="0.35" fill="none" />
                      <!-- Connecting Rod -->
                      <line x1="0" y1="0" x2="0" y2="-11.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      <!-- Piston Head (Masked to show grooves & pin hole) -->
                      <rect x="-3.5" y="-16" width="7" height="5.5" rx="0.5" fill="currentColor" mask="url(#piston-mask)" />
                    </g>

                    <!-- Right Bank (Rotated 35 deg) -->
                    <g transform="translate(12, 19) rotate(35)">
                      <!-- Cylinder Liner (Dashed Outline) -->
                      <rect x="-4.5" y="-18" width="9" height="13" rx="1.5" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 1.5" opacity="0.35" fill="none" />
                      <!-- Connecting Rod -->
                      <line x1="0" y1="0" x2="0" y2="-11.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      <!-- Piston Head (Masked to show grooves & pin hole) -->
                      <rect x="-3.5" y="-16" width="7" height="5.5" rx="0.5" fill="currentColor" mask="url(#piston-mask)" />
                    </g>

                    <!-- Crankshaft Counterweight pointing straight down -->
                    <path d="M 8.5 19 A 3.5 3.5 0 0 0 15.5 19 Z" fill="currentColor" />
                    <!-- Crankcase outer border -->
                    <circle cx="12" cy="19" r="3.5" stroke="currentColor" stroke-width="1.5" fill="none" />
                    <!-- Inner crankshaft hub -->
                    <circle cx="12" cy="19" r="1.2" fill="currentColor" />
                  </svg>
                </div>
              </div>

              <span class="label">Cylinders</span>
              <span class="val">{{ parsedCylinders.text }}</span>
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
            <div class="spec-card d-flex flex-column align-center justify-center">
              <!-- Drivetrain 4-Wheel Visual -->
              <div class="drivetrain-visual">
                <div class="chassis-line"></div>
                <div class="axle front" :class="{ active: isFrontActive }">
                  <div class="wheel left" :class="{ active: isFrontActive }"></div>
                  <div class="axle-bar"></div>
                  <div class="wheel right" :class="{ active: isFrontActive }"></div>
                </div>
                <div class="axle rear" :class="{ active: isRearActive }">
                  <div class="wheel left" :class="{ active: isRearActive }"></div>
                  <div class="axle-bar"></div>
                  <div class="wheel right" :class="{ active: isRearActive }"></div>
                </div>
              </div>
              <span class="label">Drivetrain</span>
              <span class="val text-uppercase" style="font-size: 13px">{{
                formatDrivetrain(car.drivetrain)
              }}</span>
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

            <!-- Source -->
            <div class="spec-card">
              <VIcon icon="tabler-world" class="mb-2" color="primary" />
              <span class="label">Source</span>
              <span class="val">{{ car.is_import ? 'Imported' : 'Local' }}</span>
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

          <!-- Equipment (Additional Specs) -->
          <div class="features-section mb-8" v-if="carHighlights.length">
            <h3 class="text-h5 font-weight-bold mb-4 d-flex align-center gap-2">
              <VIcon icon="tabler-square-check" color="primary" />
              Additional Specs (Equipment)
            </h3>
            <div class="features-grid">
              <div
                v-for="h in carHighlights"
                :key="h.id"
                class="feature-item highlight-item-premium"
              >
                <VIcon icon="tabler-circle-check-filled" size="18" class="me-2 text-primary" />
                {{ t(h.name) }}
              </div>
            </div>
          </div>

          <!-- Features -->
          <div class="features-section mb-8" v-if="carStandardFeatures.length">
            <h3 class="text-h5 font-weight-bold mb-4 d-flex align-center gap-2">
              <VIcon icon="tabler-list-check" color="primary" />
              Features
            </h3>
            <div class="features-grid">
              <div v-for="f in displayedFeatures" :key="f.id" class="feature-item">
                <VIcon icon="tabler-check" size="18" class="me-2 text-primary" />
                {{ t(f.name) }}
              </div>
            </div>

            <!-- Show More / Less button -->
            <div v-if="carStandardFeatures.length > 24" class="text-center mt-6">
              <VBtn
                variant="tonal"
                color="primary"
                class="rounded-xl px-6 font-weight-bold"
                height="44"
                @click="showAllFeatures = !showAllFeatures"
              >
                <VIcon
                  :icon="showAllFeatures ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                  class="me-2"
                />
                <span>{{
                  showAllFeatures
                    ? 'Show Less'
                    : 'Show More (+' + (carStandardFeatures.length - 24) + ')'
                }}</span>
              </VBtn>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="sidebar-content">
          <VCard 
            class="seller-card pa-4 mb-6 relative overflow-hidden cursor-pointer"
            :class="{
              'seller-card-diamond': car.seller?.tier?.toLowerCase() === 'diamond',
              'seller-card-gold': car.seller?.tier?.toLowerCase() === 'gold',
              'seller-card-platinum': car.seller?.tier?.toLowerCase() === 'platinum'
            }"
            @click="goSeller"
            hover
          >
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-overline opacity-60 text-caption">Listing Owner</div>
              <!-- Badges -->
              <div
                v-if="car.seller?.tier?.toLowerCase() === 'diamond'"
                class="tier-badge-diamond d-inline-flex align-center justify-center font-weight-black tracking-widest px-4 py-1 text-uppercase rounded-pill text-caption"
                style="font-size: 0.75rem !important;"
              >
                DIAMOND
              </div>
              <div
                v-else-if="car.seller?.tier?.toLowerCase() === 'platinum'"
                class="tier-badge-platinum d-inline-flex align-center justify-center font-weight-black tracking-widest px-4 py-1 text-uppercase rounded-pill text-caption"
                style="font-size: 0.75rem !important;"
              >
                ELITE
              </div>
              <div
                v-else-if="car.seller?.tier?.toLowerCase() === 'gold'"
                class="tier-badge-gold d-inline-flex align-center justify-center font-weight-black tracking-widest px-4 py-1 text-uppercase rounded-pill text-caption"
                style="font-size: 0.75rem !important;"
              >
                GOLD
              </div>
              <div
                v-else
                class="tier-badge-silver d-inline-flex align-center justify-center font-weight-black tracking-widest px-4 py-1 text-uppercase rounded-pill text-caption"
                style="font-size: 0.75rem !important;"
              >
                SILVER
              </div>
            </div>

            <!-- Seller Profile Link -->
            <div
              class="d-flex align-center gap-3 mb-2 text-decoration-none text-high-emphasis seller-profile-header"
            >
              <div 
                class="showroom-logo-wrapper d-flex align-center justify-center flex-shrink-0 bg-white rounded-lg elevation-2 border" 
                style="width: 54px; height: 54px; padding: 4px; transition: all 0.3s ease;"
                :style="{
                  borderColor: car.seller?.tier?.toLowerCase() === 'diamond' ? 'rgba(0, 210, 255, 0.8) !important' :
                               (car.seller?.tier?.toLowerCase() === 'platinum' ? 'rgba(142, 45, 226, 0.8) !important' :
                               (car.seller?.tier?.toLowerCase() === 'gold' ? 'rgba(218, 165, 32, 0.8) !important' : 'rgba(69, 90, 100, 0.6) !important')),
                  boxShadow: car.seller?.tier?.toLowerCase() === 'diamond' ? '0 0 15px rgba(0, 210, 255, 0.5)' :
                             (car.seller?.tier?.toLowerCase() === 'platinum' ? '0 0 15px rgba(142, 45, 226, 0.4)' :
                             (car.seller?.tier?.toLowerCase() === 'gold' ? '0 0 10px rgba(218, 165, 32, 0.3)' : '0 0 10px rgba(69, 90, 100, 0.2)'))
                }"
              >
                <img
                  v-if="car.seller?.store_logo"
                  :src="car.seller.store_logo"
                  alt="Seller Logo"
                  class="w-100 h-100"
                  style="object-fit: contain; border-radius: 4px;"
                />
                <span v-else class="text-h5 font-weight-black text-primary">{{
                  (car.seller?.store_name ? t(car.seller.store_name) : car.seller?.name)
                    ?.charAt(0)
                    ?.toUpperCase()
                }}</span>
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <div class="d-flex align-center gap-1 overflow-hidden">
                  <div class="font-weight-black text-body-1 text-truncate flex-grow-1">
                    {{ car.seller?.store_name ? t(car.seller.store_name) : car.seller?.name }}
                  </div>
                  <VIcon 
                    v-if="car.seller?.is_verified"
                    icon="tabler-discount-check-filled" 
                    :color="car.seller?.tier?.toLowerCase() === 'platinum' ? '#8E2DE2' : (car.seller?.tier?.toLowerCase() === 'diamond' ? '#00d2ff' : (car.seller?.tier?.toLowerCase() === 'gold' ? '#DAA520' : (car.seller?.tier?.toLowerCase() === 'silver' ? '#78909C' : '#9E9E9E')))" 
                    size="18" 
                    title="Verified Dealer" 
                    class="flex-shrink-0"
                  />
                </div>
              </div>
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
                Contact
                <strong>{{
                  car.seller?.store_name ? t(car.seller.store_name) : car.seller?.name
                }}</strong>
                directly at:
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

                <VBtn variant="text" block height="50" @click="closeCallDialog"> Cancel </VBtn>
              </div>
            </VCard>
          </VDialog>

          <!-- ✅ Premium Sidebar Ad Spot -->
          <VCard
            variant="flat"
            class="pa-4 rounded-xl sidebar-ad-card mb-4 text-center relative overflow-hidden"
            v-if="adSlides.length > 0"
            style="
              background: rgba(var(--v-theme-surface), 0.3);
              border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
            "
          >
            <div class="ad-label-tag">AD</div>
            <div class="ad-carousel-container">
              <Transition name="fade" mode="out-in">
                <div :key="adSlideIndex" class="ad-item-slide">
                  <div
                    class="ad-item-image"
                    :style="{ backgroundImage: `url(${adSlides[adSlideIndex].image})` }"
                  />
                </div>
              </Transition>
            </div>
          </VCard>

          <VCard
            variant="flat"
            class="pa-5 text-center rounded-xl metadata-card mb-4"
            style="
              background: rgba(var(--v-theme-surface), 0.5);
              border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
            "
          >
            <div class="d-flex flex-column gap-3">
              <div class="d-flex align-center justify-center gap-2">
                <VIcon icon="tabler-hash" size="18" color="primary" />
                <span class="text-subtitle-2 font-weight-black">Listing ID: #{{ car.id }}</span>
              </div>
              <VDivider opacity="0.1" />
              <div class="d-flex align-center justify-center gap-2 opacity-70">
                <VIcon icon="tabler-calendar-event" size="18" />
                <span class="text-caption font-weight-medium">
                  {{
                    car.created_at
                      ? new Intl.DateTimeFormat('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(car.created_at))
                      : '—'
                  }}
                </span>
              </div>
            </div>
          </VCard>
        </div>
      </div>

      <!-- Suggested Cars Section -->
      <VDivider class="my-10" opacity="0.1" v-if="suggestedCars.length > 0" />

      <div class="suggested-cars-section mt-10" v-if="suggestedCars.length > 0">
        <CarsSection
          embedded
          :showViewAll="false"
          :cars="suggestedCars"
          :loading="loadingSuggested"
          title="Similar Price Cars"
          subtitle="Cars with a similar price range"
        />
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
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
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
  background: rgba(0, 0, 0, 0.3);
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

.nav-arrow.left {
  left: 20px;
}
.nav-arrow.right {
  right: 20px;
}

.expand-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
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
  background: rgba(0, 0, 0, 0.4);
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
  background: rgba(0, 0, 0, 0.95);
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
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
}

.lightbox-close {
  position: fixed;
  top: 30px;
  right: 30px;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
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
  background: rgba(255, 255, 255, 0.05);
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

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.15);
}
.lightbox-nav.left {
  left: 0;
}
.lightbox-nav.right {
  right: 0;
}

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
  background: rgba(255, 255, 255, 0.1);
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
  .content-section {
    grid-template-columns: 1fr;
  }
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.spec-card {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.spec-card:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  transform: translateY(-4px);
}

.spec-card .label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(var(--v-theme-on-surface), 0.7);
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
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.feature-item {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.sidebar-content {
  position: sticky;
  top: 110px;
  align-self: start;
  z-index: 100;
}

@media (max-width: 900px) {
  .sidebar-content {
    position: static;
  }
}



/* Cylinders Graphic Visual Container */
.cylinders-graphic-container {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
}

/* Flat V2 Engine Layout */
.flat-v2-engine {
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: visible;
}

.v2-engine-svg {
  width: 24px;
  height: 24px;
  color: currentColor;
  transition: all 0.3s ease;
  overflow: visible;
}

/* Flat EV Engine layout */
.flat-ev-engine {
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.flat-ev-engine .ev-icon {
  width: 20px;
  height: 20px;
}

/* spec-card hover effects to glow up the whole visual! */
.spec-card:hover .v2-engine-svg,
.spec-card:hover .flat-ev-engine .ev-icon {
  filter: drop-shadow(0 0 4px rgb(var(--v-theme-primary)));
}

/* Custom Rearing Horse styling */
.horse-svg {
  width: 32px;
  height: 32px;
  fill: rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
  transform: scaleX(-1); /* Flips horse horizontally so it faces right! */
}

.spec-card:hover .horse-svg {
  filter: drop-shadow(0 0 6px rgb(var(--v-theme-primary)));
}

/* Custom Mileage Road styling */
.mileage-road-svg {
  width: 24px;
  height: 24px;
  color: rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
}

.spec-card:hover .mileage-road-svg {
  filter: drop-shadow(0 0 6px rgb(var(--v-theme-primary)));
}

/* Custom Drivetrain 4-Wheel Visual */
.drivetrain-visual {
  position: relative;
  width: 24px;
  height: 24px;
  margin: 0 auto 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.chassis-line {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: 1.5px;
  background: rgba(255, 255, 255, 0.15);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.axle {
  position: relative;
  width: 20px;
  height: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.axle-bar {
  position: absolute;
  left: 2px;
  right: 2px;
  height: 1.5px;
  background: rgba(255, 255, 255, 0.15);
  top: 50%;
  transform: translateY(-50%);
}

.axle.active .axle-bar {
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 4px rgb(var(--v-theme-primary));
}

.wheel {
  width: 4px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.wheel.active {
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 6px rgb(var(--v-theme-primary));
  transform: scale(1.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.leading-relaxed {
  line-height: 1.8;
}

.sidebar-ad-card {
  height: 200px;
  position: relative;
  overflow: hidden;
  padding: 0 !important;
}

.ad-label-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(var(--v-theme-primary), 0.9);
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 6px;
  letter-spacing: 1px;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.ad-carousel-container {
  width: 100%;
  height: 100%;
}

.ad-item-slide {
  width: 100%;
  height: 100%;
}

.ad-item-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

/* Premium Highlight Item styles for Equipment */
.highlight-item-premium {
  border: 1.5px solid rgba(var(--v-theme-primary), 0.25) !important;
  background: rgba(var(--v-theme-primary), 0.04) !important;
  font-weight: 700 !important;
  color: rgba(var(--v-theme-on-surface), 0.95) !important;
  transition: all 0.2s ease-in-out;
}

.highlight-item-premium:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.08) !important;
  transform: translateY(-1px);
}

/* Seller Card Styles */
.seller-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  background: rgba(var(--v-theme-surface), 0.7) !important;
  backdrop-filter: blur(10px);
  border-bottom: 3px solid rgb(var(--v-theme-primary)) !important; /* Bottom band to match footer color */
  transition: all 0.3s ease;

  &.seller-card-diamond {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(0, 210, 255, 0.15)) !important;
    border: 2px solid rgba(0, 210, 255, 0.8) !important;
    border-bottom: 2px solid rgba(0, 210, 255, 0.8) !important;
    box-shadow: 0 12px 35px rgba(0, 210, 255, 0.45) !important;
    
    &:hover {
      border-color: rgba(0, 210, 255, 1) !important;
      border-bottom-color: rgba(0, 210, 255, 1) !important;
      box-shadow: 0 20px 50px rgba(0, 210, 255, 0.65), 0 0 50px rgba(0, 210, 255, 0.4) !important;
    }
  }

  &.seller-card-gold {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(218, 165, 32, 0.15)) !important;
    border: 2px solid rgba(218, 165, 32, 0.8) !important;
    border-bottom: 2px solid rgba(218, 165, 32, 0.8) !important;
    box-shadow: 0 12px 30px rgba(218, 165, 32, 0.25) !important;
  }

  &.seller-card-silver {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(69, 90, 100, 0.15)) !important;
    border: 2px solid rgba(69, 90, 100, 0.6) !important;
    border-bottom: 2px solid rgba(69, 90, 100, 0.6) !important;
    box-shadow: 0 12px 30px rgba(69, 90, 100, 0.25) !important;
  }

  &.seller-card-platinum {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(142, 45, 226, 0.15)) !important;
    border: 2px solid rgba(142, 45, 226, 0.8) !important;
    border-bottom: 2px solid rgba(142, 45, 226, 0.8) !important;
    box-shadow: 0 12px 30px rgba(142, 45, 226, 0.45), 0 0 25px rgba(142, 45, 226, 0.25) !important;
    
    &:hover {
      border-color: rgba(142, 45, 226, 1) !important;
      border-bottom-color: rgba(142, 45, 226, 1) !important;
      box-shadow: 0 20px 45px rgba(142, 45, 226, 0.65), 0 0 50px rgba(142, 45, 226, 0.45) !important;
    }
  }
}

.tier-badge-diamond {
  background: linear-gradient(135deg, #00d2ff 0%, #0072ff 50%, #00c6ff 100%);
  color: #FFFFFF !important;
  box-shadow: 0 4px 25px rgba(0, 210, 255, 0.7), 0 0 20px rgba(0, 114, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.tier-badge-platinum {
  background: linear-gradient(135deg, #8E2DE2 0%, #667eea 50%, #4A00E1 100%);
  color: #FFFFFF !important;
  box-shadow: 0 4px 20px rgba(142, 45, 226, 0.6), 0 0 15px rgba(142, 45, 226, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.tier-badge-gold {
  background: linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #FFF8DC 100%);
  color: #3E2723 !important;
  box-shadow: 0 4px 15px rgba(218, 165, 32, 0.5);
  border: 1px solid #FFF8DC;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
}

.tier-badge-silver {
  background: linear-gradient(135deg, #455A64 0%, #78909C 50%, #B0BEC5 100%);
  color: #FFFFFF !important;
  box-shadow: 0 4px 15px rgba(69, 90, 100, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
