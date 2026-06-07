<script setup>
import { computed, onMounted, ref } from 'vue'
import sellerUserApi from '@/api/user/sellerUserApi.js'
import cityUserApi from '@/api/user/cityUserApi.js'

definePage({ meta: { layout: 'front', public: true } })

const loading = ref(true)
const error = ref('')
const sellers = ref([])
const cities = ref([])

// Filters state
const filters = ref({
  storeName: '',
  cityId: null,
  neighborhood: ''
})

const resetFilters = () => {
  filters.value.storeName = ''
  filters.value.cityId = null
  filters.value.neighborhood = ''
}

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const fetchSellers = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await sellerUserApi.getAll({ perPage: 100 })
    const payload = res.data?.data ?? res.data ?? []
    sellers.value = Array.isArray(payload) ? payload : payload.data ?? []
  } catch (err) {
    console.error('Failed to fetch showrooms:', err)
    error.value = 'Failed to load verified showrooms. Please try again later.'
  } finally {
    loading.value = false
  }
}

const fetchCities = async () => {
  try {
    const res = await cityUserApi.getAll({ perPage: 100 })
    const payload = res.data?.data ?? res.data ?? []
    cities.value = Array.isArray(payload) ? payload : payload.data ?? []
  } catch (err) {
    console.error('Failed to fetch cities:', err)
  }
}

const filteredSellers = computed(() => {
  let result = sellers.value

  // 1. Showroom Name Filter
  if (filters.value.storeName.trim()) {
    const q = filters.value.storeName.toLowerCase().trim()
    result = result.filter(s => {
      const nameEn = (s.store_name?.en || s.name || '').toLowerCase()
      const nameAr = (s.store_name?.ar || '').toLowerCase()
      const nameStr = (typeof s.store_name === 'string' ? s.store_name : '').toLowerCase()
      return nameEn.includes(q) || nameAr.includes(q) || nameStr.includes(q)
    })
  }

  // 2. Governorate Filter (cityId)
  if (filters.value.cityId) {
    result = result.filter(s => s.city_id === filters.value.cityId || s.city?.id === filters.value.cityId)
  }

  // 3. City/Neighborhood Filter
  if (filters.value.neighborhood.trim()) {
    const q = filters.value.neighborhood.toLowerCase().trim()
    result = result.filter(s => {
      const addressEn = (s.address?.en || '').toLowerCase()
      const addressAr = (s.address?.ar || '').toLowerCase()
      const addressStr = (typeof s.address === 'string' ? s.address : '').toLowerCase()
      const descEn = (s.store_description?.en || s.bio || '').toLowerCase()
      const descAr = (s.store_description?.ar || '').toLowerCase()
      const descStr = (typeof s.store_description === 'string' ? s.store_description : '').toLowerCase()
      
      const cityEn = (s.city?.name?.en || '').toLowerCase()
      const cityAr = (s.city?.name?.ar || '').toLowerCase()

      return addressEn.includes(q) || addressAr.includes(q) || addressStr.includes(q) ||
             descEn.includes(q) || descAr.includes(q) || descStr.includes(q) ||
             cityEn.includes(q) || cityAr.includes(q)
    })
  }

  return result
})

// ✅ Find Near Me using Smart Egyptian Geolocation range matching
const isLocating = ref(false)
const locateNearMe = () => {
  isLocating.value = true
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isLocating.value = false
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        
        let targetName = 'Cairo'
        // Smart Egyptian latitude/longitude boundaries
        if (lat >= 30.9 && lat <= 31.2 && lon >= 31.2 && lon <= 31.6) {
          targetName = 'Mansoura'
        } else if (lat >= 29.8 && lat <= 30.3 && lon >= 30.8 && lon <= 31.6) {
          targetName = 'Cairo'
        } else if (lat >= 31.0 && lat <= 31.4 && lon >= 29.6 && lon <= 30.1) {
          targetName = 'Alexandria'
        }

        // Set the filter cityId by matching targetName
        const matched = cities.value.find(c => {
          const nameEn = (c.name?.en || c.name || '').toLowerCase()
          return nameEn.includes(targetName.toLowerCase())
        })
        
        if (matched) {
          filters.value.cityId = matched.id
        } else {
          filters.value.neighborhood = targetName
        }
      },
      (err) => {
        isLocating.value = false
        // fallback
        const matched = cities.value.find(c => {
          const nameEn = (c.name?.en || c.name || '').toLowerCase()
          return nameEn.includes('cairo')
        })
        if (matched) filters.value.cityId = matched.id
      },
      { timeout: 5000 }
    )
  } else {
    isLocating.value = false
    const matched = cities.value.find(c => {
      const nameEn = (c.name?.en || c.name || '').toLowerCase()
      return nameEn.includes('cairo')
    })
    if (matched) filters.value.cityId = matched.id
  }
}

