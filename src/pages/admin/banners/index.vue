<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
const uploadType = ref('hero') // 'hero' or 'sidebar'

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

// Separate Banners by Type
const heroBanners = computed(() => {
  return banners.value.filter((b) => b.type === 'hero' || !b.type)
})

const sidebarBanners = computed(() => {
  return banners.value.filter((b) => b.type === 'sidebar')
})

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
    banners.value = banners.value.filter((s) => s.id !== selectedBanner.value.id)
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
            aspectRatio: uploadType.value === 'sidebar' ? 640 / 420 : 16 / 10, // المقاس المطلوب للموقع حسب النوع
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
      const cropWidth = uploadType.value === 'sidebar' ? 640 : 2560
      const cropHeight = uploadType.value === 'sidebar' ? 420 : 1600
      const canvas = cropper.getCroppedCanvas({ 
        width: cropWidth,
        height: cropHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })
      
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95) // جودة عالية جداً مع حجم ملف معقول
      })
      fileToUpload = new File([blob], uploadType.value === 'sidebar' ? 'sidebar_ad.jpg' : 'banner_2k.jpg', { type: 'image/jpeg' })
    }

    const fd = new FormData()
    fd.append('image', fileToUpload)
    fd.append('type', uploadType.value)

    await bannerAdminApi.create(fd)
    createDialog.value = false
    selectedFile.value = null
    isCropped.value = false
    fetchBanners()
  } catch (err) {
    console.error('Create failed:', err.response?.data || err.message)
    const errorMsg = err.response?.data?.message || err.message || 'فشل الرفع'
    alert(`فشل الرفع: ${errorMsg}`)
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
    <!-- 1️⃣ Hero Banners Section -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1">إعلانات الصفحة الرئيسية (Hero Banners)</h2>
        <p class="text-sm text-gray-400">إدارة البانرات التي تظهر في الواجهة الرئيسية للموقع (المقاس الإجباري بجودة 2K: 2560×1600)</p>
      </div>

      <VBtn
        color="primary"
        variant="elevated"
        class="rounded-xl px-6"
        height="44"
        @click="uploadType = 'hero'; createDialog = true; selectedFile = null"
      >
        <VIcon icon="tabler-plus" class="me-2" />
        إضافة إعلان هيرو
      </VBtn>
    </div>

    <VCard rounded="xl" border class="overflow-hidden mb-12">
      <VTable class="custom-table">
        <thead>
          <tr>
            <th class="text-uppercase text-xs font-bold opacity-70">ID</th>
            <th class="text-uppercase text-xs font-bold opacity-70">المعاينة</th>
            <th class="text-uppercase text-xs font-bold opacity-70">الحالة</th>
            <th class="text-uppercase text-xs font-bold opacity-70 text-center">العمليات</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="banner in heroBanners" :key="banner.id">
            <td class="font-medium">#{{ banner.id }}</td>
            <td>
              <div class="py-3">
                <div class="banner-preview-wrapper hero-preview">
                  <VImg :src="banner.image_path" cover class="rounded-lg border shadow-sm h-100" />
                </div>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-3">
                <VSwitch
                  v-model="banner.is_active"
                  color="success"
                  hide-details
                  density="compact"
                  @change="toggleActive(banner)"
                />
                <VChip :color="banner.is_active ? 'success' : 'default'" size="small" variant="tonal" class="font-weight-bold">
                  {{ banner.is_active ? 'نشط' : 'غير نشط' }}
                </VChip>
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
              </VBtn>
            </td>
          </tr>
          <tr v-if="heroBanners.length === 0 && !loading">
            <td colspan="4" class="text-center py-12 text-gray-400">
              <VIcon icon="tabler-photo-off" size="48" class="opacity-20 mb-4 d-block mx-auto" />
              لا توجد إعلانات هيرو حالياً
            </td>
          </tr>
        </tbody>
      </VTable>
      <div v-if="loading" class="flex justify-center items-center py-12">
        <VProgressCircular indeterminate color="primary" />
      </div>
    </VCard>

    <!-- 2️⃣ Sidebar Banners Section -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1">إعلانات تفاصيل السيارة (Sidebar Banners)</h2>
        <p class="text-sm text-gray-400">إدارة البانرات الجانبية الصغيرة التي تظهر في صفحة تفاصيل السيارات (المقاس المقترح: 640×420)</p>
      </div>

      <VBtn
        color="warning"
        variant="elevated"
        class="rounded-xl px-6"
        height="44"
        @click="uploadType = 'sidebar'; createDialog = true; selectedFile = null"
      >
        <VIcon icon="tabler-plus" class="me-2" />
        إضافة إعلان جانبي
      </VBtn>
    </div>

    <VCard rounded="xl" border class="overflow-hidden">
      <VTable class="custom-table">
        <thead>
          <tr>
            <th class="text-uppercase text-xs font-bold opacity-70">ID</th>
            <th class="text-uppercase text-xs font-bold opacity-70">المعاينة</th>
            <th class="text-uppercase text-xs font-bold opacity-70">الحالة</th>
            <th class="text-uppercase text-xs font-bold opacity-70 text-center">العمليات</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="banner in sidebarBanners" :key="banner.id">
            <td class="font-medium">#{{ banner.id }}</td>
            <td>
              <div class="py-3">
                <div class="banner-preview-wrapper sidebar-preview">
                  <VImg :src="banner.image_path" cover class="rounded-lg border shadow-sm h-100" />
                </div>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-3">
                <VSwitch
                  v-model="banner.is_active"
                  color="success"
                  hide-details
                  density="compact"
                  @change="toggleActive(banner)"
                />
                <VChip :color="banner.is_active ? 'success' : 'default'" size="small" variant="tonal" class="font-weight-bold">
                  {{ banner.is_active ? 'نشط' : 'غير نشط' }}
                </VChip>
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
              </VBtn>
            </td>
          </tr>
          <tr v-if="sidebarBanners.length === 0 && !loading">
            <td colspan="4" class="text-center py-12 text-gray-400">
              <VIcon icon="tabler-photo-off" size="48" class="opacity-20 mb-4 d-block mx-auto" />
              لا توجد إعلانات جانبية حالياً
            </td>
          </tr>
        </tbody>
      </VTable>
      <div v-if="loading" class="flex justify-center items-center py-12">
        <VProgressCircular indeterminate color="primary" />
      </div>
    </VCard>

    <!-- Create Dialog (Simplified) -->
    <VDialog v-model="createDialog" max-width="800" persistent>
      <VCard rounded="xl">
        <VCardTitle class="text-xl font-bold px-6 pt-6 flex justify-between items-center">
          رفع إعلان جديد ({{ uploadType === 'sidebar' ? 'جانبي' : 'شاشة كاملة هيرو' }})
          <VBtn icon variant="text" size="small" @click="createDialog = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText class="px-6 pb-6">
          <p class="text-sm text-gray-500 mb-6 italic">
            {{ uploadType === 'sidebar' ? 'سيتم قص الصورة تلقائياً لتناسب المقاس المقترح (640×420).' : 'سيتم قص الصورة تلقائياً لتناسب المقاس الإجباري للموقع (2560×1600).' }}
          </p>

          <VFileInput
            v-model="selectedFile"
            label="اختر ملف الصورة"
            accept="image/*"
            prepend-icon="tabler-photo-up"
            variant="outlined"
            density="comfortable"
            class="mb-6"
            placeholder="اضغط هنا لاختيار الصورة"
          />

          <!-- Cropper Interface -->
          <div v-if="imageToCrop" class="mt-2">
            <div
              class="text-xs font-bold text-primary text-uppercase mb-3 tracking-widest flex items-center gap-2"
            >
              <VIcon icon="tabler-crop" size="16" />
              تحديد منطقة العرض
            </div>

            <div
              class="cropper-wrapper bg-black rounded-xl overflow-hidden border shadow-inner mb-2"
            >
              <img ref="cropperElement" :src="imageToCrop" class="max-w-full block" />
            </div>
            
            <p class="text-center text-xs text-gray-500 mt-2">
              يمكنك سحب منطقة التحديد لضبط الجزء الذي سيظهر في الموقع.
            </p>
          </div>
        </VCardText>

        <VCardActions class="px-6 pb-6 gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-lg px-6"
            @click="createDialog = false"
          >
            إلغاء
          </VBtn>
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            class="rounded-lg px-10 font-weight-bold"
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
      <VCard rounded="xl" class="pa-6 text-center">
        <VIcon icon="tabler-alert-triangle" color="error" size="64" class="mb-4" />
        <h3 class="text-xl font-bold mb-2">تأكيد الحذف</h3>
        <p class="text-gray-500 mb-6">هل أنت متأكد من رغبتك في حذف هذا الإعلان؟ لا يمكن التراجع عن هذه الخطوة.</p>
        <div class="flex gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-lg flex-1"
            @click="deleteDialog = false"
            >إلغاء</VBtn
          >
          <VBtn
            color="error"
            variant="elevated"
            class="rounded-lg flex-1"
            :loading="deleting"
            @click="handleDelete"
            >حذف نهائي</VBtn
          >
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.banner-preview-wrapper {
  width: 240px;
  position: relative;
}

.banner-preview-wrapper.hero-preview {
  height: 150px; /* 16:10 ratio */
}

.banner-preview-wrapper.sidebar-preview {
  height: 157px; /* 640:420 ratio => 240 * (420 / 640) = 157.5px */
}

.cropper-wrapper {
  height: 450px;
  width: 100%;
}

:deep(.v-table) {
  background: transparent !important;
}
:deep(.v-table th) {
  background: rgba(255, 255, 255, 0.05) !important;
  height: 50px !important;
}
:deep(.v-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.custom-table :deep(tr:hover) {
  background: rgba(var(--v-theme-primary), 0.02) !important;
}
</style>
