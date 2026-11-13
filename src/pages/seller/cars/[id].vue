<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carSellerApi from '@/api/seller/carSellerApi.js'
import CarQrDialog from '@/components/dialogs/CarQrDialog.vue'
import CarSocialCardDialog from '@/components/dialogs/CarSocialCardDialog.vue'
import CarMotionLoader from '@/components/CarMotionLoader.vue'

const route = useRoute()
const router = useRouter()

const carId = computed(() => route.params.id)

const loading = ref(true)
const car = ref(null)
const selectedImageIndex = ref(0)

// Dialog states
const qrDialog = ref(false)
const socialCardDialog = ref(false)
const deleteDialog = ref(false)
const deleting = ref(false)

const statusDialog = ref(false)
const statusUpdating = ref(false)
const newSellerStatus = ref('approved')
const soldPrice = ref('')

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Helper formatters
const formatNumber = (num) => Number(num || 0).toLocaleString()

const statusColor = (st) => {
  switch (st) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'error'
    case 'sold': return 'info'
    case 'archived': return 'secondary'
    default: return 'primary'
  }
}

const statusLabelAr = (st) => {
  switch (st) {
    case 'approved': return 'معتمدة ومعروضة (Live)'
    case 'pending': return 'قيد المراجعة (Under Review)'
    case 'rejected': return 'مرفوضة (Rejected)'
    case 'sold': return 'تم البيع (Sold)'
    case 'archived': return 'مؤرشفة (Archived)'
    default: return st || 'غير محدد'
  }
}

const allImages = computed(() => {
  if (!car.value?.images || !Array.isArray(car.value.images)) return []
  return car.value.images.map(img => typeof img === 'string' ? img : (img.url || img.path || ''))
})

const activeImage = computed(() => {
  if (allImages.value.length === 0) return '/placeholder-car.png'
  return allImages.value[selectedImageIndex.value] || allImages.value[0] || '/placeholder-car.png'
})

const daysListed = computed(() => {
  if (!car.value?.created_at) return 0
  const created = new Date(car.value.created_at)
  const now = new Date()
  const diffTime = Math.abs(now - created)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
})

const totalLeads = computed(() => {
  if (!car.value) return 0
  return (car.value.whatsapp_clicks_count || 0) + (car.value.phone_clicks_count || 0)
})

const conversionRate = computed(() => {
  if (!car.value || !car.value.views_count) return 0
  return ((totalLeads.value / car.value.views_count) * 100).toFixed(1)
})

