<script setup>
import { ref, watch, computed, onMounted } from 'vue'

const props = defineProps({
  initialInteriorUrl: {
    type: String,
    default: '',
  },
  initialExteriorImages: {
    type: Array,
    default: () => [],
  },
  initialModel3dUrl: {
    type: String,
    default: '',
  },
})

// Interior 360 State
const interiorFile = ref(null)
const interiorPreview = ref(props.initialInteriorUrl || '')
const removeExistingInterior = ref(false)

// Exterior 360 State
const exteriorFiles = ref([])
const exteriorZipFile = ref(null)
const exteriorPreviews = ref([])
const removeExistingExterior = ref(false)
const existingExteriorImages = ref([...(props.initialExteriorImages || [])])
const previewIndex = ref(0)
const isDraggingExterior = ref(false)
const isDraggingInterior = ref(false)

// 3D Model State
const model3dFile = ref(null)
const model3dUrl = ref(props.initialModel3dUrl || '')
const removeExisting3d = ref(false)
const show3DSection = ref(!!props.initialModel3dUrl)

// Watch for initial props changes (e.g. when car data loads in edit mode)
watch(
  () => props.initialInteriorUrl,
  (val) => {
    if (val && !interiorFile.value) {
      interiorPreview.value = val
    }
  },
)

watch(
  () => props.initialExteriorImages,
  (val) => {
    if (Array.isArray(val) && val.length > 0 && exteriorFiles.value.length === 0) {
      existingExteriorImages.value = [...val]
    }
  },
)

watch(
  () => props.initialModel3dUrl,
  (val) => {
    if (val) {
      model3dUrl.value = val
      show3DSection.value = true
    }
  },
)

// Interior File Handler
const onSelectInterior = (file) => {
  if (!file) return
  interiorFile.value = file
  removeExistingInterior.value = false
  interiorPreview.value = URL.createObjectURL(file)
}

const clearInterior = () => {
  interiorFile.value = null
  interiorPreview.value = ''
  removeExistingInterior.value = true
}

// Exterior Files Handler
const onSelectExteriorFiles = (filesList) => {
  if (!filesList || filesList.length === 0) return

  const files = Array.from(filesList)
  const zip = files.find(f => f.name.toLowerCase().endsWith('.zip'))

  if (zip) {
    exteriorZipFile.value = zip
    exteriorFiles.value = []
    exteriorPreviews.value = []
    removeExistingExterior.value = false
    return
  }

  // Filter image files and sort naturally by name
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

  exteriorFiles.value = imageFiles
  exteriorZipFile.value = null
  removeExistingExterior.value = false

  // Generate previews
  exteriorPreviews.value = imageFiles.map(f => URL.createObjectURL(f))
  previewIndex.value = 0
}

const clearExterior = () => {
  exteriorFiles.value = []
  exteriorZipFile.value = null
  exteriorPreviews.value = []
  existingExteriorImages.value = []
  removeExistingExterior.value = true
}

// 3D Model Handlers
const onSelect3dFile = (file) => {
  if (!file) return
  model3dFile.value = file
  removeExisting3d.value = false
}

const clear3dModel = () => {
  model3dFile.value = null
  model3dUrl.value = ''
  removeExisting3d.value = true
}

// Total frames count
const totalExteriorFramesCount = computed(() => {
  if (exteriorZipFile.value) return 'ملف ZIP مضغوط'
  if (exteriorFiles.value.length > 0) return `${exteriorFiles.value.length} إطار`
  if (existingExteriorImages.value.length > 0) return `${existingExteriorImages.value.length} إطار حالي`
  return null
})

// Active preview frame for the exterior scrubber
const activePreviewFrameUrl = computed(() => {
  if (exteriorPreviews.value.length > 0) {
    return exteriorPreviews.value[previewIndex.value] || exteriorPreviews.value[0]
  }
  if (existingExteriorImages.value.length > 0) {
    return existingExteriorImages.value[previewIndex.value] || existingExteriorImages.value[0]
  }
  return null
})

