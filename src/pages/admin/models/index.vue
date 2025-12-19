<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import modelAdminApi from '../../../api/admin/modelAdminApi.js'
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
const selectedSeller = ref(null)
const deleting = ref(false)

const fetchLists = async (page = 1) => {
  loading.value = true
  try {
    const res = await modelAdminApi.getAll({
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

const confirmDelete = (data) => {
  selectedSeller.value = data
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedSeller.value) return
  deleting.value = true
  try {
    await modelAdminApi.delete(selectedSeller.value.id)
    lists.value = lists.value.filter(s => s.id !== selectedSeller.value.id)
    total.value -= 1
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/admin/models/edit/${id}`)

const toggleActive = async (data) => {
  try {
    data.is_active = data.is_active ? 0 : 1
    await modelAdminApi.update(data.id, { is_active: data.is_active })
  } catch (err) {
    console.error('Toggle failed:', err.response?.data || err.message)
  }
}

watch(search, () => fetchLists(1))
onMounted(() => fetchLists())

const showingText = computed(() => {
  const start = (currentPage.value - 1) * perPage + 1
  const end = Math.min(currentPage.value * perPage, total.value)
  return total.value
    ? `Showing ${start} to ${end} of ${total.value} entries`
    : 'Showing 0 to 0 of 0 entries'
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-semibold text-gray-100">Models List</h2>

      <VBtn
        color="primary"
        class="rounded-lg font-medium text-white px-5 py-2 flex items-center gap-2"
        @click="$router.push('/admin/models/create')"
      >
        <VIcon icon="tabler-plus" start />
        Add New Model
      </VBtn>
    </div>

    <div class="mb-6">
      <VTextField
        v-model="search"
        placeholder="Search by name ..."
        density="comfortable"
        variant="outlined"
        color="primary"
        hide-details
        prepend-inner-icon="tabler-search"
        class="w-full max-w-sm"
      />
    </div>

    <VTable v-if="!loading">
      <!-- إضافة رأس العمود -->
      <thead>
      <tr>
        <th>ID</th>
        <th>Brand</th>
        <th>Name Ar</th>
        <th>Name En</th>
        <th class="text-center">Actions</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="data in lists" :key="data.id">
        <td>{{ data.id }}</td>
        <td>{{ data.brand.name?.en }}</td>

        <td>{{ data.name?.ar || data.name || '-' }}</td>
        <td>{{ data.name?.en || data.name || '-' }}</td>

        <td class="text-center">
          <VBtn icon @click="handleEdit(data.id)">
            <VIcon icon="tabler-edit" />
          </VBtn>
          <VBtn icon color="error" @click="confirmDelete(data)">
            <VIcon icon="tabler-trash" />
          </VBtn>
        </td>
      </tr>
      </tbody>

    </VTable>

    <div v-else class="text-center py-4">Loading...</div>

    <!-- Confirm Delete -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-lg font-semibold text-center text-gray-800">
          Confirm Delete
        </VCardTitle>
        <VCardText class="text-center text-gray-600">
          Are you sure you want to delete
          <strong>{{ selectedSeller?.name }}</strong>?
        </VCardText>

        <VCardActions class="justify-center gap-2 pb-4">
          <VBtn variant="tonal" color="grey" @click="deleteDialog = false">
            Cancel
          </VBtn>
          <VBtn color="error" :loading="deleting" @click="handleDelete">
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
      <div class="text-sm text-gray-500">{{ showingText }}</div>

      <div class="flex items-center gap-1">
        <VBtn
          icon
          size="small"
          :disabled="currentPage === 1"
          @click="fetchLists(currentPage - 1)"
        >
          <VIcon icon="tabler-chevron-left" />
        </VBtn>

        <template v-for="page in lastPage" :key="page">
          <VBtn
            size="small"
            :color="page === currentPage ? 'primary' : ''"
            variant="outlined"
            @click="fetchLists(page)"
          >
            {{ page }}
          </VBtn>
        </template>

        <VBtn
          icon
          size="small"
          :disabled="currentPage === lastPage"
          @click="fetchLists(currentPage + 1)"
        >
          <VIcon icon="tabler-chevron-right" />
        </VBtn>
      </div>
    </div>
  </div>
</template>