// ✅ Call Dialog State
const showCallDialog = ref(false)
const selectedSellerForCall = ref(null)

const openCallDialog = (seller) => {
  selectedSellerForCall.value = seller
  showCallDialog.value = true
}

const closeCallDialog = () => {
  showCallDialog.value = false
  selectedSellerForCall.value = null
}

onMounted(() => {
  fetchSellers()
  fetchCities()
})
</script>

<template>
  <div class="showrooms-directory-page py-12">
    <VContainer>
      <!-- Premium Split Hero Layout (Above the Fold) -->
      <VRow class="align-center mb-6" no-gutters>
        <!-- Left: Search & Discovery for Buyers -->
        <VCol cols="12" md="8" class="pe-md-10 mb-6 mb-md-0">
          <div class="header-section text-center text-md-start animate-fade-in">
            <div class="d-inline-flex align-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle mb-3 border border-primary-20">
              <VIcon icon="tabler-building-store" size="16" color="primary" />
              <span class="text-caption font-weight-black text-primary text-uppercase tracking-wider">Showrooms Directory</span>
            </div>
            
            <h1 class="text-h3 font-weight-black text-white mb-4 leading-tight">
              Discover Egypt's <span class="text-gradient">Premier Showrooms</span>
            </h1>
            <p class="text-body-2 text-white-50 max-w-650 font-weight-medium mb-6" style="line-height: 1.5;">
              Explore certified automotive dealerships nationwide. Locate verified showrooms, browse premium inventories, and connect directly with verified owners.
            </p>

            <!-- Ultra-Sleek Trust & Stats Bar -->
            <div class="d-flex align-center justify-center justify-md-start flex-wrap gap-3 animate-fade-in">
              <div class="stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl bg-white-5 border-white-10">
                <div class="d-flex align-center justify-center rounded-circle bg-primary-subtle" style="width: 36px; height: 36px; min-width: 36px;">
                  <VIcon icon="tabler-building-store" color="primary" size="20" />
                </div>
                <div class="d-flex flex-column text-start">
                  <span class="text-caption font-weight-black text-white leading-tight">{{ sellers.length || 0 }} Showrooms</span>
                  <span class="text-xxs text-white-50 leading-none">Verified Dealers</span>
                </div>
              </div>

              <div class="stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl bg-white-5 border-white-10">
                <div class="d-flex align-center justify-center rounded-circle bg-success-subtle" style="width: 36px; height: 36px; min-width: 36px;">
                  <VIcon icon="tabler-map-pin" color="success" size="20" />
                </div>
                <div class="d-flex flex-column text-start">
                  <span class="text-caption font-weight-black text-white leading-tight">Egypt-wide</span>
                  <span class="text-xxs text-white-50 leading-none">Active Cities</span>
                </div>
              </div>

              <div class="stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl bg-white-5 border-white-10">
                <div class="d-flex align-center justify-center rounded-circle bg-warning-subtle" style="width: 36px; height: 36px; min-width: 36px;">
                  <VIcon icon="tabler-shield-check" color="warning" size="20" />
                </div>
                <div class="d-flex flex-column text-start">
                  <span class="text-caption font-weight-black text-white leading-tight">100% Secure</span>
                  <span class="text-xxs text-white-50 leading-none">Direct Connection</span>
                </div>
              </div>
            </div>
          </div>
        </VCol>

        <!-- Right: Premium Partnership Card for Showroom Owners & Agencies -->
        <VCol cols="12" md="4">
          <VCard class="dealer-promo-card pa-5 rounded-2xl elevation-10 overflow-hidden relative border-glow">
            <div class="d-flex flex-column gap-2 relative z-1">
              <div class="d-inline-flex align-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-primary-subtle text-primary text-caption font-weight-bold align-self-start">
                <VIcon icon="tabler-rocket" size="12" /> Dealership Partnership
              </div>
              
              <h2 class="text-h6 font-weight-black text-white leading-tight">
                Own a Showroom?
              </h2>
              
              <p class="text-caption text-white-50 mb-1 font-weight-medium" style="line-height: 1.4;">
                Grow your reach with a <span class="text-primary font-weight-bold">verified annual membership</span>! Display your inventory and receive direct buyer leads.
              </p>
              
              <VBtn
                color="primary"
                size="large"
                rounded="pill"
                to="/seller/register"
                class="px-4 font-weight-black shadow-primary text-subtitle-2 w-100"
                height="40"
                elevation="8"
              >
                <VIcon icon="tabler-building-store" size="16" class="me-2" />
                Register Showroom
              </VBtn>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Premium Structured Search Deck (Spanning Full Width - Compact!) -->
      <div class="premium-horizontal-search mb-8 animate-fade-in">
        <div class="search-main-row">
          <!-- 1. Showroom Name Field -->
          <div class="search-col search-col-name">
            <VTextField
              v-model="filters.storeName"
              placeholder="Showroom Name / اسم المعرض..."
              prepend-inner-icon="tabler-building-store"
              variant="outlined"
              density="comfortable"
              hide-details
              class="premium-input-field"
              clearable
            />
          </div>

          <!-- 2. Governorate Field -->
          <div class="search-col search-col-governorate">
            <VAutocomplete
              v-model="filters.cityId"
              :items="cities"
              item-value="id"
              :item-title="c => t(c.name)"
              placeholder="Governorate / المحافظة..."
              prepend-inner-icon="tabler-map"
              variant="outlined"
              density="comfortable"
              hide-details
              class="premium-input-field"
              clearable
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props" :title="t(item.raw.name)" />
              </template>
              <template #selection="{ item }">
                {{ t(item.raw.name) }}
              </template>
            </VAutocomplete>
          </div>

          <!-- 3. City/Area/Neighborhood Field -->
          <div class="search-col search-col-city">
            <VTextField
              v-model="filters.neighborhood"
              placeholder="City or Area / مكان المدينة..."
              prepend-inner-icon="tabler-map-pin"
              variant="outlined"
              density="comfortable"
              hide-details
              class="premium-input-field"
              clearable
            />
          </div>

          <!-- 4. Action Buttons (Near Me and Reset Filters) -->
          <div class="search-col-actions">
            <VBtn
              color="primary"
              variant="elevated"
              class="px-5 font-weight-bold shadow-primary text-subtitle-2"
              height="44"
              rounded="lg"
              :loading="isLocating"
              @click="locateNearMe"
            >
              <VIcon icon="tabler-map-pin-up" size="20" class="me-1" />
              Near Me
            </VBtn>

            <VBtn
              variant="tonal"
              height="44"
              color="secondary"
              class="px-4"
              rounded="lg"
              title="Reset Filters"
              @click="resetFilters"
            >
              <VIcon icon="tabler-refresh" />
            </VBtn>
          </div>
        </div>
      </div>

      <div class="d-flex align-center gap-2 mb-6 animate-fade-in">
        <div class="divider flex-grow-1 bg-white-10" style="height: 1px;"></div>
        <span class="text-caption font-weight-bold text-white-50 text-uppercase tracking-wider px-3">Verified Showrooms</span>
        <div class="divider flex-grow-1 bg-white-10" style="height: 1px;"></div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
        <h3 class="mt-4 text-h6 text-primary animate-pulse">Loading Verified Dealerships...</h3>
      </div>

      <!-- Error State -->
      <VAlert v-else-if="error" type="error" variant="tonal" class="mb-8 rounded-lg">
        {{ error }}
      </VAlert>

      <!-- Empty State -->
      <div v-else-if="filteredSellers.length === 0" class="text-center py-16 animate-fade-in">
        <VIcon icon="tabler-building-store" size="80" class="mb-4 opacity-20" />
        <h3 class="text-h5 text-white-50 font-weight-bold">No verified showrooms match your location or search.</h3>
        <VBtn variant="tonal" color="primary" class="mt-4 px-6 font-weight-bold" rounded="pill" @click="resetFilters">
          Reset Filters
        </VBtn>
      </div>

      <!-- Showrooms Grid -->
      <div v-else class="mb-8">
        <VRow class="showrooms-grid">
          <VCol v-for="seller in filteredSellers" :key="seller.id" cols="12" sm="6" lg="4">
            <VCard
              class="showroom-card h-100 pa-6 rounded-2xl d-flex flex-column justify-space-between cursor-pointer"
              elevation="6"
              :to="`/user/sellers/${seller.id}`"
            >
              <div>
                <!-- Top details -->
                <div class="d-flex align-center gap-4 mb-4">
                  <VAvatar size="72" color="primary" variant="tonal" class="elevation-4 overflow-hidden flex-shrink-0 border">
                    <img v-if="seller.store_logo" :src="seller.store_logo" alt="Showroom Logo" class="w-100 h-100" style="object-fit: contain; padding: 4px;" />
                    <span v-else class="text-h4 font-weight-black">{{ (t(seller.store_name) || seller.name)?.charAt(0)?.toUpperCase() }}</span>
                  </VAvatar>

                  <div class="overflow-hidden flex-grow-1">
                    <div class="d-flex align-center justify-space-between gap-1 mb-1">
                      <h3 class="text-h5 font-weight-black text-white text-truncate mb-0">
                        {{ t(seller.store_name) || seller.name }}
                      </h3>
                      <VChip color="amber" variant="elevated" size="x-small" class="font-weight-black tracking-widest px-2 py-0">PRO</VChip>
                    </div>

                    <div class="d-flex align-center gap-1 text-success font-weight-bold text-caption">
                      <VIcon icon="tabler-discount-check-filled" size="16" />
                      <span>Verified Showroom</span>
                    </div>

                    <!-- Beautiful Custom Location Tags -->
                    <div class="d-flex align-center flex-wrap gap-2 mt-2">
                      <div class="d-inline-flex align-center gap-1 px-2.5 py-0.5 rounded bg-white-5 text-white-70 text-xxs font-weight-black border-white-10">
                        <VIcon icon="tabler-map-pin-filled" size="11" color="primary" />
                        <span>{{ t(seller.city?.name) || 'Egypt' }}</span>
                      </div>
                      <div v-if="t(seller.address)" class="d-inline-flex align-center gap-1 px-2.5 py-0.5 rounded bg-white-5 text-white-50 text-xxs font-weight-medium border-white-10 text-truncate" style="max-width: 140px;" :title="t(seller.address)">
                        <VIcon icon="tabler-map-pin" size="11" color="white-50" />
                        <span>{{ t(seller.address) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bio excerpt -->
                <p class="text-body-2 text-white-50 line-clamp-2 mb-6 font-weight-medium">
                  {{ t(seller.store_description) || seller.bio || 'Premium verified showroom offering certified high-quality vehicles with guaranteed warranties and transparent pricing.' }}
                </p>
              </div>

              <!-- Actions -->
              <div class="actions-wrapper mt-auto">
                <div class="d-flex align-center gap-2 mb-3">
                  <VBtn
                    v-if="seller.phone"
                    color="primary"
                    variant="elevated"
                    size="small"
                    rounded="pill"
                    class="flex-grow-1 font-weight-bold shadow-primary px-4 py-2"
                    @click.stop="openCallDialog(seller)"
                  >
                    <VIcon icon="tabler-phone" size="16" class="me-1" />
                    Call
                  </VBtn>

                  <VBtn
                    v-if="seller.phone"
                    color="success"
                    variant="elevated"
                    size="small"
                    rounded="pill"
                    class="flex-grow-1 font-weight-bold shadow-success px-4 py-2"
                    :href="`https://wa.me/${String(seller.phone).replace('+', '')}`"
                    target="_blank"
                    @click.stop
                  >
                    <VIcon icon="tabler-brand-whatsapp" size="16" class="me-1" />
                    WhatsApp
                  </VBtn>
                </div>

                <VBtn
                  variant="tonal"
                  color="secondary"
                  block
                  rounded="pill"
                  class="font-weight-bold tracking-wide"
                  @click.stop
                  :to="`/user/sellers/${seller.id}`"
                >
                  Explore Showroom
                  <VIcon icon="tabler-arrow-right" size="18" class="ms-1" />
                </VBtn>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- Call Confirmation Modal -->
      <VDialog v-model="showCallDialog" max-width="400">
        <VCard v-if="selectedSellerForCall" class="pa-6 text-center rounded-2xl elevation-10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15);">
          <VAvatar color="primary" variant="tonal" size="70" class="mx-auto mb-4 elevation-4 overflow-hidden border">
            <img v-if="selectedSellerForCall.store_logo" :src="selectedSellerForCall.store_logo" alt="Logo" class="w-100 h-100 object-fit-cover" />
            <VIcon v-else icon="tabler-phone-calling" size="36" />
          </VAvatar>
          
          <h3 class="text-h5 font-weight-bold mb-2 text-white">Call Dealership</h3>
          <p class="text-body-1 opacity-70 mb-6 text-white-50">
            Contact <strong>{{ t(selectedSellerForCall.store_name) || selectedSellerForCall.name }}</strong> directly at:
          </p>

          <div class="phone-display mb-8 pa-4 rounded-xl font-weight-black text-h5 text-primary tracking-wide bg-primary-subtle border">
            {{ selectedSellerForCall.phone }}
          </div>

          <div class="d-flex flex-column gap-3">
            <VBtn
              color="primary"
              block
              height="50"
              size="large"
              rounded="pill"
              class="font-weight-bold shadow-primary"
              :href="`tel:${selectedSellerForCall.phone}`"
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
    </VContainer>
  </div>
</template>

<style lang="scss" scoped>
.showrooms-directory-page {
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.12), transparent 50%),
              radial-gradient(circle at top left, rgba(var(--v-theme-surface), 0.8), transparent 60%),
              radial-gradient(circle at bottom left, rgba(var(--v-theme-primary), 0.05), transparent 70%);
}

