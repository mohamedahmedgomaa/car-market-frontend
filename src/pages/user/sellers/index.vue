<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import sellerUserApi from '@/api/user/sellerUserApi.js'
import cityUserApi from '@/api/user/cityUserApi.js'
import governorateUserApi from '@/api/user/governorateUserApi.js'
import { useI18n } from 'vue-i18n'

definePage({ meta: { layout: 'front', public: true } })

const { t } = useI18n({ useScope: 'global' })

const loading = ref(true)
const error = ref('')
const sellers = ref([])
const cities = ref([])
const governorates = ref([])
const filteredCities = computed(() => {
  if (filters.value.governorateId) {
    return cities.value.filter(c => c.governorate_id === filters.value.governorateId)
  }
  return cities.value
})

// Filters state
const filters = ref({
  storeName: '',
  governorateId: null,
  cityId: null,
  neighborhood: '',
  tier: null
})

const resetFilters = () => {
  filters.value.storeName = ''
  filters.value.governorateId = null
  filters.value.cityId = null
  filters.value.neighborhood = ''
  filters.value.tier = null
}

const tierOptions = computed(() => [
  { value: null, title: _t({ ar: 'كل الباقات', en: 'All Tiers' }) },
  { value: 'platinum', title: _t({ ar: 'باقة إيليت (Elite)', en: 'Elite' }) },
  { value: 'gold', title: _t({ ar: 'باقة جولد (Gold)', en: 'Gold' }) },
  { value: 'silver', title: _t({ ar: 'باقة سيلفر (Silver)', en: 'Silver' }) },
  { value: 'none', title: _t({ ar: 'باقة عادية (Standard)', en: 'Standard' }) }
])

