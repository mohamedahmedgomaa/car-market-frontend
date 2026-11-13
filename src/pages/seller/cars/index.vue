<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import carSellerApi from '@/api/seller/carSellerApi.js'
import brandUserApi from '@/api/user/brandUserApi.js'
import reportSellerApi from '@/api/seller/reportSellerApi.js'
import CarQrDialog from '@/components/dialogs/CarQrDialog.vue'
import CarSocialCardDialog from '@/components/dialogs/CarSocialCardDialog.vue'
import AppTableLoader from '@/components/AppTableLoader.vue'

const router = useRouter()

const lists = ref([])
const loading = ref(false)
const search = ref('')
const selectedStatusTab = ref('all')
const selectedBrand = ref(null)
const selectedCondition = ref(null)
const brands = ref([])
const overviewData = ref(null)
const exportLoading = ref(false)

const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

// ===== Overview Counts =====
const fetchOverview = async () => {
  try {
    const res = await reportSellerApi.getOverview()
    if (res?.data?.data) {
      overviewData.value = res.data.data
    }
  } catch (e) {
    // Graceful fallback to table total
  }
}

const inventoryCounts = computed(() => {
  const inv = overviewData.value?.inventory
  return {
    total: inv?.total ?? total.value ?? 0,
    approved: inv?.approved ?? 0,
    pending: inv?.pending ?? 0,
    rejected: inv?.rejected ?? 0,
    sold: inv?.sold ?? 0,
    archived: inv?.archived ?? 0,
  }
})

