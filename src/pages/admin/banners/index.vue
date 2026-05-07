<script setup>
import { ref, onMounted } from 'vue'
import bannerAdminApi from '../../../api/admin/bannerAdminApi.js'

const banners = ref([])
const loading = ref(false)

const deleteDialog = ref(false)
const selectedBanner = ref(null)
const deleting = ref(false)

const createDialog = ref(false)
const creating = ref(false)
const selectedFile = ref(null)

const fetchBanners = async () => {
  loading.value = true
  try {
    const res = await bannerAdminApi.getAll()
    banners.value = res.data.data
  } catch (err) {
    console.error('Fetch banners failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (banner) => {
  selectedBanner.value = banner
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedBanner.value) return
  deleting.value = true
  try {
    await bannerAdminApi.delete(selectedBanner.value.id)
    banners.value = banners.value.filter(s => s.id !== selectedBanner.value.id)
    deleteDialog.value = false
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleCreate = async () => {
  if (!selectedFile.value) return
  creating.value = true
  try {
    const fd = new FormData()
    fd.append('image', selectedFile.value[0])
    
    await bannerAdminApi.create(fd)
    createDialog.value = false
    selectedFile.value = null
    fetchBanners()
  } catch (err) {
    console.error('Create failed:', err.response?.data || err.message)
  } finally {
    creating.value = false
  }
}

const toggleActive = async (banner) => {
  try {
    const newStatus = !banner.is_active
    await bannerAdminApi.update(banner.id, { is_active: newStatus })
    banner.is_active = newStatus
  } catch (err) {
    console.error('Toggle failed:', err.response?.data || err.message)
  }
}

onMounted(() => fetchBanners())
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-semibold text-gray-100">إعلانات الصفحة الرئيسية</h2>

      <VBtn
        color="primary"
        class="rounded-lg font-medium text-white px-5 py-2 flex items-center gap-2"
        @click="createDialog = true"
      >
        <VIcon icon="tabler-plus" start />
        إضافة إعلان
      </VBtn>
    </div>

    <VTable v-if="!loading">
      <thead>
      <tr>
        <th>ID</th>
        <th>Image</th>
        <th>Status</th>
        <th class="text-center">Actions</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="banner in banners" :key="banner.id">
        <td>{{ banner.id }}</td>

        <td>
          <img :src="banner.image_path" style="max-height: 80px; border-radius: 8px; margin: 8px 0;" alt="banner" />
        </td>

        <td>
          <VSwitch
            v-model="banner.is_active"
            color="success"
            hide-details
            @change="toggleActive(banner)"
          />
        </td>

        <td class="text-center">
          <VBtn icon color="error" @click="confirmDelete(banner)">
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
          Are you sure you want to delete this banner?
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

    <!-- Create Dialog -->
    <VDialog v-model="createDialog" max-width="500">
      <VCard>
        <VCardTitle class="text-lg font-semibold text-center mt-4">
          رفع إعلان جديد
        </VCardTitle>
        <VCardText>
          <p class="mb-4 text-sm text-gray-500">المقاس الموصى به للإعلان هو 800×500 بيكسل (نسبة 16:10) لضمان أفضل جودة وعرض على جميع الشاشات.</p>
          <VFileInput
            v-model="selectedFile"
            label="اختر صورة الإعلان"
            accept="image/*"
            prepend-icon="tabler-camera"
            variant="outlined"
            density="comfortable"
          />
        </VCardText>

        <VCardActions class="justify-center gap-2 pb-4">
          <VBtn variant="tonal" color="grey" @click="createDialog = false">
            إلغاء
          </VBtn>
          <VBtn color="primary" variant="elevated" :loading="creating" @click="handleCreate" :disabled="!selectedFile">
            رفع وحفظ
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
