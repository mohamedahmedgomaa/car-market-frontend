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

const fetchSellers = async (page = 1) => {
  loading.value = true
  try {
    const res = await sellerAdminApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
    })
    sellers.value = res.data.data
    currentPage.value = res.data.meta.currentPage
    lastPage.value = res.data.meta.lastPage
    total.value = res.data.meta.total
  } catch (err) {
    console.error('Fetch sellers failed:', err.response?.data || err.message)
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
    sellers.value = sellers.value.filter(s => s.id !== selectedSeller.value.id)
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

watch(search, () => fetchSellers(1))
onMounted(() => fetchSellers())

const stats = computed(() => [
  { title: 'Total Sellers', value: total.value, icon: 'tabler-user-dollar', color: 'primary' },
  { title: 'Verified', value: sellers.value.filter(s => s.is_verified).length, icon: 'tabler-circle-check', color: 'success' },
  { title: 'Active Listings', value: sellers.value.reduce((acc, s) => acc + (s.cars_count || 0), 0), icon: 'tabler-car', color: 'info' },
])
</script>

<template>
  <div class="admin-sellers-page pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Seller Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage car dealers, showrooms, and individual sellers</p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        size="large"
        class="elevation-4"
        @click="$router.push('/admin/sellers/create')"
      >
        Register Seller
      </VBtn>
    </div>

    <!-- Quick Stats -->
    <VRow class="mb-8">
      <VCol v-for="stat in stats" :key="stat.title" cols="12" sm="4">
        <VCard class="stat-card" elevation="1">
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

    <!-- Table Card -->
    <VCard class="main-card elevation-2 overflow-hidden">
      <VCardTitle class="px-6 py-4 d-flex align-center gap-4">
        <VTextField
          v-model="search"
          placeholder="Search by name, email or store..."
          variant="solo-filled"
          density="comfortable"
          prepend-inner-icon="tabler-search"
          class="max-width-400"
          hide-details
          flat
        />
        <VSpacer />
        <VBtn icon variant="text" @click="fetchSellers(currentPage)">
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VTable class="modern-table">
        <thead>
          <tr>
            <th class="text-uppercase text-caption font-weight-bold">Seller / Store</th>
            <th class="text-uppercase text-caption font-weight-bold">Contact Details</th>
            <th class="text-uppercase text-caption font-weight-bold text-center">Verification</th>
            <th class="text-uppercase text-caption font-weight-bold text-center">Status</th>
            <th class="text-uppercase text-caption font-weight-bold text-end px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" v-for="i in 5" :key="i">
            <td colspan="5"><VSkeletonLoader type="table-row" /></td>
          </tr>
          <tr v-else v-for="seller in sellers" :key="seller.id" class="table-row-hover">
            <td>
              <div class="d-flex align-center py-3">
                <VAvatar size="50" rounded="lg" class="me-4 border">
                  <VImg v-if="seller.store_logo" :src="seller.store_logo" cover />
                  <VIcon v-else icon="tabler-building-store" />
                </VAvatar>
                <div>
                  <div class="text-body-1 font-weight-bold">{{ seller.name }}</div>
                  <div class="text-caption text-primary font-weight-medium">
                    {{ seller.store_name?.en || seller.store_name || 'Individual' }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="text-body-2 font-weight-medium">{{ seller.email }}</div>
              <div class="text-caption text-medium-emphasis">{{ seller.phone || 'No phone' }}</div>
            </td>
            <td class="text-center">
              <VChip
                :color="seller.is_verified ? 'success' : 'warning'"
                size="small"
                variant="tonal"
                class="font-weight-bold"
                prepend-icon="tabler-shield-check"
              >
                {{ seller.is_verified ? 'Verified' : 'Pending' }}
              </VChip>
            </td>
            <td class="text-center">
              <VSwitch
                :model-value="!!seller.is_active"
                color="success"
                inset
                hide-details
                @change="toggleActive(seller)"
                class="d-inline-flex"
              />
            </td>
            <td class="text-end px-6">
              <div class="d-flex justify-end gap-1">
                <VBtn icon variant="tonal" color="primary" size="small" @click="handleEdit(seller.id)">
                  <VIcon icon="tabler-edit" />
                </VBtn>
                <VBtn icon variant="tonal" color="error" size="small" @click="confirmDelete(seller)">
                  <VIcon icon="tabler-trash" />
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VDivider />

      <div class="pa-4 d-flex align-center justify-space-between">
        <div class="text-caption text-medium-emphasis">
          Showing {{ (currentPage - 1) * perPage + 1 }} - {{ Math.min(currentPage * perPage, total) }} of {{ total }} sellers
        </div>
        <VPagination
          v-model="currentPage"
          :length="lastPage"
          :total-visible="5"
          rounded="lg"
          size="small"
          @update:model-value="fetchSellers"
        />
      </div>
    </VCard>

    <!-- Delete Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard class="pa-4 rounded-xl text-center">
        <VCardText>
          <VAvatar color="error" variant="tonal" size="72" class="mb-4">
            <VIcon icon="tabler-trash-x" size="40" />
          </VAvatar>
          <h3 class="text-h5 font-weight-bold mb-2">Remove Seller?</h3>
          <p class="text-medium-emphasis">Are you sure you want to delete <strong>{{ selectedSeller?.name }}</strong>? This action cannot be reversed.</p>
        </VCardText>
        <VCardActions class="justify-center gap-4">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" variant="elevated" :loading="deleting" @click="handleDelete" class="px-8">Delete Seller</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.gradient-text {
  background: linear-gradient(135deg, #1867c0 0%, #5cbbf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-card {
  border-radius: 16px !important;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.main-card {
  border-radius: 20px !important;
}

.max-width-400 {
  max-width: 400px;
}

.modern-table :deep(th) {
  height: 56px !important;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.table-row-hover:hover {
  background-color: rgba(var(--v-theme-primary), 0.03);
}
</style>
