<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import adminsApi from '../../../api/adminApi.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const admins = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

// 🟢 بيانات خاصة بالمودال
const deleteDialog = ref(false)
const selectedAdmin = ref(null)
const deleting = ref(false)

const fetchAdmins = async (page = 1) => {
  loading.value = true
  try {
    const res = await adminsApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
    })
    admins.value = res.data.data
    currentPage.value = res.data.meta.currentPage
    lastPage.value = res.data.meta.lastPage
    total.value = res.data.meta.total
  } catch (err) {
    console.error('Fetch admins failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

// 🟢 فتح مودال الحذف
const confirmDelete = (admin) => {
  selectedAdmin.value = admin
  deleteDialog.value = true
}

// 🟢 تنفيذ الحذف بعد التأكيد من المودال
const handleDelete = async () => {
  if (!selectedAdmin.value) return
  deleting.value = true
  try {
    await adminsApi.delete(selectedAdmin.value.id)
    admins.value = admins.value.filter(a => a.id !== selectedAdmin.value.id)
    total.value -= 1
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/admin/admins/edit/${id}`)

const toggleActive = async (admin) => {
  try {
    admin.is_active = admin.is_active ? 0 : 1
    await adminsApi.update(admin.id, { is_active: admin.is_active })
  } catch (err) {
    console.error('Toggle failed:', err.response?.data || err.message)
  }
}

watch(search, () => fetchAdmins(1))
onMounted(() => fetchAdmins())

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
      <h2 class="text-2xl font-semibold text-gray-100">Admins List</h2>

      <VBtn
        color="primary"
        class="rounded-lg font-medium text-white px-5 py-2 flex items-center gap-2"
        @click="$router.push('/admin/admins/create')"
      >
        <VIcon icon="tabler-plus" start />
        Add New
      </VBtn>
    </div>

    <div class="mb-6">
      <VTextField
        v-model="search"
        placeholder="Search by name or email..."
        density="comfortable"
        variant="outlined"
        color="primary"
        hide-details
        prepend-inner-icon="tabler-search"
        class="w-full max-w-sm"
      />
    </div>

    <VTable v-if="!loading">
      <thead>
      <tr>
        <th class="w-16">ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Status</th>
        <th class="text-center w-32">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="admin in admins" :key="admin.id">
        <td>{{ admin.id }}</td>
        <td>{{ admin.name }}</td>
        <td>{{ admin.email }}</td>
        <td>{{ admin.phone || '-' }}</td>
        <td class="text-center">
          <VSwitch
            :model-value="!!admin.is_active"
            color="success"
            inset
            hide-details
            @change="toggleActive(admin)"
          />
        </td>
        <td class="text-center">
          <VBtn icon @click="handleEdit(admin.id)">
            <VIcon icon="tabler-edit" />
          </VBtn>
          <VBtn icon color="error" @click="confirmDelete(admin)">
            <VIcon icon="tabler-trash" />
          </VBtn>
        </td>
      </tr>
      </tbody>
    </VTable>

    <div v-else class="text-center py-4">Loading...</div>

    <!-- 🟥 مودال تأكيد الحذف -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-lg font-semibold text-center text-gray-800">
          Confirm Delete
        </VCardTitle>
        <VCardText class="text-center text-gray-600">
          Are you sure you want to delete
          <strong>{{ selectedAdmin?.name }}</strong>?
        </VCardText>

        <VCardActions class="justify-center gap-2 pb-4">
          <VBtn
            variant="tonal"
            color="grey"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            :loading="deleting"
            @click="handleDelete"
          >
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
          @click="fetchAdmins(currentPage - 1)"
        >
          <VIcon icon="tabler-chevron-left" />
        </VBtn>

        <template v-for="page in lastPage" :key="page">
          <VBtn
            size="small"
            :color="page === currentPage ? 'primary' : ''"
            variant="outlined"
            @click="fetchAdmins(page)"
          >
            {{ page }}
          </VBtn>
        </template>

        <VBtn
          icon
          size="small"
          :disabled="currentPage === lastPage"
          @click="fetchAdmins(currentPage + 1)"
        >
          <VIcon icon="tabler-chevron-right" />
        </VBtn>
      </div>
    </div>
  </div>
</template>
