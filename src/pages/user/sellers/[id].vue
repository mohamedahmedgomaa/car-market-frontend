<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import sellerUserApi from '@/api/user/sellerUserApi.js'
import carUserApi from '@/api/user/carUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({ meta: { layout: 'front', public: true } })

const route = useRoute()
const sellerId = computed(() => route.params.id)

const { t, locale } = useI18n({ useScope: 'global' })

const loading = ref(false)
const error = ref('')
const seller = ref(null)
const sellerCars = ref([])

const brandTranslations = {
  'Audi': { ar: 'أودي', en: 'Audi' },
  'Porsche': { ar: 'بورشه', en: 'Porsche' },
  'Land Rover': { ar: 'لاند روفر', en: 'Land Rover' },
  'Mercedes': { ar: 'مرسيدس', en: 'Mercedes' },
  'BMW': { ar: 'بي إم دبليو', en: 'BMW' },
  'Nissan': { ar: 'نيسان', en: 'Nissan' },
  'Toyota': { ar: 'تويوتا', en: 'Toyota' },
  'Hyundai': { ar: 'هيونداي', en: 'Hyundai' },
  'Kia': { ar: 'كيا', en: 'Kia' },
  'Chevrolet': { ar: 'شيفروليه', en: 'Chevrolet' },
  'Jeep': { ar: 'جيب', en: 'Jeep' },
  'Ford': { ar: 'فورد', en: 'Ford' },
  'Honda': { ar: 'هوندا', en: 'Honda' },
  'Mitsubishi': { ar: 'ميتسوبيشي', en: 'Mitsubishi' },
  'Fiat': { ar: 'فيات', en: 'Fiat' },
  'Renault': { ar: 'رينو', en: 'Renault' },
  'Peugeot': { ar: 'بيجو', en: 'Peugeot' },
  'Skoda': { ar: 'سكودا', en: 'Skoda' },
  'Volkswagen': { ar: 'فولكس فاجن', en: 'Volkswagen' },
  'Subaru': { ar: 'سوبارو', en: 'Subaru' },
  'Mazda': { ar: 'مازدا', en: 'Mazda' },
  'Lexus': { ar: 'لكزس', en: 'Lexus' },
  'Volvo': { ar: 'فولفو', en: 'Volvo' },
  'Suzuki': { ar: 'سوزوكي', en: 'Suzuki' },
  'Chery': { ar: 'شيري', en: 'Chery' },
  'MG': { ar: 'إم جي', en: 'MG' },
  'BYD': { ar: 'بي واي دي', en: 'BYD' },
  'Geely': { ar: 'جيلي', en: 'Geely' },
  'Jetour': { ar: 'جيتور', en: 'Jetour' },
  'Opel': { ar: 'أوبل', en: 'Opel' },
}

const _t = (val) => {
  if (!val) return ''
  
  if (typeof val === 'string') {
    const lowerVal = val.trim()
    const matchKey = Object.keys(brandTranslations).find(k => k.toLowerCase() === lowerVal.toLowerCase())
    if (matchKey) {
      const currentLocale = locale.value || 'ar'
      return brandTranslations[matchKey][currentLocale] || brandTranslations[matchKey]['ar']
    }
    return val
  }
  
  const currentLocale = locale.value || 'ar'
  return currentLocale === 'ar' ? (val.ar || val.en || '') : (val.en || val.ar || '')
}

const normalizeOne = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null

const totalCarsCount = computed(() => sellerCars.value.length)
const featuredCarsCount = computed(() => sellerCars.value.filter(c => c.is_featured).length)
const bestDealCarsCount = computed(() => sellerCars.value.filter(c => c.is_best_deal).length)
const importCarsCount = computed(() => sellerCars.value.filter(c => Number(c.is_import) === 1 || Boolean(c.is_import)).length)

