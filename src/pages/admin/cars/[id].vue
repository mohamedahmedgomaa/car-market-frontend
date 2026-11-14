<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carAdminApi from '@/api/admin/carAdminApi.js'

const route = useRoute()
const router = useRouter()
const carId = computed(() => route.params.id)

// ================= State =================
const loading = ref(true)
const actionLoading = ref(false)
const car = ref(null)
const selectedImageIndex = ref(0)
const imageModal = ref(false)

// Dialogs
const approveDialog = ref(false)
const rejectDialog = ref(false)
const deleteDialog = ref(false)
const rejectionReason = ref('')

// Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showToast = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// Quick Rejection Reasons
const quickRejectReasons = [
  'الصور غير واضحة أو مخالفة لمعايير العرض',
  'السعر غير منطقي أو مبالغ فيه',
  'نقص في تفاصيل ومواصفات السيارة',
  'إعلان مكرر لنفس السيارة',
  'بيانات التواصل أو موقع السيارة غير صحيحة',
]

const addQuickReason = (reason) => {
  if (!rejectionReason.value) {
    rejectionReason.value = reason
  } else if (!rejectionReason.value.includes(reason)) {
    rejectionReason.value += ' - ' + reason
  }
}

// ================= Helpers =================
const getLocalized = (val, lang = 'ar') => {
  if (!val) return ''
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        return parsed[lang] || parsed.ar || parsed.en || Object.values(parsed)[0] || val
      } catch (e) {
        return val
      }
    }
    return val
  }
  if (typeof val === 'object') {
    return val[lang] || val.ar || val.en || Object.values(val)[0] || ''
  }
  return String(val)
}

const carTitle = computed(() => {
  if (!car.value) return 'تفاصيل السيارة'
  return getLocalized(car.value.title, 'ar') || car.value.title_ar || car.value.title_en || 'سيارة'
})

const carTitleEn = computed(() => {
  if (!car.value) return ''
  return getLocalized(car.value.title, 'en') || car.value.title_en || ''
})

const brandName = computed(() => getLocalized(car.value?.brand?.name || car.value?.brand))
const modelName = computed(() => getLocalized(car.value?.model?.name || car.value?.model))
const governorateName = computed(() => getLocalized(car.value?.governorate?.name || car.value?.governorate))
const cityName = computed(() => getLocalized(car.value?.city?.name || car.value?.city))

const locationText = computed(() => {
  const parts = [governorateName.value, cityName.value].filter(Boolean)
  return parts.length ? parts.join('، ') : 'مصر'
})

const sellerName = computed(() => {
  const s = car.value?.seller
  if (!s) return 'بائع مستقل'
  return getLocalized(s.store_name) || s.name || 'معرض سيارات'
})

const sellerPhone = computed(() => {
  return car.value?.seller?.phone || car.value?.phone_number || ''
})

const sellerWhatsApp = computed(() => {
  return car.value?.whatsapp_number || car.value?.seller?.phone || ''
})

const allImages = computed(() => {
  if (!car.value?.images || !Array.isArray(car.value.images)) return []
  return car.value.images.map(img => {
    if (typeof img === 'string') return img
    return img.path || img.url || ''
  }).filter(Boolean)
})

const activeImage = computed(() => {
  if (allImages.value.length === 0) return '/placeholder-car.jpg'
  return allImages.value[selectedImageIndex.value] || allImages.value[0] || '/placeholder-car.jpg'
})

const statusConfig = computed(() => {
  const st = car.value?.status
  switch (st) {
    case 'approved':
      return { text: 'موافق عليها (معروضة بالموقع)', color: 'success', icon: 'tabler-circle-check-filled', bannerBg: 'rgba(40, 199, 111, 0.12)' }
    case 'rejected':
      return { text: 'مرفوضة', color: 'error', icon: 'tabler-circle-x-filled', bannerBg: 'rgba(234, 84, 85, 0.12)' }
    case 'sold':
      return { text: 'تم البيع', color: 'secondary', icon: 'tabler-tag-filled', bannerBg: 'rgba(168, 170, 174, 0.12)' }
    case 'archived':
      return { text: 'مؤرشفة', color: 'grey', icon: 'tabler-archive-filled', bannerBg: 'rgba(168, 170, 174, 0.12)' }
    case 'pending':
    default:
      return { text: 'قيد المراجعة والانتظار', color: 'warning', icon: 'tabler-clock-filled', bannerBg: 'rgba(255, 159, 67, 0.12)' }
  }
})

