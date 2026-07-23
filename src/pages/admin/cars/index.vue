<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import carAdminApi from '../../../api/admin/carAdminApi.js'

const router = useRouter()
const BASE_URL = import.meta.env.VITE_BASE_URL

const lists = ref([])
const allCarsForStats = ref([])
const loading = ref(false)
const statsLoading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(100) // ✅ 100 items per page as requested

// ✅ Active Filter State ('all', 'pending', 'featured', 'best_deal', 'import', 'home_page', 'global')
const activeFilter = ref('all')

// ===== Promotion & Status Dialog =====
const promotionDialog = ref(false)
const promotionUpdating = ref(false)
const currentCar = ref(null)

const promotionForm = ref({
  status: 'pending',
  is_featured: false,
  is_best_deal: false,
  is_import: false,
  show_on_home: false,
  is_global_ad: false,
  featured_fee: 0,
  ad_expiry: null
})

// ===== Expiry Presets System =====
const selectedPreset = ref('always')

const expiryPresets = [
  { label: '٣ أيام (3 Days)', value: '3days', icon: 'tabler-calendar-time' },
  { label: '٧ أيام (7 Days)', value: '7days', icon: 'tabler-calendar-due' },
  { label: 'دائماً (Always)', value: 'always', icon: 'tabler-infinity' },
  { label: 'يدوياً (Manual)', value: 'custom', icon: 'tabler-calendar-user' }
]

const formatDateLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateLocal = (dateStr) => {
  if (!dateStr) return null
  const parts = dateStr.split('-')
  return new Date(parts[0], parts[1] - 1, parts[2])
}

const applyExpiryPreset = (preset) => {
  selectedPreset.value = preset
  const today = new Date()
  
  if (preset === '3days') {
    today.setDate(today.getDate() + 3)
    promotionForm.value.ad_expiry = formatDateLocal(today)
  } else if (preset === '7days') {
    today.setDate(today.getDate() + 7)
    promotionForm.value.ad_expiry = formatDateLocal(today)
  } else if (preset === 'always') {
    promotionForm.value.ad_expiry = null
  }
}

const detectPreset = (expiryDate) => {
  if (!expiryDate) return 'always'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = parseDateLocal(expiryDate)
  if (!expiry) return 'always'
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 3) return '3days'
  if (diffDays === 7) return '7days'
  return 'custom'
}

watch(() => promotionForm.value.ad_expiry, (newVal) => {
  if (newVal === null || newVal === '') {
    selectedPreset.value = 'always'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = parseDateLocal(newVal)
    if (!expiry) {
      selectedPreset.value = 'always'
      return
    }
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 3) {
      selectedPreset.value = '3days'
    } else if (diffDays === 7) {
      selectedPreset.value = '7days'
    } else {
      selectedPreset.value = 'custom'
    }
  }
})

// ===== Delete =====
const deleteDialog = ref(false)
const selectedCar = ref(null)
const deleting = ref(false)

const statusOptions = [
  { title: 'Pending Review', value: 'pending', color: 'warning', icon: 'tabler-clock' },
  { title: 'Approved / Active', value: 'approved', color: 'success', icon: 'tabler-check' },
  { title: 'Rejected', value: 'rejected', color: 'error', icon: 'tabler-x' },
]

// ✅ Fetch all database cars once in background for accurate overall statistics
const fetchAllStats = async () => {
  statsLoading.value = true
  try {
    const res = await carAdminApi.getAll({ perPage: 2000 })
    allCarsForStats.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to fetch full stats:', err)
  } finally {
    statsLoading.value = false
  }
}