const fetchCar = async () => {
  loading.value = true
  try {
    const res = await carSellerApi.getById(carId.value)
    car.value = res.data?.data || res.data
    selectedImageIndex.value = 0
  } catch (err) {
    console.error('Failed to load car details:', err)
    snackbarMessage.value = 'تعذر تحميل بيانات السيارة. قد تكون غير موجودة أو لا تملك صلاحية الوصول.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

const openStatusModal = () => {
  if (!car.value) return
  newSellerStatus.value = car.value.status === 'sold' ? 'sold' : (car.value.status === 'archived' ? 'archived' : 'approved')
  soldPrice.value = car.value.sold_price || ''
  statusDialog.value = true
}

const handleUpdateSellerStatus = async () => {
  statusUpdating.value = true
  try {
    const payload = {
      status: newSellerStatus.value,
      sold_price: newSellerStatus.value === 'sold' ? soldPrice.value : null,
    }
    const res = await carSellerApi.updateSellerStatus(car.value.id, payload)
    if (res?.data?.data) {
      car.value = res.data.data
    } else {
      car.value.status = newSellerStatus.value
      if (newSellerStatus.value === 'sold') {
        car.value.sold_price = soldPrice.value
      }
    }
    statusDialog.value = false
    snackbarMessage.value = 'تم تحديث حالة السيارة بنجاح'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Update status failed:', err)
    snackbarMessage.value = err.response?.data?.message || 'فشل تحديث حالة السيارة'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    statusUpdating.value = false
  }
}

const handleDelete = async () => {
  deleting.value = true
  try {
    await carSellerApi.delete(car.value.id)
    deleteDialog.value = false
    router.push('/seller/cars')
  } catch (err) {
    console.error('Delete car failed:', err)
    snackbarMessage.value = 'فشل حذف السيارة'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  if (carId.value) {
    fetchCar()
  }
})
</script>

<template>
  <div class="seller-car-details-page py-6 px-4 max-w-7xl mx-auto">
    <!-- Breadcrumb & Top Bar -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-4">
      <div>
        <div class="d-flex align-center gap-2 text-sm text-medium-emphasis mb-1">
          <RouterLink to="/seller/dashboard" class="text-medium-emphasis text-decoration-none hover:text-primary">
            لوحة تحكم المعرض
          </RouterLink>
          <VIcon icon="tabler-chevron-left" size="14" />
          <RouterLink to="/seller/cars" class="text-medium-emphasis text-decoration-none hover:text-primary">
            إدارة السيارات
          </RouterLink>
          <VIcon icon="tabler-chevron-left" size="14" />
          <span class="text-primary font-weight-medium">تفاصيل السيارة #{{ carId }}</span>
        </div>
        <h2 class="text-h4 font-weight-bold text-high-emphasis d-flex align-center gap-2 mb-1">
          <VIcon icon="tabler-car" color="primary" size="32" />
          {{ car ? (car.title?.ar || car.title?.en || `${car.brand?.name?.en || ''} ${car.model?.name?.en || ''} ${car.year || ''}`) : 'تفاصيل السيارة' }}
        </h2>
        <div class="d-flex align-center gap-2 flex-wrap text-sm text-medium-emphasis">
          <span v-if="car?.brand?.name?.en">{{ car.brand.name.en }}</span>
          <span v-if="car?.model?.name?.en">• {{ car.model.name.en }}</span>
          <span v-if="car?.year">• موديل {{ car.year }}</span>
          <span v-if="car?.id">• كود الإعلان #{{ car.id }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex align-center gap-2 flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-arrow-right"
          @click="router.push('/seller/cars')"
        >
          العودة للقائمة
        </VBtn>

        <VBtn
          v-if="car"
          variant="tonal"
          color="primary"
          prepend-icon="tabler-edit"
          @click="router.push(`/seller/cars/edit/${car.id}`)"
        >
          تعديل البيانات
        </VBtn>

        <VBtn
          v-if="car"
          variant="tonal"
          color="warning"
          prepend-icon="tabler-arrows-exchange"
          @click="openStatusModal"
        >
          تغيير الحالة
        </VBtn>

        <VBtn
          v-if="car"
          variant="tonal"
          color="success"
          prepend-icon="tabler-qrcode"
          @click="qrDialog = true"
        >
          طباعة كود QR
        </VBtn>

        <VBtn
          v-if="car"
          variant="tonal"
          color="info"
          prepend-icon="tabler-photo-share"
          @click="socialCardDialog = true"
        >
          كارت السوشيال ميديا
        </VBtn>

        <VBtn
          v-if="car && car.status === 'approved'"
          variant="outlined"
          color="primary"
          prepend-icon="tabler-external-link"
          :href="`/user/cars/${car.id}`"
          target="_blank"
        >
          معاينة بالموقع
        </VBtn>

        <VBtn
          v-if="car"
          icon
          variant="tonal"
          color="error"
          title="حذف السيارة"
          @click="deleteDialog = true"
        >
          <VIcon icon="tabler-trash" size="20" />
        </VBtn>
      </div>
    </div>

    <!-- Loading State with Driving Car Animation -->
    <div v-if="loading" class="py-12">
      <CarMotionLoader
        mode="table"
        title="جاري فحص وتحميل كامل تفاصيل السيارة..."
        subtitle="يتم تجهيز ألبوم الصور والمواصفات وبيانات الأداء والتواصل"
        :height="360"
      />
    </div>

    <!-- Error State -->
    <VCard v-else-if="!car" class="pa-10 text-center rounded-xl">
      <VIcon icon="tabler-car-off" size="64" color="error" class="mb-4" />
      <h3 class="text-h5 font-weight-bold mb-2">لم يتم العثور على بيانات السيارة</h3>
      <p class="text-medium-emphasis mb-6">قد تكون هذه السيارة قد حذفت، أو ليس لديك الصلاحية للاطلاع عليها.</p>
      <VBtn color="primary" prepend-icon="tabler-arrow-right" @click="router.push('/seller/cars')">
        العودة لقائمة السيارات
      </VBtn>
    </VCard>

    <!-- Main Content -->
    <div v-else>
      <!-- Rejection Alert Banner -->
      <VAlert
        v-if="car.status === 'rejected'"
        type="error"
        variant="tonal"
        prominent
        icon="tabler-alert-triangle"
        class="mb-6 rounded-xl"
      >
        <VAlertTitle class="text-h6 font-weight-bold mb-1">
          تم رفض هذا الإعلان من قبل إدارة الموقع
        </VAlertTitle>
        <div class="text-body-1 font-weight-medium">
          سبب الرفض: {{ car.rejection_reason || 'يرجى مراجعة بيانات وصور الإعلان وتعديلها.' }}
        </div>
        <div class="mt-3">
          <VBtn
            size="small"
            color="error"
            variant="flat"
            prepend-icon="tabler-edit"
            @click="router.push(`/seller/cars/edit/${car.id}`)"
          >
            تعديل الإعلان وإعادة الإرسال للمراجعة
          </VBtn>
        </div>
      </VAlert>

      <!-- Status & Quick Highlights Banner -->
      <VCard class="pa-4 rounded-xl mb-6 elevation-2" style="background: rgba(var(--v-theme-surface), 0.7); backdrop-filter: blur(10px);">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-3 flex-wrap">
            <VChip :color="statusColor(car.status)" size="large" class="font-weight-black text-capitalize px-4">
              {{ statusLabelAr(car.status) }}
            </VChip>

            <VChip v-if="car.is_featured" color="warning" variant="tonal" size="small" class="font-weight-bold">
              <VIcon icon="tabler-star-filled" size="14" class="me-1" /> إعلان مميز (Featured)
            </VChip>

            <VChip v-if="car.is_best_deal" color="error" variant="tonal" size="small" class="font-weight-bold">
              <VIcon icon="tabler-flame" size="14" class="me-1" /> صفقة ممتازة (Best Deal)
            </VChip>

            <VChip v-if="car.is_import === '1' || car.is_import === 1 || car.is_import === true" color="info" variant="tonal" size="small" class="font-weight-bold">
              <VIcon icon="tabler-plane-arrival" size="14" class="me-1" /> سيارة مستوردة
            </VChip>

            <span class="text-sm text-medium-emphasis">
              <VIcon icon="tabler-clock" size="16" class="me-1" />
              تاريخ الإضافة: {{ car.created_at ? new Date(car.created_at).toLocaleDateString('ar-EG') : '-' }} (منذ {{ daysListed }} يوم)
            </span>
          </div>

          <div class="d-flex align-center gap-2">
            <VBtn
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="tabler-printer"
              @click="window.print()"
            >
              طباعة التقرير
            </VBtn>
          </div>
        </div>
      </VCard>

      <!-- Layout Grid -->
      <VRow>
        <!-- Left Column: Gallery, Specs & Descriptions -->
        <VCol cols="12" lg="8">
          <!-- Gallery Card -->
          <VCard class="rounded-2xl overflow-hidden mb-6 elevation-3 border">
            <!-- Main Hero Image Stage -->
            <div class="gallery-hero-stage">
              <VImg
                :src="activeImage"
                cover
                class="gallery-main-img"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <VProgressCircular indeterminate color="primary" />
                  </div>
                </template>
              </VImg>

              <!-- Gradient Vignette -->
              <div class="gallery-vignette" />

              <!-- Counter Badge (Crystal Clear and Fully Visible) -->
              <div class="gallery-counter-badge">
                <VIcon icon="tabler-photo" size="16" class="me-1.5 text-primary" />
                <span class="font-weight-black">{{ selectedImageIndex + 1 }}</span>
                <span class="mx-1 text-medium-emphasis">/</span>
                <span>{{ allImages.length || 1 }}</span>
              </div>

              <!-- Quick image nav buttons -->
              <div v-if="allImages.length > 1" class="gallery-nav-controls">
                <button
                  type="button"
                  class="gallery-nav-btn prev-btn"
                  :disabled="selectedImageIndex === 0"
                  title="الصورة السابقة"
                  @click="selectedImageIndex--"
                >
                  <VIcon icon="tabler-chevron-right" size="22" />
                </button>

                <button
                  type="button"
                  class="gallery-nav-btn next-btn"
                  :disabled="selectedImageIndex === allImages.length - 1"
                  title="الصورة التالية"
                  @click="selectedImageIndex++"
                >
                  <VIcon icon="tabler-chevron-left" size="22" />
                </button>
              </div>
            </div>

            <!-- Thumbnail Strip -->
            <div v-if="allImages.length > 1" class="pa-3 bg-surface d-flex gap-2 overflow-x-auto border-t">
              <div
                v-for="(img, idx) in allImages"
                :key="idx"
                class="gallery-thumb-item"
                :class="{ 'thumb-active': selectedImageIndex === idx }"
                @click="selectedImageIndex = idx"
              >
                <VImg :src="img" width="80" height="56" cover class="rounded-lg" />
              </div>
            </div>
          </VCard>

          <!-- Specifications Grid -->
          <VCard class="pa-6 rounded-xl mb-6 elevation-2">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-engine" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold mb-0">المواصفات الفنية للسيارة (Specifications)</h3>
            </div>

            <VRow>
              <!-- Brand & Model -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">الماركة والموديل</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ car.brand?.name?.en || '-' }} {{ car.model?.name?.en || '' }}
                  </div>
                </div>
              </VCol>

              <!-- Year -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">سنة الصنع</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ car.year || '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Mileage -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">المسافة المقطوعة</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ formatNumber(car.mileage) }} كم
                  </div>
                </div>
              </VCol>

              <!-- Condition -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">الحالة</div>
                  <div class="font-weight-bold text-sm text-high-emphasis text-capitalize">
                    {{ car.condition === 'new' ? 'جديدة (Zero)' : 'مستعملة (Used)' }}
                  </div>
                </div>
              </VCol>

              <!-- Transmission -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">ناقل الحركة</div>
                  <div class="font-weight-bold text-sm text-high-emphasis text-capitalize">
                    {{ car.transmission || '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Fuel Type -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">نوع الوقود</div>
                  <div class="font-weight-bold text-sm text-high-emphasis text-capitalize">
                    {{ car.fuel_type || '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Engine Capacity -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">سعة المحرك</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ car.engine_capacity ? `${car.engine_capacity} CC` : '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Cylinders -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">عدد السلندرات</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ car.cylinders ? `${car.cylinders} سلندر` : '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Drivetrain -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">نظام الدفع</div>
                  <div class="font-weight-bold text-sm text-high-emphasis text-capitalize">
                    {{ car.drivetrain || '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Color -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">اللون الخارجي</div>
                  <div class="d-flex align-center gap-2 font-weight-bold text-sm text-high-emphasis">
                    <span
                      v-if="car.color"
                      class="d-inline-block rounded-circle"
                      :style="{ width: '16px', height: '16px', backgroundColor: car.color, border: '1px solid rgba(255,255,255,0.3)' }"
                    />
                    {{ car.color || '-' }}
                  </div>
                </div>
              </VCol>

              <!-- Location -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">الموقع</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ car.city?.name?.ar || car.city?.name?.en || '' }}
                    <span v-if="car.governorate"> - {{ car.governorate?.name?.ar || car.governorate?.name?.en || '' }}</span>
                  </div>
                </div>
              </VCol>

              <!-- Import status -->
              <VCol cols="6" sm="4" md="3">
                <div class="spec-tile pa-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">المصدر</div>
                  <div class="font-weight-bold text-sm text-high-emphasis">
                    {{ (car.is_import === '1' || car.is_import === 1 || car.is_import === true) ? 'استيراد خارجي' : 'وكيل محلي' }}
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCard>

          <!-- Features & Equipment -->
          <VCard class="pa-6 rounded-xl mb-6 elevation-2">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-list-check" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold mb-0">المميزات والتجهيزات (Features & Equipment)</h3>
            </div>

            <div v-if="car.features && car.features.length" class="d-flex flex-wrap gap-2">
              <VChip
                v-for="feature in car.features"
                :key="feature.id"
                color="primary"
                variant="tonal"
                class="font-weight-medium"
              >
                <VIcon icon="tabler-check" size="16" class="me-1 text-success" />
                {{ feature.name?.ar || feature.name?.en || feature.name || 'ميزة' }}
              </VChip>
            </div>
            <div v-else class="text-medium-emphasis text-sm py-2">
              لم يتم تحديد تجهيزات إضافية لهذه السيارة.
            </div>
          </VCard>

          <!-- Descriptions -->
          <VCard class="pa-6 rounded-xl mb-6 elevation-2">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-file-text" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold mb-0">وصف الإعلان (Description)</h3>
            </div>

            <!-- Arabic Description -->
            <div class="mb-4">
              <div class="text-caption font-weight-bold text-primary mb-1">الوصف بالعربية:</div>
              <div class="text-body-1 whitespace-pre-line bg-surface pa-4 rounded-lg border">
                {{ car.description?.ar || 'لا يوجد وصف عربي.' }}
              </div>
            </div>

            <!-- English Description -->
            <div v-if="car.description?.en">
              <div class="text-caption font-weight-bold text-primary mb-1">English Description:</div>
              <div class="text-body-1 whitespace-pre-line bg-surface pa-4 rounded-lg border">
                {{ car.description.en }}
              </div>
            </div>
          </VCard>

          <!-- Price History (if any) -->
          <VCard v-if="car.price_histories && car.price_histories.length" class="pa-6 rounded-xl mb-6 elevation-2">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-history" color="primary" size="24" />
              <h3 class="text-h6 font-weight-bold mb-0">سجل وتاريخ تغييرات الأسعار (Price History)</h3>
            </div>

            <VTable density="compact">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>السعر القديم</th>
                  <th>السعر الجديد</th>
                  <th>نسبة التغيير</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hist in car.price_histories" :key="hist.id">
                  <td class="text-xs text-medium-emphasis">
                    {{ hist.created_at ? new Date(hist.created_at).toLocaleDateString('ar-EG') : '-' }}
                  </td>
                  <td class="text-decoration-line-through text-medium-emphasis">
                    {{ formatNumber(hist.old_price) }} EGP
                  </td>
                  <td class="font-weight-bold text-success">
                    {{ formatNumber(hist.new_price) }} EGP
                  </td>
                  <td>
                    <VChip
                      size="x-small"
                      :color="(hist.new_price < hist.old_price) ? 'error' : 'success'"
                      class="font-weight-bold"
                    >
                      {{ (( (hist.new_price - hist.old_price) / hist.old_price ) * 100).toFixed(1) }}%
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>

        <!-- Right Column: Financials, Analytics & Showroom Contacts -->
        <VCol cols="12" lg="4">
          <!-- Price Card -->
          <VCard class="pa-6 rounded-xl mb-6 elevation-3 border-primary" style="border-top: 4px solid #ff5722;">
            <div class="text-caption text-medium-emphasis mb-1">السعر المعروض حالياً</div>
            <div class="d-flex align-baseline gap-2 mb-2">
              <h2 class="text-h3 font-weight-black text-primary">
                {{ formatNumber(car.price) }}
              </h2>
              <span class="text-subtitle-1 font-weight-bold text-medium-emphasis">
                {{ car.currency || 'EGP' }}
              </span>
            </div>

            <!-- Price Drop Warning -->
            <div v-if="car.is_price_dropped" class="d-flex align-center gap-2 mb-4 pa-2.5 rounded-lg bg-error-lighten-5 text-error">
              <VIcon icon="tabler-trending-down" size="20" />
              <div class="text-xs font-weight-bold">
                السعر السابق: <span class="text-decoration-line-through">{{ formatNumber(car.old_price) }} {{ car.currency || 'EGP' }}</span>
              </div>
            </div>

            <!-- Sold info if sold -->
            <div v-if="car.status === 'sold'" class="mb-4 pa-3 rounded-lg" style="background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.2);">
              <div class="text-xs text-info font-weight-bold mb-1">
                <VIcon icon="tabler-check" size="14" class="me-1" />
                تم إتمام البيع بنجاح
              </div>
              <div v-if="car.sold_price" class="text-sm font-weight-bold text-high-emphasis">
                سعر البيع النهائي: {{ formatNumber(car.sold_price) }} {{ car.currency || 'EGP' }}
              </div>
              <div v-if="car.sold_at" class="text-xs text-medium-emphasis mt-0.5">
                تاريخ البيع: {{ new Date(car.sold_at).toLocaleDateString('ar-EG') }}
              </div>
            </div>

            <VDivider class="my-4" />

            <div class="d-flex flex-column gap-2">
              <VBtn
                color="primary"
                block
                prepend-icon="tabler-edit"
                @click="router.push(`/seller/cars/edit/${car.id}`)"
              >
                تعديل السعر والمواصفات
              </VBtn>

              <VBtn
                variant="tonal"
                color="warning"
                block
                prepend-icon="tabler-arrows-exchange"
                @click="openStatusModal"
              >
                تغيير حالة السيارة (مباعة / مؤرشفة)
              </VBtn>
            </div>
          </VCard>

          <!-- Analytics & Leads Card -->
          <VCard class="pa-6 rounded-xl mb-6 elevation-2">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-chart-bar" color="info" size="24" />
                <h3 class="text-subtitle-1 font-weight-bold mb-0">تفاعل العملاء (Analytics)</h3>
              </div>
              <VChip size="x-small" color="info" variant="flat" class="font-weight-bold">
                {{ conversionRate }}% تحويل
              </VChip>
            </div>

            <VRow dense>
              <!-- Views -->
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center">
                  <VIcon icon="tabler-eye" color="info" size="20" class="mb-1" />
                  <div class="text-h5 font-weight-bold">{{ formatNumber(car.views_count) }}</div>
                  <div class="text-caption text-medium-emphasis">إجمالي المشاهدات</div>
                </div>
              </VCol>

              <!-- Total Leads -->
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center">
                  <VIcon icon="tabler-user-check" color="success" size="20" class="mb-1" />
                  <div class="text-h5 font-weight-bold text-success">{{ formatNumber(totalLeads) }}</div>
                  <div class="text-caption text-medium-emphasis">طلبات التواصل</div>
                </div>
              </VCol>

              <!-- WhatsApp -->
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center mt-2">
                  <VIcon icon="tabler-brand-whatsapp" color="success" size="20" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ formatNumber(car.whatsapp_clicks_count) }}</div>
                  <div class="text-caption text-medium-emphasis">نقرات واتساب</div>
                </div>
              </VCol>

              <!-- Phone calls -->
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center mt-2">
                  <VIcon icon="tabler-phone" color="primary" size="20" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ formatNumber(car.phone_clicks_count) }}</div>
                  <div class="text-caption text-medium-emphasis">مكالمات هاتف</div>
                </div>
              </VCol>

              <!-- Favorites -->
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center mt-2">
                  <VIcon icon="tabler-heart" color="error" size="20" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ formatNumber(car.favorites_count || car.favorites?.length || 0) }}</div>
                  <div class="text-caption text-medium-emphasis">إضافة للمفضلة</div>
                </div>
              </VCol>

              <!-- Shares -->
              <VCol cols="6">
                <div class="pa-3 rounded-lg bg-surface border text-center mt-2">
                  <VIcon icon="tabler-share" color="secondary" size="20" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ formatNumber(car.shares_count) }}</div>
                  <div class="text-caption text-medium-emphasis">مشاركات الإعلان</div>
                </div>
              </VCol>
            </VRow>
          </VCard>

          <!-- Contact Channels Card -->
          <VCard class="pa-6 rounded-xl mb-6 elevation-2">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon icon="tabler-address-book" color="primary" size="24" />
              <h3 class="text-subtitle-1 font-weight-bold mb-0">بيانات التواصل المعروضة للعملاء</h3>
            </div>

            <div class="d-flex flex-column gap-3 text-sm">
              <div class="d-flex align-center justify-space-between pa-2.5 rounded bg-surface border">
                <span class="text-medium-emphasis d-flex align-center gap-1.5">
                  <VIcon icon="tabler-phone" size="18" color="primary" /> رقم الهاتف:
                </span>
                <span class="font-weight-bold text-high-emphasis">
                  {{ car.phone_number || car.seller?.phone || 'رقم المعرض الرئيسي' }}
                </span>
              </div>

              <div class="d-flex align-center justify-space-between pa-2.5 rounded bg-surface border">
                <span class="text-medium-emphasis d-flex align-center gap-1.5">
                  <VIcon icon="tabler-brand-whatsapp" size="18" color="success" /> رقم الواتساب:
                </span>
                <span class="font-weight-bold text-high-emphasis">
                  {{ car.whatsapp_number || car.seller?.whatsapp_number || 'واتساب المعرض' }}
                </span>
              </div>

              <div v-if="car.youtube_url" class="pa-2.5 rounded bg-surface border">
                <div class="text-medium-emphasis text-xs mb-1 d-flex align-center gap-1">
                  <VIcon icon="tabler-brand-youtube" size="16" color="error" /> رابط فيديو يوتيوب:
                </div>
                <a :href="car.youtube_url" target="_blank" class="text-primary text-xs text-truncate d-block">
                  {{ car.youtube_url }}
                </a>
              </div>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- Status Change Dialog -->
    <VDialog v-model="statusDialog" max-width="440">
      <VCard class="rounded-xl pa-2">
        <VCardTitle class="text-center pt-4">
          تغيير حالة السيارة في المعرض
        </VCardTitle>
        <VCardText>
          <p class="text-sm text-medium-emphasis mb-4 text-center">
            اختر الحالة الجديدة للسيارة. عند تحديد "تم البيع"، يمكنك تسجيل سعر البيع الفعلي لحساب أرباح المعرض بدقة.
          </p>

          <VSelect
            v-model="newSellerStatus"
            label="حالة السيارة"
            :items="[
              { title: 'معتمدة / معروضة للبيع (Live)', value: 'approved' },
              { title: 'تم بيعها (Sold)', value: 'sold' },
              { title: 'أرشفة الإعلان مؤقتاً (Archived)', value: 'archived' }
            ]"
            variant="outlined"
            class="mb-3"
          />

          <VTextField
            v-if="newSellerStatus === 'sold'"
            v-model="soldPrice"
            label="سعر البيع الفعلي (EGP)"
            type="number"
            variant="outlined"
            placeholder="مثال: 450000"
            prepend-inner-icon="tabler-cash"
            hint="سيتم احتسابه في إجمالي مبيعات المعرض"
            persistent-hint
          />
        </VCardText>

        <VCardActions class="justify-center gap-2 pb-4">
          <VBtn variant="tonal" @click="statusDialog = false">إلغاء</VBtn>
          <VBtn color="primary" :loading="statusUpdating" @click="handleUpdateSellerStatus">
            حفظ التغييرات
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirm Dialog -->
    <VDialog v-model="deleteDialog" max-width="420">
      <VCard class="rounded-xl pa-2">
        <VCardTitle class="text-center pt-4">تأكيد حذف السيارة</VCardTitle>
        <VCardText class="text-center">
          هل أنت متأكد من حذف هذه السيارة نهائياً من مخزون المعرض؟ لن تتمكن من استرجاع هذا الإعلان مجدداً.
        </VCardText>
        <VCardActions class="justify-center gap-2 pb-4">
          <VBtn variant="tonal" @click="deleteDialog = false">إلغاء</VBtn>
          <VBtn color="error" :loading="deleting" @click="handleDelete">
            حذف نهائي
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Car QR Poster Dialog -->
    <CarQrDialog v-model:is-dialog-visible="qrDialog" :car="car" />

    <!-- Car Social Card Share Dialog -->
    <CarSocialCardDialog v-model:is-dialog-visible="socialCardDialog" :car="car" />

    <!-- Toast Notification -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top" timeout="3500">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.spec-tile {
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.2s ease;
}
.spec-tile:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.04);
}
.border-primary {
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
}

