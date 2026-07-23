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
  return val[currentLocale] || val.ar || val.en || ''
}

const normalizeOne = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null

const totalCarsCount = computed(() => sellerCars.value.length)
const featuredCarsCount = computed(() => sellerCars.value.filter(c => c.is_featured).length)
const bestDealCarsCount = computed(() => sellerCars.value.filter(c => c.is_best_deal).length)
const importCarsCount = computed(() => sellerCars.value.filter(c => Number(c.is_import) === 1 || Boolean(c.is_import)).length)

const verifiedBadgeColor = computed(() => {
  const t = seller.value?.tier?.toLowerCase()
  if (t === 'diamond') return '#00d2ff' // Diamond
  if (t === 'gold') return '#DAA520' // Gold
  if (t === 'silver') return '#78909C' // Silver
  if (t === 'platinum') return '#FF6D00' // Elite
  return 'info' // Normal verified (blue)
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
  if (seller.value?.map_url) {
    window.open(seller.value.map_url, '_blank')
    return
  }
  const query = encodeURIComponent((t(seller.value?.store_name) || seller.value?.name || 'Showroom') + ' ' + (t(seller.value?.city?.name) || ''))
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
}

// ✅ Call Dialog
const showCallDialog = ref(false)
const openCallDialog = () => { showCallDialog.value = true }
const closeCallDialog = () => { showCallDialog.value = false }

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
          elevation="10"
          :class="[seller.tier && seller.tier !== 'none' ? 'showroom-header-' + seller.tier.toLowerCase() : '']"
          :style="{
            background: seller.cover_image 
              ? 'linear-gradient(to right, rgba(15, 15, 15, 0.6) 40%, rgba(15, 15, 15, 0.25) 100%), url(' + seller.cover_image + ') no-repeat center center / cover !important' 
              : 'linear-gradient(to right, rgba(15, 15, 15, 0.6) 40%, rgba(15, 15, 15, 0.25) 100%), url(\'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80\') no-repeat center center / cover !important'
          }"
        >
          <div class="header-bg-glow"></div>
          
          <div class="showroom-profile-container pa-6 pa-md-10 position-relative z-1">
            <div class="d-flex flex-column flex-md-row align-center align-md-start gap-6 gap-md-8 text-center text-md-start">
              
              <!-- Showroom Avatar / Logo -->
              <div class="avatar-wrapper animate-float flex-shrink-0">
                <div class="showroom-logo-box elevation-8">
                  <img v-if="seller.store_logo" :src="seller.store_logo" alt="Showroom Logo" />
                  <span v-else class="text-h2 font-weight-black text-primary">{{ (_t(seller.store_name) || seller.name || 'S')[0].toUpperCase() }}</span>
                </div>
              </div>

              <!-- Profile Details -->
              <div class="showroom-info flex-grow-1 overflow-hidden">
                <div class="d-flex flex-column flex-md-row align-center align-md-start justify-space-between gap-4">
                  <div class="flex-grow-1 w-100 text-center text-md-start text-white">
                    
                    <!-- Name & Badge Line -->
                    <div class="d-flex align-center justify-center justify-md-start gap-2 mb-1 flex-wrap">
                      <h1 class="text-h3 font-weight-black text-white mb-0" style="font-size: 2.2rem !important; line-height: 1.2;">
                        {{ _t(seller.store_name) || seller.name }}
                      </h1>
                      <VIcon v-if="seller.is_verified" icon="tabler-discount-check-filled" :color="verifiedBadgeColor" size="32" class="ms-1" v-tooltip="t('verifiedShowroom') || 'Verified Showroom'" />
                      
                      <!-- Package Badge (Without Diamond Icon, Placed Next to Name) -->
                      <span
                        v-if="seller.tier && seller.tier?.toLowerCase() !== 'none'"
                        class="d-inline-flex align-center justify-center font-weight-black tracking-widest px-3 py-1 rounded-pill text-caption ms-2"
                        :style="{
                          background: seller.tier?.toLowerCase() === 'diamond' ? 'linear-gradient(135deg, #00d2ff 0%, #0072ff 100%)' :
                                      (seller.tier?.toLowerCase() === 'platinum' ? 'linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%)' :
                                      (seller.tier?.toLowerCase() === 'gold' ? 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)' : 
                                      'linear-gradient(135deg, #455A64 0%, #78909C 100%)')),
                          color: seller.tier?.toLowerCase() === 'gold' ? '#3E2723 !important' : '#FFFFFF !important',
                          boxShadow: seller.tier?.toLowerCase() === 'diamond' ? '0 2px 10px rgba(0, 210, 255, 0.4)' : '0 2px 8px rgba(0,0,0,0.15)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }"
                      >
                        {{ seller.tier?.toLowerCase() === 'diamond' ? 'DIAMOND' : (seller.tier?.toLowerCase() === 'platinum' ? 'ELITE' : (seller.tier?.toLowerCase() === 'gold' ? 'GOLD' : 'SILVER')) }}
                      </span>
                    </div>

                    <!-- City & Location line -->
                    <div class="location-line d-flex align-center justify-center justify-md-start flex-wrap gap-x-2 gap-y-1 mt-2 mb-2 text-white" style="color: rgba(255, 255, 255, 0.7) !important;">
                      <VIcon icon="tabler-map-pin" size="18" style="color: rgba(255, 255, 255, 0.8) !important;" />
                      <span class="text-subtitle-2 font-weight-bold text-white">
                        {{ seller.governorate ? _t(seller.governorate.name) : '' }}
                        {{ seller.governorate && seller.city ? ' - ' : '' }}
                        {{ seller.city ? _t(seller.city.name) : (!seller.governorate ? t('egypt') || 'Egypt' : '') }}
                      </span>
                      <span v-if="_t(seller.district)" class="text-subtitle-2 font-weight-medium text-white" style="opacity: 0.8;">
                        • {{ _t(seller.district) }}
                      </span>
                      <span v-if="_t(seller.street)" class="text-subtitle-2 font-weight-medium text-white" style="opacity: 0.8;">
                        • {{ _t(seller.street) }}
                      </span>
                      <span v-if="_t(seller.address)" class="text-subtitle-2 font-weight-medium text-white" style="opacity: 0.8;">
                        ({{ _t(seller.address) }})
                      </span>
                      <VChip
                        size="x-small"
                        color="error"
                        variant="elevated"
                        class="ms-2 font-weight-bold cursor-pointer open-map-chip text-white"
                        @click="openMap"
                        prepend-icon="tabler-map"
                      >
                        {{ t('openMap') || 'Open Map' }}
                      </VChip>
                    </div>

                    <!-- Reviews / Ratings -->
                    <div class="d-flex align-center justify-center justify-md-start gap-1 mt-2 mb-3 flex-wrap text-white">
                      <div class="d-flex align-center text-amber-accent-4 cursor-pointer" @click="openReviewDialog" title="Click to see reviews">
                        <VIcon icon="tabler-star-filled" size="16" />
                        <VIcon icon="tabler-star-filled" size="16" />
                        <VIcon icon="tabler-star-filled" size="16" />
                        <VIcon icon="tabler-star-filled" size="16" />
                        <VIcon icon="tabler-star-half-filled" size="16" />
                      </div>
                      <span class="text-caption font-weight-medium ms-2 text-white" style="color: rgba(255, 255, 255, 0.7) !important;">4.8 (124 {{ t('reviews') || 'Reviews' }})</span>
                      
                      <VBtn 
                        variant="tonal" 
                        size="x-small" 
                        color="amber-accent-4" 
                        class="ms-3 font-weight-bold rounded-pill px-3 shadow-sm text-white"
                        @click="openReviewDialog"
                      >
                        <VIcon icon="tabler-edit" size="12" class="me-1" />
                        {{ t('rateShowroom') || 'Rate' }}
                      </VBtn>
                    </div>

                    <!-- Showroom Bio / Description (4-line fixed space) -->
                    <p class="store-bio mt-3 text-subtitle-2 max-w-700 mx-auto mx-md-0 text-center text-md-start text-white" style="color: rgba(255, 255, 255, 0.7) !important;">
                      {{ _t(seller.store_description) || seller.bio || t('showroomDefaultBio') || 'Welcome to our premium showroom. We offer a high-quality selection of certified pre-owned and brand new vehicles.' }}
                    </p>
                  </div>

                  <!-- Contact Hub Card (Transparent & Compact Control Deck) -->
                  <div class="contact-hub-card pa-4 rounded-2xl d-flex flex-column gap-3 mt-4 mt-md-0 flex-shrink-0">
                    <!-- Primary Actions (Call & WhatsApp) -->
                    <div class="d-flex align-center gap-3 w-100">
                      <VBtn
                        v-if="seller.phone"
                        variant="flat"
                        size="large"
                        rounded="pill"
                        class="flex-grow-1 font-weight-bold text-subtitle-1 px-4 py-2 text-white"
                        :style="{
                          background: seller.tier?.toLowerCase() === 'platinum' ? 'linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%)' :
                                      (seller.tier?.toLowerCase() === 'gold' ? 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)' : 
                                      (seller.tier?.toLowerCase() === 'silver' ? 'linear-gradient(135deg, #455A64 0%, #78909C 100%)' : 'var(--v-theme-primary)')),
                          color: seller.tier?.toLowerCase() === 'gold' ? '#3E2723 !important' : '#FFFFFF !important',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                        }"
                        @click="openCallDialog"
                      >
                        <VIcon icon="tabler-phone" size="18" class="me-2" />
                        {{ t('call') || 'Call' }}
                      </VBtn>

                      <VBtn
                        v-if="seller.phone"
                        color="success"
                        variant="elevated"
                        size="large"
                        rounded="pill"
                        class="flex-grow-1 font-weight-bold shadow-success text-subtitle-1 px-4 py-2"
                        :href="`https://wa.me/${String(seller.phone).replace('+', '')}`"
                        target="_blank"
                      >
                        <VIcon icon="tabler-brand-whatsapp" size="18" class="me-2" />
                        {{ t('whatsapp') || 'WhatsApp' }}
                      </VBtn>
                    </div>

                    <VDivider class="w-100 opacity-20" />

                    <!-- Social Media Row (Centered & Simple without Connect Text) -->
                    <div class="d-flex align-center justify-center gap-3 w-100">
                      <VBtn
                        icon
                        size="small"
                        variant="flat"
                        class="social-btn social-btn-facebook"
                        :href="seller.facebook || 'https://facebook.com'"
                        target="_blank"
                        v-tooltip="'Facebook'"
                      >
                        <VIcon icon="tabler-brand-facebook" size="22" />
                      </VBtn>

                      <VBtn
                        icon
                        size="small"
                        variant="flat"
                        class="social-btn social-btn-instagram"
                        :href="seller.instagram || 'https://instagram.com'"
                        target="_blank"
                        v-tooltip="'Instagram'"
                      >
                        <VIcon icon="tabler-brand-instagram" size="22" />
                      </VBtn>

                      <VBtn
                        icon
                        size="small"
                        variant="flat"
                        class="social-btn social-btn-website"
                        :href="seller.website || 'https://google.com'"
                        target="_blank"
                        v-tooltip="'Website'"
                      >
                        <VIcon icon="tabler-world" size="22" />
                      </VBtn>

                      <VBtn
                        icon
                        size="small"
                        variant="flat"
                        class="social-btn social-btn-tiktok"
                        :href="seller.tiktok || 'https://tiktok.com'"
                        target="_blank"
                        v-tooltip="'TikTok'"
                      >
                        <VIcon icon="tabler-brand-tiktok" size="22" />
                      </VBtn>
                    </div>
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
        <VDialog v-model="showCallDialog" max-width="400">
          <VCard class="pa-6 text-center rounded-2xl" elevation="10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(var(--v-border-color), 0.15);">
            <VAvatar color="primary" variant="tonal" size="70" class="mx-auto mb-4 elevation-4">
              <VIcon icon="tabler-phone-calling" size="40" />
            </VAvatar>
            
            <h3 class="text-h5 font-weight-bold mb-2 text-high-emphasis">{{ t('callShowroom') || 'Call Showroom' }}</h3>
            <p class="text-body-1 mb-6 text-medium-emphasis">
              {{ t('contact') || 'Contact' }} <strong>{{ t(seller.store_name) || seller.name }}</strong> {{ t('directlyAt') || 'directly at:' }}
            </p>

            <div class="phone-display mb-8 pa-4 rounded-xl font-weight-black text-h5 text-primary tracking-wide bg-primary-subtle border">
              {{ seller.phone }}
            </div>

            <div class="d-flex flex-column gap-3">
              <VBtn
                color="primary"
                block
                height="50"
                size="large"
                rounded="pill"
                class="font-weight-bold shadow-primary"
                :href="`tel:${seller.phone}`"
                @click="closeCallDialog"
              >
                <VIcon icon="tabler-phone" class="me-2" />
                {{ t('callNow') || 'Call Now' }}
              </VBtn>

              <VBtn
                variant="text"
                block
                height="50"
                rounded="pill"
                class="text-medium-emphasis font-weight-medium"
                @click="closeCallDialog"
              >
                {{ t('cancel') || 'Cancel' }}
              </VBtn>
            </div>
          </VCard>
        </VDialog>

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
  background: rgba(var(--v-theme-surface), 0.4) !important;
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 32px !important;
  overflow: hidden;
  position: relative;
}

