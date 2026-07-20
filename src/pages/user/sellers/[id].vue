<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import sellerUserApi from '@/api/user/sellerUserApi.js'
import carUserApi from '@/api/user/carUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({ meta: { layout: 'front', public: true } })

const route = useRoute()
const sellerId = computed(() => route.params.id)

const loading = ref(false)
const error = ref('')
const seller = ref(null)
const sellerCars = ref([])

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const normalizeOne = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null

const totalCarsCount = computed(() => sellerCars.value.length)
const featuredCarsCount = computed(() => sellerCars.value.filter(c => c.is_featured).length)
const bestDealCarsCount = computed(() => sellerCars.value.filter(c => c.is_best_deal).length)
const importCarsCount = computed(() => sellerCars.value.filter(c => Number(c.is_import) === 1 || Boolean(c.is_import)).length)

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

onMounted(fetchSeller)
</script>

<template>
  <div class="showroom-page py-10">
    <VContainer>
      <!-- Loading State -->
      <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
        <h3 class="mt-4 text-h6 text-primary">Loading Showroom Profile...</h3>
      </div>

      <!-- Error State -->
      <VAlert v-else-if="error" type="error" variant="tonal" class="mb-8 rounded-lg" border="start">
        {{ error }}
      </VAlert>

      <!-- Profile & Stats Content -->
      <template v-else-if="seller">
        <!-- Showroom Header Card -->
        <VCard class="showroom-header-card mb-8 animate-fade-in-up" elevation="10">
          <div class="header-bg-glow"></div>
          
          <div class="showroom-profile-container pa-6 pa-md-10 position-relative z-1">
            <div class="d-flex flex-column flex-md-row align-center align-md-start gap-6 gap-md-8 text-center text-md-start">
              
              <!-- Showroom Avatar / Logo -->
              <div class="avatar-wrapper animate-float">
                <VAvatar size="120" class="showroom-avatar elevation-8">
                  <img v-if="seller.store_logo" :src="seller.store_logo" alt="Showroom Logo" />
                  <span v-else class="text-h2 font-weight-black text-primary">{{ (t(seller.store_name) || seller.name || 'S')[0].toUpperCase() }}</span>
                </VAvatar>
              </div>

              <!-- Profile Details -->
              <div class="showroom-info flex-grow-1">
                <div class="d-flex flex-column flex-md-row align-center align-md-start justify-space-between gap-4">
                  <div class="flex-grow-1 w-100 text-center text-md-start">
                    <div class="d-flex align-center justify-center justify-md-start gap-2 mb-1 flex-wrap">
                      <h1 class="text-h3 font-weight-black text-white mb-0">
                        {{ t(seller.store_name) || seller.name }}
                      </h1>
                      <VIcon v-if="seller.is_verified" icon="tabler-discount-check-filled" color="success" size="32" class="ms-1" v-tooltip="'Verified Showroom'" />
                      
                      <!-- Tier Badge -->
                      <VChip
                        v-if="seller.tier && seller.tier !== 'none'"
                        size="small"
                        :color="seller.tier === 'silver' ? 'grey-lighten-1' : seller.tier === 'gold' ? 'warning' : 'blue-darken-1'"
                        class="ms-2 font-weight-bold text-uppercase elevation-2"
                        prepend-icon="tabler-medal"
                      >
                        {{ seller.tier === 'silver' ? 'Silver Partner' : seller.tier === 'gold' ? 'Gold Partner' : 'Platinum Co-Founder' }}
                      </VChip>
                    </div>

                    <!-- Reviews / Ratings (Placeholder) -->
                    <div class="d-flex align-center justify-center justify-md-start gap-1 mt-2">
                      <div class="d-flex align-center text-amber-accent-4">
                        <VIcon icon="tabler-star-filled" size="18" />
                        <VIcon icon="tabler-star-filled" size="18" />
                        <VIcon icon="tabler-star-filled" size="18" />
                        <VIcon icon="tabler-star-filled" size="18" />
                        <VIcon icon="tabler-star-half-filled" size="18" />
                      </div>
                      <span class="text-subtitle-2 text-white-50 font-weight-medium ms-2">4.8 (124 Reviews)</span>
                    </div>

                    <!-- City & Location line -->
                    <div class="location-line d-flex align-center justify-center justify-md-start flex-wrap gap-x-2 gap-y-1 mt-2 mb-3">
                      <VIcon icon="tabler-map-pin" color="error" size="20" />
                      <span class="text-subtitle-1 text-white font-weight-black">
                        {{ seller.governorate ? t(seller.governorate.name) : '' }}
                        {{ seller.governorate && seller.city ? ' - ' : '' }}
                        {{ seller.city ? t(seller.city.name) : (!seller.governorate ? 'Egypt' : '') }}
                      </span>
                      <span v-if="t(seller.district)" class="text-subtitle-1 text-white-70 font-weight-bold">
                        • {{ t(seller.district) }}
                      </span>
                      <span v-if="t(seller.street)" class="text-subtitle-1 text-white-50 font-weight-medium">
                        • {{ t(seller.street) }}
                      </span>
                      <span v-if="t(seller.address)" class="text-subtitle-1 text-white-50 font-weight-medium">
                        ({{ t(seller.address) }})
                      </span>
                      <VChip
                        size="small"
                        color="error"
                        variant="elevated"
                        class="ms-2 font-weight-bold cursor-pointer open-map-chip"
                        @click="openMap"
                        prepend-icon="tabler-map"
                      >
                        Open Map / الموقع
                      </VChip>
                    </div>

                    <!-- Showroom Bio / Description (Moved here to the empty left side) -->
                    <p class="store-bio mt-4 text-subtitle-1 text-white-50 max-w-700 mx-auto mx-md-0 text-center text-md-start">
                      {{ t(seller.store_description) || seller.bio || 'Welcome to our premium showroom. We offer a high-quality selection of certified pre-owned and brand new vehicles.' }}
                    </p>
                  </div>

                  <!-- Contact Hub Card (Spacious Premium Control Deck) -->
                  <div class="contact-hub-card pa-6 rounded-2xl d-flex flex-column gap-4 mt-4 mt-md-0 elevation-10 flex-shrink-0">
                    <!-- Primary Actions (Call & WhatsApp) -->
                    <div class="d-flex align-center gap-3 w-100">
                      <VBtn
                        v-if="seller.phone"
                        color="primary"
                        variant="elevated"
                        size="large"
                        rounded="pill"
                        class="flex-grow-1 font-weight-bold shadow-primary text-subtitle-1 px-6 py-2"
                        @click="openCallDialog"
                      >
                        <VIcon icon="tabler-phone" size="20" class="me-2" />
                        Call Now
                      </VBtn>

                      <VBtn
                        v-if="seller.phone"
                        color="success"
                        variant="elevated"
                        size="large"
                        rounded="pill"
                        class="flex-grow-1 font-weight-bold shadow-success text-subtitle-1 px-6 py-2"
                        :href="`https://wa.me/${String(seller.phone).replace('+', '')}`"
                        target="_blank"
                      >
                        <VIcon icon="tabler-brand-whatsapp" size="20" class="me-2" />
                        WhatsApp
                      </VBtn>
                    </div>

                    <VDivider class="w-100 my-2 opacity-20" />

                    <!-- Social Media Row -->
                    <div class="d-flex align-center justify-space-between gap-3 w-100 px-2">
                      <span class="text-button text-uppercase font-weight-black text-white-50 tracking-wide">Connect:</span>
                      
                      <div class="d-flex align-center gap-3">
                        <VBtn
                          icon
                          size="small"
                          variant="tonal"
                          color="blue-lighten-1"
                          class="social-btn"
                          :href="seller.facebook || 'https://facebook.com'"
                          target="_blank"
                          v-tooltip="'Facebook'"
                        >
                          <VIcon icon="tabler-brand-facebook" size="20" />
                        </VBtn>

                        <VBtn
                          icon
                          size="small"
                          variant="tonal"
                          color="purple-lighten-2"
                          class="social-btn"
                          :href="seller.instagram || 'https://instagram.com'"
                          target="_blank"
                          v-tooltip="'Instagram'"
                        >
                          <VIcon icon="tabler-brand-instagram" size="20" />
                        </VBtn>

                        <VBtn
                          icon
                          size="small"
                          variant="tonal"
                          color="cyan-lighten-1"
                          class="social-btn"
                          :href="seller.website || 'https://google.com'"
                          target="_blank"
                          v-tooltip="'Website'"
                        >
                          <VIcon icon="tabler-world" size="20" />
                        </VBtn>

                        <VBtn
                          icon
                          size="small"
                          variant="tonal"
                          color="red-lighten-1"
                          class="social-btn"
                          :href="seller.tiktok || 'https://tiktok.com'"
                          target="_blank"
                          v-tooltip="'TikTok'"
                        >
                          <VIcon icon="tabler-brand-tiktok" size="20" />
                        </VBtn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </VCard>

        <!-- 📊 Showroom Statistics Cards Grid (4 Columns side-by-side) -->
        <VRow class="stats-grid mb-10 animate-fade-in-up" style="animation-delay: 0.2s">
          <!-- Total Cars -->
          <VCol cols="6" md="3">
            <VCard class="stat-card px-3 py-4 text-center h-100 rounded-xl d-flex align-center justify-center gap-3" elevation="6">
              <div class="stat-icon-wrapper bg-primary-subtle flex-shrink-0">
                <VIcon icon="tabler-car" size="26" color="primary" />
              </div>
              <div class="text-start overflow-hidden">
                <h2 class="text-h3 font-weight-black text-primary mb-0 line-height-1">
                  {{ totalCarsCount }}
                </h2>
                <div class="text-caption font-weight-bold text-uppercase tracking-wider text-white-50 mt-1 text-truncate">
                  Total Cars
                </div>
              </div>
            </VCard>
          </VCol>

          <!-- Featured Ads -->
          <VCol cols="6" md="3">
            <VCard class="stat-card px-3 py-4 text-center h-100 rounded-xl d-flex align-center justify-center gap-3" elevation="6">
              <div class="stat-icon-wrapper bg-amber-subtle flex-shrink-0">
                <VIcon icon="tabler-star-filled" size="26" color="amber-darken-1" />
              </div>
              <div class="text-start overflow-hidden">
                <h2 class="text-h3 font-weight-black text-amber-darken-1 mb-0 line-height-1">
                  {{ featuredCarsCount }}
                </h2>
                <div class="text-caption font-weight-bold text-uppercase tracking-wider text-white-50 mt-1 text-truncate">
                  Featured
                </div>
              </div>
            </VCard>
          </VCol>

          <!-- Best Deals -->
          <VCol cols="6" md="3">
            <VCard class="stat-card px-3 py-4 text-center h-100 rounded-xl d-flex align-center justify-center gap-3" elevation="6">
              <div class="stat-icon-wrapper bg-deep-orange-subtle flex-shrink-0">
                <VIcon icon="tabler-flame" size="26" color="deep-orange-accent-2" />
              </div>
              <div class="text-start overflow-hidden">
                <h2 class="text-h3 font-weight-black text-deep-orange-accent-2 mb-0 line-height-1">
                  {{ bestDealCarsCount }}
                </h2>
                <div class="text-caption font-weight-bold text-uppercase tracking-wider text-white-50 mt-1 text-truncate">
                  Best Deals
                </div>
              </div>
            </VCard>
          </VCol>

          <!-- Import Cars -->
          <VCol cols="6" md="3">
            <VCard class="stat-card px-3 py-4 text-center h-100 rounded-xl d-flex align-center justify-center gap-3" elevation="6">
              <div class="stat-icon-wrapper bg-info-subtle flex-shrink-0">
                <VIcon icon="tabler-ship" size="26" color="info" />
              </div>
              <div class="text-start overflow-hidden">
                <h2 class="text-h3 font-weight-black text-info mb-0 line-height-1">
                  {{ importCarsCount }}
                </h2>
                <div class="text-caption font-weight-bold text-uppercase tracking-wider text-white-50 mt-1 text-truncate">
                  Import Cars
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>

        <!-- Showroom Cars Section -->
        <div class="inventory-section animate-fade-in-up" style="animation-delay: 0.3s">
          <!-- Brands Filter -->
          <div v-if="uniqueBrands.length > 0" class="brands-filter-container mb-6 d-flex align-center gap-3 overflow-x-auto pb-2">
            <span class="text-subtitle-1 font-weight-bold text-white-50 text-no-wrap">Filter by Brand:</span>
            
            <VChip
              class="font-weight-bold brand-chip"
              :variant="selectedBrandId === null ? 'elevated' : 'tonal'"
              :color="selectedBrandId === null ? 'primary' : 'grey-lighten-2'"
              size="large"
              @click="selectedBrandId = null"
            >
              All Brands
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
              {{ t(brand.name) }}
            </VChip>
          </div>

          <CarsSection
            :title="`Available Listings at ${t(seller.store_name) || seller.name}`"
            subtitle="Browse all verified high-quality vehicles offered by this showroom"
            :limit="20"
            :params="carParams"
            :viewAllTo="carViewAllPath"
            :key="selectedBrandId"
          />
        </div>

        <!-- ✅ Call Confirmation Dialog -->
        <VDialog v-model="showCallDialog" max-width="400">
          <VCard class="pa-6 text-center rounded-2xl" elevation="10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15);">
            <VAvatar color="primary" variant="tonal" size="70" class="mx-auto mb-4 elevation-4">
              <VIcon icon="tabler-phone-calling" size="40" />
            </VAvatar>
            
            <h3 class="text-h5 font-weight-bold mb-2 text-white">Call Showroom</h3>
            <p class="text-body-1 opacity-70 mb-6 text-white-50">
              Contact <strong>{{ t(seller.store_name) || seller.name }}</strong> directly at:
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
                Call Now
              </VBtn>

              <VBtn
                variant="text"
                block
                height="50"
                rounded="pill"
                class="text-white-50 font-weight-medium"
                @click="closeCallDialog"
              >
                Cancel
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

/* Avatar Styling */
.showroom-avatar {
  border: 4px solid rgba(var(--v-theme-primary), 0.8);
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: 0 0 30px rgba(var(--v-theme-primary), 0.4);
  overflow: hidden;

  :deep(img) {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
  }
}

/* Typography & Info */
.store-bio {
  line-height: 1.7;
  max-width: 720px;
  font-size: 1.05rem !important;
  color: rgba(255, 255, 255, 0.75) !important;
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
  background: rgba(0, 0, 0, 0.45) !important;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  min-width: 360px;
}

.opacity-20 {
  opacity: 0.2 !important;
}

.social-btn {
  width: 42px !important;
  height: 42px !important;
  border-radius: 50% !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;

  &:hover {
    transform: translateY(-4px) rotate(8deg);
    background: currentColor !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    :deep(.v-icon) {
      color: #fff !important;
    }
  }
}

/* Stats Cards */
.stat-card {
  background: rgba(var(--v-theme-surface), 0.3) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
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
