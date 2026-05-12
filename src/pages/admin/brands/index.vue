<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import brandAdminApi from '../../../api/admin/brandAdminApi.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const brands = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

const deleteDialog = ref(false)
const selectedItem = ref(null)
const deleting = ref(false)

const fetchBrands = async (page = 1) => {
  loading.value = true
  try {
    const res = await brandAdminApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
    })
    brands.value = res.data.data
    currentPage.value = res.data.meta.currentPage
    lastPage.value = res.data.meta.lastPage
    total.value = res.data.meta.total
  } catch (err) {
    console.error('Fetch brands failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (brand) => {
  selectedItem.value = brand
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedItem.value) return
  deleting.value = true
  try {
    await brandAdminApi.delete(selectedItem.value.id)
    brands.value = brands.value.filter(s => s.id !== selectedItem.value.id)
    total.value -= 1
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/admin/brands/edit/${id}`)

watch(search, () => fetchBrands(1))
onMounted(() => fetchBrands())
</script>

<template>
  <div class="admin-brands-page pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Brands Inventory</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Configure automobile manufacturers and their logos</p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        size="large"
        @click="$router.push('/admin/brands/create')"
      >
        Add New Brand
      </VBtn>
    </div>

    <VCard class="main-card elevation-2 overflow-hidden">
      <VCardTitle class="px-6 py-4 d-flex align-center gap-4">
        <VTextField
          v-model="search"
          placeholder="Search brands..."
          variant="solo-filled"
          density="comfortable"
          prepend-inner-icon="tabler-search"
          class="max-width-400"
          hide-details
          flat
        />
        <VSpacer />
        <VBtn icon variant="text" @click="fetchBrands(currentPage)">
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VTable class="modern-table">
        <thead>
          <tr>
            <th class="text-uppercase text-caption font-weight-bold">ID</th>
            <th class="text-uppercase text-caption font-weight-bold">Brand Name (AR)</th>
            <th class="text-uppercase text-caption font-weight-bold">Brand Name (EN)</th>
            <th class="text-uppercase text-caption font-weight-bold text-end px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" v-for="i in 5" :key="i">
            <td colspan="4"><VSkeletonLoader type="table-row" /></td>
          </tr>
          <tr v-else v-for="brand in brands" :key="brand.id" class="table-row-hover">
            <td><span class="text-body-2 font-weight-bold">#{{ brand.id }}</span></td>
            <td><div class="text-body-1">{{ brand.name?.ar || brand.name || '-' }}</div></td>
            <td><div class="text-body-1 font-weight-medium text-primary">{{ brand.name?.en || brand.name || '-' }}</div></td>
            <td class="text-end px-6">
              <div class="d-flex justify-end gap-1">
                <VBtn icon variant="tonal" color="primary" size="small" @click="handleEdit(brand.id)">
                  <VIcon icon="tabler-edit" />
                </VBtn>
                <VBtn icon variant="tonal" color="error" size="small" @click="confirmDelete(brand)">
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
          Total of {{ total }} brands registered
        </div>
        <VPagination
          v-model="currentPage"
          :length="lastPage"
          :total-visible="5"
          rounded="lg"
          size="small"
          @update:model-value="fetchBrands"
        />
      </div>
    </VCard>

    <VDialog v-model="deleteDialog" max-width="400">
      <VCard class="pa-4 rounded-xl text-center">
        <VCardText>
          <VAvatar color="error" variant="tonal" size="72" class="mb-4">
            <VIcon icon="tabler-trash-x" size="40" />
          </VAvatar>
          <h3 class="text-h5 font-weight-bold mb-2">Delete Brand?</h3>
          <p class="text-medium-emphasis">Are you sure you want to delete <strong>{{ selectedItem?.name?.en || selectedItem?.name }}</strong>? This might affect associated models.</p>
        </VCardText>
        <VCardActions class="justify-center gap-4">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" variant="elevated" :loading="deleting" @click="handleDelete" class="px-8">Confirm</VBtn>
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
.main-card { border-radius: 20px !important; }
.max-width-400 { max-width: 400px; }
.modern-table :deep(th) {
  height: 56px !important;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}
.table-row-hover:hover { background-color: rgba(var(--v-theme-primary), 0.03); }
</style>