.header-bg-glow {
  position: absolute;
  top: -50%;
  left: -20%;
  width: 70%;
  height: 200%;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.2) 0%, transparent 70%);
  filter: blur(60px);
  z-index: 0;
  pointer-events: none;
}

/* Tier Glow Classes */
.showroom-header-diamond {
  border: 2px solid rgba(0, 210, 255, 0.8) !important;
  box-shadow: 0 12px 40px rgba(0, 210, 255, 0.25) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(0, 210, 255, 0.2) 0%, transparent 70%); }
  .showroom-logo-box {
    border: 2px solid rgba(0, 210, 255, 0.8) !important;
    box-shadow: 0 0 15px rgba(0, 210, 255, 0.4) !important;
  }
}

.showroom-header-gold {
  border: 2px solid rgba(218, 165, 32, 0.8) !important;
  box-shadow: 0 12px 40px rgba(218, 165, 32, 0.25) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(218, 165, 32, 0.2) 0%, transparent 70%); }
  .showroom-logo-box {
    border: 2px solid rgba(218, 165, 32, 0.8) !important;
    box-shadow: 0 0 15px rgba(218, 165, 32, 0.4) !important;
  }
}

.showroom-header-platinum {
  border: 2px solid rgba(255, 109, 0, 0.8) !important;
  box-shadow: 0 12px 40px rgba(255, 109, 0, 0.4), 0 0 25px rgba(255, 143, 0, 0.3) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(255, 109, 0, 0.3) 0%, transparent 75%); filter: blur(50px); }
  .showroom-logo-box {
    border: 2px solid rgba(255, 109, 0, 0.8) !important;
    box-shadow: 0 0 15px rgba(255, 109, 0, 0.5) !important;
  }
}