// Public helper to append all 360 data to FormData
const appendFormData = (formData) => {
  // 1. Interior
  if (interiorFile.value) {
    formData.append('interior_360_image', interiorFile.value)
  } else if (removeExistingInterior.value) {
    formData.append('remove_interior_360', '1')
  }

  // 2. Exterior
  if (exteriorZipFile.value) {
    formData.append('exterior_360_zip', exteriorZipFile.value)
  } else if (exteriorFiles.value.length > 0) {
    exteriorFiles.value.forEach((file) => {
      formData.append('exterior_360_files[]', file)
    })
  } else if (removeExistingExterior.value) {
    formData.append('remove_exterior_360', '1')
  }

  // 3. 3D Model
  if (model3dFile.value) {
    formData.append('model_3d_file', model3dFile.value)
  } else if (model3dUrl.value) {
    formData.append('model_3d_url', model3dUrl.value)
  } else if (removeExisting3d.value) {
    formData.append('remove_model_3d', '1')
  }
}

defineExpose({
  appendFormData,
  interiorFile,
  exteriorFiles,
  exteriorZipFile,
  model3dFile,
  model3dUrl,
})
</script>

<template>
  <div class="car-360-upload-card border rounded-2xl pa-5 mb-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4 border-b pb-3">
      <div class="d-flex align-center gap-2">
        <VAvatar color="primary" variant="tonal" size="38">
          <VIcon icon="tabler-view-360" size="22" />
        </VAvatar>
        <div>
          <h4 class="text-subtitle-1 font-weight-bold mb-0">
            فحص ومعاينة السيارة بزاوية 360° (اختياري - ميزة احترافية)
          </h4>
          <p class="text-caption text-medium-emphasis mb-0">
            ارفع صور الدوران الخارجي وبانوراما المقصورة لتتيح للمشتري تجربة وفحص السيارة بزاوية 360 درجة
          </p>
        </div>
      </div>
      <VChip color="primary" variant="tonal" size="small" class="font-weight-bold">
        360° Experience
      </VChip>
    </div>

    <VRow>
      <!-- ============================================== -->
      <!-- SECTION 1: EXTERIOR 360° SPIN                  -->
      <!-- ============================================== -->
      <VCol cols="12" md="6">
        <div class="upload-subbox pa-4 rounded-xl border h-100 d-flex flex-column justify-space-between">
          <div>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="font-weight-bold text-subtitle-2 d-flex align-center gap-1">
                <VIcon icon="tabler-rotate-clockwise" size="18" color="primary" />
                1. الاستعراض الخارجي 360° (دوران الهيكل)
              </span>
              <VChip v-if="totalExteriorFramesCount" color="success" size="x-small" variant="flat">
                {{ totalExteriorFramesCount }}
              </VChip>
            </div>
            <p class="text-xs text-medium-emphasis mb-3">
              ارفع 16 إلى 36 صورة متتابعة تدور حول السيارة، أو ارفع ملف <strong>ZIP</strong> مضغوط يحتوي عليها.
            </p>

            <!-- Dropzone -->
            <div
              v-if="!activePreviewFrameUrl && !exteriorZipFile"
              class="mini-dropzone pa-5 text-center rounded-lg border-dashed cursor-pointer transition"
              :class="{ 'dropzone-active': isDraggingExterior }"
              @dragover.prevent="isDraggingExterior = true"
              @dragleave.prevent="isDraggingExterior = false"
              @drop.prevent="e => { isDraggingExterior = false; onSelectExteriorFiles(e.dataTransfer.files) }"
              @click="$refs.exteriorInputRef.click()"
            >
              <input
                ref="exteriorInputRef"
                type="file"
                multiple
                accept="image/*,.zip"
                class="d-none"
                @change="e => onSelectExteriorFiles(e.target.files)"
              />
              <VIcon icon="tabler-cloud-upload" size="30" color="primary" class="mb-2" />
              <div class="text-caption font-weight-bold mb-1">
                اضغط لاختيار الصور أو ملف ZIP
              </div>
              <div class="text-xs text-medium-emphasis">
                JPG, PNG, WebP أو ZIP (حتى 36 إطار)
              </div>
            </div>

            <!-- ZIP Preview -->
            <div v-else-if="exteriorZipFile" class="zip-preview-card pa-4 rounded-lg border bg-surface d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-3">
                <VAvatar color="warning" variant="tonal" size="36">
                  <VIcon icon="tabler-file-zip" size="22" />
                </VAvatar>
                <div>
                  <div class="font-weight-bold text-caption">{{ exteriorZipFile.name }}</div>
                  <div class="text-xs text-medium-emphasis">
                    {{ (exteriorZipFile.size / 1024 / 1024).toFixed(2) }} MB • سيتم فك ضغط الإطارات تلقائياً
                  </div>
                </div>
              </div>
              <VBtn icon="tabler-trash" size="x-small" color="error" variant="text" @click="clearExterior" />
            </div>

            <!-- Active Frames Interactive Scrubber Preview -->
            <div v-else-if="activePreviewFrameUrl" class="frames-scrubber-preview">
              <div class="relative rounded-lg overflow-hidden border bg-black text-center mb-2">
                <img :src="activePreviewFrameUrl" alt="spin frame" class="spin-preview-img" />
                <button type="button" class="clear-preview-btn" title="حذف الصور" @click="clearExterior">
                  <VIcon icon="tabler-x" size="14" />
                </button>
              </div>

              <!-- Interactive Angle Slider -->
              <div class="d-flex align-center gap-2 px-1">
                <span class="text-xs text-medium-emphasis">اسحب للتجربة:</span>
                <input
                  v-model.number="previewIndex"
                  type="range"
                  min="0"
                  :max="(exteriorPreviews.length || existingExteriorImages.length) - 1"
                  class="preview-slider flex-1"
                />
                <span class="text-xs font-weight-bold">
                  {{ previewIndex + 1 }} / {{ exteriorPreviews.length || existingExteriorImages.length }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </VCol>

      <!-- ============================================== -->
      <!-- SECTION 2: INTERIOR 360° PANORAMA              -->
      <!-- ============================================== -->
      <VCol cols="12" md="6">
        <div class="upload-subbox pa-4 rounded-xl border h-100 d-flex flex-column justify-space-between">
          <div>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="font-weight-bold text-subtitle-2 d-flex align-center gap-1">
                <VIcon icon="tabler-steering-wheel" size="18" color="primary" />
                2. مقصورة القيادة 360° (بانوراما الصالون)
              </span>
              <VChip v-if="interiorPreview" color="success" size="x-small" variant="flat">
                صورة واحدة جاهزة ✅
              </VChip>
            </div>
            <p class="text-xs text-medium-emphasis mb-3">
              ارفع <strong>صورة واحدة فقط</strong> بانورامية 360° (Equirectangular 2:1) ملتقطة من داخل السيارة.
            </p>

            <!-- Dropzone -->
            <div
              v-if="!interiorPreview"
              class="mini-dropzone pa-5 text-center rounded-lg border-dashed cursor-pointer transition"
              :class="{ 'dropzone-active': isDraggingInterior }"
              @dragover.prevent="isDraggingInterior = true"
              @dragleave.prevent="isDraggingInterior = false"
              @drop.prevent="e => { isDraggingInterior = false; onSelectInterior(e.dataTransfer.files[0]) }"
              @click="$refs.interiorInputRef.click()"
            >
              <input
                ref="interiorInputRef"
                type="file"
                accept="image/*"
                class="d-none"
                @change="e => onSelectInterior(e.target.files[0])"
              />
              <VIcon icon="tabler-photo-sphere" size="30" color="primary" class="mb-2" />
              <div class="text-caption font-weight-bold mb-1">
                اضغط لاختيار صورة البانوراما 360°
              </div>
              <div class="text-xs text-medium-emphasis">
                صورة كروية واحدة (JPG, PNG, WebP)
              </div>
            </div>

            <!-- Panoramic Preview Card -->
            <div v-else class="panoramic-preview-card relative rounded-lg overflow-hidden border">
              <img :src="interiorPreview" alt="interior panorama" class="pano-img" />
              <div class="pano-badge-overlay">
                <VIcon icon="tabler-view-360" size="14" class="me-1" /> بانوراما 360°
              </div>
              <button type="button" class="clear-preview-btn" title="حذف البانوراما" @click="clearInterior">
                <VIcon icon="tabler-x" size="14" />
              </button>
            </div>
          </div>
        </div>
      </VCol>

      <!-- ============================================== -->
      <!-- SECTION 3: (OPTIONAL) 3D MODEL                 -->
      <!-- ============================================== -->
      <VCol cols="12">
        <div class="mt-2">
          <button
            type="button"
            class="d-flex align-center gap-1 text-caption text-primary font-weight-bold bg-transparent border-0 cursor-pointer"
            @click="show3DSection = !show3DSection"
          >
            <VIcon :icon="show3DSection ? 'tabler-chevron-up' : 'tabler-chevron-down'" size="16" />
            <span>{{ show3DSection ? 'إخفاء خيار مجسم 3D' : '+ هل يتوفر لديك مجسم 3D مخصص للسيارة (GLB)؟ (اختياري)' }}</span>
          </button>

          <div v-if="show3DSection" class="pa-4 mt-2 rounded-xl border bg-surface-variant-light">
            <VRow align="center">
              <VCol cols="12" md="6">
                <VFileInput
                  label="رفع ملف مجسم 3D (.glb)"
                  accept=".glb"
                  prepend-icon="tabler-cube-3d-sphere"
                  density="compact"
                  variant="outlined"
                  hint="ملف ثلاثي الأبعاد بصيغة GLB (حتى 30 ميجابايت)"
                  persistent-hint
                  @change="e => onSelect3dFile(e.target.files[0])"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="model3dUrl"
                  label="أو رابط مجسم 3D خارجي (URL)"
                  placeholder="https://.../model.glb"
                  prepend-inner-icon="tabler-link"
                  density="compact"
                  variant="outlined"
                  hint="رابط مباشر لملف .glb"
                  persistent-hint
                />
              </VCol>
            </VRow>
            <div v-if="model3dUrl || model3dFile" class="d-flex justify-end mt-2">
              <VBtn size="x-small" color="error" variant="text" @click="clear3dModel">
                إلغاء المجسم ثلاثي الأبعاد
              </VBtn>
            </div>
          </div>
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.car-360-upload-card {
  background: rgba(var(--v-theme-surface), 0.6);
}

.upload-subbox {
  background: rgba(var(--v-theme-surface), 0.8);
  border-color: rgba(var(--v-border-color), 0.15) !important;
}

.mini-dropzone {
  border: 2px dashed rgba(var(--v-border-color), 0.25);
  background: rgba(var(--v-theme-primary), 0.02);
}

.mini-dropzone:hover,
.dropzone-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.spin-preview-img {
  width: 100%;
  height: 140px;
  object-fit: contain;
  display: block;
}

.panoramic-preview-card {
  position: relative;
  height: 140px;
  background: #000;
}

.pano-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pano-badge-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #ff9f43;
}

.clear-preview-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(234, 84, 85, 0.85);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 5;
}

.clear-preview-btn:hover {
  transform: scale(1.15);
}

.preview-slider {
  accent-color: rgb(var(--v-theme-primary));
  cursor: pointer;
}
</style>
