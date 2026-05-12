<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import userAdminApi from '../../../api/admin/userAdminApi.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const lists = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

const deleteDialog = ref(false)
const selectedData = ref(null)
const deleting = ref(false)

const fetchLists = async (page = 1) => {
  loading.value = true
  try {
    const res = await userAdminApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
    })
    lists.value = res.data.data
    currentPage.value = res.data.meta.currentPage
    lastPage.value = res.data.meta.lastPage
    total.value = res.data.meta.total
  } catch (err) {
    console.error('Fetch lists failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (admin) => {
  selectedData.value = admin
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedData.value) return
  deleting.value = true
  try {
    await userAdminApi.delete(selectedData.value.id)
    lists.value = lists.value.filter(a => a.id !== selectedData.value.id)
    total.value -= 1
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/admin/users/edit/${id}`)

const toggleActive = async (data) => {
  try {
    const newVal = data.is_active ? 0 : 1
    await userAdminApi.update(data.id, { is_active: newVal })
    data.is_active = newVal
  } catch (err) {
    console.error('Toggle failed:', err.response?.data || err.message)
  }
}

watch(search, () => fetchLists(1))
onMounted(() => fetchLists())

const stats = computed(() => [
  { title: 'Total Users', value: total.value, icon: 'tabler-users', color: 'primary' },
  { title: 'Active', value: lists.value.filter(u => u.is_active).length, icon: 'tabler-user-check', color: 'success' },
  { title: 'Inactive', value: lists.value.filter(u => !u.is_active).length, icon: 'tabler-user-off', color: 'error' },
])
</script>

<template>
  <div class="admin-users-page pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">User Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">View and manage all registered platform users</p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        size="large"
        class="elevation-4"
        @click="$router.push('/admin/users/create')"
      >
        Add New User
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
          placeholder="Search by name, email or phone..."
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
            <th class="text-uppercase text-caption font-weight-bold">User Info</th>
            <th class="text-uppercase text-caption font-weight-bold">Contact</th>
            <th class="text-uppercase text-caption font-weight-bold text-center">Status</th>
            <th class="text-uppercase text-caption font-weight-bold text-end px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" v-for="i in 5" :key="i">
            <td colspan="4"><VSkeletonLoader type="table-row" /></td>
          </tr>
          <tr v-else v-for="user in lists" :key="user.id" class="table-row-hover">
            <td>
              <div class="d-flex align-center py-3">
                <VAvatar size="40" color="primary" variant="tonal" class="me-3">
                  <span class="text-h6">{{ user.name?.charAt(0).toUpperCase() }}</span>
                </VAvatar>
                <div>
                  <div class="text-body-1 font-weight-bold">{{ user.name }}</div>
                  <div class="text-caption text-medium-emphasis">ID: #{{ user.id }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="text-body-2 font-weight-medium">{{ user.email }}</div>
              <div class="text-caption text-medium-emphasis">{{ user.phone || 'No phone' }}</div>
            </td>
            <td class="text-center">
              <VChip
                :color="user.is_active ? 'success' : 'error'"
                size="small"
                variant="flat"
                class="font-weight-bold text-uppercase px-3"
                @click="toggleActive(user)"
              >
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </VChip>
            </td>
            <td class="text-end px-6">
              <div class="d-flex justify-end gap-1">
                <VBtn icon variant="tonal" color="primary" size="small" @click="handleEdit(user.id)">
                  <VIcon icon="tabler-edit" />
                </VBtn>
                <VBtn icon variant="tonal" color="error" size="small" @click="confirmDelete(user)">
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
          Showing {{ (currentPage - 1) * perPage + 1 }} - {{ Math.min(currentPage * perPage, total) }} of {{ total }} users
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

    <!-- Delete Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard class="pa-4 rounded-xl text-center">
        <VCardText>
          <VAvatar color="error" variant="tonal" size="72" class="mb-4">
            <VIcon icon="tabler-trash-x" size="40" />
          </VAvatar>
          <h3 class="text-h5 font-weight-bold mb-2">Remove User?</h3>
          <p class="text-medium-emphasis">Are you sure you want to delete <strong>{{ selectedData?.name }}</strong>? This cannot be undone.</p>
        </VCardText>
        <VCardActions class="justify-center gap-4">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" variant="elevated" :loading="deleting" @click="handleDelete" class="px-8">Delete User</VBtn>
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