const getSocialUrl = (platform) => {
  const s = seller.value || {}
  
  let direct = null
  if (platform === 'facebook') direct = s.facebook || s.facebook_url
  if (platform === 'instagram') direct = s.instagram || s.instagram_url
  if (platform === 'youtube') direct = s.youtube || s.youtube_url
  if (platform === 'tiktok') direct = s.tiktok || s.tiktok_url
  if (direct) return direct

  const rawMap = s.map_url || ''
  if (rawMap.includes('#soc|')) {
    const hash = rawMap.split('#soc|')[1] || ''
    let found = null
    hash.split('|').forEach(part => {
      const idx = part.indexOf('=')
      if (idx > -1) {
        const k = part.substring(0, idx)
        const v = part.substring(idx + 1)
        if (platform === 'facebook' && k === 'fb') found = v
        if (platform === 'instagram' && k === 'ig') found = v
        if (platform === 'tiktok' && k === 'tt') found = v
        if (platform === 'youtube' && k === 'yt') found = v
      }
    })
    if (found) return found
  } else if (rawMap.includes('#social=')) {
    try {
      const hash = rawMap.split('#social=')[1]
      const socialExtracted = JSON.parse(decodeURIComponent(hash))
      if (platform === 'facebook') return socialExtracted.fb || null
      if (platform === 'instagram') return socialExtracted.ig || null
      if (platform === 'youtube') return socialExtracted.yt || null
      if (platform === 'tiktok') return socialExtracted.tt || null
    } catch (e) {}
  }
  return null
}

const openSocial = (platform) => {
  const raw = getSocialUrl(platform)
  if (!raw) return

  let url = String(raw).trim()
  if (!url) return

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }
  window.open(url, '_blank')
}

const verifiedBadgeColor = computed(() => {
  const t = seller.value?.tier?.toLowerCase()
  if (t === 'diamond') return '#00d2ff' // Diamond
  if (t === 'gold') return '#DAA520' // Gold
  if (t === 'silver') return '#78909C' // Silver
  if (t === 'platinum') return '#8E2DE2' // Elite
  return '#9E9E9E' // Normal verified (gray)
})

// 🔥 Brand Filtering Logic
const selectedBrandId = ref(null)
const uniqueBrands = computed(() => {
  const brandsMap = new Map()
  sellerCars.value.forEach(car => {
    if (car.brand) {
      brandsMap.set(car.brand.id, car.brand)
    }
  })
  return Array.from(brandsMap.values())
})

const carParams = computed(() => {
  const params = {
    sort: '-created_at',
    'filter[status]': 'approved',
    'filter[seller_id]': seller.value?.id,
  }
  if (selectedBrandId.value) {
    params['filter[brand_id]'] = selectedBrandId.value
  }
  return params
})

const carViewAllPath = computed(() => {
  return {
    path: '/user/cars',
    query: {
      sort: '-created_at',
      'filter[status]': 'approved',
      'filter[seller_id]': seller.value?.id,
      ...(selectedBrandId.value ? { 'filter[brand_id]': selectedBrandId.value } : {})
    }
  }
})

const fetchSeller = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await sellerUserApi.getById(sellerId.value)
    seller.value = normalizeOne(res.data)

    // Fetch all approved cars for this seller to calculate exact statistics
    const carsRes = await carUserApi.getAll({
      'filter[seller_id]': sellerId.value,
      'filter[status]': 'approved',
    })
    sellerCars.value = carsRes?.data?.data ?? carsRes?.data ?? []
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load seller information'
  } finally {
    loading.value = false
  }
}

const openMap = () => {
  let url = seller.value?.map_url || ''
  if (url.includes('#soc')) {
    url = url.split('#soc')[0]
  }
  url = url.trim()
  if (url) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    window.open(url, '_blank')
    return
  }
  const query = encodeURIComponent((_t(seller.value?.store_name) || seller.value?.name || 'Showroom') + ' ' + (_t(seller.value?.city?.name) || ''))
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
}

// ✅ Call Dialog & Copying
const showCallDialog = ref(false)
const copiedSnackbar = ref(false)
const openCallDialog = () => { showCallDialog.value = true }
const closeCallDialog = () => { showCallDialog.value = false }
const copyPhone = () => {
  if (seller.value?.phone) {
    navigator.clipboard.writeText(String(seller.value.phone))
    copiedSnackbar.value = true
  }
}