const _t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const getCombinedName = (nameObj) => {
  if (!nameObj) return ''
  if (typeof nameObj === 'string') return nameObj
  const en = nameObj.en || ''
  const ar = nameObj.ar || ''
  if (en && ar) {
    return `${en} / ${ar}`
  }
  return en || ar || ''
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

const fetchGovernorates = async () => {
  try {
    const res = await governorateUserApi.getAll({ perPage: 100 })
    const payload = res.data?.data ?? res.data ?? []
    governorates.value = Array.isArray(payload) ? payload : payload.data ?? []
  } catch (err) {
    console.error('Failed to fetch governorates:', err)
  }
}

const fetchCities = async () => {
  try {
    const res = await cityUserApi.getAll({ perPage: 1000 })
    const payload = res.data?.data ?? res.data ?? []
    cities.value = Array.isArray(payload) ? payload : payload.data ?? []
  } catch (err) {
    console.error('Failed to fetch cities:', err)
  }
}

watch(() => filters.value.governorateId, (newGovId) => {
  if (filters.value.cityId) {
    const currentCity = cities.value.find(c => c.id === filters.value.cityId)
    if (!currentCity || currentCity.governorate_id !== newGovId) {
      filters.value.cityId = null
    }
  }
})

watch(() => filters.value.cityId, (newCityId) => {
  if (newCityId) {
    const selectedCity = cities.value.find(c => c.id === newCityId)
    if (selectedCity && selectedCity.governorate_id && filters.value.governorateId !== selectedCity.governorate_id) {
      filters.value.governorateId = selectedCity.governorate_id
    }
  }
})

const filteredSellers = computed(() => {
  let result = sellers.value

  // 1. Showroom Name Filter
  if (filters.value.storeName && filters.value.storeName.trim()) {
    const q = filters.value.storeName.toLowerCase().trim()
    result = result.filter(s => {
      const nameEn = (s.store_name?.en || s.name || '').toLowerCase()
      const nameAr = (s.store_name?.ar || '').toLowerCase()
      const nameStr = (typeof s.store_name === 'string' ? s.store_name : '').toLowerCase()
      return nameEn.includes(q) || nameAr.includes(q) || nameStr.includes(q)
    })
  }

  // 2. Governorate Filter
  if (filters.value.governorateId) {
    result = result.filter(s => s.governorate_id === filters.value.governorateId || s.governorate?.id === filters.value.governorateId)
  }

  // 3. City Filter
  if (filters.value.cityId) {
    result = result.filter(s => s.city_id === filters.value.cityId || s.city?.id === filters.value.cityId)
  }

  // 4. City/Neighborhood Filter
  if (filters.value.neighborhood && filters.value.neighborhood.trim()) {
    const q = filters.value.neighborhood.toLowerCase().trim()
    result = result.filter(s => {
      const addressEn = (s.address?.en || '').toLowerCase()
      const addressAr = (s.address?.ar || '').toLowerCase()
      const addressStr = (typeof s.address === 'string' ? s.address : '').toLowerCase()
      
      const districtEn = (s.district?.en || '').toLowerCase()
      const districtAr = (s.district?.ar || '').toLowerCase()
      const districtStr = (typeof s.district === 'string' ? s.district : '').toLowerCase()

      const streetEn = (s.street?.en || '').toLowerCase()
      const streetAr = (s.street?.ar || '').toLowerCase()
      const streetStr = (typeof s.street === 'string' ? s.street : '').toLowerCase()

      const descEn = (s.store_description?.en || s.bio || '').toLowerCase()
      const descAr = (s.store_description?.ar || '').toLowerCase()
      const descStr = (typeof s.store_description === 'string' ? s.store_description : '').toLowerCase()
      
      const cityEn = (s.city?.name?.en || '').toLowerCase()
      const cityAr = (s.city?.name?.ar || '').toLowerCase()

      return addressEn.includes(q) || addressAr.includes(q) || addressStr.includes(q) ||
             districtEn.includes(q) || districtAr.includes(q) || districtStr.includes(q) ||
             streetEn.includes(q) || streetAr.includes(q) || streetStr.includes(q) ||
             descEn.includes(q) || descAr.includes(q) || descStr.includes(q) ||
             cityEn.includes(q) || cityAr.includes(q)
    })
  }

  // 5. Tier Package Filter
  if (filters.value.tier !== null) {
    result = result.filter(s => {
      const tierVal = s.tier?.toLowerCase()
      if (filters.value.tier === 'none') {
        return !tierVal || tierVal === 'none'
      }
      return tierVal === filters.value.tier
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
          filters.value.governorateId = matched.governorate_id
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
        if (matched) {
          filters.value.governorateId = matched.governorate_id
          filters.value.cityId = matched.id
        }
      },
      { timeout: 5000 }
    )
  } else {
    isLocating.value = false
    const matched = cities.value.find(c => {
      const nameEn = (c.name?.en || c.name || '').toLowerCase()
      return nameEn.includes('cairo')
    })
    if (matched) {
      filters.value.governorateId = matched.governorate_id
      filters.value.cityId = matched.id
    }
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

const openWhatsApp = (phone) => {
  if (!phone) return
  window.open(`https://wa.me/${String(phone).replace('+', '')}`, '_blank')
}

onMounted(() => {
  fetchSellers()
  fetchGovernorates()
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
              <span class="text-caption font-weight-black text-primary text-uppercase tracking-wider">{{ t('showroomsDirectory') }}</span>
            </div>
            
            <h1 class="text-h3 font-weight-black text-high-emphasis mb-4 leading-tight">
              <span dir="ltr">{{ t('discoverShowrooms') }}</span>
            </h1>
            <p class="text-body-2 text-medium-emphasis max-w-650 font-weight-medium mb-6" style="line-height: 1.5;">
              <span dir="ltr">{{ t('exploreShowroomsDesc') }}</span>
            </p>

            <!-- Ultra-Sleek Trust & Stats Bar -->
            <div class="d-flex align-center justify-center justify-md-start flex-wrap gap-3 animate-fade-in">
              <div class="stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl bg-white-5 border-white-10">
                <div class="d-flex align-center justify-center rounded-circle bg-primary-subtle" style="width: 36px; height: 36px; min-width: 36px;">
                  <VIcon icon="tabler-building-store" color="primary" size="20" />
                </div>
                <div class="d-flex flex-column text-start">
                  <span class="text-caption font-weight-black text-high-emphasis leading-tight"><span dir="ltr">{{ t('showroomsCount', { count: sellers.length || 0 }) }}</span></span>
                  <span class="text-xxs text-medium-emphasis leading-none">{{ t('verifiedDealers') }}</span>
                </div>
              </div>

              <div class="stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl bg-white-5 border-white-10">
                <div class="d-flex align-center justify-center rounded-circle bg-success-subtle" style="width: 36px; height: 36px; min-width: 36px;">
                  <VIcon icon="tabler-map-pin" color="success" size="20" />
                </div>
                <div class="d-flex flex-column text-start">
                  <span class="text-caption font-weight-black text-high-emphasis leading-tight">{{ t('egyptWide') }}</span>
                  <span class="text-xxs text-medium-emphasis leading-none">{{ t('activeCities') }}</span>
                </div>
              </div>

              <div class="stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl bg-white-5 border-white-10">
                <div class="d-flex align-center justify-center rounded-circle bg-warning-subtle" style="width: 36px; height: 36px; min-width: 36px;">
                  <VIcon icon="tabler-shield-check" color="warning" size="20" />
                </div>
                <div class="d-flex flex-column text-start">
                  <span class="text-caption font-weight-black text-high-emphasis leading-tight"><span dir="ltr">{{ t('secure100') }}</span></span>
                  <span class="text-xxs text-medium-emphasis leading-none">{{ t('directConnection') }}</span>
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
                <VIcon icon="tabler-rocket" size="12" /> {{ t('dealershipPartnership') }}
              </div>
              
              <h2 class="text-h6 font-weight-black text-high-emphasis leading-tight">
                <span dir="ltr">{{ t('ownShowroomTitle') }}</span>
              </h2>
              
              <p class="text-caption text-medium-emphasis mb-1 font-weight-medium" style="line-height: 1.4;">
                <span dir="ltr">{{ t('ownShowroomDesc') }}</span>
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
                {{ t('registerShowroom') }}
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
              :placeholder="t('showroomNamePlaceholder')"
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
              v-model="filters.governorateId"
              :items="governorates"
              item-value="id"
              :item-title="g => getCombinedName(g.name)"
              :placeholder="t('governoratePlaceholder')"
              prepend-inner-icon="tabler-map"
              variant="outlined"
              density="comfortable"
              hide-details
              class="premium-input-field"
              clearable
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props" :title="getCombinedName(item.raw.name)" />
              </template>
              <template #selection="{ item }">
                {{ getCombinedName(item.raw.name) }}
              </template>
            </VAutocomplete>
          </div>

          <!-- 3. City Field -->
          <div class="search-col search-col-city">
            <VAutocomplete
              v-model="filters.cityId"
              :items="filteredCities"
              item-value="id"
              :item-title="c => getCombinedName(c.name)"
              :placeholder="t('cityPlaceholder')"
              prepend-inner-icon="tabler-map-pin"
              variant="outlined"
              density="comfortable"
              hide-details
              class="premium-input-field"
              clearable
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props" :title="getCombinedName(item.raw.name)" />
              </template>
              <template #selection="{ item }">
                {{ getCombinedName(item.raw.name) }}
              </template>
            </VAutocomplete>
          </div>

          <!-- 4. Tier Package Selector -->
          <div class="search-col search-col-tier">
            <VSelect
              v-model="filters.tier"
              :items="tierOptions"
              item-value="value"
              item-title="title"
              :placeholder="_t({ ar: 'اختر الباقة', en: 'Select Tier' })"
              prepend-inner-icon="tabler-crown"
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
              {{ t('nearMe') }}
            </VBtn>

            <VBtn
              variant="tonal"
              height="44"
              color="secondary"
              class="px-4"
              rounded="lg"
              :title="t('resetFilters')"
              @click="resetFilters"
            >
              <VIcon icon="tabler-refresh" />
            </VBtn>
          </div>
        </div>
      </div>

      <div class="d-flex align-center gap-2 mb-6 animate-fade-in">
        <div class="divider flex-grow-1 bg-white-10" style="height: 1px;"></div>
        <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase tracking-wider px-3">{{ t('verifiedShowroomsTitle') }}</span>
        <div class="divider flex-grow-1 bg-white-10" style="height: 1px;"></div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
        <h3 class="mt-4 text-h6 text-primary animate-pulse">{{ t('loadingShowrooms') }}</h3>
      </div>

      <!-- Error State -->
      <VAlert v-else-if="error" type="error" variant="tonal" class="mb-8 rounded-lg">
        <div dir="ltr">{{ error }}</div>
      </VAlert>

      <!-- Empty State -->
      <div v-else-if="filteredSellers.length === 0" class="text-center py-16 animate-fade-in">
        <VIcon icon="tabler-building-store" size="80" class="mb-4 opacity-20" />
        <h3 class="text-h5 text-medium-emphasis font-weight-bold">{{ t('noShowroomsFound') }}</h3>
        <VBtn variant="tonal" color="primary" class="mt-4 px-6 font-weight-bold" rounded="pill" @click="resetFilters">
          {{ t('resetFilters') }}
        </VBtn>
      </div>

      <!-- Showrooms Grid -->
      <div v-else class="mb-8">
        <VRow class="showrooms-grid">
          <VCol v-for="seller in filteredSellers" :key="seller.id" cols="12" sm="6" lg="4">
            <VCard
              class="showroom-card h-100 pa-6 rounded-2xl d-flex flex-column justify-space-between cursor-pointer relative"
              :class="{
                'showroom-card-gold': seller.tier?.toLowerCase() === 'gold',
                'showroom-card-silver': seller.tier?.toLowerCase() === 'silver',
                'showroom-card-platinum': seller.tier?.toLowerCase() === 'platinum'
              }"
              elevation="6"
              :to="`/user/sellers/${seller.id}`"
            >
              <div>
                <!-- Top details -->
                <div class="d-flex align-start gap-4 mb-3">
                  <!-- Logo Container -->
                  <div class="showroom-logo-wrapper position-relative d-flex align-center justify-center flex-shrink-0 bg-white rounded-lg elevation-2 border" style="width: 80px; height: 80px; padding: 6px;">
                    <img v-if="seller.store_logo" :src="seller.store_logo" alt="Showroom Logo" class="w-100 h-100" style="object-fit: contain; border-radius: 4px;" />
                    <span v-else class="text-h4 font-weight-black text-primary">{{ (_t(seller.store_name) || seller.name)?.charAt(0)?.toUpperCase() }}</span>
                    
                    <!-- Absolute Overlaid Tier Badge -->
                    <div 
                      v-if="seller.tier && seller.tier !== 'none'"
                      class="logo-tier-overlay text-xxs font-weight-black px-2 py-0.5 rounded text-uppercase"
                      :class="{
                        'tier-badge-platinum': seller.tier?.toLowerCase() === 'platinum',
                        'tier-badge-gold': seller.tier?.toLowerCase() === 'gold',
                        'tier-badge-silver': seller.tier?.toLowerCase() === 'silver'
                      }"
                    >
                      {{ 
                        seller.tier?.toLowerCase() === 'platinum' ? 'ELITE' : 
                        (seller.tier?.toLowerCase() === 'gold' ? 'GOLD' : 'SILVER') 
                      }}
                    </div>
                  </div>

                  <div class="overflow-hidden flex-grow-1">
                    <div class="d-flex align-center justify-space-between gap-1 mb-1 w-100">
                      <div class="d-flex align-center gap-1 overflow-hidden flex-grow-1">
                        <h3 class="font-weight-black text-truncate mb-0" style="font-size: 1.1rem !important;"
                            :class="{
                              'text-gold': seller.tier?.toLowerCase() === 'gold',
                              'text-platinum': seller.tier?.toLowerCase() === 'platinum',
                              'text-silver': seller.tier?.toLowerCase() === 'silver',
                              'text-high-emphasis': !seller.tier || seller.tier === 'none'
                            }">
                          {{ _t(seller.store_name) || seller.name }}
                        </h3>
                        <VIcon 
                          icon="tabler-discount-check-filled" 
                          :color="seller.tier?.toLowerCase() === 'gold' ? '#DAA520' : (seller.tier?.toLowerCase() === 'silver' ? '#78909C' : (seller.tier?.toLowerCase() === 'platinum' ? '#FF6D00' : 'info'))" 
                          size="22" 
                          :title="t('verifiedShowroom')" 
                          class="flex-shrink-0 ms-1"
                        />
                      </div>
                    </div>

                    <!-- Clean Professional Location Line -->
                    <div class="d-flex align-center text-medium-emphasis text-caption font-weight-medium mt-2">
                      <VIcon icon="tabler-map-pin" size="16" class="me-1" />
                      <span class="text-truncate">
                        {{ seller.governorate ? _t(seller.governorate.name) : '' }}
                        <span v-if="seller.city">, {{ _t(seller.city.name) }}</span>
                        <span v-if="_t(seller.district)">, {{ _t(seller.district) }}</span>
                        <span v-if="_t(seller.street)">, {{ _t(seller.street) }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Mid content wrapper with fixed min-height to prevent layout shifts -->
                <div class="mid-content-wrapper mb-3" style="min-height: 90px;">
                  <!-- Bio excerpt -->
                  <p class="text-body-2 text-medium-emphasis line-clamp-2 mb-0 font-weight-medium" style="line-height: 1.5;">
                    {{ _t(seller.store_description) || seller.bio || 'Premium verified showroom offering certified high-quality vehicles with guaranteed warranties and transparent pricing.' }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="actions-wrapper mt-auto">
                <div class="d-flex align-center gap-2">
                  <VBtn
                    v-if="seller.phone"
                    :color="seller.tier?.toLowerCase() === 'platinum' ? '#FF6D00' : (seller.tier?.toLowerCase() === 'gold' ? '#DAA520' : (seller.tier?.toLowerCase() === 'silver' ? '#455A64' : 'primary'))"
                    variant="elevated"
                    size="small"
                    rounded="pill"
                    class="flex-grow-1 font-weight-bold px-4 py-2"
                    :class="[
                      seller.tier && seller.tier !== 'none' ? 'btn-call-' + seller.tier.toLowerCase() : 'shadow-primary'
                    ]"
                    @click.stop.prevent="openCallDialog(seller)"
                  >
                    <VIcon icon="tabler-phone" size="16" class="me-1" />
                    {{ t('callBtn') }}
                  </VBtn>

                  <VBtn
                    v-if="seller.phone"
                    color="success"
                    variant="elevated"
                    size="small"
                    rounded="pill"
                    class="flex-grow-1 font-weight-bold shadow-success px-4 py-2"
                    @click.stop.prevent="openWhatsApp(seller.phone)"
                  >
                    <VIcon icon="tabler-brand-whatsapp" size="16" class="me-1" />
                    {{ t('whatsappBtn') }}
                  </VBtn>
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- Call Confirmation Modal -->
      <VDialog v-model="showCallDialog" max-width="400">
        <VCard v-if="selectedSellerForCall" class="pa-6 text-center rounded-2xl elevation-10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(var(--v-theme-on-surface), 0.15);">
          <VAvatar color="primary" variant="tonal" size="70" class="mx-auto mb-4 elevation-4 overflow-hidden border">
            <img v-if="selectedSellerForCall.store_logo" :src="selectedSellerForCall.store_logo" alt="Logo" class="w-100 h-100 object-fit-cover" />
            <VIcon v-else icon="tabler-phone-calling" size="36" />
          </VAvatar>
          
          <h3 class="text-h5 font-weight-bold mb-2 text-high-emphasis">Call Dealership</h3>
          <p class="text-body-1 opacity-70 mb-6 text-medium-emphasis">
            Contact <strong>{{ _t(selectedSellerForCall.store_name) || selectedSellerForCall.name }}</strong> directly at:
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
              class="text-medium-emphasis font-weight-medium"
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
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.15) !important;
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
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
  backdrop-filter: blur(8px);
}

.border-white-10 {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
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

.text-medium-emphasis {
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
}

.stat-badge {
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-3px);
    background: rgba(var(--v-theme-on-surface), 0.08) !important;
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
  }
}

.showroom-card {
  background: rgba(var(--v-theme-surface), 0.35) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(var(--v-theme-primary), 0.5) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(var(--v-theme-primary), 0.2) !important;
  }

  &.showroom-card-gold {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(218, 165, 32, 0.15)) !important;
    border: 2px solid rgba(218, 165, 32, 0.8) !important;
    box-shadow: 0 12px 30px rgba(218, 165, 32, 0.25) !important;
    
    &:hover {
      border-color: rgba(218, 165, 32, 1) !important;
      box-shadow: 0 20px 45px rgba(218, 165, 32, 0.4), 0 0 40px rgba(218, 165, 32, 0.25) !important;
    }
  }

  &.showroom-card-silver {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(69, 90, 100, 0.15)) !important;
    border: 2px solid rgba(69, 90, 100, 0.6) !important;
    box-shadow: 0 12px 30px rgba(69, 90, 100, 0.25) !important;
    
    &:hover {
      border-color: rgba(69, 90, 100, 1) !important;
      box-shadow: 0 20px 45px rgba(69, 90, 100, 0.4), 0 0 40px rgba(69, 90, 100, 0.25) !important;
    }
  }

  &.showroom-card-platinum {
    background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.95), rgba(255, 109, 0, 0.15)) !important;
    border: 2px solid rgba(255, 109, 0, 0.8) !important;
    box-shadow: 0 12px 30px rgba(255, 109, 0, 0.4), 0 0 25px rgba(255, 143, 0, 0.2) !important;
    
    &:hover {
      border-color: rgba(255, 109, 0, 1) !important;
      box-shadow: 0 20px 45px rgba(255, 109, 0, 0.6), 0 0 50px rgba(255, 143, 0, 0.4) !important;
    }
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