.text-gradient {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 1) 0%, #ff8c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dealer-promo-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.15), rgba(var(--v-theme-surface), 0.9)) !important;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  transition: all 0.4s ease;

  &.border-glow {
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    
    &:hover {
      border-color: rgba(var(--v-theme-primary), 0.6) !important;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(var(--v-theme-primary), 0.15) !important;
      transform: translateY(-4px);
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -50%; right: -20%;
    width: 250px; height: 250px;
    background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.35), transparent 70%);
    z-index: 0;
    pointer-events: none;
  }
}

.bg-white-5 {
  background: rgba(255, 255, 255, 0.04) !important;
  backdrop-filter: blur(8px);
}

.border-white-10 {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.bg-success-subtle {
  background: rgba(76, 175, 80, 0.15) !important;
  border: 1px solid rgba(76, 175, 80, 0.25) !important;
}

.bg-warning-subtle {
  background: rgba(255, 193, 7, 0.15) !important;
  border: 1px solid rgba(255, 193, 7, 0.25) !important;
}

.text-xxs {
  font-size: 0.65rem !important;
}

.text-white-70 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.stat-badge {
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
  }
}

.showroom-card {
  background: rgba(var(--v-theme-surface), 0.35) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(var(--v-theme-primary), 0.5) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(var(--v-theme-primary), 0.2) !important;
  }
}

