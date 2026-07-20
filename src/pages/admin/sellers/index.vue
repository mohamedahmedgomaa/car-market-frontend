<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import sellerAdminApi from '../../../api/admin/sellerAdminApi.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const sellers = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

const deleteDialog = ref(false)
const selectedSeller = ref(null)
const deleting = ref(false)

// We pass `sort: '-sort_order'` to bypass the backend default sort bug
const fetchSellers = async (page = 1) => {
  loading.value = true
  try {
    const res = await sellerAdminApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
      sort: '-sort_order', // This bypasses the SQL column issue on the backend without needing a deploy!
    })
    sellers.value = res.data?.data || []
    currentPage.value = res.data?.meta?.currentPage || 1
    lastPage.value = res.data?.meta?.lastPage || 1
    total.value = res.data?.meta?.total || 0
  } catch (err) {
    console.error('Fetch sellers failed:', err.response?.data || err.message)
    sellers.value = []
  } finally {
    loading.value = false
  }
}

const confirmDelete = (seller) => {
  selectedSeller.value = seller
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedSeller.value) return
  deleting.value = true
  try {
    await sellerAdminApi.delete(selectedSeller.value.id)
    sellers.value = sellers.value.filter((s) => s.id !== selectedSeller.value.id)
    total.value -= 1
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/admin/sellers/edit/${id}`)

const toggleActive = async (seller) => {
  try {
    const newVal = seller.is_active ? 0 : 1
    await sellerAdminApi.update(seller.id, { is_active: newVal })
    seller.is_active = newVal
  } catch (err) {
    console.error('Toggle failed:', err.response?.data || err.message)
  }
}

watch(search, () => {
  // Debounce could be added here, but direct works for now
  fetchSellers(1)
})

onMounted(() => fetchSellers())

const stats = computed(() => [
  { 
    title: 'Total Sellers', 
    value: total.value, 
    icon: 'tabler-users-group', 
    color: '#FF6F00',
    bg: 'linear-gradient(135deg, rgba(255,111,0,0.1) 0%, rgba(255,111,0,0.02) 100%)'
  },
  {
    title: 'Verified Partners',
    value: sellers.value.filter((s) => s.is_verified).length,
    icon: 'tabler-shield-check-filled',
    color: '#00C853',
    bg: 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, rgba(0,200,83,0.02) 100%)'
  },
  {
    title: 'Active Showrooms',
    value: sellers.value.filter((s) => s.is_active).length,
    icon: 'tabler-building-store',
    color: '#2962FF',
    bg: 'linear-gradient(135deg, rgba(41,98,255,0.1) 0%, rgba(41,98,255,0.02) 100%)'
  },
])
</script>

<template>
  <div class="sellers-dashboard pa-4 pa-md-8">
    <!-- Header Section -->
    <div class="d-flex flex-column flex-md-row align-center justify-space-between mb-8 gap-4">
      <div class="text-center text-md-left">
        <h1 class="text-h3 font-weight-black mb-2 premium-gradient-text">
          Sellers Network
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          Manage and monitor all your automotive partners globally.
        </p>
      </div>
      <VBtn
        color="warning"
        prepend-icon="tabler-plus"
        size="x-large"
        class="premium-btn text-none px-8"
        elevation="4"
        rounded="pill"
        @click="$router.push('/admin/sellers/create')"
      >
        <span class="font-weight-bold">Register Seller</span>
      </VBtn>
    </div>

    <!-- Quick Stats -->
    <VRow class="mb-8" dense>
      <VCol v-for="stat in stats" :key="stat.title" cols="12" md="4">
        <VCard class="glass-stat-card border" elevation="0" :style="{ background: stat.bg }">
          <VCardText class="d-flex align-center pa-6">
            <div class="icon-wrapper" :style="{ color: stat.color }">
              <VIcon :icon="stat.icon" size="36" />
            </div>
            <div class="ml-5">
              <div class="text-caption text-uppercase font-weight-bold opacity-80 tracking-widest" :style="{ color: stat.color }">
                {{ stat.title }}
              </div>
              <div class="text-h4 font-weight-black mt-1 text-high-emphasis">
                {{ stat.value }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Main Table Container -->
    <VCard class="premium-table-card border overflow-hidden" elevation="0">
      <!-- Toolbar -->
      <div class="d-flex flex-wrap align-center px-6 py-5 gap-4 border-b bg-surface">
        <VTextField
          v-model="search"
          placeholder="Search partners by name, store, or email..."
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="tabler-search"
          class="search-input flex-grow-1 max-width-500"
          hide-details
          bg-color="transparent"
          rounded="pill"
        />
        <VSpacer />
        <VBtn
          icon
          variant="tonal"
          color="primary"
          class="refresh-btn"
          @click="fetchSellers(currentPage)"
          :loading="loading"
        >
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </div>

      <!-- Table -->
      <VTable class="premium-table bg-surface">
        <thead>
          <tr>
            <th class="text-uppercase text-caption font-weight-bold tracking-widest text-medium-emphasis">Partner Info</th>
            <th class="text-uppercase text-caption font-weight-bold tracking-widest text-medium-emphasis">Contact Hub</th>
            <th class="text-uppercase text-caption font-weight-bold tracking-widest text-medium-emphasis text-center">Trust Status</th>
            <th class="text-uppercase text-caption font-weight-bold tracking-widest text-medium-emphasis text-center">Visibility</th>
            <th class="text-uppercase text-caption font-weight-bold tracking-widest text-medium-emphasis text-end px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading State -->
          <template v-if="loading">
            <tr v-for="i in 5" :key="`skel-${i}`" class="skel-row">
              <td colspan="5" class="pa-0">
                <VSkeletonLoader type="table-row" class="bg-transparent" />
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else-if="sellers.length === 0">
            <td colspan="5" class="text-center py-16">
              <VIcon icon="tabler-users-slash" size="64" color="disabled" class="mb-4" />
              <h3 class="text-h6 font-weight-bold text-medium-emphasis">No Sellers Found</h3>
              <p class="text-body-2 text-disabled mt-1">Try adjusting your search or register a new seller.</p>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr v-else v-for="seller in sellers" :key="seller.id" class="data-row transition-swing">
            <td class="py-4">
              <div class="d-flex align-center">
                <VAvatar size="56" rounded="xl" class="premium-avatar me-4 border elevation-1">
                  <VImg v-if="seller.store_logo" :src="seller.store_logo" cover />
                  <VIcon v-else icon="tabler-building-store" size="28" color="primary" />
                </VAvatar>
                <div>
                  <div class="text-body-1 font-weight-bold text-high-emphasis mb-1">{{ seller.name }}</div>
                  <div class="text-caption font-weight-medium text-warning d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-briefcase" size="14" />
                    {{ seller.store_name?.en || seller.store_name || 'Individual Seller' }}
                  </div>
                  <!-- Tier Badge display in list -->
                  <VChip
                    v-if="seller.tier && seller.tier !== 'none'"
                    size="x-small"
                    :color="seller.tier === 'silver' ? 'grey-lighten-1' : seller.tier === 'gold' ? 'warning' : 'blue-darken-1'"
                    class="font-weight-bold text-uppercase elevation-1"
                  >
                    {{ seller.tier === 'silver' ? 'Silver' : seller.tier === 'gold' ? 'Gold' : 'Platinum' }}
                  </VChip>
                </div>
              </div>
            </td>
            <td>
              <div class="d-flex flex-column gap-1">
                <div class="text-body-2 font-weight-medium d-flex align-center gap-2">
                  <VIcon icon="tabler-mail" size="16" class="text-medium-emphasis" />
                  {{ seller.email }}
                </div>
                <div class="text-caption text-medium-emphasis d-flex align-center gap-2">
                  <VIcon icon="tabler-phone" size="16" />
                  {{ seller.phone || 'No phone provided' }}
                </div>
              </div>
            </td>
            <td class="text-center">
              <VChip
                :color="seller.is_verified ? 'success' : 'grey'"
                size="small"
                :variant="seller.is_verified ? 'flat' : 'tonal'"
                class="font-weight-bold px-4"
                :prepend-icon="seller.is_verified ? 'tabler-shield-check-filled' : 'tabler-shield'"
              >
                {{ seller.is_verified ? 'Verified' : 'Unverified' }}
              </VChip>
            </td>
            <td class="text-center">
              <VSwitch
                :model-value="!!seller.is_active"
                color="warning"
                inset
                hide-details
                density="compact"
                class="d-inline-flex modern-switch"
                @change="toggleActive(seller)"
              />
            </td>
            <td class="text-end px-6">
              <div class="d-flex justify-end gap-2">
                <VBtn
                  icon
                  variant="tonal"
                  color="primary"
                  size="small"
                  class="action-btn"
                  @click="handleEdit(seller.id)"
                >
                  <VIcon icon="tabler-edit" />
                  <VTooltip activator="parent" location="top">Edit Partner</VTooltip>
                </VBtn>
                <VBtn
                  icon
                  variant="tonal"
                  color="error"
                  size="small"
                  class="action-btn"
                  @click="confirmDelete(seller)"
                >
                  <VIcon icon="tabler-trash" />
                  <VTooltip activator="parent" location="top">Remove Partner</VTooltip>
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VDivider />

      <!-- Pagination Footer -->
      <div class="px-6 py-4 d-flex flex-column flex-md-row align-center justify-space-between gap-4 bg-surface-variant-light">
        <div class="text-caption font-weight-medium text-medium-emphasis">
          Showing <span class="text-high-emphasis font-weight-bold">{{ Math.min((currentPage - 1) * perPage + 1, total) }}</span> 
          to <span class="text-high-emphasis font-weight-bold">{{ Math.min(currentPage * perPage, total) }}</span> 
          of <span class="text-high-emphasis font-weight-bold">{{ total }}</span> partners
        </div>
        <VPagination
          v-model="currentPage"
          :length="lastPage"
          :total-visible="5"
          rounded="circle"
          active-color="warning"
          elevation="0"
          class="premium-pagination"
          @update:model-value="fetchSellers"
        />
      </div>
    </VCard>

    <!-- Sleek Delete Dialog -->
    <VDialog v-model="deleteDialog" max-width="450" transition="dialog-bottom-transition">
      <VCard class="pa-6 rounded-xl text-center glass-dialog">
        <VCardText class="pa-0">
          <div class="danger-icon-wrapper mx-auto mb-6">
            <VIcon icon="tabler-alert-triangle-filled" size="48" color="error" />
          </div>
          <h3 class="text-h5 font-weight-black mb-3">Revoke Access?</h3>
          <p class="text-body-1 text-medium-emphasis mb-6">
            You are about to permanently remove <strong class="text-high-emphasis">{{ selectedSeller?.name }}</strong> from the network. This action cannot be undone.
          </p>
        </VCardText>
        <VCardActions class="justify-center gap-4 pa-0">
          <VBtn 
            variant="tonal" 
            color="grey-darken-1" 
            size="large" 
            rounded="pill" 
            class="px-6 text-none font-weight-bold"
            @click="deleteDialog = false"
          >
            Keep Partner
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            size="large"
            rounded="pill"
            class="px-8 text-none font-weight-bold elevation-4"
            :loading="deleting"
            @click="handleDelete"
          >
            Yes, Remove
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.sellers-dashboard {
  max-width: 1440px;
  margin: 0 auto;
}

/* Typography Enhancements */
.premium-gradient-text {
  background: linear-gradient(135deg, #FF6F00 0%, #FFCA28 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  letter-spacing: -0.5px;
}

.tracking-widest {
  letter-spacing: 0.1em;
}

/* Premium Buttons */
.premium-btn {
  background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.premium-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(255, 111, 0, 0.5) !important;
}

/* Glass Stat Cards */
.glass-stat-card {
  border-radius: 24px !important;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05) !important;
}
.glass-stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px -10px rgba(0,0,0,0.1) !important;
}
.icon-wrapper {
  background: rgba(var(--v-theme-surface), 0.5);
  padding: 16px;
  border-radius: 18px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

/* Modern Table Layout */
.premium-table-card {
  border-radius: 24px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05) !important;
}
.search-input {
  max-width: 450px;
}
.search-input :deep(.v-field) {
  border-radius: 100px !important;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.premium-table {
  background: transparent !important;
}
.premium-table :deep(th) {
  background-color: rgba(var(--v-theme-on-surface), 0.02) !important;
  height: 64px !important;
  font-size: 0.75rem !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}
.premium-table :deep(td) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04) !important;
}

/* Row Interactions */
.data-row {
  transition: all 0.2s ease;
}
.data-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.02);
  transform: scale(1.001);
}

.premium-avatar {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

/* Action Buttons */
.action-btn {
  transition: transform 0.2s ease, background 0.2s ease;
}
.action-btn:hover {
  transform: scale(1.1);
}

/* Modern Switch */
.modern-switch :deep(.v-switch__track) {
  opacity: 0.2;
}

/* Pagination */
.bg-surface-variant-light {
  background: rgba(var(--v-theme-on-surface), 0.01);
}
.premium-pagination :deep(.v-pagination__item) {
  box-shadow: none !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.premium-pagination :deep(.v-pagination__item--is-active) {
  border-color: transparent;
  box-shadow: 0 4px 15px -3px rgba(var(--v-theme-warning), 0.4) !important;
}

/* Dialog */
.glass-dialog {
  backdrop-filter: blur(20px);
  background: rgba(var(--v-theme-surface), 0.95) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.danger-icon-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--v-theme-error), 0.15) 0%, rgba(var(--v-theme-error), 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
