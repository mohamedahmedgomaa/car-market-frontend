<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import carAdminApi from '../../../api/admin/carAdminApi.js'
import sellerAdminApi from '../../../api/admin/sellerAdminApi.js'
import PageHeroHeader from '@/components/PageHeroHeader.vue'
import AppTableLoader from '@/components/AppTableLoader.vue'

const router = useRouter()

// ================= State =================
const loading = ref(false)
const actionLoading = ref(false)
const cars = ref([])
const sellers = ref([])
const selectedSellerId = ref(null)
const searchQuery = ref('')
const activeStatusTab = ref('pending') // 'pending' by default as requested

// Pagination
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(50)

// Multi-Selection State
const selectedCarIds = ref([])

// Dialog States
const approveConfirmDialog = ref(false)
const bulkApproveDialog = ref(false)
const rejectDialog = ref(false)
const bulkRejectDialog = ref(false)
const previewDialog = ref(false)

const currentCar = ref(null)
const rejectionReason = ref('')

// Snackbars
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showToast = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// ================= Fetch Sellers =================
const fetchSellers = async () => {
  try {
    const res = await sellerAdminApi.getAll({ perPage: 200, sort: '-sort_order' })
    sellers.value = res.data?.data || []
  } catch (e) {
    console.error('Failed to load sellers:', e)
  }
}

// ================= Fetch Cars =================
const fetchCars = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      perPage: perPage.value,
      sort: '-created_at',
    }

    if (activeStatusTab.value && activeStatusTab.value !== 'all') {
      params['filter[status]'] = activeStatusTab.value
    }

    if (selectedSellerId.value) {
      params['filter[seller_id]'] = selectedSellerId.value
    }

    if (searchQuery.value && searchQuery.value.trim()) {
      params['filter[search]'] = searchQuery.value.trim()
    }

    const res = await carAdminApi.getAll(params)
    const rawData = res.data?.data || []

    cars.value = rawData
    currentPage.value = res.data?.meta?.currentPage || page
    lastPage.value = res.data?.meta?.lastPage || 1
    total.value = res.data?.meta?.total || rawData.length

    // Clean up selectedCarIds that are no longer in cars list
    // (or keep them if user wants cross-page, but here we keep valid ids)
  } catch (err) {
    console.error('Failed to fetch cars:', err)
    showToast(err.response?.data?.message || 'فشل في تحميل قائمة السيارات', 'error')
  } finally {
    loading.value = false
  }
}

// Overall Stats (Quick Counters)
const pendingCount = ref(0)
const approvedCount = ref(0)
const rejectedCount = ref(0)

const fetchCounters = async () => {
  try {
    const [pRes, aRes, rRes] = await Promise.allSettled([
      carAdminApi.getAll({ 'filter[status]': 'pending', perPage: 1 }),
      carAdminApi.getAll({ 'filter[status]': 'approved', perPage: 1 }),
      carAdminApi.getAll({ 'filter[status]': 'rejected', perPage: 1 }),
    ])

    if (pRes.status === 'fulfilled') pendingCount.value = pRes.value.data?.meta?.total ?? 0
    if (aRes.status === 'fulfilled') approvedCount.value = aRes.value.data?.meta?.total ?? 0
    if (rRes.status === 'fulfilled') rejectedCount.value = rRes.value.data?.meta?.total ?? 0
  } catch (e) {
    console.warn('Error fetching status counters:', e)
  }
}

// ================= Selection Computed & Helpers =================
const isAllSelected = computed(() => {
  if (cars.value.length === 0) return false
  return cars.value.every(car => selectedCarIds.value.includes(car.id))
})

const isSomeSelected = computed(() => {
  return selectedCarIds.value.length > 0 && !isAllSelected.value
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all on current page
    const pageIds = cars.value.map(c => c.id)
    selectedCarIds.value = selectedCarIds.value.filter(id => !pageIds.includes(id))
  } else {
    // Select all on current page
    const pageIds = cars.value.map(c => c.id)
    const set = new Set([...selectedCarIds.value, ...pageIds])
    selectedCarIds.value = Array.from(set)
  }
}

const isCarSelected = (carId) => selectedCarIds.value.includes(carId)

const toggleCarSelection = (carId) => {
  const index = selectedCarIds.value.indexOf(carId)
  if (index > -1) {
    selectedCarIds.value.splice(index, 1)
  } else {
    selectedCarIds.value.push(carId)
  }
}

const clearSelection = () => {
  selectedCarIds.value = []
}

// ================= Actions: Approve / Reject =================

// Single Approve
const openApproveConfirm = (car) => {
  currentCar.value = car
  approveConfirmDialog.value = true
}