.showroom-header-silver {
  border: 2px solid rgba(69, 90, 100, 0.6) !important;
  box-shadow: 0 12px 40px rgba(69, 90, 100, 0.25) !important;
  .header-bg-glow { background: radial-gradient(circle, rgba(69, 90, 100, 0.2) 0%, transparent 70%); }
  .showroom-logo-box {
    border: 2px solid rgba(69, 90, 100, 0.6) !important;
    box-shadow: 0 0 15px rgba(69, 90, 100, 0.3) !important;
  }
}

.tier-badge-platinum {
  background: linear-gradient(135deg, #FF6D00 0%, #FF8F00 50%, #FFA000 100%);
  color: #FFFFFF !important;
  box-shadow: 0 4px 20px rgba(255, 109, 0, 0.6), 0 0 15px rgba(255, 143, 0, 0.4);
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

/* Avatar Styling */
.showroom-logo-box {
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: #09090b;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  border-radius: 16px;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    object-fit: contain;
    width: 100%;
    height: 100%;
    padding: 10px;
  }
}

/* Typography & Info */
.store-bio {
  line-height: 1.6;
  max-width: 720px;
  font-size: 0.95rem !important;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 90px; /* Fixed height for exactly 4 lines (1.6 * 0.95rem * 4 lines ≈ 90px) */
}

.text-white-50 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.tracking-wide {
  letter-spacing: 1.5px;
}

.open-map-chip {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
  }
}