const fetchLists = async (page = 1) => {
  loading.value = true
  try {
    const queryStr = search.value?.trim() || ''
    const isIdSearch = queryStr.startsWith('#') ? queryStr.substring(1) : queryStr
    const isNumeric = /^\d+$/.test(isIdSearch)

    const params = {
      page,
      perPage: perPage.value,
    }

    if (isNumeric) {
      params['filter[id]'] = isIdSearch
    } else if (queryStr) {
      params['filter[global]'] = queryStr
    }

    // Apply active category filter
    if (activeFilter.value === 'pending') params['filter[status]'] = 'pending'
    if (activeFilter.value === 'featured') params['filter[is_featured]'] = 1
    if (activeFilter.value === 'best_deal') params['filter[is_best_deal]'] = 1
    if (activeFilter.value === 'import') params['filter[is_import]'] = 1
    if (activeFilter.value === 'home_page') params['filter[show_on_home]'] = 1
    if (activeFilter.value === 'global') params['filter[is_global_ad]'] = 1

    const res = await carAdminApi.getAll(params)

    lists.value = res.data.data
    currentPage.value = res.data.meta?.currentPage || 1
    lastPage.value = res.data.meta?.lastPage || 1
    total.value = res.data.meta?.total || lists.value.length
  } catch (err) {
    console.error('Fetch cars failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

const selectFilter = (type) => {
  if (activeFilter.value === type) {
    activeFilter.value = 'all'
  } else {
    activeFilter.value = type
  }
  currentPage.value = 1
  fetchLists(1)
}

const openPromotionDialog = (car) => {
  currentCar.value = car
  const expiry = car.ad_expiry ? car.ad_expiry.split('T')[0] : null
  promotionForm.value = {
    status: car.status || 'pending',
    is_featured: !!car.is_featured,
    is_best_deal: !!car.is_best_deal,
    is_import: !!car.is_import,
    show_on_home: !!car.show_on_home,
    is_global_ad: !!car.is_global_ad,
    featured_fee: car.featured_fee || 0,
    ad_expiry: expiry
  }
  selectedPreset.value = detectPreset(expiry)
  promotionDialog.value = true
}

const handleUpdatePromotion = async () => {
  if (!currentCar.value) return
  promotionUpdating.value = true

  try {
    const res = await carAdminApi.updateStatus(currentCar.value.id, promotionForm.value)
    
    // Update local list
    const idx = lists.value.findIndex(c => c.id === currentCar.value.id)
    if (idx !== -1) {
      lists.value[idx] = { ...lists.value[idx], ...res.data.data }
    }

    // Also update stats array
    const sIdx = allCarsForStats.value.findIndex(c => c.id === currentCar.value.id)
    if (sIdx !== -1) {
      allCarsForStats.value[sIdx] = { ...allCarsForStats.value[sIdx], ...res.data.data }
    }

    promotionDialog.value = false
  } catch (err) {
    alert(err.response?.data?.message || 'Update promotion failed')
    console.error('Update promotion failed:', err.response?.data || err.message)
  } finally {
    promotionUpdating.value = false
  }
}

const confirmDelete = (car) => {
  selectedCar.value = car
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedCar.value) return
  deleting.value = true
  try {
    await carAdminApi.delete(selectedCar.value.id)
    lists.value = lists.value.filter(c => c.id !== selectedCar.value.id)
    allCarsForStats.value = allCarsForStats.value.filter(c => c.id !== selectedCar.value.id)
    total.value--
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/admin/cars/edit/${id}`)

watch(search, () => fetchLists(1))

onMounted(() => {
  fetchAllStats()
  fetchLists()
})

const getMainImageUrl = (car) => {
  if (car.main_image_url) return car.main_image_url
  const main = car.images?.find(i => i.is_main)
  if (main?.path) return main.path
  return car.images?.[0]?.path || '/placeholder-car.png'
}

// ✅ Computed overall statistics across entire database
const stats = computed(() => {
  const db = allCarsForStats.value.length ? allCarsForStats.value : lists.value
  return [
    { title: 'Total Cars', filterKey: 'all', value: db.length, icon: 'tabler-car', color: 'primary' },
    { title: 'Pending Review', filterKey: 'pending', value: db.filter(c => c.status === 'pending').length, icon: 'tabler-clock', color: 'warning' },
    { title: 'Featured Ads', filterKey: 'featured', value: db.filter(c => Number(c.is_featured) === 1 || Boolean(c.is_featured)).length, icon: 'tabler-star-filled', color: 'info' },
    { title: 'Best Deals', filterKey: 'best_deal', value: db.filter(c => Number(c.is_best_deal) === 1 || Boolean(c.is_best_deal)).length, icon: 'tabler-flame', color: 'error' },
    { title: 'Import Cars', filterKey: 'import', value: db.filter(c => Number(c.is_import) === 1 || Boolean(c.is_import)).length, icon: 'tabler-ship', color: 'success' },
    { title: 'Homepage Ads', filterKey: 'home_page', value: db.filter(c => Number(c.show_on_home) === 1 || Boolean(c.show_on_home)).length, icon: 'tabler-home-star', color: 'amber' },
    { title: 'Global Banners', filterKey: 'global', value: db.filter(c => Number(c.is_global_ad) === 1 || Boolean(c.is_global_ad)).length, icon: 'tabler-broadcast', color: 'purple' },
  ]
})
</script>

<template>
  <div class="admin-cars-page">
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-8">
      <div>
        <h1 class="text-h3 font-weight-black mb-1 d-flex align-center gap-2">
          <span class="text-gradient">Vehicle Database</span>
          <VChip color="primary" variant="elevated" size="small" class="font-weight-black tracking-wider px-3 text-white" style="color: #fff !important; -webkit-text-fill-color: #fff !important;">{{ total }} Listings</VChip>
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">Manage complete inventory, apply promotions, and monitor category metrics</p>
      </div>

      <div class="d-flex align-center gap-3">
        <VBtn
          v-if="activeFilter !== 'all'"
          color="warning"
          variant="tonal"
          prepend-icon="tabler-filter-off"
          class="font-weight-bold px-4"
          rounded="pill"
          @click="selectFilter('all')"
        >
          Clear Filter
        </VBtn>

        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          size="large"
          rounded="pill"
          class="elevation-6 font-weight-black px-6 shadow-primary"
          @click="$router.push('/admin/cars/create')"
        >
          Post New Vehicle
        </VBtn>
      </div>
    </div>

    <!-- 📊 Interactive Stats / Filters Grid -->
    <div class="mb-8">
      <div class="text-subtitle-2 font-weight-bold opacity-70 mb-3 text-uppercase tracking-wider">Click any card to filter listings instantly:</div>
      <div class="stats-container">
        <VCard
          v-for="stat in stats"
          :key="stat.title"
          class="stat-card px-3 py-3 text-start h-100 rounded-xl cursor-pointer transition-all relative overflow-hidden"
          :class="[
            activeFilter === stat.filterKey ? 'active-stat-filter' : '',
            activeFilter === stat.filterKey ? `active-card-${stat.color}` : '',
          ]"
          elevation="4"
          @click="selectFilter(stat.filterKey)"
        >
          <div class="stat-glow" :style="{ backgroundColor: `rgba(var(--v-theme-${stat.color}), 0.15)` }"></div>
          <div class="d-flex align-center justify-space-between mb-2">
            <VAvatar :color="stat.color" variant="tonal" size="38" rounded="lg" class="border">
              <VIcon :icon="stat.icon" size="18" />
            </VAvatar>

            <div class="active-dot" :class="`bg-${stat.color}`" v-if="activeFilter === stat.filterKey"></div>
          </div>

          <div>
            <h2 class="text-h4 font-weight-black mb-0.5 line-height-1" :class="`text-${stat.color}`">
              {{ statsLoading ? '...' : stat.value }}
            </h2>
            <div class="stat-card-title text-caption font-weight-bold text-uppercase tracking-wider text-medium-emphasis">
              {{ stat.title }}
            </div>
          </div>
        </VCard>
      </div>
    </div>

    <!-- Main Content Card -->
    <VCard class="main-content-card pa-6 rounded-2xl" elevation="6">
      <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
        <div class="d-flex align-center gap-3 flex-grow-1 max-w-500">
          <VTextField
            v-model="search"
            placeholder="Search by title, brand, model, or seller..."
            variant="solo-filled"
            density="comfortable"
            prepend-inner-icon="tabler-search"
            hide-details
            flat
            rounded="pill"
            class="search-input w-100 font-weight-medium"
          >
            <template #append-inner v-if="search">
              <VBtn icon="tabler-x" size="small" variant="text" @click="search = ''" />
            </template>
          </VTextField>
        </div>

        <div class="d-flex align-center gap-2">
          <div class="text-caption font-weight-bold opacity-70">Rows / page: 100</div>
          <VBtn icon variant="tonal" color="primary" size="small" class="rounded-lg" @click="fetchLists(currentPage)">
            <VIcon icon="tabler-refresh" />
          </VBtn>
        </div>
      </div>

      <VTable class="modern-table">
        <thead>
          <tr>
            <th class="text-uppercase text-caption font-weight-bold py-3">Vehicle</th>
            <th class="text-uppercase text-caption font-weight-bold py-3">Seller / City</th>
            <th class="text-uppercase text-caption font-weight-bold py-3">Pricing & Specs</th>
            <th class="text-uppercase text-caption font-weight-bold py-3">Visibility Features</th>
            <th class="text-uppercase text-caption font-weight-bold text-center py-3">Status</th>
            <th class="text-uppercase text-caption font-weight-bold text-end px-6 py-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading" v-for="i in 8" :key="i">
            <td colspan="6" class="py-4"><VSkeletonLoader type="table-row" /></td>
          </tr>
          
          <tr v-else v-for="car in lists" :key="car.id" class="table-row-hover font-weight-medium">
            <!-- Vehicle Info -->
            <td>
              <div class="d-flex align-center py-3">
                <VAvatar size="64" rounded="xl" class="me-4 elevation-3 border overflow-hidden flex-shrink-0">
                  <VImg :src="getMainImageUrl(car)" cover />
                </VAvatar>
                <div class="overflow-hidden">
                  <div class="text-body-1 font-weight-black text-no-wrap overflow-hidden text-truncate mb-1" style="max-width: 280px;">
                    {{ car.title?.en || car.title || 'Untitled' }}
                  </div>
                  <div class="text-caption text-medium-emphasis font-weight-bold">
                    {{ car.brand?.name?.en || car.brand?.name || '-' }} • {{ car.model?.name?.en || car.model?.name || '-' }} • {{ car.year }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Seller -->
            <td>
              <div class="text-body-2 font-weight-bold">{{ car.seller?.name || 'Anonymous' }}</div>
              <div class="text-caption text-medium-emphasis font-weight-medium">{{ car.city?.name?.en || car.city?.name || 'N/A' }}</div>
            </td>

            <!-- Pricing -->
            <td>
              <div class="text-body-1 font-weight-black text-primary">
                {{ Number(car.price).toLocaleString() }} <span class="text-caption font-weight-bold">EGP</span>
              </div>
              <div class="text-caption text-medium-emphasis font-weight-medium">{{ Number(car.mileage || 0).toLocaleString() }} km</div>
            </td>

            <!-- Visibility / Promotions -->
            <td>
              <div class="d-flex flex-wrap gap-2 align-center">
                <VChip v-if="car.is_featured" color="warning" variant="elevated" size="x-small" class="font-weight-bold px-2 py-1 shadow-warning">
                  <VIcon icon="tabler-star-filled" size="14" class="me-1" /> Featured
                </VChip>

                <VChip v-if="car.is_best_deal" color="error" variant="elevated" size="x-small" class="font-weight-bold px-2 py-1 shadow-error">
                  <VIcon icon="tabler-flame" size="14" class="me-1" /> Best Deal
                </VChip>

                <VChip v-if="car.is_import" color="success" variant="elevated" size="x-small" class="font-weight-bold px-2 py-1 shadow-success">
                  <VIcon icon="tabler-ship" size="14" class="me-1" /> Import
                </VChip>

                <VChip v-if="car.show_on_home" color="amber-darken-1" variant="elevated" size="x-small" class="font-weight-bold px-2 py-1">
                  <VIcon icon="tabler-home" size="14" class="me-1" /> Home
                </VChip>

                <VChip v-if="car.is_global_ad" color="secondary" variant="elevated" size="x-small" class="font-weight-bold px-2 py-1">
                  <VIcon icon="tabler-broadcast" size="14" class="me-1" /> Global Ad
                </VChip>

                <span v-if="!car.is_featured && !car.is_best_deal && !car.is_global_ad && !car.is_import && !car.show_on_home" class="text-caption opacity-40 font-weight-bold">Standard</span>
              </div>
            </td>

            <!-- Status -->
            <td class="text-center">
              <VChip
                :color="statusOptions.find(o => o.value === car.status)?.color || 'grey'"
                size="small"
                variant="flat"
                class="font-weight-black text-uppercase px-4 py-2 cursor-pointer shadow-sm"
                @click="openPromotionDialog(car)"
              >
                {{ car.status }}
              </VChip>
            </td>

            <!-- Actions -->
            <td class="text-end px-6">
              <div class="d-flex justify-end gap-2">
                <VBtn icon variant="tonal" color="info" size="small" class="rounded-lg shadow-hover" @click="openPromotionDialog(car)">
                  <VIcon icon="tabler-settings-automation" />
                </VBtn>
                <VBtn icon variant="tonal" color="primary" size="small" class="rounded-lg shadow-hover" @click="handleEdit(car.id)">
                  <VIcon icon="tabler-edit" />
                </VBtn>
                <VBtn icon variant="tonal" color="error" size="small" class="rounded-lg shadow-hover" @click="confirmDelete(car)">
                  <VIcon icon="tabler-trash" />
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VDivider class="my-4" />

      <!-- Pagination -->
      <div class="d-flex align-center justify-space-between flex-wrap gap-4 pt-2">
        <div class="text-caption font-weight-bold text-medium-emphasis">
          Showing {{ (currentPage - 1) * perPage + 1 }} - {{ Math.min(currentPage * perPage, total) }} of {{ total }} listings
        </div>
        <VPagination
          v-if="total > perPage"
          v-model="currentPage"
          :length="lastPage"
          :total-visible="7"
          rounded="lg"
          size="small"
          @update:model-value="fetchLists"
        />
      </div>
    </VCard>

    <!-- Promotion / Status Dialog -->
    <VDialog v-model="promotionDialog" max-width="600" persistent transition="dialog-bottom-transition">
      <VCard class="promotion-dialog-card rounded-2xl elevation-10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px);">
        <div class="dialog-header-accent"></div>
        
        <VCardTitle class="d-flex align-center pa-6 pb-4">
          <div>
            <div class="text-h5 font-weight-black">Visibility & Promotions</div>
            <div class="text-caption opacity-70 font-weight-bold">Manage listing badges and featured placement</div>
          </div>
          <VSpacer />
          <VBtn icon="tabler-x" variant="text" size="small" class="rounded-lg" @click="promotionDialog = false" />
        </VCardTitle>

        <VDivider opacity="0.1" />

        <VCardText class="pa-6 scrollable-content">
          <!-- Car Preview Mini -->
          <div class="d-flex align-center mb-6 pa-4 rounded-xl bg-surface-variant elevation-2 border">
            <VAvatar size="64" rounded="lg" class="me-4 border overflow-hidden">
              <VImg :src="getMainImageUrl(currentCar)" cover />
            </VAvatar>
            <div>
              <div class="font-weight-black text-body-1">{{ currentCar?.title?.en || currentCar?.title }}</div>
              <div class="text-caption font-weight-bold text-primary">ID: #{{ currentCar?.id }} • {{ Number(currentCar?.price).toLocaleString() }} EGP</div>
            </div>
          </div>

          <VRow>
            <!-- Core Status -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-black mb-2">Listing Status</div>
              <VSelect
                v-model="promotionForm.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
              >
                <template v-slot:item="{ props, item }">
                  <VListItem v-bind="props" :prepend-icon="item.raw.icon" :title="item.raw.title" class="font-weight-bold">
                    <template v-slot:prepend>
                       <VIcon :color="item.raw.color" />
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Visibility Toggles -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-black mb-3">Promotional Features</div>
              
              <div class="promotion-grid">
                <div class="promotion-item rounded-xl pa-4" :class="{ active: promotionForm.is_featured }">
                  <VSwitch v-model="promotionForm.is_featured" color="warning" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold text-body-2">Featured Listing</div>
                        <div class="text-caption opacity-70">Pin to top of search results</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item rounded-xl pa-4" :class="{ active: promotionForm.is_best_deal }">
                  <VSwitch v-model="promotionForm.is_best_deal" color="error" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold text-body-2">Best Deal Badge</div>
                        <div class="text-caption opacity-70">Highlight as limited offer</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item rounded-xl pa-4" :class="{ active: promotionForm.is_import }">
                  <VSwitch v-model="promotionForm.is_import" color="success" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold text-body-2">Import Cars</div>
                        <div class="text-caption opacity-70">Show in specialized import list</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item rounded-xl pa-4" :class="{ active: promotionForm.show_on_home }">
                  <VSwitch v-model="promotionForm.show_on_home" color="amber-darken-1" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold text-body-2">Homepage Ads</div>
                        <div class="text-caption opacity-70">Include in home slider/grids</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item rounded-xl pa-4" :class="{ active: promotionForm.is_global_ad }">
                  <VSwitch v-model="promotionForm.is_global_ad" color="secondary" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold text-body-2">Global Banner</div>
                        <div class="text-caption opacity-70">Show as banner across all pages</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>
              </div>
            </VCol>

            <!-- Ad Details -->
            <VCol cols="12" v-if="promotionForm.is_featured || promotionForm.is_global_ad">
              <div class="text-subtitle-2 font-weight-black mb-2">تاريخ انتهاء الإعلان (Ad Expiry Preset)</div>
              
              <!-- Premium Preset Buttons -->
              <div class="d-flex gap-2 mb-4 flex-wrap">
                <VBtn
                  v-for="preset in expiryPresets"
                  :key="preset.value"
                  :color="selectedPreset === preset.value ? 'primary' : 'surface-variant'"
                  :variant="selectedPreset === preset.value ? 'elevated' : 'tonal'"
                  size="small"
                  class="font-weight-black rounded-lg px-4"
                  @click="applyExpiryPreset(preset.value)"
                  :style="selectedPreset === preset.value ? 'color: #fff !important; -webkit-text-fill-color: #fff !important;' : ''"
                >
                  <VIcon :icon="preset.icon" size="16" class="me-1" />
                  {{ preset.label }}
                </VBtn>
              </div>

              <!-- Date Picker Input -->
              <div class="text-subtitle-2 font-weight-black mb-2" v-if="selectedPreset !== 'always'">اختر تاريخ انتهاء يدوي (Expiry Date)</div>
              <VTextField
                v-if="selectedPreset !== 'always'"
                v-model="promotionForm.ad_expiry"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-calendar"
                :readonly="selectedPreset !== 'custom'"
                class="expiry-date-input"
                :hint="selectedPreset !== 'custom' ? 'تم التحديد تلقائياً بناءً على الخيار السريع (Read-only)' : 'حدد التاريخ يدوياً'"
                persistent-hint
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="pa-6 pt-4 border-t">
          <VSpacer />
          <VBtn variant="tonal" rounded="pill" @click="promotionDialog = false" class="px-6 font-weight-bold">Cancel</VBtn>
          <VBtn
            color="primary"
            rounded="pill"
            :loading="promotionUpdating"
            @click="handleUpdatePromotion"
            class="px-8 shadow-primary font-weight-bold"
            variant="elevated"
          >
            Apply Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard class="pa-6 text-center rounded-2xl elevation-10" style="background: rgba(var(--v-theme-surface), 0.95); backdrop-filter: blur(20px);">
        <VAvatar color="error" variant="tonal" size="72" class="mx-auto mb-4 border">
          <VIcon icon="tabler-trash-x" size="40" />
        </VAvatar>
        <h3 class="text-h5 font-weight-black mb-2">Confirm Removal</h3>
        <p class="text-medium-emphasis font-weight-medium mb-6">
          Are you sure you want to delete this vehicle listing? This action cannot be undone.
        </p>
        <div class="d-flex justify-center gap-3">
          <VBtn variant="tonal" rounded="pill" @click="deleteDialog = false" class="px-6 font-weight-bold flex-grow-1">Keep it</VBtn>
          <VBtn color="error" rounded="pill" :loading="deleting" @click="handleDelete" variant="elevated" class="px-8 font-weight-bold flex-grow-1 shadow-error">
            Delete Car
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.admin-cars-page {
  padding: 24px;
  background-color: transparent;
}

.text-gradient {
  background: linear-gradient(45deg, #1867c0, #5cbbf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  width: 100%;
}

@media (max-width: 1200px) {
  .stats-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: rgba(var(--v-theme-surface), 0.5) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4) !important;
  }
}

.stat-card-title {
  font-size: 11px !important;
  font-weight: 700;
  white-space: nowrap;
}

.active-stat-filter {
  border-width: 1.5px !important;
  transform: translateY(-4px);
}

/* Beautiful dynamic colored active styles matching each category */
.active-card-primary { border-color: rgba(var(--v-theme-primary), 0.8) !important; background: rgba(var(--v-theme-primary), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-primary), 0.15) !important; }
.active-card-warning { border-color: rgba(var(--v-theme-warning), 0.8) !important; background: rgba(var(--v-theme-warning), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-warning), 0.15) !important; }
.active-card-info { border-color: rgba(var(--v-theme-info), 0.8) !important; background: rgba(var(--v-theme-info), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-info), 0.15) !important; }
.active-card-error { border-color: rgba(var(--v-theme-error), 0.8) !important; background: rgba(var(--v-theme-error), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-error), 0.15) !important; }
.active-card-success { border-color: rgba(var(--v-theme-success), 0.8) !important; background: rgba(var(--v-theme-success), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-success), 0.15) !important; }
.active-card-amber { border-color: rgba(var(--v-theme-amber), 0.8) !important; background: rgba(var(--v-theme-amber), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-amber), 0.15) !important; }
.active-card-purple { border-color: rgba(var(--v-theme-purple), 0.8) !important; background: rgba(var(--v-theme-purple), 0.12) !important; box-shadow: 0 10px 20px rgba(var(--v-theme-purple), 0.15) !important; }

.active-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

.stat-glow {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 60px;
  height: 60px;
  filter: blur(25px);
  opacity: 0.12;
  border-radius: 50%;
}

.main-content-card {
  background: rgba(var(--v-theme-surface), 0.6) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.search-input :deep(.v-field) {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 9999px !important;
}

.max-w-500 {
  max-width: 500px;
}

.line-height-1 {
  line-height: 1 !important;
}

.tracking-wider {
  letter-spacing: 1.5px;
}

.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.4) !important;
}

.shadow-warning {
  box-shadow: 0 4px 15px rgba(255, 179, 0, 0.3) !important;
}

.shadow-error {
  box-shadow: 0 4px 15px rgba(255, 82, 82, 0.3) !important;
}

.shadow-success {
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3) !important;
}

.modern-table :deep(thead) {
  background-color: rgba(var(--v-theme-on-surface), 0.03);
}

.modern-table :deep(th) {
  height: 56px !important;
}

.table-row-hover {
  transition: background-color 0.2s ease;
}

.table-row-hover:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.scrollable-content {
  overflow-y: auto;
  flex-grow: 1;
}

.dialog-header-accent {
  height: 6px;
  background: linear-gradient(90deg, #1867c0, #5cbbf6, #1867c0);
  background-size: 200% 100%;
  animation: shimmer 3s infinite linear;
}

.promotion-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.promotion-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;
}

.promotion-item.active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.2);
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@media (max-width: 600px) {
  .promotion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
