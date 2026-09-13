<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import bannerAdminApi from '../../../api/admin/bannerAdminApi.js'
import { getBannerLink, setBannerLink } from '../../../utils/bannerLinkStorage.js'
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
const uploadType = ref('hero') // 'hero', 'sidebar', or 'video'
const videoUrlInput = ref('')
const bannerLinkInput = ref('')

const deleteDialog = ref(false)
const selectedBanner = ref(null)
const deleting = ref(false)

const editDialog = ref(false)
const editingBanner = ref(null)
const editBannerLinkInput = ref('')
const savingEdit = ref(false)

const openEditDialog = (banner) => {
  editingBanner.value = banner
  editBannerLinkInput.value = getBannerLink(banner.id, banner.link || '')
  editDialog.value = true
}

const handleEditSave = async () => {
  if (!editingBanner.value) return
  savingEdit.value = true
  try {
    const newLink = editBannerLinkInput.value ? editBannerLinkInput.value.trim() : ''
    
    // Save to local persistence immediately so it works 100%
    setBannerLink(editingBanner.value.id, newLink)
    editingBanner.value.link = newLink

    // Also attempt backend API update
    try {
      await bannerAdminApi.update(editingBanner.value.id, {
        is_active: editingBanner.value.is_active ? 1 : 0,
        link: newLink,
      })
    } catch (apiErr) {
      console.warn('Backend API banner link sync notice:', apiErr?.response?.data || apiErr?.message)
    }

    editDialog.value = false
  } catch (err) {
    console.error('Update link failed:', err)
  } finally {
    savingEdit.value = false
  }
}

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

const videoBanners = computed(() => {
  return banners.value.filter((b) => b.type === 'video')
})