.bg-white-10 {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.text-medium-emphasis {
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
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
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 12px 18px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 15px 35px rgba(var(--v-theme-on-surface), 0.1);
}

.premium-horizontal-search:hover {
  border-color: rgba(var(--v-theme-primary), 0.15);
  box-shadow: 0 20px 45px rgba(var(--v-theme-on-surface), 0.15);
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
  flex: 1.4;
}

.search-col-governorate {
  flex: 1.7;
}

.search-col-city {
  flex: 1.7;
}

.search-col-tier {
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
  background: rgba(var(--v-theme-on-surface), 0.05) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px !important;
  display: flex;
  align-items: center;
}

.premium-input-field :deep(.v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: rgba(var(--v-theme-on-surface), 0.08) !important;
  transition: color 0.3s ease;
}

.premium-input-field :deep(.v-field:hover .v-field__outline) {
  color: rgba(var(--v-theme-on-surface), 0.2) !important;
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
  color: rgba(var(--v-theme-on-surface), 0.9) !important;
  font-size: 14px;
  flex-wrap: nowrap !important;
  overflow: hidden !important;
  white-space: nowrap !important;
}

.premium-input-field :deep(.v-autocomplete__selection),
.premium-input-field :deep(.v-select__selection) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  display: flex !important;
  align-items: center !important;
  max-width: calc(100% - 24px) !important;
}