// ✅ Review Dialog State
const showReviewDialog = ref(false)
const reviewRating = ref(0)
const reviewText = ref('')
const isSubmittingReview = ref(false)
const reviewSuccess = ref(false)

const openReviewDialog = () => {
  reviewRating.value = 0
  reviewText.value = ''
  reviewSuccess.value = false
  showReviewDialog.value = true
}

const submitReview = () => {
  if (reviewRating.value === 0) return
  isSubmittingReview.value = true
  
  // Mock API Call
  setTimeout(() => {
    isSubmittingReview.value = false
    reviewSuccess.value = true
    
    setTimeout(() => {
      showReviewDialog.value = false
    }, 2000)
  }, 1500)
}

onMounted(fetchSeller)
</script>

<template>
  <div class="showroom-page py-10">
    <VContainer>
      <!-- Loading State -->
      <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
        <h3 class="mt-4 text-h6 text-primary">{{ t('loadingShowroom') || 'Loading Showroom Profile...' }}</h3>
      </div>

      <!-- Error State -->
      <VAlert v-else-if="error" type="error" variant="tonal" class="mb-8 rounded-lg" border="start">
        {{ error }}
      </VAlert>

      <!-- Profile & Stats Content -->
      <template v-else-if="seller">
        <!-- Showroom Header Card -->
        <VCard 
          class="showroom-header-card mb-8 animate-fade-in-up" 
          elevation="12"
          :class="[seller.tier && seller.tier !== 'none' ? 'showroom-header-' + seller.tier.toLowerCase() : '']"
        >
          <!-- Deep Ambient Cover Backdrop (prevents text clashing with cover watermarks) -->
          <div class="header-cover-backdrop">
            <div 
              class="header-cover-img" 
              :style="{
                backgroundImage: 'url(' + (seller.cover_image || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80') + ')'
              }"
            ></div>
            <div class="header-cover-gradient"></div>
            <div class="header-bg-glow"></div>
          </div>
          
          <div class="showroom-profile-container py-12 py-md-16 px-6 px-md-10 position-relative z-1">
            <div class="d-flex flex-column flex-lg-row align-center align-lg-stretch justify-space-between gap-6 gap-md-8">
              
              <!-- Left Column: Logo + Showroom Info -->
              <div class="d-flex flex-column flex-md-row align-center align-md-start gap-6 gap-md-8 flex-grow-1 text-center text-md-start">
                
                <!-- Showroom Avatar / Logo -->
                <div class="avatar-wrapper flex-shrink-0 animate-float">
                  <div class="showroom-logo-box elevation-10">
                    <img v-if="seller.store_logo" :src="seller.store_logo" alt="Showroom Logo" />
                    <span v-else class="text-h2 font-weight-black text-primary">{{ (_t(seller.store_name) || seller.name || 'S')[0].toUpperCase() }}</span>
                  </div>
                </div>

                <!-- Showroom Details -->
                <div class="showroom-info flex-grow-1">
                  <!-- Name & Badges -->
                  <div class="d-flex align-center justify-center justify-md-start gap-3 mb-2 flex-wrap">
                    <h1 class="text-h3 font-weight-black text-white mb-0 showroom-title">
                      {{ _t(seller.store_name) || seller.name }}
                    </h1>
                    <VIcon 
                      v-if="seller.is_verified" 
                      icon="tabler-discount-check-filled" 
                      :color="verifiedBadgeColor" 
                      size="30" 
                      class="ms-1" 
                      v-tooltip="t('verifiedShowroom') || 'Verified Showroom'" 
                    />
                    
                    <!-- Tier Badge -->
                    <span
                      v-if="seller.tier && seller.tier?.toLowerCase() !== 'none'"
                      class="tier-pill-badge"
                      :class="'tier-badge-' + seller.tier.toLowerCase()"
                    >
                      {{ seller.tier?.toLowerCase() === 'diamond' ? 'DIAMOND' : (seller.tier?.toLowerCase() === 'platinum' ? 'ELITE' : (seller.tier?.toLowerCase() === 'gold' ? 'GOLD' : 'SILVER')) }}
                    </span>
                  </div>

                  <!-- Location & Map Line -->
                  <div class="location-badge-row d-flex align-center justify-center justify-md-start flex-wrap gap-2 mb-3">
                    <div class="location-pill d-inline-flex align-center px-3 py-1 rounded-pill">
                      <VIcon icon="tabler-map-pin" size="16" class="me-1 text-primary" />
                      <span class="text-subtitle-2 font-weight-bold text-white">
                        {{ seller.governorate ? _t(seller.governorate.name) : '' }}
                        {{ seller.governorate && seller.city ? ' • ' : '' }}
                        {{ seller.city ? _t(seller.city.name) : (!seller.governorate ? (t('egypt') || 'Egypt') : '') }}
                      </span>
                    </div>

                    <VBtn
                      size="small"
                      variant="tonal"
                      color="primary"
                      rounded="pill"
                      class="open-map-btn font-weight-bold px-3 text-white"
                      @click="openMap"
                    >
                      <VIcon icon="tabler-map" size="15" class="me-1" />
                      {{ t('openMap') || 'Open Map' }}
                    </VBtn>
                  </div>

                  <!-- Showroom Bio Card -->
                  <div class="store-bio-card">
                    <p class="store-bio-text mb-0">
                      {{ _t(seller.store_description) || seller.bio || t('showroomDefaultBio') || 'Welcome to our premium showroom. We offer a high-quality selection of certified pre-owned and brand new vehicles.' }}
                    </p>
                  </div>
                </div>

              </div>

              <!-- Right Column: Premium Contact Hub Deck -->
              <div class="contact-hub-deck flex-shrink-0 d-flex flex-column justify-center align-center">
                <!-- Action Buttons: Call & WhatsApp -->
                <div class="d-flex flex-row flex-lg-column gap-3 w-100 mb-3">
                  <VBtn
                    v-if="seller.phone"
                    variant="flat"
                    size="large"
                    rounded="pill"
                    class="action-btn call-action-btn font-weight-black text-subtitle-1 w-100 text-white"
                    :class="'call-btn-' + (seller.tier?.toLowerCase() || 'default')"
                    @click="openCallDialog"
                  >
                    <VIcon icon="tabler-phone" size="19" class="me-2" />
                    {{ t('call') || 'Call' }}
                  </VBtn>

                  <VBtn
                    v-if="seller.phone"
                    variant="flat"
                    size="large"
                    rounded="pill"
                    class="action-btn whatsapp-action-btn font-weight-black text-subtitle-1 w-100 text-white"
                    :href="`https://wa.me/${String(seller.phone).replace('+', '')}`"
                    target="_blank"
                  >
                    <VIcon icon="tabler-brand-whatsapp" size="20" class="me-2" />
                    {{ t('whatsapp') || 'WhatsApp' }}
                  </VBtn>
                </div>

                <!-- Social Media Channel Row -->
                <div class="social-links-wrapper w-100 pt-3">
                  <div class="social-header-label text-center mb-2">
                    <span>{{ t('followUs') || 'FOLLOW US' }}</span>
                  </div>
                  <div class="d-flex align-center justify-center gap-3">
                    <button
                      type="button"
                      class="social-btn social-btn-facebook"
                      :class="{ 'opacity-30 cursor-not-allowed': !getSocialUrl('facebook') }"
                      @click="openSocial('facebook')"
                      v-tooltip="getSocialUrl('facebook') ? 'Facebook' : 'Facebook (غير متوفر)'"
                    >
                      <VIcon icon="tabler-brand-facebook" size="19" />
                    </button>

                    <button
                      type="button"
                      class="social-btn social-btn-instagram"
                      :class="{ 'opacity-30 cursor-not-allowed': !getSocialUrl('instagram') }"
                      @click="openSocial('instagram')"
                      v-tooltip="getSocialUrl('instagram') ? 'Instagram' : 'Instagram (غير متوفر)'"
                    >
                      <VIcon icon="tabler-brand-instagram" size="19" />
                    </button>

                    <button
                      type="button"
                      class="social-btn social-btn-youtube"
                      :class="{ 'opacity-30 cursor-not-allowed': !getSocialUrl('youtube') }"
                      @click="openSocial('youtube')"
                      v-tooltip="getSocialUrl('youtube') ? 'YouTube' : 'YouTube (غير متوفر)'"
                    >
                      <VIcon icon="tabler-brand-youtube" size="19" />
                    </button>

                    <button
                      type="button"
                      class="social-btn social-btn-tiktok"
                      :class="{ 'opacity-30 cursor-not-allowed': !getSocialUrl('tiktok') }"
                      @click="openSocial('tiktok')"
                      v-tooltip="getSocialUrl('tiktok') ? 'TikTok' : 'TikTok (غير متوفر)'"
                    >
                      <VIcon icon="tabler-brand-tiktok" size="19" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </VCard>



        <!-- Showroom Cars Section -->
        <div class="inventory-section animate-fade-in-up" style="animation-delay: 0.3s">
          <!-- Brands Filter -->
          <div v-if="uniqueBrands.length > 0" class="brands-filter-container mb-6 d-flex align-center gap-3 overflow-x-auto pb-2">
            <span class="text-subtitle-1 font-weight-bold text-medium-emphasis text-no-wrap me-2">{{ t('filterByBrand') || 'Filter by Brand:' }}</span>
            
            <div class="d-inline-flex align-center bg-surface px-3 py-1 rounded-pill elevation-1 border me-2 flex-shrink-0" v-tooltip="t('totalCars') || 'Total Cars'">
              <VIcon icon="tabler-car" size="16" class="me-1 text-primary" />
              <span class="text-subtitle-2 font-weight-bold text-high-emphasis">{{ totalCarsCount }}</span>
            </div>
            
            <VChip
              class="font-weight-bold brand-chip"
              :variant="selectedBrandId === null ? 'elevated' : 'tonal'"
              :color="selectedBrandId === null ? 'primary' : 'grey-lighten-2'"
              size="large"
              @click="selectedBrandId = null"
            >
              {{ t('allBrands') || 'All Brands' }}
            </VChip>

            <VChip
              v-for="brand in uniqueBrands"
              :key="brand.id"
              class="font-weight-bold brand-chip"
              :variant="selectedBrandId === brand.id ? 'elevated' : 'tonal'"
              :color="selectedBrandId === brand.id ? 'primary' : 'grey-lighten-2'"
              size="large"
              @click="selectedBrandId = brand.id"
            >
              <!-- Show brand logo if exists -->
              <VAvatar start v-if="brand.logo" size="24" class="me-1">
                <img :src="brand.logo" alt="brand" />
              </VAvatar>
              {{ _t(brand.name) }}
            </VChip>
          </div>

          <CarsSection
            :title="t('availableListingsAt', { name: _t(seller.store_name) || seller.name })"
            :subtitle="t('showroomListingsSubtitle') || 'Browse all verified high-quality vehicles offered by this showroom'"
            :limit="20"
            :params="carParams"
            :viewAllTo="carViewAllPath"
            :show-view-all="false"
            :key="selectedBrandId"
          />
        </div>

        <!-- ✅ Call Confirmation Dialog -->
        <VDialog v-model="showCallDialog" max-width="420">
          <VCard class="pa-6 text-center rounded-2xl elevation-12" style="background: rgba(15, 23, 42, 0.96); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15);">
            <VAvatar color="primary" variant="tonal" size="70" class="mx-auto mb-4 elevation-4">
              <VIcon icon="tabler-phone-calling" size="38" color="primary" />
            </VAvatar>
            
            <h3 class="text-h5 font-weight-black mb-1 text-white">{{ t('callShowroom') || 'الاتصال بالمعرض' }}</h3>
            <p class="text-body-2 mb-4 text-grey-lighten-1">
              {{ t('contact') || 'التواصل مع' }} <strong class="text-white">{{ _t(seller.store_name) || seller.name }}</strong>
            </p>

            <!-- Prominent Phone Number Display -->
            <div class="phone-display mb-6 pa-4 rounded-xl font-weight-black text-h4 text-primary tracking-widest bg-slate-800 border" style="background: rgba(30, 41, 59, 0.9); border-color: rgba(255, 255, 255, 0.15) !important;">
              {{ seller.phone }}
            </div>

            <div class="d-flex flex-column gap-3">
              <VBtn
                color="primary"
                block
                height="48"
                size="large"
                rounded="pill"
                class="font-weight-bold shadow-primary text-subtitle-1"
                :href="`tel:${seller.phone}`"
                @click="closeCallDialog"
              >
                <VIcon icon="tabler-phone-outgoing" class="me-2" />
                {{ t('callNow') || 'اتصال الآن' }}
              </VBtn>

              <VBtn
                variant="tonal"
                color="info"
                block
                height="48"
                size="large"
                rounded="pill"
                class="font-weight-bold text-subtitle-1"
                @click="copyPhone"
              >
                <VIcon icon="tabler-copy" class="me-2" />
                نسخ الرقم
              </VBtn>

              <VBtn
                variant="text"
                block
                height="40"
                rounded="pill"
                class="text-grey-lighten-1 font-weight-medium"
                @click="closeCallDialog"
              >
                {{ t('cancel') || 'إلغاء' }}
              </VBtn>
            </div>
          </VCard>
        </VDialog>

        <!-- Snackbar for copied phone number -->
        <VSnackbar v-model="copiedSnackbar" color="success" location="top" timeout="2500" class="rounded-lg">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-check" size="20" />
            <span>تم نسخ رقم الهاتف بنجاح!</span>
          </div>
        </VSnackbar>

        <!-- ✅ Rate & Review Dialog -->
        <VDialog v-model="showReviewDialog" max-width="500">
          <VCard class="pa-6 rounded-2xl elevation-10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(var(--v-border-color), 0.15);">
            <div class="d-flex justify-space-between align-center mb-4">
              <h3 class="text-h5 font-weight-black text-high-emphasis m-0">
                {{ t('rateAndReview') || 'Rate & Review' }}
              </h3>
              <VBtn icon variant="text" size="small" @click="showReviewDialog = false">
                <VIcon icon="tabler-x" />
              </VBtn>
            </div>

            <div v-if="reviewSuccess" class="text-center py-6 animate-fade-in">
              <VIcon icon="tabler-circle-check-filled" color="success" size="64" class="mb-4" />
              <h4 class="text-h6 font-weight-bold text-success mb-2">{{ t('reviewSubmitted') || 'Review Submitted!' }}</h4>
              <p class="text-body-2 text-medium-emphasis">{{ t('reviewPendingApproval') || 'Your review is pending approval.' }}</p>
            </div>

            <div v-else class="animate-fade-in">
              <p class="text-body-2 text-medium-emphasis mb-6">
                {{ t('shareExperienceWith') || 'Share your experience with' }} <strong>{{ t(seller?.store_name) || seller?.name }}</strong>.
              </p>

              <div class="d-flex flex-column align-center mb-6">
                <span class="text-subtitle-1 font-weight-bold mb-2">{{ t('yourRating') || 'Your Rating' }}</span>
                <VRating
                  v-model="reviewRating"
                  color="amber-accent-4"
                  active-color="amber-accent-4"
                  hover
                  size="large"
                />
              </div>

              <VTextarea
                v-model="reviewText"
                :label="t('writeReviewOptional') || 'Write your review (Optional)'"
                variant="outlined"
                auto-grow
                rows="3"
                class="mb-6 premium-input-field"
                bg-color="transparent"
              />

              <VBtn
                color="primary"
                block
                height="50"
                rounded="pill"
                class="font-weight-bold shadow-primary text-subtitle-1"
                :disabled="reviewRating === 0"
                :loading="isSubmittingReview"
                @click="submitReview"
              >
                {{ t('submitReviewBtn') || 'Submit Review' }}
              </VBtn>
            </div>
          </VCard>
        </VDialog>
      </template>
    </VContainer>
  </div>
