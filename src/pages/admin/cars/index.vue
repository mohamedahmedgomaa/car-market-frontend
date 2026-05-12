<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import carAdminApi from '../../../api/admin/carAdminApi.js'

const router = useRouter()
const BASE_URL = import.meta.env.VITE_BASE_URL

const lists = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

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

// ===== Delete =====
const deleteDialog = ref(false)
const selectedCar = ref(null)
const deleting = ref(false)

const statusOptions = [
  { title: 'Pending Review', value: 'pending', color: 'warning', icon: 'tabler-clock' },
  { title: 'Approved / Active', value: 'approved', color: 'success', icon: 'tabler-check' },
  { title: 'Rejected', value: 'rejected', color: 'error', icon: 'tabler-x' },
]

const fetchLists = async (page = 1) => {
  loading.value = true
  try {
    const res = await carAdminApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
    })

    lists.value = res.data.data
    currentPage.value = res.data.meta.currentPage
    lastPage.value = res.data.meta.lastPage
    total.value = res.data.meta.total
  } catch (err) {
    console.error('Fetch cars failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

const openPromotionDialog = (car) => {
  currentCar.value = car
  promotionForm.value = {
    status: car.status || 'pending',
    is_featured: !!car.is_featured,
    is_best_deal: !!car.is_best_deal,
    is_import: !!car.is_import,
    show_on_home: !!car.show_on_home,
    is_global_ad: !!car.is_global_ad,
    featured_fee: car.featured_fee || 0,
    ad_expiry: car.ad_expiry ? car.ad_expiry.split('T')[0] : null
  }
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
onMounted(() => fetchLists())

const getMainImageUrl = (car) => {
  if (car.main_image_url) return car.main_image_url
  const main = car.images?.find(i => i.is_main)
  if (main?.path) return main.path
  return car.images?.[0]?.path || '/placeholder-car.png'
}

const stats = computed(() => {
  return [
    { title: 'Total Cars', value: total.value, icon: 'tabler-car', color: 'primary' },
    { title: 'Pending', value: lists.value.filter(c => c.status === 'pending').length, icon: 'tabler-hourglass-high', color: 'warning' },
    { title: 'Featured', value: lists.value.filter(c => c.is_featured).length, icon: 'tabler-star', color: 'info' },
    { title: 'Global Ads', value: lists.value.filter(c => c.is_global_ad).length, icon: 'tabler-broadcast', color: 'secondary' },
  ]
})
</script>

<template>
  <div class="admin-cars-page">
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 text-gradient">Car Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage inventory, promotions, and global advertisements</p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        size="large"
        class="elevation-4 action-btn"
        @click="$router.push('/admin/cars/create')"
      >
        Post New Vehicle
      </VBtn>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-8">
      <VCol v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <VCard class="stat-card overflow-hidden">
          <div class="stat-glow" :style="{ backgroundColor: `var(--v-${stat.color}-base)` }"></div>
          <VCardText class="d-flex align-center pa-6">
            <VAvatar :color="stat.color" variant="tonal" size="48" rounded="lg" class="me-4">
              <VIcon :icon="stat.icon" size="28" />
            </VAvatar>
            <div>
              <div class="text-caption text-uppercase font-weight-bold opacity-70">{{ stat.title }}</div>
              <div class="text-h5 font-weight-black">{{ stat.value }}</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Main Content Card -->
    <VCard class="main-content-card elevation-2">
      <VCardTitle class="px-6 py-4 d-flex align-center gap-4">
        <VTextField
          v-model="search"
          placeholder="Search by title, brand, or seller..."
          variant="solo-filled"
          density="comfortable"
          prepend-inner-icon="tabler-search"
          class="max-width-400"
          hide-details
          flat
        />
        <VSpacer />
        <VBtn icon variant="text" @click="fetchLists(currentPage)">
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VTable class="modern-table">
        <thead>
          <tr>
            <th class="text-uppercase text-caption font-weight-bold">Vehicle</th>
            <th class="text-uppercase text-caption font-weight-bold">Seller</th>
            <th class="text-uppercase text-caption font-weight-bold">Pricing</th>
            <th class="text-uppercase text-caption font-weight-bold">Visibility</th>
            <th class="text-uppercase text-caption font-weight-bold text-center">Status</th>
            <th class="text-uppercase text-caption font-weight-bold text-end px-6">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading" v-for="i in 5" :key="i">
            <td colspan="6"><VSkeletonLoader type="table-row" /></td>
          </tr>
          
          <tr v-else v-for="car in lists" :key="car.id" class="table-row-hover">
            <!-- Vehicle Info -->
            <td>
              <div class="d-flex align-center py-3">
                <VAvatar size="64" rounded="lg" class="me-4 elevation-2 border-primary">
                  <VImg :src="getMainImageUrl(car)" cover />
                </VAvatar>
                <div>
                  <div class="text-body-1 font-weight-bold text-no-wrap overflow-hidden text-truncate" style="max-width: 250px;">
                    {{ car.title?.en || car.title || 'Untitled' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ car.brand?.name?.en || '-' }} • {{ car.model?.name?.en || '-' }} • {{ car.year }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Seller -->
            <td>
              <div class="text-body-2 font-weight-medium">{{ car.seller?.name || 'Anonymous' }}</div>
              <div class="text-caption text-medium-emphasis">{{ car.city?.name?.en || 'N/A' }}</div>
            </td>

            <!-- Pricing -->
            <td>
              <div class="text-body-1 font-weight-black text-primary">
                {{ Number(car.price).toLocaleString() }} <span class="text-caption">EGP</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ car.mileage?.toLocaleString() }} km</div>
            </td>

            <!-- Visibility / Promotions -->
            <td>
              <div class="d-flex flex-wrap gap-1">
                <VTooltip text="Featured on Top" location="top">
                  <template v-slot:activator="{ props }">
                    <VIcon v-if="car.is_featured" v-bind="props" icon="tabler-star-filled" color="warning" size="18" />
                  </template>
                </VTooltip>
                <VTooltip text="Best Deal Badge" location="top">
                  <template v-slot:activator="{ props }">
                    <VIcon v-if="car.is_best_deal" v-bind="props" icon="tabler-bolt" color="error" size="18" />
                  </template>
                </VTooltip>
                <VTooltip text="Global Advertisement" location="top">
                  <template v-slot:activator="{ props }">
                    <VIcon v-if="car.is_global_ad" v-bind="props" icon="tabler-broadcast" color="secondary" size="18" />
                  </template>
                </VTooltip>
                <VTooltip text="Shown on Home Page" location="top">
                  <template v-slot:activator="{ props }">
                    <VIcon v-if="car.show_on_home" v-bind="props" icon="tabler-home" color="info" size="18" />
                  </template>
                </VTooltip>
                <span v-if="!car.is_featured && !car.is_best_deal && !car.is_global_ad" class="text-caption opacity-50">Standard</span>
              </div>
            </td>

            <!-- Status -->
            <td class="text-center">
              <VChip
                :color="statusOptions.find(o => o.value === car.status)?.color || 'grey'"
                size="small"
                variant="flat"
                class="font-weight-bold text-uppercase px-3"
                @click="openPromotionDialog(car)"
              >
                {{ car.status }}
              </VChip>
            </td>

            <!-- Actions -->
            <td class="text-end px-6">
              <div class="d-flex justify-end gap-1">
                <VBtn icon variant="tonal" color="info" size="small" @click="openPromotionDialog(car)">
                  <VIcon icon="tabler-settings-automation" />
                </VBtn>
                <VBtn icon variant="tonal" color="primary" size="small" @click="handleEdit(car.id)">
                  <VIcon icon="tabler-edit" />
                </VBtn>
                <VBtn icon variant="tonal" color="error" size="small" @click="confirmDelete(car)">
                  <VIcon icon="tabler-trash" />
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VDivider />

      <!-- Pagination -->
      <div class="pa-4 d-flex align-center justify-space-between">
        <div class="text-caption text-medium-emphasis">
          Showing {{ (currentPage - 1) * perPage + 1 }} - {{ Math.min(currentPage * perPage, total) }} of {{ total }} vehicles
        </div>
        <VPagination
          v-model="currentPage"
          :length="lastPage"
          :total-visible="5"
          rounded="lg"
          size="small"
          @update:model-value="fetchLists"
        />
      </div>
    </VCard>

    <!-- Promotion / Status Dialog -->
    <VDialog v-model="promotionDialog" max-width="600" persistent transition="dialog-bottom-transition">
      <VCard class="promotion-dialog-card">
        <div class="dialog-header-accent"></div>
        
        <VCardTitle class="d-flex align-center pa-6">
          <div>
            <div class="text-h5 font-weight-bold">Visibility & Promotions</div>
            <div class="text-caption opacity-70">Manage how this vehicle appears to users</div>
          </div>
          <VSpacer />
          <VBtn icon="tabler-x" variant="text" @click="promotionDialog = false" />
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6 scrollable-content">
          <!-- Car Preview Mini -->
          <div class="d-flex align-center mb-6 pa-4 rounded-lg bg-surface-variant elevation-1">
            <VAvatar size="60" rounded="lg" class="me-4">
              <VImg :src="getMainImageUrl(currentCar)" cover />
            </VAvatar>
            <div>
              <div class="font-weight-bold text-body-1">{{ currentCar?.title?.en || currentCar?.title }}</div>
              <div class="text-caption">ID: #{{ currentCar?.id }} • Price: {{ Number(currentCar?.price).toLocaleString() }} EGP</div>
            </div>
          </div>

          <VRow>
            <!-- Core Status -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-bold mb-2">Listing Status</div>
              <VSelect
                v-model="promotionForm.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
              >
                <template v-slot:item="{ props, item }">
                  <VListItem v-bind="props" :prepend-icon="item.raw.icon" :title="item.raw.title">
                    <template v-slot:prepend>
                       <VIcon :color="item.raw.color" />
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Visibility Toggles -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-bold mb-4">Promotional Features</div>
              
              <div class="promotion-grid">
                <div class="promotion-item" :class="{ active: promotionForm.is_featured }">
                  <VSwitch v-model="promotionForm.is_featured" color="warning" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold">Featured Listing</div>
                        <div class="text-caption">Pin to top of search results</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item" :class="{ active: promotionForm.is_global_ad }">
                  <VSwitch v-model="promotionForm.is_global_ad" color="secondary" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold">Global Advertisement</div>
                        <div class="text-caption">Show as banner across all pages</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item" :class="{ active: promotionForm.is_best_deal }">
                  <VSwitch v-model="promotionForm.is_best_deal" color="error" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold">Best Deal Badge</div>
                        <div class="text-caption">Highlight as limited offer</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item" :class="{ active: promotionForm.show_on_home }">
                  <VSwitch v-model="promotionForm.show_on_home" color="info" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold">Show on Homepage</div>
                        <div class="text-caption">Include in home slider/grids</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>

                <div class="promotion-item" :class="{ active: promotionForm.is_import }">
                  <VSwitch v-model="promotionForm.is_import" color="success" hide-details inset>
                    <template v-slot:label>
                      <div class="ms-2">
                        <div class="font-weight-bold">Import Cars Section</div>
                        <div class="text-caption">Show in specialized import list</div>
                      </div>
                    </template>
                  </VSwitch>
                </div>
              </div>
            </VCol>

            <!-- Ad Details -->
            <VCol cols="12" v-if="promotionForm.is_featured || promotionForm.is_global_ad">
              <div class="text-subtitle-2 font-weight-bold mb-2">Ad Expiry Date</div>
              <VTextField
                v-model="promotionForm.ad_expiry"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-calendar"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="pa-6">
          <VSpacer />
          <VBtn variant="tonal" @click="promotionDialog = false" class="px-6">Cancel</VBtn>
          <VBtn
            color="primary"
            :loading="promotionUpdating"
            @click="handleUpdatePromotion"
            class="px-8 elevation-4"
            variant="elevated"
          >
            Apply Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard class="pa-4 rounded-xl">
        <VCardText class="text-center">
          <VAvatar color="error" variant="tonal" size="72" class="mb-4">
            <VIcon icon="tabler-trash-x" size="40" />
          </VAvatar>
          <h3 class="text-h5 font-weight-bold mb-2">Confirm Removal</h3>
          <p class="text-medium-emphasis">
            Are you sure you want to delete this vehicle listing? This action cannot be undone.
          </p>
        </VCardText>
        <VCardActions class="justify-center gap-4">
          <VBtn variant="text" @click="deleteDialog = false" class="px-6">Keep it</VBtn>
          <VBtn color="error" :loading="deleting" @click="handleDelete" variant="elevated" class="px-8 rounded-lg">
            Delete Car
          </VBtn>
        </VCardActions>
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

.stat-card {
  border-radius: 16px !important;
  position: relative;
  transition: transform 0.3s ease;
  border: 1px solid rgba(var(--v-border-color), 0.05);
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 100px;
  height: 100px;
  filter: blur(40px);
  opacity: 0.15;
  border-radius: 50%;
}

.main-content-card {
  border-radius: 20px !important;
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(10px);
}

.max-width-400 {
  max-width: 400px;
}

.modern-table :deep(thead) {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.modern-table :deep(th) {
  height: 56px !important;
}

.table-row-hover {
  transition: background-color 0.2s ease;
}

.table-row-hover:hover {
  background-color: rgba(var(--v-theme-primary), 0.03);
}

.promotion-dialog-card {
  border-radius: 24px !important;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.scrollable-content {
  overflow-y: auto;
  flex-grow: 1;
}

/* Custom Scrollbar for better aesthetics */
.scrollable-content::-webkit-scrollbar {
  width: 6px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.2);
  border-radius: 10px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.4);
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
  border: 1px solid rgba(var(--v-border-color), 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.promotion-item.active {
  border-color: var(--v-primary-base);
  background-color: rgba(var(--v-theme-primary), 0.05);
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

.border-primary {
  border: 2px solid rgba(var(--v-theme-primary), 0.3) !important;
}
</style>