// ===== CSV Export =====
const handleExport = async () => {
  exportLoading.value = true
  try {
    const res = await reportSellerApi.downloadCsv()
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `showroom_fleet_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    exportLoading.value = false
  }
}

// ===== QR Code Poster Dialog =====
const qrDialog = ref(false)
const qrSelectedCar = ref(null)

const openQrModal = async (car) => {
  qrSelectedCar.value = car
  qrDialog.value = true
  if (car?.id) {
    try {
      const res = await carSellerApi.getById(car.id)
      if (res?.data?.data) {
        qrSelectedCar.value = res.data.data
      }
    } catch (e) {
      // Keep existing row car object on error
    }
  }
}

// ===== Social Card Share Dialog =====
const socialCardDialog = ref(false)
const socialSelectedCar = ref(null)

const openSocialCardModal = async (car) => {
  socialSelectedCar.value = car
  socialCardDialog.value = true
  if (car?.id) {
    try {
      const res = await carSellerApi.getById(car.id)
      if (res?.data?.data) {
        socialSelectedCar.value = res.data.data
      }
    } catch (e) {
      // Keep existing row car object on error
    }
  }
}

// ===== Delete =====
const deleteDialog = ref(false)
const selectedCar = ref(null)
const deleting = ref(false)

// ===== Seller Status Change Dialog (Sold / Archived / Available) =====
const statusDialog = ref(false)
const statusUpdating = ref(false)
const statusCar = ref(null)
const targetSellerStatus = ref('sold')
const soldPriceInput = ref('')

const openSellerStatusModal = (car) => {
  statusCar.value = car
  targetSellerStatus.value = car.status === 'sold' ? 'available' : 'sold'
  soldPriceInput.value = car.sold_price || car.price || ''
  statusDialog.value = true
}

const handleUpdateSellerStatus = async () => {
  if (!statusCar.value) return
  statusUpdating.value = true

  try {
    const payload = {
      status: targetSellerStatus.value,
    }
    if (targetSellerStatus.value === 'sold' && soldPriceInput.value) {
      payload.sold_price = Number(soldPriceInput.value)
    }

    const res = await carSellerApi.updateSellerStatus(statusCar.value.id, payload)
    const updated = res?.data?.data

    if (updated) {
      const idx = lists.value.findIndex(c => c.id === statusCar.value.id)
      if (idx !== -1) {
        lists.value[idx] = { ...lists.value[idx], ...updated }
      }
    }

    statusDialog.value = false
    fetchOverview()
  } catch (err) {
    console.error('Update seller status failed:', err.response?.data || err.message)
  } finally {
    statusUpdating.value = false
  }
}

const fetchLists = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      perPage,
      'filter[global]': search.value || undefined,
    }

    if (selectedStatusTab.value && selectedStatusTab.value !== 'all') {
      params['filter[status]'] = selectedStatusTab.value
    }

    if (selectedBrand.value) {
      params['filter[brand_id]'] = selectedBrand.value
    }

    if (selectedCondition.value) {
      params['filter[condition]'] = selectedCondition.value
    }

    const res = await carSellerApi.getAll(params)

    lists.value = res.data?.data || []
    currentPage.value = res.data?.meta?.currentPage || 1
    lastPage.value = res.data?.meta?.lastPage || 1
    total.value = res.data?.meta?.total || 0
  } catch (err) {
    console.error('Fetch cars failed:', err.response?.data || err.message)
  } finally {
    loading.value = false
  }
}

// ===== Delete handlers =====
const confirmDelete = (car) => {
  selectedCar.value = car
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!selectedCar.value) return
  deleting.value = true

  try {
    await carSellerApi.delete(selectedCar.value.id)
    lists.value = lists.value.filter(c => c.id !== selectedCar.value.id)
    total.value--
    deleteDialog.value = false
    fetchOverview()
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (id) => router.push(`/seller/cars/edit/${id}`)

const resetFilters = () => {
  search.value = ''
  selectedStatusTab.value = 'all'
  selectedBrand.value = null
  selectedCondition.value = null
}

const hasActiveFilters = computed(() => {
  return !!search.value || selectedStatusTab.value !== 'all' || !!selectedBrand.value || !!selectedCondition.value
})

watch([search, selectedStatusTab, selectedBrand, selectedCondition], () => {
  fetchLists(1)
})

onMounted(async () => {
  fetchLists()
  fetchOverview()
  try {
    const res = await brandUserApi.getAll()
    brands.value = res.data?.data || []
  } catch (e) {
    console.error('Failed to load brands for filter:', e)
  }
})

const showingText = computed(() => {
  const start = (currentPage.value - 1) * perPage + 1
  const end = Math.min(currentPage.value * perPage, total.value)

  return total.value
    ? `عرض ${start} - ${end} من أصل ${Number(total.value).toLocaleString()} سيارة`
    : 'لا توجد سيارات مطابقة'
})

const statusColor = (status) => {
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'error'
  if (status === 'sold') return 'info'
  if (status === 'archived') return 'secondary'
  return 'primary'
}

const getMainImageUrl = (car) => {
  if (!car) return ''
  if (car.main_image_url) return car.main_image_url
  const main = car.images?.find(i => i.is_main === 1 || i.is_main === true)
  if (main?.path) return main.path
  const first = car.images?.[0]
  if (first?.path) return first.path
  return ''
}
</script>

<template>
  <div class="seller-cars-page p-4">
    <!-- ===== Premium Hero Header ===== -->
    <div class="fleet-hero-banner mb-6 pa-6 rounded-2xl elevation-2 position-relative overflow-hidden">
      <div class="fleet-hero-glow"></div>

      <div class="d-flex flex-wrap align-center justify-space-between gap-5 position-relative">
        <!-- Title & Breadcrumbs -->
        <div class="fleet-title-section">
          <!-- Sleek Breadcrumb -->
          <div class="d-flex align-center gap-2 text-xs text-medium-emphasis mb-2 font-weight-medium">
            <RouterLink to="/seller/dashboard" class="breadcrumb-link d-flex align-center gap-1">
              <VIcon icon="tabler-smart-home" size="14" />
              <span>لوحة التحكم</span>
            </RouterLink>
            <VIcon icon="tabler-chevron-left" size="12" class="opacity-40" />
            <span class="text-primary font-weight-bold">أسطول السيارات</span>
          </div>

          <!-- Main Title with Glowing Icon -->
          <div class="d-flex align-center gap-3 mb-2">
            <div class="fleet-icon-wrapper d-flex align-center justify-center">
              <VIcon icon="tabler-car-garage" size="30" class="fleet-header-icon" />
            </div>
            <div>
              <div class="d-flex align-center gap-2 flex-wrap">
                <h1 class="text-h4 font-weight-black text-high-emphasis tracking-tight mb-0">
                  إدارة أسطول السيارات
                </h1>
                <VChip
                  size="small"
                  color="primary"
                  variant="flat"
                  class="fleet-status-pill font-weight-bold px-3"
                >
                  <span class="live-pulse-dot me-1"></span>
                  المخزون الحي
                </VChip>
              </div>
              <p class="text-sm text-medium-emphasis mb-0 mt-1">
                تحكم متكامل في سيارات المعرض، الأسعار، العروض، ومتابعة حالات البيع والتفاعل لحظياً.
              </p>
            </div>
          </div>
        </div>

        <!-- Right Side: Fast KPI Counters & Actions -->
        <div class="d-flex align-center gap-3 flex-wrap">
          <!-- KPI 1: Total Fleet Count -->
          <div class="fleet-stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl">
            <div class="fleet-stat-icon-box bg-primary-subtle text-primary">
              <VIcon icon="tabler-car" size="22" />
            </div>
            <div>
              <div class="stat-caption">إجمالي الأسطول</div>
              <div class="stat-value text-primary">
                {{ Number(inventoryCounts.total || total || 0).toLocaleString() }}
                <span class="stat-unit">مركبة</span>
              </div>
            </div>
          </div>

          <!-- KPI 2: Live Approved -->
          <div v-if="inventoryCounts.approved" class="fleet-stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl">
            <div class="fleet-stat-icon-box bg-success-subtle text-success">
              <VIcon icon="tabler-circle-check" size="22" />
            </div>
            <div>
              <div class="stat-caption">معتمدة للبيع</div>
              <div class="stat-value text-success">
                {{ Number(inventoryCounts.approved).toLocaleString() }}
                <span class="stat-unit">معروضة</span>
              </div>
            </div>
          </div>

          <!-- Primary Action: Add Car Button -->
          <VBtn
            size="large"
            prepend-icon="tabler-circle-plus"
            class="add-car-hero-btn text-white font-weight-bold px-6 elevation-4"
            @click="router.push('/seller/cars/create')"
          >
            إضافة سيارة جديدة
          </VBtn>

          <!-- Secondary Action: Export CSV -->
          <VBtn
            variant="tonal"
            color="secondary"
            size="large"
            icon="tabler-download"
            :loading="exportLoading"
            title="تصدير الأسطول إلى ملف Excel / CSV"
            @click="handleExport"
          />

          <!-- Refresh Button -->
          <VBtn
            variant="tonal"
            color="secondary"
            size="large"
            icon="tabler-refresh"
            :loading="loading"
            title="تحديث البيانات"
            @click="fetchLists(currentPage); fetchOverview()"
          />
        </div>
      </div>
    </div>

    <!-- ===== Dedicated Modern Filter & Search Hub ===== -->
    <VCard elevation="3" class="fleet-filter-hub mb-6 rounded-2xl overflow-hidden border">
      <!-- Status Tabs Bar with Live Badges -->
      <div class="filter-tabs-strip px-4 pt-3 border-b">
        <VTabs
          v-model="selectedStatusTab"
          color="primary"
          density="comfortable"
          show-arrows
          class="custom-fleet-tabs"
        >
          <!-- All -->
          <VTab value="all" class="custom-fleet-tab">
            <VIcon icon="tabler-layout-grid" size="18" class="me-2" />
            <span>الكل</span>
            <span class="tab-count-badge ms-2">{{ Number(inventoryCounts.total || total).toLocaleString() }}</span>
          </VTab>

          <!-- Approved / Live -->
          <VTab value="approved" class="custom-fleet-tab">
            <VIcon icon="tabler-circle-check" size="18" class="me-2 text-success" />
            <span>معتمدة</span>
            <span class="tab-count-badge tab-count-success ms-2">{{ Number(inventoryCounts.approved).toLocaleString() }}</span>
          </VTab>

          <!-- Pending -->
          <VTab value="pending" class="custom-fleet-tab">
            <VIcon icon="tabler-clock-hour-4" size="18" class="me-2 text-warning" />
            <span>قيد المراجعة</span>
            <span class="tab-count-badge tab-count-warning ms-2">{{ Number(inventoryCounts.pending).toLocaleString() }}</span>
          </VTab>

          <!-- Rejected -->
          <VTab value="rejected" class="custom-fleet-tab">
            <VIcon icon="tabler-alert-triangle" size="18" class="me-2 text-error" />
            <span>مرفوضة</span>
            <span v-if="inventoryCounts.rejected" class="tab-count-badge tab-count-error ms-2">{{ Number(inventoryCounts.rejected).toLocaleString() }}</span>
          </VTab>

          <!-- Sold -->
          <VTab value="sold" class="custom-fleet-tab">
            <VIcon icon="tabler-tag-starred" size="18" class="me-2 text-info" />
            <span>تم بيعها</span>
            <span v-if="inventoryCounts.sold" class="tab-count-badge tab-count-info ms-2">{{ Number(inventoryCounts.sold).toLocaleString() }}</span>
          </VTab>

          <!-- Archived -->
          <VTab value="archived" class="custom-fleet-tab">
            <VIcon icon="tabler-archive" size="18" class="me-2 text-medium-emphasis" />
            <span>مؤرشفة</span>
            <span v-if="inventoryCounts.archived" class="tab-count-badge ms-2">{{ Number(inventoryCounts.archived).toLocaleString() }}</span>
          </VTab>
        </VTabs>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="pa-4 d-flex flex-wrap align-center justify-space-between gap-3">
        <div class="d-flex flex-wrap align-center gap-3 flex-1">
          <!-- Search Field -->
          <VTextField
            v-model="search"
            placeholder="ابحث بالماركة، الموديل، سنة الصنع، أو كود الإعلان..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="tabler-search"
            style="min-width: 260px; max-width: 380px;"
            hide-details
            clearable
            class="fleet-search-field"
          />

          <!-- Brand Filter -->
          <VAutocomplete
            v-model="selectedBrand"
            :items="brands"
            :item-title="b => b.name?.ar ? `${b.name.ar} (${b.name.en || ''})` : (b.name?.en || b.name || '')"
            item-value="id"
            placeholder="كل الماركات"
            label="الماركة"
            prepend-inner-icon="tabler-building-factory"
            variant="outlined"
            density="compact"
            style="min-width: 170px; max-width: 220px;"
            hide-details
            clearable
          />

          <!-- Condition Filter -->
          <VSelect
            v-model="selectedCondition"
            :items="[
              { title: 'كل الحالات', value: null },
              { title: 'جديدة تماماً / زيرو', value: 'new' },
              { title: 'مستعملة بحالة ممتازة', value: 'used' },
            ]"
            placeholder="الحالة"
            label="حالة السيارة"
            prepend-inner-icon="tabler-sparkles"
            variant="outlined"
            density="compact"
            style="min-width: 160px; max-width: 200px;"
            hide-details
            clearable
          />

          <!-- Reset Filter Button -->
          <VBtn
            v-if="hasActiveFilters"
            variant="tonal"
            color="secondary"
            size="small"
            prepend-icon="tabler-filter-off"
            class="rounded-lg"
            @click="resetFilters"
          >
            إعادة تعيين الفلاتر
          </VBtn>
        </div>

        <!-- Matching results counter -->
        <div class="d-flex align-center gap-2">
          <VChip variant="tonal" color="primary" size="small" class="font-weight-medium">
            <VIcon icon="tabler-list-check" size="14" class="me-1" />
            {{ showingText }}
          </VChip>
        </div>
      </div>
    </VCard>

    <!-- Table -->
    <VCard elevation="3" class="rounded-xl overflow-hidden">
      <VTable v-if="!loading">
        <thead>
          <tr>
            <th style="width: 60px;">ID</th>
            <th style="width: 70px;">الصورة</th>
            <th>السيارة</th>
            <th>السعر</th>
            <th>المواصفات</th>
            <th class="text-center">التفاعل (Analytics)</th>
            <th class="text-center">الحالة</th>
            <th class="text-center" style="width: 130px;">إجراءات</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="lists.length === 0">
            <td colspan="8" class="text-center py-10 text-medium-emphasis">
              <VIcon icon="tabler-car-off" size="36" class="mb-2" />
              <div>لا توجد سيارات مطابقة في هذا التصنيف.</div>
            </td>
          </tr>

          <tr v-for="car in lists" :key="car.id">
            <td class="text-xs text-medium-emphasis">#{{ car.id }}</td>

            <!-- Main Image -->
            <td>
              <VAvatar size="48" rounded="lg" color="grey-lighten-4">
                <VImg
                  v-if="getMainImageUrl(car)"
                  :src="getMainImageUrl(car)"
                  cover
                />
                <VIcon v-else icon="tabler-car" color="medium-emphasis" />
              </VAvatar>
            </td>

            <!-- Car Info -->
            <td>
              <div class="font-weight-bold text-high-emphasis">
                {{ car.title?.ar || car.title?.en || car.title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ car.brand?.name?.en || car.brand?.name?.ar || car.brand?.name || '' }}
                <span v-if="car.model"> / {{ car.model?.name?.en || car.model?.name?.ar || car.model?.name || '' }}</span>
              </div>
            </td>

            <!-- Price -->
            <td>
              <div class="font-weight-black text-primary">
                {{ Number(car.price || 0).toLocaleString() }}
                <span class="text-caption">{{ car.currency || 'EGP' }}</span>
              </div>
              <div v-if="car.old_price" class="text-caption text-decoration-line-through text-medium-emphasis">
                {{ Number(car.old_price).toLocaleString() }} {{ car.currency || 'EGP' }}
              </div>
            </td>

            <!-- Specs -->
            <td class="text-caption">
              <div>{{ car.year }} • {{ car.condition === 'new' ? 'جديدة' : 'مستعملة' }}</div>
              <div v-if="car.mileage" class="text-medium-emphasis">
                {{ Number(car.mileage).toLocaleString() }} كم
              </div>
            </td>

            <!-- Analytics -->
            <td class="text-center">
              <div class="d-flex align-center justify-center gap-2 text-caption">
                <span title="مشاهدات" class="d-flex align-center gap-1 text-medium-emphasis">
                  <VIcon icon="tabler-eye" size="14" />
                  {{ car.views_count || 0 }}
                </span>
                <span title="نقرات واتساب" class="d-flex align-center gap-1 text-success">
                  <VIcon icon="tabler-brand-whatsapp" size="14" />
                  {{ car.whatsapp_clicks_count || 0 }}
                </span>
                <span title="مكالمات" class="d-flex align-center gap-1 text-info">
                  <VIcon icon="tabler-phone" size="14" />
                  {{ car.phone_clicks_count || 0 }}
                </span>
              </div>
            </td>

            <!-- Status -->
            <td class="text-center">
              <VChip
                :color="statusColor(car.status)"
                size="small"
                variant="tonal"
                class="font-weight-bold text-capitalize"
              >
                {{ car.status }}
              </VChip>
            </td>

            <!-- Actions (Compact & Organized) -->
            <td class="text-center">
              <div class="d-flex align-center justify-center gap-1">
                <!-- 1. Eye: View Details Page -->
                <VBtn
                  icon="tabler-eye"
                  size="small"
                  variant="tonal"
                  color="info"
                  title="عرض تفاصيل السيارة"
                  @click="router.push(`/seller/cars/details/${car.id}`)"
                />

                <!-- 2. Edit: Edit Car Form -->
                <VBtn
                  icon="tabler-pencil"
                  size="small"
                  variant="tonal"
                  color="warning"
                  title="تعديل الإعلان"
                  @click="handleEdit(car.id)"
                />

                <!-- 3. More Menu (Secondary Actions) -->
                <VMenu location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <VBtn
                      v-bind="menuProps"
                      icon="tabler-dots-vertical"
                      size="small"
                      variant="text"
                      color="secondary"
                      title="المزيد من الإجراءات"
                    />
                  </template>

                  <VList density="compact" class="rounded-lg elevation-4 py-1" style="min-width: 180px;">
                    <!-- Change Status (Sold / Archive) -->
                    <VListItem prepend-icon="tabler-arrows-diff" @click="openSellerStatusModal(car)">
                      <VListItemTitle class="text-sm">تغيير الحالة (بيع / أرشفة)</VListItemTitle>
                    </VListItem>

                    <!-- Print QR Poster -->
                    <VListItem prepend-icon="tabler-qrcode" @click="openQrModal(car)">
                      <VListItemTitle class="text-sm">بوستر QR للسيارة</VListItemTitle>
                    </VListItem>

                    <!-- Social Card -->
                    <VListItem prepend-icon="tabler-share" @click="openSocialCardModal(car)">
                      <VListItemTitle class="text-sm">بطاقة السوشيال ميديا</VListItemTitle>
                    </VListItem>

                    <VDivider class="my-1" />

                    <!-- Delete -->
                    <VListItem prepend-icon="tabler-trash" color="error" class="text-error" @click="confirmDelete(car)">
                      <VListItemTitle class="text-sm">حذف الإعلان</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Driving Car Loader while fetching -->
      <AppTableLoader
        v-else
        title="جاري فحص وتحميل أسطول سيارات المعرض..."
        subtitle="يتم تجهيز بيانات المخزون والحالات الحية للسيارات"
        :height="300"
      />

      <!-- Pagination -->
      <div class="d-flex align-center justify-space-between flex-wrap gap-3 pa-4 border-t">
        <div class="text-xs text-medium-emphasis">
          {{ showingText }}
        </div>

        <div class="d-flex align-center gap-2">
          <VPagination
            v-model="currentPage"
            :length="lastPage"
            :total-visible="5"
            rounded="circle"
            density="comfortable"
            active-color="primary"
            @update:model-value="fetchLists"
          />
        </div>
      </div>
    </VCard>

    <!-- Change Seller Status Dialog -->
    <VDialog v-model="statusDialog" max-width="440">
      <VCard class="rounded-xl pa-2">
        <VCardTitle class="text-center pt-4">
          تغيير حالة السيارة
        </VCardTitle>

        <VCardText>
          <div class="mb-4 text-sm text-center opacity-80">
            {{ statusCar?.title?.ar || statusCar?.title?.en || statusCar?.title }}
          </div>

          <VRadioGroup v-model="targetSellerStatus" class="mb-3">
            <VRadio label="تم بيع السيارة بنجاح (Sold) 🎉" value="sold" color="success" />
            <VRadio label="أرشفة / إخفاء مؤقت من العرض (Archived)" value="archived" color="secondary" />
            <VRadio label="إعادة الإعلان للمراجعة والعرض (Available)" value="available" color="primary" />
          </VRadioGroup>

          <VTextField
            v-if="targetSellerStatus === 'sold'"
            v-model="soldPriceInput"
            label="سعر البيع الفعلي (اختياري لحساب أرباح المعرض)"
            type="number"
            variant="outlined"
            density="comfortable"
            suffix="EGP"
            class="mt-2"
          />
        </VCardText>

        <VCardActions class="justify-center gap-2 pb-4">
          <VBtn variant="tonal" @click="statusDialog = false">إلغاء</VBtn>
          <VBtn color="primary" :loading="statusUpdating" @click="handleUpdateSellerStatus">
            حفظ الحالة
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard class="rounded-xl pa-2">
        <VCardTitle class="text-center pt-4">تأكيد حذف السيارة</VCardTitle>
        <VCardText class="text-center">
          هل أنت متأكد من حذف هذا الإعلان نهائياً؟ لن تتمكن من استرجاعه.
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
    <CarQrDialog v-model:is-dialog-visible="qrDialog" :car="qrSelectedCar" />

    <!-- Car Social Card Share Dialog -->
    <CarSocialCardDialog v-model:is-dialog-visible="socialCardDialog" :car="socialSelectedCar" />
  </div>
</template>

<style scoped>
/* Hero Header Styling */
.fleet-hero-banner {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.08) 0%, rgba(30, 32, 45, 0.7) 100%);
  border: 1px solid rgba(255, 107, 0, 0.2);
  backdrop-filter: blur(12px);
  position: relative;
}

.fleet-hero-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, rgba(255, 107, 0, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.breadcrumb-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: rgb(var(--v-theme-primary));
}

.fleet-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 70, 0, 0.05) 100%);
  border: 1px solid rgba(255, 107, 0, 0.3);
  box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
  flex-shrink: 0;
}

.fleet-header-icon {
  color: rgb(var(--v-theme-primary));
}

.live-pulse-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #28c76f;
  box-shadow: 0 0 8px #28c76f;
  animation: pulse-dot 1.8s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.fleet-stat-badge {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  min-width: 140px;
  transition: transform 0.2s, border-color 0.2s;
}

.fleet-stat-badge:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 107, 0, 0.3);
}

.fleet-stat-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-primary-subtle {
  background: rgba(255, 107, 0, 0.12);
}

.bg-success-subtle {
  background: rgba(40, 199, 111, 0.12);
}

.stat-caption {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.2;
}

.stat-unit {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.add-car-hero-btn {
  background: linear-gradient(135deg, #ff7a00 0%, #ff4b00 100%) !important;
  box-shadow: 0 6px 20px rgba(255, 107, 0, 0.4) !important;
  transition: all 0.25s ease;
  letter-spacing: 0.3px;
}

.add-car-hero-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(255, 107, 0, 0.55) !important;
}

/* Filter Hub Styling */
.fleet-filter-hub {
  background: rgba(var(--v-theme-surface), 0.85);
  backdrop-filter: blur(10px);
}

.filter-tabs-strip {
  background: rgba(var(--v-theme-surface), 0.95);
}

.custom-fleet-tab {
  font-weight: 600;
  font-size: 0.88rem;
  text-transform: none;
  letter-spacing: normal;
  transition: all 0.2s;
}

.tab-count-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.tab-count-success {
  background: rgba(40, 199, 111, 0.15);
  color: #28c76f;
}

.tab-count-warning {
  background: rgba(255, 159, 67, 0.15);
  color: #ff9f43;
}

.tab-count-error {
  background: rgba(234, 84, 85, 0.15);
  color: #ea5455;
}

.tab-count-info {
  background: rgba(0, 207, 232, 0.15);
  color: #00cfe8;
}
</style>