</template>

<style lang="scss" scoped>
.showroom-page {
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.15), transparent 60%),
              radial-gradient(circle at bottom left, rgba(var(--v-theme-surface), 0.8), transparent 70%);
  min-height: 80vh;
}

/* Header Card */
.showroom-header-card {
  background: #0b0f19 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 28px !important;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6) !important;
}

/* Ambient Cover Backdrop */
.header-cover-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.header-cover-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.65) contrast(1.05);
  transition: all 0.5s ease;
}

.header-cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 14, 26, 0.45) 0%, rgba(10, 14, 26, 0.88) 100%),
              linear-gradient(to right, rgba(10, 14, 26, 0.85) 0%, rgba(10, 14, 26, 0.3) 50%, rgba(10, 14, 26, 0.85) 100%);
}

.header-bg-glow {
  position: absolute;
  top: -40%;
  left: 10%;
  width: 60%;
  height: 180%;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.18) 0%, transparent 70%);
  filter: blur(70px);
  z-index: 1;
  pointer-events: none;
}

/* Tier Glow Classes */
.showroom-header-diamond {
  border: 2px solid rgba(0, 210, 255, 0.65) !important;
  box-shadow: 0 12px 40px rgba(0, 210, 255, 0.22), 0 0 20px rgba(0, 210, 255, 0.1) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(0, 210, 255, 0.22) 0%, transparent 70%); }
  .showroom-logo-box {
    border: 2px solid rgba(0, 210, 255, 0.8) !important;
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.35) !important;
  }
}