/* Gallery Hero Stage & Controls */
.gallery-hero-stage {
  position: relative;
  width: 100%;
  min-height: 440px;
  max-height: 540px;
  background: #0b0d14;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-main-img {
  width: 100%;
  height: 100%;
  min-height: 440px;
  max-height: 540px;
  object-fit: cover;
}

.gallery-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, transparent 20%, transparent 75%, rgba(0, 0, 0, 0.65) 100%);
  pointer-events: none;
  z-index: 1;
}

.gallery-counter-badge {
  position: absolute;
  top: 16px;
  inset-inline-start: 16px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  background: rgba(11, 13, 20, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.gallery-nav-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 2;
  pointer-events: none;
}

.gallery-nav-btn {
  pointer-events: auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(11, 13, 20, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.gallery-nav-btn:hover:not(:disabled) {
  background: #ff6b00;
  border-color: #ff6b00;
  color: #ffffff;
  transform: scale(1.08);
}

.gallery-nav-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.gallery-thumb-item {
  cursor: pointer;
  border-radius: 10px;
  padding: 2px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  opacity: 0.65;
}

.gallery-thumb-item:hover {
  opacity: 0.95;
}

.gallery-thumb-item.thumb-active {
  opacity: 1;
  border-color: #ff6b00;
  box-shadow: 0 0 12px rgba(255, 107, 0, 0.45);
}
</style>