.bg-white-10 {
  background: rgba(255, 255, 255, 0.08) !important;
}

.text-white-50 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bg-primary-subtle {
  background: rgba(var(--v-theme-primary), 0.15) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.25) !important;
}

.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.35) !important;
}

.shadow-success {
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.35) !important;
}

.max-w-650 {
  max-width: 650px;
}

.max-w-900 {
  max-width: 900px;
}

.tracking-wide {
  letter-spacing: 1px;
}

.tracking-wider {
  letter-spacing: 1.5px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}

/* Premium Horizontal Search Deck Styles - Very Compact! */
.premium-horizontal-search {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 12px 18px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.premium-horizontal-search:hover {
  border-color: rgba(var(--v-theme-primary), 0.15);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
}

.search-main-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
}

.search-col {
  flex: 1;
  min-width: 0;
}

.search-col-name {
  flex: 1.5;
}

.search-col-governorate {
  flex: 1.2;
}

.search-col-city {
  flex: 1.2;
}

.search-col-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Integrated Outlined Cohesion for all Vuetify 3 inputs */
.premium-input-field :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px !important;
  display: flex;
  align-items: center;
}

.premium-input-field :deep(.v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: rgba(255, 255, 255, 0.08) !important;
  transition: color 0.3s ease;
}

.premium-input-field :deep(.v-field:hover .v-field__outline) {
  color: rgba(255, 255, 255, 0.2) !important;
}

.premium-input-field :deep(.v-field--focused .v-field__outline) {
  color: rgba(var(--v-theme-primary), 1) !important;
}

.premium-input-field :deep(.v-field__input) {
  min-height: 44px !important;
  height: 44px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  align-items: center;
  color: #fff !important;
  font-size: 14px;
}

.premium-input-field :deep(.v-label) {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 14px;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.premium-input-field :deep(.v-field--active .v-label) {
  top: 0 !important;
  transform: translateY(-60%) scale(0.75) !important;
}

.premium-input-field :deep(.v-field__append-inner),
.premium-input-field :deep(.v-field__prepend-inner) {
  align-items: center;
  padding-top: 0 !important;
  margin-top: 0 !important;
  height: 44px !important;
  color: rgba(255, 255, 255, 0.5);
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.gap-4 {
  gap: 16px;
}

.font-arabic {
  font-family: 'Cairo', 'Inter', sans-serif !important;
}

@media (max-width: 959px) {
  .search-main-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .search-col {
    width: 100%;
  }
  
  .search-col-actions {
    justify-content: space-between;
    margin-top: 8px;
  }
  
  .search-col-actions > button {
    flex: 1;
  }
}
</style>