.showroom-header-gold {
  border: 2px solid rgba(218, 165, 32, 0.65) !important;
  box-shadow: 0 12px 40px rgba(218, 165, 32, 0.22) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(218, 165, 32, 0.22) 0%, transparent 70%); }
  .showroom-logo-box {
    border: 2px solid rgba(218, 165, 32, 0.8) !important;
    box-shadow: 0 0 20px rgba(218, 165, 32, 0.35) !important;
  }
}

.showroom-header-platinum {
  border: 2px solid rgba(142, 45, 226, 0.65) !important;
  box-shadow: 0 12px 40px rgba(142, 45, 226, 0.3) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(142, 45, 226, 0.28) 0%, transparent 75%); filter: blur(60px); }
  .showroom-logo-box {
    border: 2px solid rgba(142, 45, 226, 0.8) !important;
    box-shadow: 0 0 20px rgba(142, 45, 226, 0.4) !important;
  }
}

.showroom-header-silver {
  border: 2px solid rgba(120, 144, 156, 0.5) !important;
  box-shadow: 0 12px 30px rgba(120, 144, 156, 0.2) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(120, 144, 156, 0.2) 0%, transparent 70%); }
  .showroom-logo-box {
    border: 2px solid rgba(120, 144, 156, 0.7) !important;
    box-shadow: 0 0 15px rgba(120, 144, 156, 0.3) !important;
  }
}

