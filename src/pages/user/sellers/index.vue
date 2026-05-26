<script setup>
import { computed, onMounted, ref } from 'vue'
import sellerUserApi from '@/api/user/sellerUserApi.js'

definePage({ meta: { layout: 'front', public: true } })

const loading = ref(true)
const error = ref('')
const sellers = ref([])
const searchQuery = ref('')
const selectedCity = ref('All')

// Common Egyptian automotive hubs for quick filtering
const popularCities = ['All', 'Mansoura', 'Cairo', 'Alexandria', 'Giza', 'Tanta', 'Kafr El Sheikh', 'Port Said', 'Ismailia']

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const fetchSellers = async () => {
  loading.value = true
  error.value = ''
  try {
    // Fetch all active showrooms without the incorrect 'status' filter
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

const filteredSellers = computed(() => {
  let result = sellers.value

  // City Filter
  if (selectedCity.value !== 'All') {
    const cityQ = selectedCity.value.toLowerCase()
    result = result.filter(s => {
      const cityEn = (s.city?.name?.en || '').toLowerCase()
      const cityAr = (s.city?.name?.ar || '').toLowerCase()
      const address = (t(s.address) || '').toLowerCase()
      return cityEn.includes(cityQ) || cityAr.includes(cityQ) || address.includes(cityQ)
    })
  }

  // Smart Intelligent Search Query Filter (Matches Name, Address, City, Area/Neighborhood, Description in AR/EN)
  if (searchQuery.value.trim()) {
    const tokens = searchQuery.value.toLowerCase().trim().split(/\s+/).filter(Boolean)

    if (tokens.length > 0) {
      result = result.filter(s => {
        // Collect all searchable strings for this showroom
        const nameEn = (s.store_name?.en || s.name || '').toLowerCase()
        const nameAr = (s.store_name?.ar || '').toLowerCase()
        const descEn = (s.store_description?.en || s.bio || '').toLowerCase()
        const descAr = (s.store_description?.ar || '').toLowerCase()
        const cityEn = (s.city?.name?.en || '').toLowerCase()
        const cityAr = (s.city?.name?.ar || '').toLowerCase()
        
        // Handle address translatable or plain string
        const addressEn = (s.address?.en || '').toLowerCase()
        const addressAr = (s.address?.ar || '').toLowerCase()
        const addressStr = (typeof s.address === 'string' ? s.address : '').toLowerCase()
        const nameStr = (typeof s.store_name === 'string' ? s.store_name : '').toLowerCase()
        const descStr = (typeof s.store_description === 'string' ? s.store_description : '').toLowerCase()

        const searchableFields = [
          nameEn, nameAr, nameStr,
          descEn, descAr, descStr,
          cityEn, cityAr,
          addressEn, addressAr, addressStr,
          s.phone || ''
        ]

        // Intelligent Matching: ALL query tokens must match AT LEAST ONE searchable field
        return tokens.every(token => {
          return searchableFields.some(field => field.includes(token))
        })
      })
    }
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
        
        // Smart Egyptian latitude/longitude boundaries
        if (lat >= 30.9 && lat <= 31.2 && lon >= 31.2 && lon <= 31.6) {
          searchQuery.value = 'Mansoura'
        } else if (lat >= 29.8 && lat <= 30.3 && lon >= 30.8 && lon <= 31.6) {
          searchQuery.value = 'Cairo'
        } else if (lat >= 31.0 && lat <= 31.4 && lon >= 29.6 && lon <= 30.1) {
          searchQuery.value = 'Alexandria'
        } else {
          searchQuery.value = 'Cairo' // default Egypt hub
        }
      },
      (err) => {
        isLocating.value = false
        searchQuery.value = 'Cairo' // default fallback on permission error
      },
      { timeout: 5000 }
    )
  } else {
    isLocating.value = false
    searchQuery.value = 'Cairo'
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

onMounted(fetchSellers)
</script>

<template>
  <div class="showrooms-directory-page py-12">
    <VContainer>
      <!-- Premium Split Hero Layout (Above the Fold) -->
      <VRow class="align-center mb-12" no-gutters>
        <!-- Left: Search & Discovery for Buyers -->
        <VCol cols="12" md="8" class="pe-md-10 mb-8 mb-md-0">
          <div class="header-section text-center text-md-start animate-fade-in">
            <div class="d-inline-flex align-center gap-2 px-4 py-1.5 rounded-pill bg-primary-subtle mb-4 border border-primary-20">
              <VIcon icon="tabler-building-store" size="18" color="primary" />
              <span class="text-caption font-weight-black text-primary text-uppercase tracking-wider">Showrooms Directory</span>
            </div>
            
            <h1 class="text-h2 font-weight-black text-white mb-4 leading-tight">
              Find & Search Any <span class="text-gradient">Showroom</span> in Egypt
            </h1>
            <p class="text-h6 text-white-50 max-w-650 font-weight-medium mb-8" style="line-height: 1.6;">
              Your comprehensive destination to explore certified automotive dealers. Search by name, city, or neighborhood to locate verified showrooms and browse premium inventories.
            </p>

            <!-- Search input -->
            <VSheet class="search-sheet rounded-pill px-4 py-2 elevation-8 mb-6 mx-auto mx-md-0" max-width="650">
              <div class="d-flex align-center">
                <VIcon icon="tabler-search" color="primary" class="ms-3 me-2" size="24" />
                
                <VTextField
                  v-model="searchQuery"
                  placeholder="Search for any showroom, city, district, or neighborhood..."
                  variant="plain"
                  hide-details
                  density="comfortable"
                  class="showroom-search-input text-subtitle-1 font-weight-medium flex-grow-1"
                >
                  <template #append-inner v-if="searchQuery">
                    <VBtn icon="tabler-x" size="small" variant="text" @click="searchQuery = ''" />
                  </template>
                </VTextField>

                <VBtn
                  color="primary"
                  variant="elevated"
                  rounded="pill"
                  class="px-5 font-weight-bold shadow-primary text-subtitle-1 ms-2"
                  height="44"
                  :loading="isLocating"
                  @click="locateNearMe"
                >
                  <VIcon icon="tabler-map-pin-up" size="20" class="me-2" />
                  Near Me
                </VBtn>
              </div>
            </VSheet>

            <!-- Quick City Filter Chips -->
            <div class="city-chips d-flex align-center justify-center justify-md-start flex-wrap gap-2 max-w-900">
              <span class="text-caption text-uppercase font-weight-bold text-white-50 me-2 align-self-center">Location Hubs:</span>
              <VChip
                v-for="city in popularCities"
                :key="city"
                :color="selectedCity === city ? 'primary' : 'default'"
                :variant="selectedCity === city ? 'elevated' : 'tonal'"
                class="city-chip font-weight-bold px-4 py-2 rounded-pill"
                size="large"
                @click="selectedCity = city"
              >
                {{ city }}
              </VChip>
            </div>
          </div>
        </VCol>

        <!-- Right: Premium Partnership Card for Showroom Owners & Agencies (Sleeker & More Compact!) -->
        <VCol cols="12" md="4">
          <VCard class="dealer-promo-card pa-6 rounded-2xl elevation-10 overflow-hidden relative border-glow">
            <div class="d-flex flex-column gap-3 relative z-1">
              <div class="d-inline-flex align-center gap-1.5 px-3 py-1 rounded-pill bg-primary-subtle text-primary text-caption font-weight-bold align-self-start">
                <VIcon icon="tabler-rocket" size="14" /> Dealership Partnership
              </div>
              
              <h2 class="text-h5 font-weight-black text-white leading-tight">
                Own a Showroom?
              </h2>
              
              <p class="text-caption text-white-50 mb-2 font-weight-medium" style="line-height: 1.5;">
                Grow your reach with a <span class="text-primary font-weight-bold">verified annual membership</span>! Display your inventory and receive direct qualified buyer leads.
              </p>
              
              <VBtn
                color="primary"
                size="large"
                rounded="pill"
                to="/seller/register"
                class="px-5 font-weight-black shadow-primary text-subtitle-2 w-100"
                height="44"
                elevation="8"
              >
                <VIcon icon="tabler-building-store" size="18" class="me-2" />
                Register Showroom
              </VBtn>
            </div>
          </VCard>
        </VCol>
      </VRow>

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
        <VBtn variant="tonal" color="primary" class="mt-4 px-6 font-weight-bold" rounded="pill" @click="searchQuery = ''; selectedCity = 'All'">
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

                    <div class="d-flex align-center gap-1 text-white-50 text-caption mt-1">
                      <VIcon icon="tabler-map-pin" size="14" color="error" />
                      <span class="text-truncate font-weight-medium">
                        {{ t(seller.city?.name) ? (t(seller.city?.name) + (t(seller.address) ? ' - ' + t(seller.address) : '')) : (t(seller.address) || 'Egypt') }}
                      </span>
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

.search-sheet {
  background: rgba(0, 0, 0, 0.45) !important;
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: rgba(var(--v-theme-primary), 0.5) !important;
    box-shadow: 0 20px 50px rgba(var(--v-theme-primary), 0.25) !important;
  }
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

.city-chip {
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    background-color: rgba(var(--v-theme-primary), 0.1) !important;
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
  background: rgba(var(--v-theme-primary), 0.15);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
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
</style>