// Video Embed URL generator
const youtubeEmbedUrl = computed(() => {
  const url = car.value?.youtube_url || car.value?.seller?.youtube_url || car.value?.seller?.youtube
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = String(url).match(regExp)
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?rel=0` : null
})

const instagramEmbedUrl = computed(() => {
  const url = car.value?.instagram_url || car.value?.seller?.instagram_url || car.value?.seller?.instagram
  if (!url) return null
  const clean = String(url).split('?')[0].replace(/\/+$/, '')
  return `${clean}/embed`
})

// ================= Data Fetching =================
const fetchCarDetails = async () => {
  loading.value = true
  try {
    const res = await carAdminApi.getById(carId.value)
    car.value = res.data?.data || null
    if (car.value?.rejection_reason) {
      rejectionReason.value = car.value.rejection_reason
    }
  } catch (err) {
    console.error('Failed to load car details:', err)
    showToast(err.response?.data?.message || 'فشل في تحميل بيانات السيارة', 'error')
  } finally {
    loading.value = false
  }
}

// ================= Actions =================
const handleApprove = async () => {
  actionLoading.value = true
  try {
    await carAdminApi.updateStatus(carId.value, { status: 'approved' })
    if (car.value) {
      car.value.status = 'approved'
      car.value.rejection_reason = null
    }
    approveDialog.value = false
    showToast('تمت الموافقة على السيارة بنجاح وأصبحت ظاهرة بالموقع ✅', 'success')
  } catch (err) {
    console.error('Approve failed:', err)
    showToast(err.response?.data?.message || 'فشل في تحديث حالة السيارة', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleReject = async () => {
  actionLoading.value = true
  try {
    const reason = rejectionReason.value.trim()
    await carAdminApi.updateStatus(carId.value, {
      status: 'rejected',
      rejection_reason: reason || undefined,
    })
    if (car.value) {
      car.value.status = 'rejected'
      car.value.rejection_reason = reason
    }
    rejectDialog.value = false
    showToast('تم رفض السيارة وإشعار البائع بالسبب', 'warning')
  } catch (err) {
    console.error('Reject failed:', err)
    showToast(err.response?.data?.message || 'فشل في رفض السيارة', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async () => {
  actionLoading.value = true
  try {
    await carAdminApi.delete(carId.value)
    deleteDialog.value = false
    showToast('تم حذف السيارة نهائياً', 'success')
    router.push('/admin/cars/approvals')
  } catch (err) {
    console.error('Delete failed:', err)
    showToast(err.response?.data?.message || 'فشل في حذف السيارة', 'error')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchCarDetails()
})
</script>

<template>
  <div class="car-details-page">
    <!-- Top Action Breadcrumb Bar -->
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div class="d-flex align-center gap-3">
        <VBtn
          color="secondary"
          variant="tonal"
          rounded="pill"
          size="small"
          prepend-icon="tabler-arrow-right"
          @click="$router.push('/admin/cars/approvals')"
        >
          العودة لقائمة الاعتماد
        </VBtn>
        <VBreadcrumbs
          :items="[
            { title: 'لوحة التحكم', to: '/admin/dashboard' },
            { title: 'إدارة السيارات', to: '/admin/cars' },
            { title: 'اعتماد سيارات البائعين', to: '/admin/cars/approvals' },
            { title: `#${carId}` },
          ]"
          density="compact"
          class="pa-0 d-none d-md-flex text-caption"
        />
      </div>

      <!-- Quick Action Buttons -->
      <div v-if="car" class="d-flex align-center gap-2">
        <VBtn
          v-if="car.status !== 'approved'"
          color="success"
          variant="elevated"
          rounded="pill"
          prepend-icon="tabler-circle-check"
          class="font-weight-bold px-4"
          @click="approveDialog = true"
        >
          الموافقة والنشر بالموقع
        </VBtn>

        <VBtn
          v-if="car.status !== 'rejected'"
          color="error"
          variant="tonal"
          rounded="pill"
          prepend-icon="tabler-circle-x"
          class="font-weight-bold"
          @click="rejectDialog = true"
        >
          رفض الإعلان
        </VBtn>

        <VBtn
          color="primary"
          variant="tonal"
          rounded="pill"
          prepend-icon="tabler-edit"
          @click="$router.push(`/admin/cars/edit/${car.id}`)"
        >
          تعديل
        </VBtn>

        <VMenu location="bottom end">
          <template #activator="{ props }">
            <VBtn v-bind="props" icon variant="tonal" color="secondary" size="small">
              <VIcon icon="tabler-dots-vertical" />
            </VBtn>
          </template>
          <VList density="compact" rounded="lg">
            <VListItem
              prepend-icon="tabler-external-link"
              title="معاينة في الموقع"
              :href="`/cars/${car.id}`"
              target="_blank"
            />
            <VListItem
              prepend-icon="tabler-building-store"
              title="زيارة بروفايل المعرض"
              :to="`/admin/sellers/edit/${car.seller_id}`"
            />
            <VDivider class="my-1" />
            <VListItem
              prepend-icon="tabler-trash"
              title="حذف السيارة نهائياً"
              color="error"
              @click="deleteDialog = true"
            />
          </VList>
        </VMenu>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="pa-8 text-center">
      <VProgressCircular indeterminate color="primary" size="50" class="mb-4" />
      <div class="text-subtitle-1 text-medium-emphasis">جاري تحميل بيانات وتفاصيل السيارة...</div>
    </div>

    <!-- Main Content -->
    <div v-else-if="car">
      <!-- Rejection Alert Banner (if rejected) -->
      <VAlert
        v-if="car.status === 'rejected'"
        type="error"
        variant="tonal"
        prominent
        class="mb-6 rounded-xl border-error"
      >
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <span class="font-weight-bold text-h6">تم رفض هذه السيارة من الظهور بالموقع</span>
            <VBtn
              size="small"
              color="success"
              variant="flat"
              rounded="pill"
              prepend-icon="tabler-refresh"
              @click="approveDialog = true"
            >
              إعادة الموافقة الآن
            </VBtn>
          </div>
        </template>
        <div class="mt-2 text-body-1">
          <strong>سبب الرفض المسجل:</strong>
          <span class="ms-1 text-high-emphasis font-weight-medium">{{ car.rejection_reason || 'لم يتم تسجيل سبب محدد' }}</span>
        </div>
      </VAlert>

      <!-- Hero Header Card -->
      <VCard class="rounded-xl pa-6 mb-6 elevation-2 border position-relative overflow-hidden">
        <div class="d-flex flex-wrap align-start justify-space-between gap-4">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-2 mb-2 flex-wrap">
              <VChip
                :color="statusConfig.color"
                variant="flat"
                class="font-weight-black text-uppercase"
              >
                <VIcon :icon="statusConfig.icon" size="16" class="me-1" />
                {{ statusConfig.text }}
              </VChip>

              <VChip color="primary" variant="tonal" class="font-weight-bold">
                كود السيارة #{{ car.id }}
              </VChip>

              <VChip v-if="car.condition" variant="outlined" size="small">
                {{ car.condition === 'new' ? 'جديدة (زيرو)' : 'مستعملة' }}
              </VChip>

              <VChip v-if="car.is_featured" color="warning" variant="tonal" size="small">
                ⭐ مميزة (Featured)
              </VChip>
            </div>

            <!-- Title -->
            <h1 class="text-h4 font-weight-black text-high-emphasis mb-1">
              {{ carTitle }}
            </h1>
            <div v-if="carTitleEn" class="text-subtitle-1 text-medium-emphasis mb-3">
              {{ carTitleEn }}
            </div>

            <!-- Subtitle tags -->
            <div class="d-flex flex-wrap align-center gap-3 text-caption text-medium-emphasis">
              <span class="d-flex align-center gap-1">
                <VIcon icon="tabler-car" size="16" color="primary" />
                <strong>{{ brandName }} {{ modelName }}</strong>
              </span>
              <span>•</span>
              <span class="d-flex align-center gap-1">
                <VIcon icon="tabler-calendar" size="16" />
                موديل {{ car.year }}
              </span>
              <span>•</span>
              <span class="d-flex align-center gap-1">
                <VIcon icon="tabler-map-pin" size="16" color="error" />
                {{ locationText }}
              </span>
              <span>•</span>
              <span class="d-flex align-center gap-1">
                <VIcon icon="tabler-clock" size="16" />
                تاريخ الإضافة: {{ car.created_at ? new Date(car.created_at).toLocaleDateString('ar-EG') : '-' }}
              </span>
            </div>
          </div>

          <!-- Price Badge Card -->
          <div class="text-start text-md-end pa-4 rounded-xl bg-surface border elevation-1 min-w-[200px]">
            <div class="text-caption text-medium-emphasis mb-1">السعر المطلوب</div>
            <div class="text-h4 font-weight-black text-primary">
              {{ car.price ? Number(car.price).toLocaleString() : 'عند الاتصال' }}
              <span class="text-subtitle-2 text-medium-emphasis">{{ car.currency || 'ج.م' }}</span>
            </div>
            <div v-if="car.old_price" class="text-caption text-decoration-line-through text-disabled">
              كان: {{ Number(car.old_price).toLocaleString() }} {{ car.currency || 'ج.م' }}
            </div>
          </div>
        </div>
      </VCard>

      <!-- Main Layout: 2 Columns -->
      <VRow>
        <!-- LEFT COLUMN: Media Gallery, Specs, Descriptions, Features -->
        <VCol cols="12" lg="8">
          <!-- Photo Gallery Card -->
          <VCard class="rounded-xl mb-6 overflow-hidden border elevation-1">
            <div class="position-relative bg-black" style="min-height: 420px; max-height: 520px; display: flex; align-items: center; justify-content: center;">
              <!-- Main Active Image -->
              <VImg
                :src="activeImage"
                class="w-100 h-100 cursor-pointer"
                style="max-height: 520px; object-fit: contain;"
                @click="imageModal = true"
              />

              <!-- Fullscreen button -->
              <VBtn
                icon
                size="small"
                variant="flat"
                color="rgba(0,0,0,0.6)"
                class="position-absolute top-4 start-4 text-white"
                @click="imageModal = true"
                v-tooltip="'عرض بالحجم الكامل'"
              >
                <VIcon icon="tabler-maximize" />
              </VBtn>

              <!-- Image Counter Badge -->
              <div class="position-absolute bottom-4 end-4 px-3 py-1 rounded-pill bg-black/70 text-white text-caption font-weight-bold">
                <VIcon icon="tabler-photo" size="14" class="me-1" />
                {{ allImages.length ? selectedImageIndex + 1 : 0 }} / {{ allImages.length }}
              </div>

              <!-- Next / Prev controls -->
              <VBtn
                v-if="allImages.length > 1"
                icon
                size="small"
                variant="flat"
                color="rgba(0,0,0,0.5)"
                class="position-absolute start-4 text-white"
                @click.stop="selectedImageIndex = (selectedImageIndex - 1 + allImages.length) % allImages.length"
              >
                <VIcon icon="tabler-chevron-right" />
              </VBtn>

              <VBtn
                v-if="allImages.length > 1"
                icon
                size="small"
                variant="flat"
                color="rgba(0,0,0,0.5)"
                class="position-absolute end-4 text-white"
                @click.stop="selectedImageIndex = (selectedImageIndex + 1) % allImages.length"
              >
                <VIcon icon="tabler-chevron-left" />
              </VBtn>
            </div>

            <!-- Thumbnails Strip -->
            <div v-if="allImages.length > 1" class="pa-3 bg-surface border-t d-flex align-center gap-2 overflow-x-auto">
              <div
                v-for="(img, idx) in allImages"
                :key="idx"
                class="thumbnail-box rounded-lg overflow-hidden cursor-pointer flex-shrink-0 border-2"
                :class="selectedImageIndex === idx ? 'border-primary ring-2 ring-primary' : 'border-transparent opacity-60 hover:opacity-100'"
                style="width: 76px; height: 56px;"
                @click="selectedImageIndex = idx"
              >
                <VImg :src="img" cover class="w-100 h-100" />
              </div>
            </div>
          </VCard>

          <!-- Video & 360 Walkthrough Section (if available) -->
          <VCard v-if="youtubeEmbedUrl || instagramEmbedUrl || car.model_3d_url || car.interior_360_url" class="rounded-xl mb-6 pa-6 border elevation-1">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-video" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold">فيديو ومعاينة 360 للسيارة</h3>
            </div>

            <!-- YouTube Video Embed -->
            <div v-if="youtubeEmbedUrl" class="mb-4">
              <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center gap-2 text-error">
                <VIcon icon="tabler-brand-youtube" />
                فيديو المعاينة على يوتيوب:
              </div>
              <div class="responsive-video-container rounded-xl overflow-hidden border">
                <iframe
                  :src="youtubeEmbedUrl"
                  title="Car Video"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="w-100"
                  style="aspect-ratio: 16/9; min-height: 360px;"
                />
              </div>
            </div>

            <!-- Instagram Reel Embed -->
            <div v-if="instagramEmbedUrl" class="mb-4">
              <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center gap-2 text-purple">
                <VIcon icon="tabler-brand-instagram" />
                معاينة ريلز انستجرام:
              </div>
              <div class="rounded-xl overflow-hidden border pa-2 bg-surface">
                <iframe
                  :src="instagramEmbedUrl"
                  frameborder="0"
                  scrolling="no"
                  class="w-100"
                  style="height: 480px;"
                />
              </div>
            </div>
          </VCard>

          <!-- Specifications Grid -->
          <VCard class="rounded-xl mb-6 pa-6 border elevation-1">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-settings-check" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold">المواصفات الفنية والميكانيكية</h3>
            </div>

            <VRow dense>
              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-calendar" size="14" />
                    سنة الصنع
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.year || '-' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-dashboard" size="14" />
                    المسافة المقطوعة
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.mileage ? Number(car.mileage).toLocaleString() + ' كم' : '0 كم' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-manual-gearbox" size="14" />
                    ناقل الحركة
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ car.transmission === 'automatic' ? 'أوتوماتيك' : car.transmission === 'manual' ? 'مانيوال (يدوي)' : car.transmission || '-' }}
                  </div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-gas-station" size="14" />
                    نوع الوقود
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ car.fuel_type === 'petrol' ? 'بنزين' : car.fuel_type === 'diesel' ? 'ديزل' : car.fuel_type === 'electric' ? 'كهرباء' : car.fuel_type === 'hybrid' ? 'هايبرد' : car.fuel_type || '-' }}
                  </div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-steering-wheel" size="14" />
                    منظومة الدفع
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ car.drivetrain === 'fwd' ? 'دفع أمامي (FWD)' : car.drivetrain === 'rwd' ? 'دفع خلفي (RWD)' : car.drivetrain === 'awd' ? 'دفع كلي (AWD)' : car.drivetrain === '4wd' ? 'دفع رباعي (4WD)' : car.drivetrain || '-' }}
                  </div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-engine" size="14" />
                    سعة المحرك (CC)
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.engine_capacity ? car.engine_capacity + ' CC' : '-' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-bolt" size="14" />
                    القوة الحصانية
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.horsepower ? car.horsepower + ' حصان' : '-' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-palette" size="14" />
                    اللون الخارجي
                  </div>
                  <div class="text-subtitle-2 font-weight-bold d-flex align-center gap-1">
                    <span v-if="car.color" class="d-inline-block rounded-circle border" :style="{ width: '14px', height: '14px', backgroundColor: car.color }" />
                    {{ car.color || '-' }}
                  </div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-cylinder" size="14" />
                    عدد السلندرات
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.cylinders ? car.cylinders + ' سلندر' : '-' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-gauge" size="14" />
                    التسارع (0-100)
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.acceleration ? car.acceleration + ' ثانية' : '-' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-weight" size="14" />
                    وزن السيارة
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.weight ? car.weight + ' كجم' : '-' }}</div>
                </div>
              </VCol>

              <VCol cols="6" sm="4" md="3" class="mb-3">
                <div class="pa-3 rounded-lg bg-surface border">
                  <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-shield-check" size="14" />
                    حالة الهيكل
                  </div>
                  <div class="text-subtitle-2 font-weight-bold">{{ car.condition === 'new' ? 'جديدة فابريكا' : 'مستعملة' }}</div>
                </div>
              </VCol>
            </VRow>
          </VCard>

          <!-- Features & Options Chips -->
          <VCard v-if="car.features && car.features.length" class="rounded-xl mb-6 pa-6 border elevation-1">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-sparkles" color="warning" size="24" />
              <h3 class="text-h6 font-weight-bold">المميزات والتجهيزات الإضافية ({{ car.features.length }})</h3>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <VChip
                v-for="feat in car.features"
                :key="feat.id"
                variant="tonal"
                color="primary"
                rounded="pill"
                class="font-weight-medium"
              >
                <VIcon icon="tabler-check" size="14" class="me-1" />
                {{ getLocalized(feat.name) || feat.name }}
              </VChip>
            </div>
          </VCard>

          <!-- Description Section -->
          <VCard class="rounded-xl mb-6 pa-6 border elevation-1">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-file-description" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold">الوصف والتفاصيل المكتوبة</h3>
            </div>

            <!-- Arabic Description -->
            <div class="mb-4">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-1">الوصف بالعربية:</div>
              <div class="pa-4 rounded-xl bg-surface border text-body-1 leading-relaxed whitespace-pre-line">
                {{ getLocalized(car.description, 'ar') || 'لا يوجد وصف عربي مسجل' }}
              </div>
            </div>

            <!-- English Description -->
            <div v-if="getLocalized(car.description, 'en')">
              <div class="text-subtitle-2 font-weight-bold text-secondary mb-1">الوصف بالإنجليزية (English):</div>
              <div class="pa-4 rounded-xl bg-surface border text-body-2 leading-relaxed whitespace-pre-line text-left" dir="ltr">
                {{ getLocalized(car.description, 'en') }}
              </div>
            </div>
          </VCard>
        </VCol>

        <!-- RIGHT COLUMN: Seller Card, Activity & Controls -->
        <VCol cols="12" lg="4">
          <!-- Seller / Showroom Card -->
          <VCard class="rounded-xl mb-6 pa-6 border elevation-1">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-building-store" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold">بيانات المعرض / البائع</h3>
            </div>

            <div class="d-flex align-center gap-3 mb-4">
              <VAvatar size="54" color="primary" variant="tonal" rounded="circle" class="border">
                <VImg v-if="car.seller?.store_logo" :src="car.seller.store_logo" cover />
                <VIcon v-else icon="tabler-building-store" size="28" />
              </VAvatar>
              <div>
                <h4 class="text-subtitle-1 font-weight-bold d-flex align-center gap-1">
                  {{ sellerName }}
                  <VIcon v-if="car.seller?.is_verified" icon="tabler-circle-check-filled" color="primary" size="18" />
                </h4>
                <div class="text-caption text-medium-emphasis">
                  {{ car.seller?.email || 'بدون بريد إلكتروني' }}
                </div>
              </div>
            </div>

            <VDivider class="my-4" />

            <!-- Contact Numbers -->
            <div class="d-flex flex-column gap-3 mb-4">
              <div class="d-flex align-center justify-space-between pa-2 rounded-lg bg-surface border">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="tabler-phone" color="primary" size="18" />
                  <span class="text-body-2 font-weight-bold" dir="ltr">{{ sellerPhone || 'غير متوفر' }}</span>
                </div>
                <VBtn
                  v-if="sellerPhone"
                  size="small"
                  variant="text"
                  color="primary"
                  :href="`tel:${sellerPhone}`"
                >
                  اتصال
                </VBtn>
              </div>

              <div class="d-flex align-center justify-space-between pa-2 rounded-lg bg-surface border">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="tabler-brand-whatsapp" color="success" size="18" />
                  <span class="text-body-2 font-weight-bold" dir="ltr">{{ sellerWhatsApp || 'غير متوفر' }}</span>
                </div>
                <VBtn
                  v-if="sellerWhatsApp"
                  size="small"
                  variant="text"
                  color="success"
                  :href="`https://wa.me/${sellerWhatsApp.replace(/[^0-9]/g, '')}`"
                  target="_blank"
                >
                  واتساب
                </VBtn>
              </div>
            </div>

            <!-- Address & Location -->
            <div class="text-caption text-medium-emphasis mb-4">
              <div class="d-flex align-center gap-2 mb-1">
                <VIcon icon="tabler-map-pin" size="16" color="error" />
                <strong>الموقع:</strong> {{ locationText }}
              </div>
              <div v-if="car.seller?.address" class="text-xs ps-6 opacity-80">
                {{ getLocalized(car.seller.address) }}
              </div>
            </div>

            <!-- Button: Visit Seller Profile in Admin -->
            <VBtn
              v-if="car.seller_id"
              block
              variant="tonal"
              color="primary"
              rounded="pill"
              prepend-icon="tabler-external-link"
              :to="`/admin/sellers/edit/${car.seller_id}`"
            >
              عرض ملف المعرض بالكامل
            </VBtn>
          </VCard>

          <!-- Listing Performance / Analytics -->
          <VCard class="rounded-xl mb-6 pa-6 border elevation-1">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-chart-bar" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold">إحصائيات الإعلان والتفاعل</h3>
            </div>

            <VRow dense>
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center">
                  <div class="text-h5 font-weight-black text-primary">{{ car.views_count || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">مشاهدات الإعلان</div>
                </div>
              </VCol>
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center">
                  <div class="text-h5 font-weight-black text-success">{{ car.whatsapp_clicks_count || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">نقرات واتساب</div>
                </div>
              </VCol>
              <VCol cols="6" class="mt-2">
                <div class="pa-3 rounded-lg bg-surface border text-center">
                  <div class="text-h5 font-weight-black text-info">{{ car.phone_clicks_count || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">نقرات الاتصال</div>
                </div>
              </VCol>
              <VCol cols="6" class="mt-2">
                <div class="pa-3 rounded-lg bg-surface border text-center">
                  <div class="text-h5 font-weight-black text-warning">{{ car.shares_count || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">مرات المشاركة</div>
                </div>
              </VCol>
            </VRow>
          </VCard>

          <!-- Quick Decision Action Box -->
          <VCard class="rounded-xl pa-6 border elevation-2" :style="{ backgroundColor: statusConfig.bannerBg }">
            <div class="d-flex align-center gap-2 mb-3">
              <VIcon :icon="statusConfig.icon" :color="statusConfig.color" size="28" />
              <div>
                <div class="text-caption text-medium-emphasis">حالة الإعلان الحالية:</div>
                <div class="text-subtitle-1 font-weight-black" :class="`text-${statusConfig.color}`">
                  {{ statusConfig.text }}
                </div>
              </div>
            </div>

            <div class="d-flex flex-column gap-2 mt-4">
              <VBtn
                v-if="car.status !== 'approved'"
                color="success"
                variant="elevated"
                rounded="pill"
                size="large"
                block
                prepend-icon="tabler-circle-check"
                class="font-weight-bold"
                @click="approveDialog = true"
              >
                الموافقة والاعتماد الفوري
              </VBtn>

              <VBtn
                v-if="car.status !== 'rejected'"
                color="error"
                variant="tonal"
                rounded="pill"
                size="large"
                block
                prepend-icon="tabler-circle-x"
                class="font-weight-bold"
                @click="rejectDialog = true"
              >
                رفض السيارة مع السبب
              </VBtn>

              <VBtn
                color="primary"
                variant="outlined"
                rounded="pill"
                block
                prepend-icon="tabler-edit"
                :to="`/admin/cars/edit/${car.id}`"
              >
                تعديل بيانات الإعلان
              </VBtn>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- ================= CONFIRMATION DIALOGS ================= -->

    <!-- AWESOME APPROVE DIALOG -->
    <VDialog v-model="approveDialog" max-width="560">
      <VCard class="rounded-2xl overflow-hidden border-t-4 border-success pa-0">
        <!-- Top Visual Header -->
        <div class="pa-6 text-center bg-gradient-to-b from-success/10 to-transparent">
          <div class="d-inline-flex pa-4 rounded-circle bg-success/20 mb-3 text-success">
            <VIcon icon="tabler-circle-check" size="48" />
          </div>
          <h2 class="text-h5 font-weight-black text-high-emphasis mb-1">
            الموافقة على نشر السيارة في الموقع
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            سيتم تغيير حالة الإعلان فوراً إلى <strong>معتمد (Approved)</strong>
          </p>
        </div>

        <VCardText class="px-6 py-2">
          <!-- Car Mini Summary Card -->
          <div class="d-flex align-center gap-3 pa-3 rounded-xl bg-surface border mb-4">
            <VAvatar size="64" rounded="lg" class="border flex-shrink-0">
              <VImg :src="activeImage" cover />
            </VAvatar>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-center justify-space-between gap-2 mb-1">
                <span class="text-subtitle-2 font-weight-bold text-truncate">{{ carTitle }}</span>
                <VChip size="x-small" color="primary" variant="tonal">#{{ car?.id }}</VChip>
              </div>
              <div class="text-caption text-medium-emphasis d-flex align-center gap-2">
                <span>{{ brandName }} {{ modelName }}</span>
                <span>•</span>
                <span class="text-primary font-weight-bold">{{ car?.price ? Number(car.price).toLocaleString() + ' ' + (car.currency || 'ج.م') : '' }}</span>
              </div>
              <div class="text-xs text-medium-emphasis mt-1">
                البائع: <strong>{{ sellerName }}</strong>
              </div>
            </div>
          </div>

          <!-- Alert Note -->
          <VAlert type="success" variant="tonal" density="compact" class="rounded-xl mb-2">
            <template #text>
              <div class="text-body-2">
                ✅ بمجرد التأكيد، ستظهر السيارة لجميع زوار المنصة في نتائج البحث والصفحة الرئيسية، وسيتم إشعار البائع باعتماد سيارته بنجاح.
              </div>
            </template>
          </VAlert>
        </VCardText>

        <VCardActions class="px-6 pb-6 pt-2 d-flex justify-end gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            rounded="pill"
            class="px-5"
            @click="approveDialog = false"
          >
            تراجع
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            rounded="pill"
            class="px-6 font-weight-bold"
            prepend-icon="tabler-check"
            :loading="actionLoading"
            @click="handleApprove"
          >
            نعم، اعتمد السيارة الآن
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- AWESOME REJECT DIALOG -->
    <VDialog v-model="rejectDialog" max-width="580">
      <VCard class="rounded-2xl overflow-hidden border-t-4 border-error pa-0">
        <!-- Top Visual Header -->
        <div class="pa-6 text-center bg-gradient-to-b from-error/10 to-transparent">
          <div class="d-inline-flex pa-4 rounded-circle bg-error/20 mb-3 text-error">
            <VIcon icon="tabler-alert-triangle" size="48" />
          </div>
          <h2 class="text-h5 font-weight-black text-high-emphasis mb-1">
            رفض إعلان السيارة وإخطار البائع
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            سيتم حجب السيارة من الظهور في الموقع وإرسال سبب الرفض إلى البائع
          </p>
        </div>

        <VCardText class="px-6 py-2">
          <!-- Car Mini Summary Card -->
          <div class="d-flex align-center gap-3 pa-3 rounded-xl bg-surface border mb-4">
            <VAvatar size="54" rounded="lg" class="border flex-shrink-0">
              <VImg :src="activeImage" cover />
            </VAvatar>
            <div class="flex-grow-1 min-w-0">
              <div class="text-subtitle-2 font-weight-bold text-truncate">{{ carTitle }}</div>
              <div class="text-caption text-medium-emphasis">
                كود #{{ car?.id }} • المعرض: {{ sellerName }}
              </div>
            </div>
          </div>

          <!-- Quick Select Reasons -->
          <div class="mb-3">
            <label class="text-caption font-weight-bold text-medium-emphasis mb-2 d-block">
              اختر سبباً سريعاً (أو اكتب سبباً خاصاً بالأسفل):
            </label>
            <div class="d-flex flex-wrap gap-1">
              <VChip
                v-for="r in quickRejectReasons"
                :key="r"
                size="small"
                variant="outlined"
                color="secondary"
                class="cursor-pointer hover:bg-error/10"
                @click="addQuickReason(r)"
              >
                + {{ r }}
              </VChip>
            </div>
          </div>

          <!-- Reason Textarea -->
          <VTextarea
            v-model="rejectionReason"
            label="تفاصيل سبب الرفض (سيصل للبائع في الإشعار)"
            placeholder="مثال: يرجى رفع صور واضحة من جميع الزوايا للسيارة مع تعديل السعر..."
            variant="outlined"
            rows="3"
            counter="500"
            class="mb-2"
          />

          <VAlert type="warning" variant="tonal" density="compact" class="rounded-xl">
            <template #text>
              <div class="text-caption">
                ⚠️ سيتمكن البائع من قراءة هذا السبب في حسابه، وتعديل السيارة ثم إعادة إرسالها للمراجعة مرة أخرى.
              </div>
            </template>
          </VAlert>
        </VCardText>

        <VCardActions class="px-6 pb-6 pt-2 d-flex justify-end gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            rounded="pill"
            class="px-5"
            @click="rejectDialog = false"
          >
            إلغاء
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            rounded="pill"
            class="px-6 font-weight-bold"
            prepend-icon="tabler-circle-x"
            :loading="actionLoading"
            @click="handleReject"
          >
            تأكيد الرفض وإشعار البائع
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="480">
      <VCard class="rounded-2xl pa-6 text-center">
        <VAvatar size="64" color="error" variant="tonal" class="mb-4 mx-auto">
          <VIcon icon="tabler-trash" size="32" />
        </VAvatar>
        <h3 class="text-h6 font-weight-bold mb-2">هل أنت متأكد من حذف هذه السيارة نهائياً؟</h3>
        <p class="text-body-2 text-medium-emphasis mb-6">
          سيتم حذف بيانات السيارة وجميع صورها بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
        </p>
        <div class="d-flex justify-center gap-3">
          <VBtn variant="tonal" color="secondary" rounded="pill" class="px-5" @click="deleteDialog = false">
            إلغاء
          </VBtn>
          <VBtn color="error" variant="elevated" rounded="pill" class="px-6 font-weight-bold" :loading="actionLoading" @click="handleDelete">
            نعم، احذف نهائياً
          </VBtn>
        </div>
      </VCard>
    </VDialog>

    <!-- Fullscreen Image Preview Dialog -->
    <VDialog v-model="imageModal" max-width="1100">
      <VCard class="rounded-2xl bg-black pa-2 position-relative overflow-hidden text-center">
        <VBtn
          icon
          size="small"
          variant="flat"
          color="rgba(255,255,255,0.2)"
          class="position-absolute top-4 end-4 text-white z-10"
          @click="imageModal = false"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
        <VImg :src="activeImage" style="max-height: 80vh; object-fit: contain;" class="mx-auto" />
      </VCard>
    </VDialog>

    <!-- Toast Notification -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="3500"
      location="top center"
      rounded="pill"
      elevation="4"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.responsive-video-container {
  position: relative;
  width: 100%;
}
.thumbnail-box {
  transition: all 0.2s ease;
}
.thumbnail-box:hover {
  transform: scale(1.05);
}
</style>