const fetchBanners = async () => {
  loading.value = true
  try {
    const res = await bannerAdminApi.getAll()
    const rawItems = res.data?.data || []
    banners.value = rawItems.map((b) => ({
      ...b,
      link: getBannerLink(b.id, b.link || ''),
    }))
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
  if (uploadType.value === 'video') return
  if (file && file instanceof File && !isCropped.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageToCrop.value = e.target.result

      nextTick(() => {
        if (cropper) cropper.destroy()
        if (cropperElement.value) {
          cropper = new Cropper(cropperElement.value, {
            aspectRatio: uploadType.value === 'sidebar' ? 640 / 420 : 2 / 1,
            viewMode: 0,
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

const handleCreate = async (useOriginal = false) => {
  if (!selectedFile.value && !videoUrlInput.value) return

  creating.value = true
  try {
    const fd = new FormData()
    fd.append('type', uploadType.value)
    if (bannerLinkInput.value) {
      fd.append('link', bannerLinkInput.value)
    }

    if (uploadType.value === 'video') {
      if (videoUrlInput.value) {
        fd.append('video_url', videoUrlInput.value)
      } else if (selectedFile.value) {
        fd.append('image', selectedFile.value)
      }
    } else if (selectedFile.value) {
      let fileToUpload = selectedFile.value

      // If cropper is active and not skipping crop, get the cropped version
      if (!useOriginal && cropper && !isCropped.value) {
        const cropWidth = uploadType.value === 'sidebar' ? 640 : 1600
        const cropHeight = uploadType.value === 'sidebar' ? 420 : 800
        const canvas = cropper.getCroppedCanvas({ 
          width: cropWidth,
          height: cropHeight,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
        })
        
        if (canvas) {
          const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.95)
          })
          if (blob) {
            fileToUpload = new File([blob], uploadType.value === 'sidebar' ? 'sidebar_ad.jpg' : 'hero_banner.jpg', { type: 'image/jpeg' })
          }
        }
      }
      fd.append('image', fileToUpload)
    }

    const createdRes = await bannerAdminApi.create(fd)
    if (createdRes?.data?.data?.id && bannerLinkInput.value) {
      setBannerLink(createdRes.data.data.id, bannerLinkInput.value.trim())
    }

    createDialog.value = false
    selectedFile.value = null
    videoUrlInput.value = ''
    bannerLinkInput.value = ''
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
    await bannerAdminApi.update(banner.id, { is_active: newStatus ? 1 : 0, link: banner.link || '' })
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
        <p class="text-sm text-gray-400">
          إدارة البانرات التي تظهر في الواجهة الرئيسية (المقاس الإجباري والموصى به: <strong class="text-primary font-bold">1200 × 600 بكسل — نسبة 2:1</strong>)
        </p>
      </div>

      <VBtn
        color="primary"
        variant="elevated"
        class="rounded-xl px-6"
        height="44"
        @click="uploadType = 'hero'; createDialog = true; selectedFile = null; videoUrlInput = ''; bannerLinkInput = ''"
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
            <th class="text-uppercase text-xs font-bold opacity-70">الرابط المرفق</th>
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
              <div v-if="banner.link && banner.link !== '#'" class="text-xs text-primary font-bold flex items-center gap-1">
                <VIcon icon="tabler-link" size="14" />
                <a :href="banner.link" target="_blank" class="text-primary hover:underline truncate max-w-200 inline-block">
                  {{ banner.link }}
                </a>
              </div>
              <span v-else class="text-xs text-gray-500 italic">بدون رابط</span>
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
                color="primary"
                class="rounded-lg me-1"
                title="تعديل رابط الإعلان"
                @click="openEditDialog(banner)"
              >
                <VIcon icon="tabler-pencil" />
              </VBtn>
              <VBtn
                icon
                variant="text"
                color="error"
                class="rounded-lg"
                title="حذف الإعلان"
                @click="confirmDelete(banner)"
              >
                <VIcon icon="tabler-trash" />
              </VBtn>
            </td>
          </tr>
          <tr v-if="heroBanners.length === 0 && !loading">
            <td colspan="5" class="text-center py-12 text-gray-400">
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

    <!-- 3️⃣ Promo Video Banners Section -->
    <div class="flex items-center justify-between mb-8 mt-12">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1">إعلانات الفيديو الترويجي (Video Banners)</h2>
        <p class="text-sm text-gray-400">إدارة فيديوهات الإعلان الترويجي التي تظهر في الواجهة الرئيسية بجانب كرت البحث</p>
      </div>

      <VBtn
        color="info"
        variant="elevated"
        class="rounded-xl px-6"
        height="44"
        @click="uploadType = 'video'; createDialog = true; selectedFile = null; videoUrlInput = ''"
      >
        <VIcon icon="tabler-plus" class="me-2" />
        إضافة إعلان فيديو
      </VBtn>
    </div>

    <VCard rounded="xl" border class="overflow-hidden mb-12">
      <VTable class="custom-table">
        <thead>
          <tr>
            <th class="text-uppercase text-xs font-bold opacity-70">ID</th>
            <th class="text-uppercase text-xs font-bold opacity-70">معاينة الفيديو</th>
            <th class="text-uppercase text-xs font-bold opacity-70">الحالة</th>
            <th class="text-uppercase text-xs font-bold opacity-70 text-center">العمليات</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="banner in videoBanners" :key="banner.id">
            <td class="font-medium">#{{ banner.id }}</td>
            <td>
              <div class="py-3">
                <div class="banner-preview-wrapper video-preview" style="width: 240px; height: 135px;">
                  <video
                    :src="banner.image_path"
                    controls
                    muted
                    class="rounded-lg border shadow-sm h-100 w-100 object-cover"
                    style="max-height: 120px;"
                  ></video>
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
          <tr v-if="videoBanners.length === 0 && !loading">
            <td colspan="4" class="text-center py-12 text-gray-400">
              <VIcon icon="tabler-video-off" size="48" class="opacity-20 mb-4 d-block mx-auto" />
              لا توجد إعلانات فيديو حالياً
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
          رفع إعلان جديد ({{ uploadType === 'sidebar' ? 'جانبي' : uploadType === 'video' ? 'فيديو ترويجي' : 'شاشة كاملة هيرو' }})
          <VBtn icon variant="text" size="small" @click="createDialog = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText class="px-6 pb-6">
          <VAlert color="primary" variant="tonal" class="mb-5 rounded-xl text-xs font-weight-medium">
            <VIcon icon="tabler-info-circle" class="me-1" />
            <span v-if="uploadType === 'sidebar'">
              المقاس الموصى به لإعلانات الشريط الجانبي: <strong>640 × 420 بكسل</strong>.
            </span>
            <span v-else-if="uploadType === 'video'">
              يمكنك تحميل ملف فيديو مباشرة أو إدخال رابط فيديو خارجي (مفضل).
            </span>
            <span v-else>
              المقاس الإجباري والموصى به لبانر الهيرو: <strong>1200 × 600 بكسل (نسبة 2:1)</strong> — يتيح لك نظام القص التفاعلي أدناه اختيار وتحديد المنطقة المطلوبة بدقة لتظهر كاملة وواضحة بدون اقتطاع.
            </span>
          </VAlert>

          <!-- Banner Link Input (For image banners) -->
          <VTextField
            v-if="uploadType !== 'video'"
            v-model="bannerLinkInput"
            label="رابط الإعلان عند الضغط عليه (اختياري)"
            placeholder="مثال: https://example.com أو /user/cars/123"
            prepend-inner-icon="tabler-link"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          />

          <!-- Video Fields -->
          <div v-if="uploadType === 'video'">
            <VFileInput
              v-model="selectedFile"
              label="تحميل ملف فيديو (اختياري)"
              accept="video/*"
              prepend-icon="tabler-video"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              placeholder="اضغط هنا لاختيار ملف فيديو (MP4, WebM)"
              :disabled="!!videoUrlInput"
            />
            
            <div class="text-center my-3 text-gray-500 font-weight-bold">أو</div>
            
            <VTextField
              v-model="videoUrlInput"
              label="أدخل رابط فيديو مباشر (اختياري)"
              placeholder="مثال: https://example.com/video.mp4"
              prepend-inner-icon="tabler-link"
              variant="outlined"
              density="comfortable"
              class="mb-6"
              :disabled="!!selectedFile"
            />
          </div>

          <!-- Image Fields -->
          <div v-else>
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
          </div>

          <!-- Cropper Interface -->
          <div v-if="imageToCrop && uploadType !== 'video'" class="mt-2">
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

        <VCardActions class="px-6 pb-6 gap-3 flex-wrap">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-lg px-4"
            @click="createDialog = false"
          >
            إلغاء
          </VBtn>
          <VSpacer />
          <VBtn
            v-if="selectedFile && uploadType !== 'video'"
            color="warning"
            variant="tonal"
            class="rounded-lg px-4 font-weight-bold"
            height="44"
            :loading="creating"
            @click="handleCreate(true)"
          >
            <VIcon icon="tabler-file-upload" class="me-1" />
            رفع الصورة كاملة (بدون قص)
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            class="rounded-lg px-8 font-weight-bold"
            height="44"
            :loading="creating"
            @click="handleCreate(false)"
            :disabled="!selectedFile && !videoUrlInput"
          >
            <VIcon icon="tabler-check" class="me-1" />
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

    <!-- Edit Link Dialog -->
    <VDialog v-model="editDialog" max-width="550">
      <VCard rounded="xl" class="pa-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <VIcon icon="tabler-link" color="primary" />
            تعديل رابط الإعلان
          </h3>
          <VBtn icon variant="text" size="small" @click="editDialog = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </div>

        <p class="text-xs text-gray-400 mb-6">
          أدخل رابط الصفحة الخارجية أو الصفحة الداخلية التي سيفتحها المستخدم عند الضغط على هذا الإعلان.
        </p>

        <VTextField
          v-model="editBannerLinkInput"
          label="رابط الإعلان"
          placeholder="مثال: https://example.com أو /user/cars/123"
          prepend-inner-icon="tabler-link"
          variant="outlined"
          density="comfortable"
          class="mb-6"
        />

        <div class="flex gap-3 justify-end">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-lg px-6"
            @click="editDialog = false"
          >
            إلغاء
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            class="rounded-lg px-8 font-weight-bold"
            :loading="savingEdit"
            @click="handleEditSave"
          >
            حفظ التغييرات
          </VBtn>
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