const handleApproveSingle = async () => {
  if (!currentCar.value) return
  actionLoading.value = true
  try {
    await carAdminApi.updateStatus(currentCar.value.id, { status: 'approved' })
    showToast(`تمت الموافقة على السيارة #${currentCar.value.id} والسماح بظهورها في الموقع بنجاح!`)
    approveConfirmDialog.value = false
    currentCar.value = null
    await fetchCars(currentPage.value)
    await fetchCounters()
  } catch (err) {
    console.error('Approve failed:', err)
    showToast(err.response?.data?.message || 'فشلت عملية الموافقة', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Single Reject
const openRejectDialog = (car) => {
  currentCar.value = car
  rejectionReason.value = ''
  rejectDialog.value = true
}

const handleRejectSingle = async () => {
  if (!currentCar.value) return
  actionLoading.value = true
  try {
    await carAdminApi.updateStatus(currentCar.value.id, {
      status: 'rejected',
      rejection_reason: rejectionReason.value.trim() || undefined,
    })
    showToast(`تم رفض السيارة #${currentCar.value.id} وإخطار البائع`)
    rejectDialog.value = false
    currentCar.value = null
    rejectionReason.value = ''
    await fetchCars(currentPage.value)
    await fetchCounters()
  } catch (err) {
    console.error('Reject failed:', err)
    showToast(err.response?.data?.message || 'فشلت عملية الرفض', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Bulk Approve ("الموافقة على الكل أو المحدد")
const handleBulkApprove = async () => {
  if (selectedCarIds.value.length === 0) return
  actionLoading.value = true
  try {
    const idsToApprove = [...selectedCarIds.value]

    // Use dedicated bulk API with fallback
    let successCount = 0
    try {
      const res = await carAdminApi.bulkUpdateStatus({
        car_ids: idsToApprove,
        status: 'approved',
      })
      successCount = res.data?.data?.updated_count || idsToApprove.length
    } catch (apiErr) {
      // Fallback: update in parallel
      const results = await Promise.allSettled(
        idsToApprove.map(id => carAdminApi.updateStatus(id, { status: 'approved' }))
      )
      successCount = results.filter(r => r.status === 'fulfilled').length
    }

    showToast(`تمت الموافقة على ${successCount} سيارة بنجاح وأصبحت ظاهرة في الموقع!`)
    bulkApproveDialog.value = false
    selectedCarIds.value = []
    await fetchCars(currentPage.value)
    await fetchCounters()
  } catch (err) {
    console.error('Bulk approve failed:', err)
    showToast(err.response?.data?.message || 'حدث خطأ أثناء الموافقة الجماعية', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Bulk Reject
const handleBulkReject = async () => {
  if (selectedCarIds.value.length === 0) return
  actionLoading.value = true
  try {
    const idsToReject = [...selectedCarIds.value]
    const reason = rejectionReason.value.trim()

    let count = 0
    try {
      const res = await carAdminApi.bulkUpdateStatus({
        car_ids: idsToReject,
        status: 'rejected',
        rejection_reason: reason || undefined,
      })
      count = res.data?.data?.updated_count || idsToReject.length
    } catch (apiErr) {
      const results = await Promise.allSettled(
        idsToReject.map(id => carAdminApi.updateStatus(id, {
          status: 'rejected',
          rejection_reason: reason || undefined,
        }))
      )
      count = results.filter(r => r.status === 'fulfilled').length
    }

    showToast(`تم رفض ${count} سيارة وإخطار البائعين`)
    bulkRejectDialog.value = false
    selectedCarIds.value = []
    rejectionReason.value = ''
    await fetchCars(currentPage.value)
    await fetchCounters()
  } catch (err) {
    console.error('Bulk reject failed:', err)
    showToast(err.response?.data?.message || 'حدث خطأ أثناء الرفض الجماعي', 'error')
  } finally {
    actionLoading.value = false
  }
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

// Navigate to standalone Car Details Page
const goToCarDetails = (carId) => {
  if (carId) {
    router.push(`/admin/cars/${carId}`)
  }
}

// Preview Dialog
const openPreview = (car) => {
  goToCarDetails(car.id)
}

// ================= Formatting & Localization Helpers =================
const getLocalizedName = (val) => {
  if (!val) return ''
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        return parsed.ar || parsed.en || Object.values(parsed)[0] || val
      } catch (e) {
        return val
      }
    }
    return val
  }
  if (typeof val === 'object') {
    return val.ar || val.en || Object.values(val)[0] || ''
  }
  return String(val)
}

const getBrandName = (car) => {
  if (!car) return ''
  return getLocalizedName(car.brand?.name || car.brand)
}

const getModelName = (car) => {
  if (!car) return ''
  return getLocalizedName(car.model?.name || car.model)
}

const getLocationName = (car) => {
  if (!car) return ''
  const gov = getLocalizedName(car.governorate?.name || car.governorate)
  const city = getLocalizedName(car.city?.name || car.city)
  if (gov && city) return `${gov}، ${city}`
  return gov || city || 'مصر'
}

const getTitle = (car) => {
  if (!car) return ''
  const currentLang = 'ar'
  if (car.title && typeof car.title === 'object') {
    return car.title[currentLang] || car.title.ar || car.title.en || 'بدون عنوان'
  }
  return getLocalizedName(car.title || car.title_ar || car.title_en || 'بدون عنوان')
}

const getStoreName = (seller) => {
  if (!seller) return 'بائع مستقل'
  if (seller.store_name && typeof seller.store_name === 'object') {
    return seller.store_name.ar || seller.store_name.en || seller.name || 'معرض سيارات'
  }
  return getLocalizedName(seller.store_name) || seller.name || 'معرض سيارات'
}

const getMainImage = (car) => {
  if (!car) return '/placeholder-car.jpg'
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const main = car.images.find(img => img.is_main) || car.images[0]
    return main.path || main.url || '/placeholder-car.jpg'
  }
  return car.main_image || '/placeholder-car.jpg'
}

const formatPrice = (price, currency = 'EGP') => {
  if (!price && price !== 0) return 'السعر عند الاتصال'
  return `${Number(price).toLocaleString()} ${currency || 'EGP'}`
}

const getStatusChip = (status) => {
  switch (status) {
    case 'approved':
      return { text: 'موافق عليه (معروض بالموقع)', color: 'success', icon: 'tabler-circle-check-filled' }
    case 'rejected':
      return { text: 'مرفوض', color: 'error', icon: 'tabler-circle-x-filled' }
    case 'sold':
      return { text: 'تم البيع', color: 'secondary', icon: 'tabler-tag-filled' }
    case 'archived':
      return { text: 'مؤرشف', color: 'grey', icon: 'tabler-archive-filled' }
    case 'pending':
    default:
      return { text: 'قيد المراجعة والانتظار', color: 'warning', icon: 'tabler-clock-filled' }
  }
}

// Watch filters
watch([activeStatusTab, selectedSellerId], () => {
  currentPage.value = 1
  fetchCars(1)
})

let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchCars(1)
  }, 400)
})

onMounted(() => {
  fetchSellers()
  fetchCars(1)
  fetchCounters()
})
</script>

<template>
  <div class="admin-car-approvals-page">
    <!-- Header -->
    <PageHeroHeader
      title="الموافقة على سيارات البائعين (Seller Cars Approval)"
      subtitle="إدارة ومراجعة سيارات البائعين، اختيار تحديد الكل أو سيارات محددة، والموافقة عليها بنقرة واحدة للسماح بظهورها في الموقع"
      icon="tabler-shield-check"
      :breadcrumbs="[
        { title: 'لوحة التحكم', to: '/admin/dashboard', icon: 'tabler-smart-home' },
        { title: 'إدارة السيارات', to: '/admin/cars', icon: 'tabler-car' },
        { title: 'موافقة السيارات' }
      ]"
    >
      <template #actions>
        <VBtn
          variant="tonal"
          color="primary"
          prepend-icon="tabler-car"
          @click="$router.push('/admin/cars')"
        >
          كافة سيارات النظام
        </VBtn>
      </template>
    </PageHeroHeader>

    <!-- Top Statistics Grid -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard
          class="stat-pill-card cursor-pointer border rounded-xl"
          :class="{ 'active-card-pill border-warning elevation-4': activeStatusTab === 'pending' }"
          @click="activeStatusTab = 'pending'"
        >
          <VCardText class="d-flex align-center justify-space-between py-4">
            <div>
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1">بانتظار الموافقة</div>
              <div class="text-h4 font-weight-bold text-warning">{{ pendingCount }}</div>
            </div>
            <VAvatar color="warning" variant="tonal" size="48" rounded="lg">
              <VIcon icon="tabler-clock-hour-4" size="26" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard
          class="stat-pill-card cursor-pointer border rounded-xl"
          :class="{ 'active-card-pill border-success elevation-4': activeStatusTab === 'approved' }"
          @click="activeStatusTab = 'approved'"
        >
          <VCardText class="d-flex align-center justify-space-between py-4">
            <div>
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1">موافق عليها (معروضة)</div>
              <div class="text-h4 font-weight-bold text-success">{{ approvedCount }}</div>
            </div>
            <VAvatar color="success" variant="tonal" size="48" rounded="lg">
              <VIcon icon="tabler-circle-check" size="26" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard
          class="stat-pill-card cursor-pointer border rounded-xl"
          :class="{ 'active-card-pill border-error elevation-4': activeStatusTab === 'rejected' }"
          @click="activeStatusTab = 'rejected'"
        >
          <VCardText class="d-flex align-center justify-space-between py-4">
            <div>
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1">سيارات مرفوضة</div>
              <div class="text-h4 font-weight-bold text-error">{{ rejectedCount }}</div>
            </div>
            <VAvatar color="error" variant="tonal" size="48" rounded="lg">
              <VIcon icon="tabler-circle-x" size="26" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" md="3">
        <VCard
          class="stat-pill-card cursor-pointer border rounded-xl"
          :class="{ 'active-card-pill border-primary elevation-4': activeStatusTab === 'all' }"
          @click="activeStatusTab = 'all'"
        >
          <VCardText class="d-flex align-center justify-space-between py-4">
            <div>
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1">كافة سيارات البائعين</div>
              <div class="text-h4 font-weight-bold text-primary">{{ pendingCount + approvedCount + rejectedCount }}</div>
            </div>
            <VAvatar color="primary" variant="tonal" size="48" rounded="lg">
              <VIcon icon="tabler-car" size="26" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters & Search Toolbar -->
    <VCard class="mb-6 rounded-xl border elevation-1">
      <VCardText class="pa-4">
        <VRow dense align="center">
          <!-- Search input -->
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              density="compact"
              variant="outlined"
              placeholder="ابحث برقم الإعلان، موديل السيارة، أو اسم المعرض..."
              prepend-inner-icon="tabler-search"
              clearable
              hide-details
            />
          </VCol>

          <!-- Filter by Seller -->
          <VCol cols="12" sm="6" md="4">
            <VSelect
              v-model="selectedSellerId"
              :items="sellers"
              item-title="name"
              item-value="id"
              density="compact"
              variant="outlined"
              label="تصفية حسب المعرض / البائع"
              placeholder="جميع المعارض"
              clearable
              hide-details
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props" :subtitle="item.raw.phone || item.raw.email">
                  <template #title>
                    {{ getStoreName(item.raw) }}
                  </template>
                </VListItem>
              </template>
              <template #selection="{ item }">
                {{ getStoreName(item.raw) }}
              </template>
            </VSelect>
          </VCol>

          <!-- Status Tabs -->
          <VCol cols="12" sm="6" md="4" class="d-flex justify-end gap-2">
            <VTabs v-model="activeStatusTab" density="compact" color="primary">
              <VTab value="pending">
                <VIcon icon="tabler-clock" size="18" class="me-1 text-warning" />
                المعلق ({{ pendingCount }})
              </VTab>
              <VTab value="approved">
                <VIcon icon="tabler-check" size="18" class="me-1 text-success" />
                المعتمد
              </VTab>
              <VTab value="rejected">
                <VIcon icon="tabler-x" size="18" class="me-1 text-error" />
                المرفوض
              </VTab>
              <VTab value="all">الكل</VTab>
            </VTabs>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Bulk Action Floating Alert Bar (When cars are selected) -->
    <VAlert
      v-if="selectedCarIds.length > 0"
      color="primary"
      variant="tonal"
      class="mb-6 rounded-xl border elevation-2 sticky-bulk-bar"
      prominent
    >
      <div class="d-flex align-center justify-space-between flex-wrap gap-4 w-100">
        <div class="d-flex align-center gap-2">
          <VIcon icon="tabler-checkbox" size="24" color="primary" />
          <span class="text-subtitle-1 font-weight-bold">
            تم تحديد <span class="text-primary font-weight-black text-h6">{{ selectedCarIds.length }}</span> سيارة
          </span>
          <VBtn size="small" variant="text" color="secondary" @click="clearSelection">
            إلغاء التحديد
          </VBtn>
        </div>

        <div class="d-flex align-center flex-wrap gap-2">
          <!-- Bulk Approve Button -->
          <VBtn
            color="success"
            variant="elevated"
            rounded="pill"
            prepend-icon="tabler-circle-check"
            class="font-weight-bold px-5"
            :loading="actionLoading"
            @click="bulkApproveDialog = true"
          >
            الموافقة على السيارات المحددة (السماح بالظهور بالموقع)
          </VBtn>

          <!-- Bulk Reject Button -->
          <VBtn
            color="error"
            variant="tonal"
            rounded="pill"
            prepend-icon="tabler-circle-x"
            :loading="actionLoading"
            @click="bulkRejectDialog = true"
          >
            رفض السيارات المحددة
          </VBtn>
        </div>
      </div>
    </VAlert>

    <!-- Main Table Card -->
    <VCard class="rounded-xl border elevation-2 overflow-hidden">
      <!-- Table Header & Select All Controls -->
      <div class="pa-4 bg-surface d-flex align-center justify-space-between flex-wrap gap-3 border-b">
        <div class="d-flex align-center gap-3">
          <!-- Master Select All Checkbox -->
          <VCheckbox
            :model-value="isAllSelected"
            :indeterminate="isSomeSelected"
            hide-details
            density="compact"
            color="primary"
            class="me-2"
            @click.stop="toggleSelectAll"
          />
          <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">
            {{ isAllSelected ? 'إلغاء تحديد كل الصفحة' : 'تحديد الكل في هذه الصفحة (' + cars.length + ' سيارة)' }}
          </span>
        </div>

        <div class="text-caption text-medium-emphasis">
          إجمالي النتائج: <strong class="text-high-emphasis">{{ total }}</strong> سيارة
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-12">
        <AppTableLoader />
      </div>

      <!-- Empty State -->
      <div v-else-if="cars.length === 0" class="text-center py-16 px-4">
        <VAvatar color="primary" variant="tonal" size="72" class="mb-4">
          <VIcon icon="tabler-car-off" size="36" />
        </VAvatar>
        <h3 class="text-h6 font-weight-bold mb-2">لا توجد سيارات مطابقة</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          لم يتم العثور على أي سيارات في هذا القسم أو تحت الفلاتر المحددة حالياً.
        </p>
        <VBtn
          v-if="activeStatusTab !== 'pending'"
          variant="tonal"
          color="primary"
          rounded="pill"
          @click="activeStatusTab = 'pending'"
        >
          الانتقال لقسم السيارات المعلقة
        </VBtn>
      </div>

      <!-- Data Table -->
      <VTable v-else hover class="text-no-wrap car-approvals-table">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-900">
            <th class="text-center" style="width: 48px;">
              <VCheckbox
                :model-value="isAllSelected"
                :indeterminate="isSomeSelected"
                hide-details
                density="compact"
                color="primary"
                @click.stop="toggleSelectAll"
              />
            </th>
            <th class="text-start">السيارة</th>
            <th class="text-start">المعرض / البائع</th>
            <th class="text-start">السعر والمواصفات</th>
            <th class="text-center">تاريخ الإضافة</th>
            <th class="text-center">الحالة الحالية</th>
            <th class="text-center" style="width: 220px;">إجراءات الاعتماد</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="car in cars"
            :key="car.id"
            :class="{ 'selected-row': isCarSelected(car.id) }"
          >
            <!-- Checkbox -->
            <td class="text-center">
              <VCheckbox
                :model-value="isCarSelected(car.id)"
                hide-details
                density="compact"
                color="primary"
                @click.stop="toggleCarSelection(car.id)"
              />
            </td>

            <!-- Car Thumbnail & Title -->
            <td>
              <div class="d-flex align-center gap-3 py-2">
                <VAvatar
                  size="64"
                  rounded="lg"
                  class="cursor-pointer border elevation-1 flex-shrink-0 hover:scale-105 transition-transform"
                  @click="goToCarDetails(car.id)"
                  v-tooltip="'فتح صفحة تفاصيل السيارة'"
                >
                  <VImg :src="getMainImage(car)" cover />
                </VAvatar>
                <div>
                  <div class="d-flex align-center gap-2 mb-1 cursor-pointer" @click="goToCarDetails(car.id)">
                    <span class="text-subtitle-2 font-weight-bold text-high-emphasis hover:text-primary">
                      {{ getTitle(car) }}
                    </span>
                    <VChip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                      #{{ car.id }}
                    </VChip>
                  </div>
                  <div class="text-caption text-medium-emphasis d-flex flex-wrap align-center gap-2">
                    <span>{{ car.year }}</span>
                    <span>•</span>
                    <span class="font-weight-medium text-high-emphasis">{{ getBrandName(car) }} {{ getModelName(car) }}</span>
                    <span>•</span>
                    <span>{{ getLocationName(car) }}</span>
                    <span v-if="car.condition">• {{ car.condition === 'new' ? 'جديدة' : 'مستعملة' }}</span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Seller / Showroom -->
            <td>
              <div class="d-flex align-center gap-2 py-2">
                <VAvatar size="36" color="primary" variant="tonal" rounded="circle">
                  <VImg v-if="car.seller?.store_logo" :src="car.seller.store_logo" cover />
                  <VIcon v-else icon="tabler-building-store" size="18" />
                </VAvatar>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ getStoreName(car.seller) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ car.seller?.phone || car.phone_number || 'بدون هاتف' }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Price & Specs -->
            <td>
              <div>
                <div class="text-subtitle-2 font-weight-black text-primary">
                  {{ formatPrice(car.price, car.currency) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ car.mileage ? car.mileage.toLocaleString() + ' كم' : '0 كم' }}
                  <span v-if="car.transmission"> • {{ car.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال' }}</span>
                </div>
              </div>
            </td>

            <!-- Created Date -->
            <td class="text-center text-caption text-medium-emphasis">
              <div>{{ car.created_at ? new Date(car.created_at).toLocaleDateString('ar-EG') : '-' }}</div>
              <div class="text-xs opacity-70">{{ car.created_at ? new Date(car.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '' }}</div>
            </td>

            <!-- Status Badge -->
            <td class="text-center">
              <VChip
                size="small"
                :color="getStatusChip(car.status).color"
                variant="tonal"
                class="font-weight-bold"
              >
                <VIcon :icon="getStatusChip(car.status).icon" size="14" class="me-1" />
                {{ getStatusChip(car.status).text }}
              </VChip>
            </td>

            <!-- Action Buttons -->
            <td class="text-center">
              <div class="d-flex align-center justify-center gap-1">
                <!-- Quick Approve Button (السماح بالظهور) -->
                <VBtn
                  v-if="car.status !== 'approved'"
                  color="success"
                  variant="flat"
                  size="small"
                  rounded="pill"
                  class="font-weight-bold"
                  prepend-icon="tabler-check"
                  @click="openApproveConfirm(car)"
                  v-tooltip="'الموافقة والسماح بالظهور في الموقع'"
                >
                  موافقة
                </VBtn>

                <!-- If already approved, show active checkmark -->
                <VBtn
                  v-else
                  color="success"
                  variant="tonal"
                  size="small"
                  rounded="pill"
                  disabled
                >
                  معروض بالموقع ✅
                </VBtn>

                <!-- Quick Reject Button -->
                <VBtn
                  v-if="car.status !== 'rejected'"
                  color="error"
                  variant="tonal"
                  size="small"
                  icon
                  @click="openRejectDialog(car)"
                  v-tooltip="'رفض السيارة مع سبب'"
                >
                  <VIcon icon="tabler-x" size="18" />
                </VBtn>

                <!-- View Standalone Car Details Page -->
                <VBtn
                  color="info"
                  variant="tonal"
                  size="small"
                  icon
                  @click="goToCarDetails(car.id)"
                  v-tooltip="'فتح صفحة تفاصيل السيارة الكاملة'"
                >
                  <VIcon icon="tabler-external-link" size="18" />
                </VBtn>

                <!-- Edit Car -->
                <VBtn
                  color="primary"
                  variant="text"
                  size="small"
                  icon
                  @click="$router.push(`/admin/cars/edit/${car.id}`)"
                  v-tooltip="'تعديل بيانات السيارة'"
                >
                  <VIcon icon="tabler-edit" size="18" />
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="pa-4 d-flex justify-center border-t">
        <VPagination
          v-model="currentPage"
          :length="lastPage"
          total-visible="7"
          rounded="circle"
          @update:model-value="fetchCars"
        />
      </div>
    </VCard>

    <!-- ================= DIALOGS ================= -->

    <!-- Single Approve Confirm Dialog -->
    <VDialog v-model="approveConfirmDialog" max-width="560">
      <VCard class="rounded-2xl overflow-hidden border-t-4 border-success pa-0">
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
          <!-- Car Preview Box -->
          <div v-if="currentCar" class="d-flex align-center gap-3 pa-3 rounded-xl bg-surface border mb-4">
            <VAvatar size="64" rounded="lg" class="border flex-shrink-0">
              <VImg :src="getMainImage(currentCar)" cover />
            </VAvatar>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-center justify-space-between gap-2 mb-1">
                <span class="text-subtitle-2 font-weight-bold text-truncate">{{ getTitle(currentCar) }}</span>
                <VChip size="x-small" color="primary" variant="tonal">#{{ currentCar?.id }}</VChip>
              </div>
              <div class="text-caption text-medium-emphasis d-flex align-center gap-2">
                <span>{{ getBrandName(currentCar) }} {{ getModelName(currentCar) }}</span>
                <span>•</span>
                <span class="text-primary font-weight-bold">{{ formatPrice(currentCar?.price, currentCar?.currency) }}</span>
              </div>
              <div class="text-xs text-medium-emphasis mt-1">
                البائع: <strong>{{ getStoreName(currentCar?.seller) }}</strong>
              </div>
            </div>
          </div>

          <VAlert type="success" variant="tonal" density="compact" class="rounded-xl mb-2">
            <template #text>
              <div class="text-body-2">
                ✅ بمجرد التأكيد، ستظهر السيارة لجميع زوار المنصة في نتائج البحث والصفحة الرئيسية، وسيتم إشعار البائع بنجاح اعتماد سيارته.
              </div>
            </template>
          </VAlert>
        </VCardText>

        <VCardActions class="px-6 pb-6 pt-2 d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" rounded="pill" class="px-5" @click="approveConfirmDialog = false">
            تراجع
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            rounded="pill"
            class="px-6 font-weight-bold"
            prepend-icon="tabler-check"
            :loading="actionLoading"
            @click="handleApproveSingle"
          >
            نعم، اعتمد السيارة الآن
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Approve Dialog -->
    <VDialog v-model="bulkApproveDialog" max-width="560">
      <VCard class="rounded-2xl overflow-hidden border-t-4 border-success pa-0">
        <div class="pa-6 text-center bg-gradient-to-b from-success/10 to-transparent">
          <div class="d-inline-flex pa-4 rounded-circle bg-success/20 mb-3 text-success">
            <VIcon icon="tabler-checklist" size="48" />
          </div>
          <h2 class="text-h5 font-weight-black text-high-emphasis mb-1">
            موافقة جماعية على السيارات المحددة
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            أنت على وشك الموافقة على <strong class="text-success text-h6">{{ selectedCarIds.length }}</strong> سيارة محددة دفعة واحدة
          </p>
        </div>

        <VCardText class="px-6 py-2">
          <VAlert type="info" variant="tonal" density="compact" class="rounded-xl mb-3">
            <template #text>
              <div class="text-body-2">
                سيتم تغيير حالة جميع السيارات المحددة إلى <strong>موافق عليها (Approved)</strong> وستظهر فوراً في صفحات الموقع وقوائم البحث، مع إرسال إشعارات لجميع البائعين.
              </div>
            </template>
          </VAlert>
        </VCardText>

        <VCardActions class="px-6 pb-6 pt-2 d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" rounded="pill" class="px-5" @click="bulkApproveDialog = false">
            تراجع
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            rounded="pill"
            class="px-6 font-weight-bold"
            prepend-icon="tabler-check"
            :loading="actionLoading"
            @click="handleBulkApprove"
          >
            تأكيد الموافقة على ({{ selectedCarIds.length }}) سيارة
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Single Reject Dialog -->
    <VDialog v-model="rejectDialog" max-width="580">
      <VCard class="rounded-2xl overflow-hidden border-t-4 border-error pa-0">
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
          <!-- Car Preview Box -->
          <div v-if="currentCar" class="d-flex align-center gap-3 pa-3 rounded-xl bg-surface border mb-4">
            <VAvatar size="54" rounded="lg" class="border flex-shrink-0">
              <VImg :src="getMainImage(currentCar)" cover />
            </VAvatar>
            <div class="flex-grow-1 min-w-0">
              <div class="text-subtitle-2 font-weight-bold text-truncate">{{ getTitle(currentCar) }}</div>
              <div class="text-caption text-medium-emphasis">
                كود #{{ currentCar?.id }} • المعرض: {{ getStoreName(currentCar?.seller) }}
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
          <VBtn variant="tonal" color="secondary" rounded="pill" class="px-5" @click="rejectDialog = false">
            إلغاء
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            rounded="pill"
            class="px-6 font-weight-bold"
            prepend-icon="tabler-circle-x"
            :loading="actionLoading"
            @click="handleRejectSingle"
          >
            تأكيد الرفض وإشعار البائع
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Reject Dialog -->
    <VDialog v-model="bulkRejectDialog" max-width="580">
      <VCard class="rounded-2xl overflow-hidden border-t-4 border-error pa-0">
        <div class="pa-6 text-center bg-gradient-to-b from-error/10 to-transparent">
          <div class="d-inline-flex pa-4 rounded-circle bg-error/20 mb-3 text-error">
            <VIcon icon="tabler-circle-x" size="48" />
          </div>
          <h2 class="text-h5 font-weight-black text-high-emphasis mb-1">
            رفض جماعي للسيارات المحددة
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            سيتم رفض عدد <strong class="text-error text-h6">{{ selectedCarIds.length }}</strong> سيارة محددة وإخفاؤها من الموقع
          </p>
        </div>

        <VCardText class="px-6 py-2">
          <!-- Quick Select Reasons -->
          <div class="mb-3">
            <label class="text-caption font-weight-bold text-medium-emphasis mb-2 d-block">
              اختر سبباً سريعاً موحداً:
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

          <VTextarea
            v-model="rejectionReason"
            label="سبب الرفض الموحد (سيصل للبائعين في الإشعار)"
            placeholder="اكتب سبب الرفض ليتم إرساله للبائعين..."
            variant="outlined"
            rows="3"
            class="mb-2"
          />
        </VCardText>

        <VCardActions class="px-6 pb-6 pt-2 d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" rounded="pill" class="px-5" @click="bulkRejectDialog = false">
            تراجع
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            rounded="pill"
            class="px-6 font-weight-bold"
            prepend-icon="tabler-circle-x"
            :loading="actionLoading"
            @click="handleBulkReject"
          >
            تأكيد رفض ({{ selectedCarIds.length }}) سيارة
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Preview Car Details Dialog -->
    <VDialog v-model="previewDialog" max-width="800">
      <VCard v-if="currentCar" class="rounded-xl overflow-hidden">
        <div class="relative bg-slate-900" style="max-height: 380px; overflow: hidden;">
          <VImg :src="getMainImage(currentCar)" height="360" cover />
          <div class="absolute top-4 right-4 d-flex gap-2">
            <VChip color="primary" variant="elevated" class="font-weight-bold">
              كود #{{ currentCar.id }}
            </VChip>
            <VChip :color="getStatusChip(currentCar.status).color" variant="elevated" class="font-weight-bold">
              {{ getStatusChip(currentCar.status).text }}
            </VChip>
          </div>
        </div>

        <VCardText class="pa-6">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
            <h2 class="text-h5 font-weight-black text-high-emphasis">{{ getTitle(currentCar) }}</h2>
            <div class="text-h5 font-weight-black text-primary">
              {{ formatPrice(currentCar.price, currentCar.currency) }}
            </div>
          </div>

          <div class="d-flex flex-wrap gap-3 mb-4">
            <VChip size="small" variant="tonal" prepend-icon="tabler-calendar">
              موديل {{ currentCar.year }}
            </VChip>
            <VChip size="small" variant="tonal" prepend-icon="tabler-dashboard">
              {{ currentCar.mileage ? currentCar.mileage.toLocaleString() + ' كم' : '0 كم' }}
            </VChip>
            <VChip size="small" variant="tonal" prepend-icon="tabler-manual-gearbox">
              {{ currentCar.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي' }}
            </VChip>
            <VChip size="small" variant="tonal" prepend-icon="tabler-gas-station">
              {{ currentCar.fuel_type || 'بنزين' }}
            </VChip>
          </div>

          <VDivider class="my-4" />

          <!-- Seller Info -->
          <div class="pa-4 rounded-xl bg-slate-50 dark:bg-slate-900 border mb-4">
            <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">بيانات البائع / المعرض:</div>
            <div class="d-flex align-center justify-space-between flex-wrap gap-3">
              <div class="d-flex align-center gap-3">
                <VAvatar size="44" color="primary" variant="tonal">
                  <VImg v-if="currentCar.seller?.store_logo" :src="currentCar.seller.store_logo" cover />
                  <VIcon v-else icon="tabler-building-store" size="22" />
                </VAvatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ getStoreName(currentCar.seller) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    الهاتف: {{ currentCar.seller?.phone || currentCar.phone_number || '-' }}
                  </div>
                </div>
              </div>

              <VBtn
                v-if="currentCar.seller?.id"
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="tabler-external-link"
                :href="`/user/sellers/${currentCar.seller.id}`"
                target="_blank"
              >
                زيارة المعرض
              </VBtn>
            </div>
          </div>

          <!-- Quick Car Links if available -->
          <div v-if="currentCar.youtube_url || currentCar.instagram_url" class="d-flex gap-2 mb-2">
            <VBtn
              v-if="currentCar.youtube_url"
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="tabler-brand-youtube"
              :href="currentCar.youtube_url"
              target="_blank"
            >
              فيديو YouTube
            </VBtn>
            <VBtn
              v-if="currentCar.instagram_url"
              size="small"
              variant="tonal"
              color="pink"
              prepend-icon="tabler-brand-instagram"
              :href="currentCar.instagram_url"
              target="_blank"
            >
              فيديو Instagram
            </VBtn>
          </div>
        </VCardText>

        <VCardActions class="pa-4 bg-slate-50 dark:bg-slate-900 border-t d-flex justify-space-between">
          <VBtn variant="text" @click="previewDialog = false">إغلاق</VBtn>

          <div class="d-flex gap-2">
            <VBtn
              v-if="currentCar.status !== 'approved'"
              color="success"
              variant="elevated"
              rounded="pill"
              prepend-icon="tabler-check"
              @click="previewDialog = false; openApproveConfirm(currentCar)"
            >
              الموافقة والسماح بالظهور
            </VBtn>
            <VBtn
              v-if="currentCar.status !== 'rejected'"
              color="error"
              variant="tonal"
              rounded="pill"
              prepend-icon="tabler-x"
              @click="previewDialog = false; openRejectDialog(currentCar)"
            >
              رفض الإعلان
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar Notifications -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top center"
      timeout="3500"
      rounded="pill"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.stat-pill-card {
  transition: all 0.25s ease;
}
.stat-pill-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}
.active-card-pill {
  border-width: 2px !important;
}
.sticky-bulk-bar {
  position: sticky;
  top: 75px;
  z-index: 20;
}
.selected-row {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}
.car-approvals-table td {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
</style>