/* Tier Pill Badges */
.tier-pill-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 1.5px;
  font-size: 0.72rem;
  padding: 4px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.tier-badge-diamond {
  background: linear-gradient(135deg, #00d2ff 0%, #0072ff 100%);
  color: #FFFFFF !important;
  box-shadow: 0 2px 14px rgba(0, 210, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.tier-badge-platinum {
  background: linear-gradient(135deg, #8E2DE2 0%, #667eea 50%, #4A00E1 100%);
  color: #FFFFFF !important;
  box-shadow: 0 4px 18px rgba(142, 45, 226, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.tier-badge-gold {
  background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
  color: #211300 !important;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.tier-badge-silver {
  background: linear-gradient(135deg, #455A64 0%, #78909C 50%, #B0BEC5 100%);
  color: #FFFFFF !important;
  box-shadow: 0 4px 15px rgba(69, 90, 100, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Avatar & Logo Styling */
.showroom-logo-box {
  background: #090d16 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  border-radius: 24px;
  width: 170px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  transition: transform 0.3s ease;

  @media (max-width: 600px) {
    width: 130px;
    height: 130px;
  }

  &:hover {
    transform: scale(1.03);
  }

  img {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
}

/* Typography & Content Info */
.showroom-title {
  font-size: 2.1rem !important;
  line-height: 1.25;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.location-pill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.open-map-btn {
  background: rgba(var(--v-theme-primary), 0.18) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.35) !important;
  transition: all 0.25s ease;
  &:hover {
    background: rgba(var(--v-theme-primary), 0.35) !important;
    transform: translateY(-2px);
  }
}

.store-bio-card {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px 24px;
  backdrop-filter: blur(12px);
  max-width: 720px;
  min-height: 72px;
  display: flex;
  align-items: center;
}

.store-bio-text {
  font-size: 0.93rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Contact Hub Deck */
.contact-hub-deck {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  padding: 18px 22px;
  backdrop-filter: blur(20px);
  min-width: 270px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
}

.action-btn {
  height: 48px !important;
  border-radius: 9999px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-2px);
  }
}

.call-btn-diamond, .call-btn-default {
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%) !important;
  box-shadow: 0 4px 16px rgba(0, 114, 255, 0.4);
  &:hover {
    box-shadow: 0 6px 22px rgba(0, 210, 255, 0.6);
  }
}

.call-btn-gold {
  background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%) !important;
  color: #211300 !important;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
  &:hover {
    box-shadow: 0 6px 22px rgba(255, 215, 0, 0.6);
  }
}

.call-btn-platinum {
  background: linear-gradient(135deg, #8E2DE2 0%, #4A00E1 100%) !important;
  box-shadow: 0 4px 16px rgba(142, 45, 226, 0.4);
  &:hover {
    box-shadow: 0 6px 22px rgba(142, 45, 226, 0.6);
  }
}

.whatsapp-action-btn {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
  &:hover {
    box-shadow: 0 6px 22px rgba(37, 211, 102, 0.6);
  }
}

.social-links-wrapper {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.social-header-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.social-btn {
  width: 42px !important;
  height: 42px !important;
  border-radius: 50% !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
  text-decoration: none !important;
}

.social-btn-facebook {
  color: #1877F2 !important;
}
.social-btn-facebook:hover {
  background: #1877F2 !important;
  color: #ffffff !important;
  border-color: #1877F2 !important;
  box-shadow: 0 0 20px rgba(24, 119, 242, 0.6) !important;
  transform: translateY(-4px) scale(1.08);
}

.social-btn-instagram {
  color: #E1306C !important;
}
.social-btn-instagram:hover {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
  color: #ffffff !important;
  border-color: #E1306C !important;
  box-shadow: 0 0 20px rgba(225, 48, 108, 0.6) !important;
  transform: translateY(-4px) scale(1.08);
}

.social-btn-youtube {
  color: #FF0000 !important;
}
.social-btn-youtube:hover {
  background: #FF0000 !important;
  color: #ffffff !important;
  border-color: #FF0000 !important;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.6) !important;
  transform: translateY(-4px) scale(1.08);
}

.social-btn-tiktok {
  color: #00F2FE !important;
}
.social-btn-tiktok:hover {
  background: #000000 !important;
  border-color: #FE2C55 !important;
  color: #ffffff !important;
  box-shadow: 0 0 20px rgba(254, 44, 85, 0.6) !important;
  transform: translateY(-4px) scale(1.08);
}


/* Stats Cards */
.stat-card {
  background: rgba(var(--v-theme-surface), 0.6) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(var(--v-theme-primary), 0.5) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(var(--v-theme-primary), 0.2) !important;
  }
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  .stat-card:hover & {
    transform: scale(1.1) rotate(5deg);
  }
}

.line-height-1 {
  line-height: 1 !important;
}

.bg-primary-subtle {
  background: rgba(var(--v-theme-primary), 0.15);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

.bg-amber-subtle {
  background: rgba(255, 179, 0, 0.15);
  border: 1px solid rgba(255, 179, 0, 0.3);
}

.bg-deep-orange-subtle {
  background: rgba(255, 82, 82, 0.15);
  border: 1px solid rgba(255, 82, 82, 0.3);
}

.bg-info-subtle {
  background: rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(33, 150, 243, 0.3);
}

/* Shadows */
.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.4) !important;
}

.shadow-success {
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4) !important;
}

/* Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* Brand Filter */
.brands-filter-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.5) transparent;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-primary), 0.5);
    border-radius: 4px;
  }
}

.brand-chip {
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
  }
}
</style>
