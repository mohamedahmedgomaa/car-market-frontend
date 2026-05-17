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
                  <div>
                    <div class="d-flex align-center justify-center justify-md-start gap-2 mb-1">
                      <h1 class="text-h3 font-weight-black text-white mb-0">
                        {{ t(seller.store_name) || seller.name }}
                      </h1>
                      <VIcon v-if="seller.is_verified" icon="tabler-discount-check-filled" color="success" size="32" class="ms-1" />
                    </div>

                    <!-- City & Location line -->
                    <div class="location-line d-flex align-center justify-center justify-md-start gap-2 mt-2 mb-3">
                      <VIcon icon="tabler-map-pin" color="error" size="20" />
                      <span class="text-subtitle-1 text-white font-weight-medium">
                        {{ t(seller.address) || (seller.city ? t(seller.city.name) : 'Egypt') }}
                      </span>
                      <VChip
                        size="small"
                        color="error"
                        variant="elevated"
                        class="ms-2 font-weight-bold cursor-pointer open-map-chip"
                        @click="openMap"
                        prepend-icon="tabler-map"
                      >
                        Open Map
                      </VChip>
                    </div>
                  </div>

                  <!-- Primary Actions (Call & WhatsApp) -->
                  <div class="action-buttons d-flex align-center gap-3">
                    <VBtn
                      v-if="seller.phone"
                      color="primary"
                      variant="elevated"
                      size="large"
                      rounded="xl"
                      class="px-6 font-weight-bold shadow-primary text-subtitle-1"
                      :href="`tel:${seller.phone}`"
                      prepend-icon="tabler-phone"
                    >
                      Call
                    </VBtn>

                    <VBtn
                      v-if="seller.phone"
                      color="success"
                      variant="elevated"
                      size="large"
                      rounded="xl"
                      class="px-6 font-weight-bold shadow-success text-subtitle-1"
                      :href="`https://wa.me/${String(seller.phone).replace('+', '')}`"
                      target="_blank"
                      prepend-icon="tabler-brand-whatsapp"
                    >
                      WhatsApp
                    </VBtn>
                  </div>
                </div>

                <!-- Showroom Bio / Description -->
                <p class="store-bio mt-4 text-subtitle-1 text-white-50 max-w-700">
                  {{ t(seller.store_description) || seller.bio || 'Welcome to our premium showroom. We offer a high-quality selection of certified pre-owned and brand new vehicles.' }}
                </p>

                <!-- Social Media Bar -->
                <div class="social-bar mt-6 d-flex align-center justify-center justify-md-start gap-3 flex-wrap">
                  <span class="text-caption text-uppercase font-weight-bold text-white-50 me-2">Connect:</span>
                  
                  <VBtn
                    icon
                    size="small"
                    variant="tonal"
                    color="blue"
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
        </VCard>

        <!-- 📊 Showroom Statistics Cards Grid -->
        <VRow class="stats-grid mb-12 animate-fade-in-up" style="animation-delay: 0.2s">
          <!-- Total Cars -->
          <VCol cols="12" md="4">
            <VCard class="stat-card px-6 py-8 text-center h-100 rounded-xl" elevation="6">
              <div class="stat-icon-wrapper bg-primary-subtle mx-auto mb-4">
                <VIcon icon="tabler-car" size="36" color="primary" />
              </div>
              <h2 class="text-h2 font-weight-black text-primary mb-1">
                {{ totalCarsCount }}
              </h2>
              <div class="text-subtitle-1 font-weight-bold text-uppercase tracking-wide text-white-50">
                Total Vehicles
              </div>
            </VCard>
          </VCol>

          <!-- Featured Ads -->
          <VCol cols="12" md="4">
            <VCard class="stat-card px-6 py-8 text-center h-100 rounded-xl" elevation="6">
              <div class="stat-icon-wrapper bg-amber-subtle mx-auto mb-4">
                <VIcon icon="tabler-star-filled" size="36" color="amber-darken-1" />
              </div>
              <h2 class="text-h2 font-weight-black text-amber-darken-1 mb-1">
                {{ featuredCarsCount }}
              </h2>
              <div class="text-subtitle-1 font-weight-bold text-uppercase tracking-wide text-white-50">
                Featured Ads
              </div>
            </VCard>
          </VCol>

          <!-- Best Deals -->
          <VCol cols="12" md="4">
            <VCard class="stat-card px-6 py-8 text-center h-100 rounded-xl" elevation="6">
              <div class="stat-icon-wrapper bg-deep-orange-subtle mx-auto mb-4">
                <VIcon icon="tabler-flame" size="36" color="deep-orange-accent-2" />
              </div>
              <h2 class="text-h2 font-weight-black text-deep-orange-accent-2 mb-1">
                {{ bestDealCarsCount }}
              </h2>
              <div class="text-subtitle-1 font-weight-bold text-uppercase tracking-wide text-white-50">
                Best Deals
              </div>
            </VCard>
          </VCol>
        </VRow>

        <!-- Showroom Cars Section -->
        <div class="inventory-section animate-fade-in-up" style="animation-delay: 0.3s">
          <CarsSection
            :title="`Available Listings at ${t(seller.store_name) || seller.name}`"
            subtitle="Browse all verified high-quality vehicles offered by this showroom"
            :limit="20"
            :params="{
              sort: '-created_at',
              'filter[status]': 'approved',
              'filter[seller_id]': seller.id,
            }"
            :viewAllTo="{
              path: '/user/cars',
              query: {
                sort: '-created_at',
                'filter[status]': 'approved',
                'filter[seller_id]': seller.id,
              }
            }"
          />
        </div>
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
}

/* Typography & Info */
.store-bio {
  line-height: 1.6;
  max-width: 800px;
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

/* Social Buttons */
.social-btn {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;

  &:hover {
    transform: translateY(-4px) rotate(8deg);
    background: currentColor !important;
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
  width: 72px;
  height: 72px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  .stat-card:hover & {
    transform: scale(1.1) rotate(5deg);
  }
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
</style>