.premium-input-field :deep(.v-select__selection-text),
.premium-input-field :deep(.v-autocomplete__selection-text) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.premium-input-field :deep(input) {
  white-space: nowrap !important;
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

.text-gold { color: #DAA520 !important; }
.text-platinum { color: #FF6D00 !important; text-shadow: 0 0 8px rgba(255, 109, 0, 0.4); }
.v-theme--dark .text-platinum { color: #FF6D00 !important; text-shadow: 0 0 8px rgba(255, 109, 0, 0.4); }
.text-silver { color: #78909C !important; }

.premium-pill-trusted {
  backdrop-filter: blur(8px);
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  display: inline-flex;
  align-items: center;
  
  &.pill-gold {
    background: rgba(218, 165, 32, 0.08) !important;
    border-color: rgba(218, 165, 32, 0.25) !important;
    color: #DAA520 !important;
  }
  &.pill-platinum {
    background: rgba(255, 109, 0, 0.08) !important;
    border-color: rgba(255, 109, 0, 0.25) !important;
    color: #FF6D00 !important;
  }
  &.pill-silver {
    background: rgba(120, 144, 156, 0.08) !important;
    border-color: rgba(120, 144, 156, 0.25) !important;
    color: #90A4AE !important;
  }
  &.pill-standard {
    background: rgba(76, 175, 80, 0.08) !important;
    border-color: rgba(76, 175, 80, 0.25) !important;
    color: #4CAF50 !important;
  }
}

.premium-pill-tier {
  font-size: 0.68rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.showroom-card-gold .showroom-logo-wrapper {
  border-color: rgba(218, 165, 32, 0.5) !important;
  box-shadow: 0 0 12px rgba(218, 165, 32, 0.15) !important;
}
.showroom-card-platinum .showroom-logo-wrapper {
  border-color: rgba(255, 109, 0, 0.5) !important;
  box-shadow: 0 0 12px rgba(255, 109, 0, 0.15) !important;
}
.showroom-card-silver .showroom-logo-wrapper {
  border-color: rgba(120, 144, 156, 0.4) !important;
  box-shadow: 0 0 10px rgba(120, 144, 156, 0.12) !important;
}

.logo-tier-overlay {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem !important;
  font-weight: 900 !important;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}
</style>