/* Contact Hub Card */
.contact-hub-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  min-width: 290px;
}

.opacity-20 {
  opacity: 0.2 !important;
}

.social-btn {
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.social-btn-facebook {
  background: rgba(24, 119, 242, 0.15) !important;
  border: 1px solid rgba(24, 119, 242, 0.4) !important;
  color: #1877F2 !important;
}
.social-btn-facebook:hover {
  background: #1877F2 !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(24, 119, 242, 0.6) !important;
  transform: translateY(-4px) rotate(8deg);
}

.social-btn-instagram {
  background: rgba(225, 48, 108, 0.15) !important;
  border: 1px solid rgba(225, 48, 108, 0.4) !important;
  color: #E1306C !important;
}
.social-btn-instagram:hover {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(225, 48, 108, 0.6) !important;
  transform: translateY(-4px) rotate(8deg);
}

.social-btn-website {
  background: rgba(0, 176, 255, 0.15) !important;
  border: 1px solid rgba(0, 176, 255, 0.4) !important;
  color: #00B0FF !important;
}
.social-btn-website:hover {
  background: #00B0FF !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(0, 176, 255, 0.6) !important;
  transform: translateY(-4px) rotate(8deg);
}

.social-btn-tiktok {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: #ffffff !important;
}
.social-btn-tiktok:hover {
  background: #000000 !important;
  border-color: #FE2C55 !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(254, 44, 85, 0.6) !important;
  transform: translateY(-4px) rotate(8deg);
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
