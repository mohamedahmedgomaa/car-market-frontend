<script setup>
import { ref, onMounted, watch } from 'vue'
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
const cropDialog = ref(false)
const imageToCrop = ref(null)
const cropperElement = ref(null)
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

// Watch selected file to open cropper
watch(selectedFile, (file) => {
  if (file && file instanceof File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageToCrop.value = e.target.result
      cropDialog.value = true
      
      // Initialize cropper after dialog opens
      setTimeout(() => {
        if (cropper) cropper.destroy()
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
      }, 300)
    }
    reader.readAsDataURL(file)
  }
})

const handleCropSave = () => {
  if (!cropper) return
  
  cropper.getCroppedCanvas({
    width: 1600, 
    height: 1000,
  }).toBlob((blob) => {
    const croppedFile = new File([blob], selectedFile.value.name, { type: selectedFile.value.type })
    selectedFile.value = croppedFile
    cropDialog.value = false
  }, selectedFile.value.type)
}

const handleCreate = async () => {
  if (!selectedFile.value) return
  creating.value = true
  try {
    const fd = new FormData()
    fd.append('image', selectedFile.value)
    
    await bannerAdminApi.create(fd)
    createDialog.value = false
    selectedFile.value = null
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
        @click="createDialog = true"
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
                <VImg
                  :src="banner.image_path"
                  width="160"
                  height="100"
                  cover
                  class="rounded-lg border shadow-sm"
                />
              </div>
            </td>

            <td>
              <div class="flex items-center gap-2">
                <VSwitch
                  v-model="banner.is_active"
                  color="success"
                  hide-details
                  density="compact"
                  @change="toggleActive(banner)"
                />
                <span :class="banner.is_active ? 'text-success' : 'text-gray-400'" class="text-sm font-medium">
                  {{ banner.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </td>

            <td class="text-center">
              <VBtn
                icon
                variant="text"
                color="error"
                class="rounded-lg"
                @click="confirmDelete(banner)"
              >
                <VIcon icon="tabler-trash" />
                <VTooltip activator="parent" location="top">حذف الإعلان</VTooltip>
              </VBtn>
            </td>
          </tr>
          
          <tr v-if="banners.length === 0 && !loading">
            <td colspan="4" class="text-center py-12 text-gray-400">
              <VIcon icon="tabler-photo-off" size="48" class="mb-2 opacity-20" />
              <p>لا توجد إعلانات حالياً</p>
            </td>
          </tr>
        </tbody>
      </VTable>
      
      <div v-if="loading" class="flex justify-center items-center py-12">
        <VProgressCircular indeterminate color="primary" />
      </div>
    </VCard>

    <!-- Create Dialog -->
    <VDialog v-model="createDialog" max-width="550" persistent>
      <VCard rounded="xl">
        <VCardTitle class="text-xl font-bold px-6 pt-6">
          رفع إعلان جديد
        </VCardTitle>
        
        <VCardText class="px-6">
          <div class="bg-primary-lighten-5 p-4 rounded-lg mb-6 border border-primary-lighten-4">
            <div class="flex gap-3">
              <VIcon icon="tabler-info-circle" color="primary" />
              <div>
                <p class="text-sm font-bold text-primary mb-1">نصيحة للمقاسات</p>
                <p class="text-xs text-primary opacity-80 leading-relaxed">
                  سيتم قص الصورة تلقائياً لتركيز العرض بنسبة 16:10. يمكنك التحكم في الجزء الذي تريد إظهاره بعد اختيار الصورة.
                </p>
              </div>
            </div>
          </div>

          <VFileInput
            v-model="selectedFile"
            label="اختر صورة الإعلان"
            accept="image/*"
            prepend-icon="tabler-camera"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
        </VCardText>

        <VCardActions class="p-6 pt-2 gap-3">
          <VBtn variant="tonal" color="secondary" class="rounded-lg flex-1" @click="createDialog = false">
            إلغاء
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            class="rounded-lg flex-1"
            :loading="creating"
            @click="handleCreate"
            :disabled="!selectedFile"
          >
            حفظ النهائي
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Crop Dialog -->
    <VDialog v-model="cropDialog" max-width="800" persistent>
      <VCard rounded="xl">
        <VCardTitle class="text-xl font-bold px-6 pt-6 flex justify-between items-center">
          ضبط الصورة (Crop)
          <VBtn icon variant="text" size="small" @click="cropDialog = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText class="px-6 py-4">
          <div class="cropper-container bg-black rounded-lg overflow-hidden border">
            <img ref="cropperElement" :src="imageToCrop" class="max-w-full block" />
          </div>
          
          <div class="flex gap-2 mt-4 justify-center">
            <VBtn icon variant="tonal" size="small" @click="cropper.rotate(-90)">
              <VIcon icon="tabler-rotate-counter-clockwise" />
            </VBtn>
            <VBtn icon variant="tonal" size="small" @click="cropper.rotate(90)">
              <VIcon icon="tabler-rotate-clockwise" />
            </VBtn>
            <VBtn icon variant="tonal" size="small" @click="cropper.zoom(0.1)">
              <VIcon icon="tabler-zoom-in" />
            </VBtn>
            <VBtn icon variant="tonal" size="small" @click="cropper.zoom(-0.1)">
              <VIcon icon="tabler-zoom-out" />
            </VBtn>
            <VBtn icon variant="tonal" size="small" @click="cropper.scaleX(cropper.getData().scaleX === 1 ? -1 : 1)">
              <VIcon icon="tabler-arrows-left-right" />
            </VBtn>
          </div>
        </VCardText>

        <VCardActions class="p-6 pt-2 gap-3">
          <VBtn variant="tonal" color="secondary" class="rounded-lg px-6" @click="cropDialog = false">
            تراجع
          </VBtn>
          <VSpacer />
          <VBtn color="primary" variant="elevated" class="rounded-lg px-8" @click="handleCropSave">
            اعتماد وحفظ التعديل
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirm -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard rounded="xl" class="p-4 text-center">
        <div class="p-4 bg-error-lighten-5 rounded-circle inline-flex mb-4">
          <VIcon icon="tabler-trash" color="error" size="32" />
        </div>
        <h3 class="text-xl font-bold mb-2">تأكيد الحذف</h3>
        <p class="text-gray-500 mb-6 px-4">هل أنت متأكد من رغبتك في حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.</p>
        
        <div class="flex gap-3">
          <VBtn variant="tonal" color="secondary" class="rounded-lg flex-1" @click="deleteDialog = false">
            إلغاء
          </VBtn>
          <VBtn color="error" variant="elevated" class="rounded-lg flex-1" :loading="deleting" @click="handleDelete">
            حذف الآن
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.cropper-container {
  height: 450px;
  width: 100%;
}

:deep(.v-table) {
  background: transparent !important;
}

:deep(.v-table th) {
  background: rgba(255, 255, 255, 0.05) !important;
}

:deep(.v-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}
</style>
