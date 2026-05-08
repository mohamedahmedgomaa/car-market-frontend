<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import bannerAdminApi from '../../../api/admin/bannerAdminApi.js'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

definePage({
  meta: {
    layout: 'default',
    action: 'manage',
    subject: 'all',
  },
})

const banners = ref([])
const loading = ref(false)

const deleteDialog = ref(false)
const selectedBanner = ref(null)
const deleting = ref(false)

const createDialog = ref(false)
const creating = ref(false)
const selectedFile = ref(null)

// Cropper State
const imageToCrop = ref(null)
const cropperElement = ref(null)
const isCropped = ref(false)
let cropper = null

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

// Watch selected file to init cropper inside the dialog
watch(selectedFile, (file) => {
  if (file && file instanceof File && !isCropped.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageToCrop.value = e.target.result
      
      nextTick(() => {
        if (cropper) cropper.destroy()
        if (cropperElement.value) {
          cropper = new Cropper(cropperElement.value, {
            aspectRatio: 16 / 10,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
          })
        }
      })
    }
    reader.readAsDataURL(file)
  } else if (!file) {
    imageToCrop.value = null
    isCropped.value = false
    if (cropper) cropper.destroy()
    cropper = null
  }
})

const handleCreate = async () => {
  if (!selectedFile.value) return
  
  creating.value = true
  try {
    let fileToUpload = selectedFile.value

    // If cropper is active, get the cropped version first
    if (cropper && !isCropped.value) {
      const blob = await new Promise(resolve => {
        cropper.getCroppedCanvas({ width: 1600, height: 1000 }).toBlob(resolve, selectedFile.value.type)
      })
      fileToUpload = new File([blob], selectedFile.value.name, { type: selectedFile.value.type })
    }

    const fd = new FormData()
    fd.append('image', fileToUpload)
    
    await bannerAdminApi.create(fd)
    createDialog.value = false
    selectedFile.value = null
    isCropped.value = false
    fetchBanners()
  } catch (err) {
    console.error('Create failed:', err.response?.data || err.message)
    alert('فشل الرفع: تأكد من حجم الصورة (بحد أقصى 10 ميجا)')
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
  <div class="p-6">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1">إعلانات الصفحة الرئيسية</h2>
        <p class="text-sm text-gray-400">إدارة البانرات التي تظهر في الواجهة الرئيسية للموقع</p>
      </div>

      <VBtn
        color="primary"
        variant="elevated"
        class="rounded-xl px-6"
        height="44"
        @click="createDialog = true; selectedFile = null"
      >
        <VIcon icon="tabler-plus" class="me-2" />
        إضافة إعلان
      </VBtn>
    </div>

    <VCard rounded="xl" border class="overflow-hidden">
      <VTable>
        <thead>
          <tr>
            <th class="text-uppercase text-xs font-bold opacity-70">ID</th>
            <th class="text-uppercase text-xs font-bold opacity-70">Preview</th>
            <th class="text-uppercase text-xs font-bold opacity-70">Status</th>
            <th class="text-uppercase text-xs font-bold opacity-70 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="banner in banners" :key="banner.id">
            <td class="font-medium">#{{ banner.id }}</td>
            <td>
              <div class="py-3">
                <VImg :src="banner.image_path" width="160" height="100" cover class="rounded-lg border shadow-sm" />
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <VSwitch v-model="banner.is_active" color="success" hide-details density="compact" @change="toggleActive(banner)" />
                <span :class="banner.is_active ? 'text-success' : 'text-gray-400'" class="text-sm font-medium">
                  {{ banner.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </td>
            <td class="text-center">
              <VBtn icon variant="text" color="error" class="rounded-lg" @click="confirmDelete(banner)">
                <VIcon icon="tabler-trash" />
              </VBtn>
            </td>
          </tr>
          <tr v-if="banners.length === 0 && !loading">
            <td colspan="4" class="text-center py-12 text-gray-400">لا توجد إعلانات حالياً</td>
          </tr>
        </tbody>
      </VTable>
      <div v-if="loading" class="flex justify-center items-center py-12">
        <VProgressCircular indeterminate color="primary" />
      </div>
    </VCard>

    <!-- Create Dialog (Unified with Cropper) -->
    <VDialog v-model="createDialog" max-width="700" persistent>
      <VCard rounded="xl">
        <VCardTitle class="text-xl font-bold px-6 pt-6 flex justify-between items-center">
          رفع وتعديل إعلان جديد
          <VBtn icon variant="text" size="small" @click="createDialog = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>
        
        <VCardText class="px-6 pb-6">
          <p v-if="!selectedFile" class="text-sm text-gray-500 mb-4 italic">
            اختر صورة لتبدأ في ضبط حجمها ومكانها يدوياً لتناسب الموقع.
          </p>

          <VFileInput
            v-model="selectedFile"
            label="اختر صورة الإعلان"
            accept="image/*"
            prepend-icon="tabler-camera"
            variant="outlined"
            density="comfortable"
            class="mb-6"
          />

          <!-- Cropper Interface -->
          <div v-if="imageToCrop" class="mt-2">
            <div class="text-xs font-bold text-primary text-uppercase mb-3 tracking-widest flex items-center gap-2">
              <VIcon icon="tabler-crop" size="16" />
              قم بضبط الصورة يدوياً أدناه
            </div>
            
            <div class="cropper-wrapper bg-black rounded-xl overflow-hidden border shadow-inner mb-4">
              <img ref="cropperElement" :src="imageToCrop" class="max-w-full block" />
            </div>

            <!-- Manual Controls -->
            <div class="flex gap-2 justify-center mb-2">
              <VBtn icon variant="tonal" size="small" @click="cropper.rotate(-90)" title="تدوير لليسار">
                <VIcon icon="tabler-rotate-counter-clockwise" />
              </VBtn>
              <VBtn icon variant="tonal" size="small" @click="cropper.rotate(90)" title="تدوير لليمين">
                <VIcon icon="tabler-rotate-clockwise" />
              </VBtn>
              <VBtn icon variant="tonal" size="small" @click="cropper.zoom(0.1)" title="تكبير">
                <VIcon icon="tabler-zoom-in" />
              </VBtn>
              <VBtn icon variant="tonal" size="small" @click="cropper.zoom(-0.1)" title="تصغير">
                <VIcon icon="tabler-zoom-out" />
              </VBtn>
              <VBtn icon variant="tonal" size="small" @click="cropper.scaleX(cropper.getData().scaleX === 1 ? -1 : 1)" title="قلب أفقي">
                <VIcon icon="tabler-arrows-left-right" />
              </VBtn>
            </div>
            <p class="text-center text-xs text-gray-500 italic">يمكنك تحريك الإطار أو الزووم بالماوس أيضاً</p>
          </div>
        </VCardText>

        <VCardActions class="px-6 pb-6 gap-3">
          <VBtn variant="tonal" color="secondary" class="rounded-lg px-6" @click="createDialog = false">
            إلغاء
          </VBtn>
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            class="rounded-lg px-10"
            height="44"
            :loading="creating"
            @click="handleCreate"
            :disabled="!selectedFile"
          >
            حفظ ونشر الإعلان
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirm -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard rounded="xl" class="p-6 text-center">
        <h3 class="text-xl font-bold mb-4">تأكيد الحذف</h3>
        <p class="text-gray-500 mb-6">هل أنت متأكد من رغبتك في حذف هذا الإعلان؟</p>
        <div class="flex gap-3">
          <VBtn variant="tonal" color="secondary" class="rounded-lg flex-1" @click="deleteDialog = false">إلغاء</VBtn>
          <VBtn color="error" variant="elevated" class="rounded-lg flex-1" :loading="deleting" @click="handleDelete">حذف</VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.cropper-wrapper {
  height: 400px;
  width: 100%;
}

:deep(.v-table) { background: transparent !important; }
:deep(.v-table th) { background: rgba(255, 255, 255, 0.05) !important; }
</style>
