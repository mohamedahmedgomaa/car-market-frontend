<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import carSellerApi from '../../../api/seller/carSellerApi.js'

const router = useRouter()

const BASE_URL = import.meta.env.VITE_BASE_URL

const lists = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 10

// ===== Delete =====
const deleteDialog = ref(false)
const selectedCar = ref(null)
const deleting = ref(false)

// ===== Status =====
const statusDialog = ref(false)
const statusUpdating = ref(false)
const statusCar = ref(null)
const selectedStatus = ref(null)

// ✅ عدّلهم حسب الـ statuses عندك
const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
]

const fetchLists = async (page = 1) => {
  loading.value = true
  try {
    const res = await carSellerApi.getAll({
      page,
      'filter[global]': search.value || undefined,
      perPage,
    })

    lists.value = res.data.data
    currentPage.value = res.data.meta.currentPage
    lastPage.value = res.data.meta.lastPage
    total.value = res.data.meta.total
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
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
  } finally {
    deleting.value = false
  }
}

// ===== Status handlers =====
const openStatusDialog = (car) => {
  statusCar.value = car
  selectedStatus.value = car.status || 'pending'
  statusDialog.value = true
}

const handleUpdateStatus = async () => {
  if (!statusCar.value) return
  statusUpdating.value = true

  try {
    const res = await carSellerApi.updateStatus(statusCar.value.id, {
      status: selectedStatus.value,
    })

    // ✅ تحديث الليست محليًا
    const updatedStatus = res?.data?.data?.status ?? selectedStatus.value
    const idx = lists.value.findIndex(c => c.id === statusCar.value.id)
    if (idx !== -1) lists.value[idx].status = updatedStatus

    statusDialog.value = false
  } catch (err) {
    console.error('Update status failed:', err.response?.data || err.message)
  } finally {
    statusUpdating.value = false
  }
}

const handleEdit = (id) => router.push(`/seller/cars/edit/${id}`)

watch(search, () => fetchLists(1))
onMounted(() => fetchLists())

const showingText = computed(() => {
  const start = (currentPage.value - 1) * perPage + 1
  const end = Math.min(currentPage.value * perPage, total.value)

  return total.value
    ? `Showing ${start} to ${end} of ${total.value} entries`
    : 'Showing 0 to 0 of 0 entries'
})

const statusColor = (status) => {
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'error'
  return 'success'
}

// ✅ helper: get main image url
const getMainImageUrl = (car) => {
  if (!car) return ''

  // لو backend بيبعت url جاهز
  if (car.main_image_url) return car.main_image_url

  // لو بيرجع images array
  const main = car.images?.find(i => i.is_main === 1 || i.is_main === true)
  if (main?.path) return `${BASE_URL}/storage/${main.path}`

  // fallback: أول صورة
  const first = car.images?.[0]
  if (first?.path) return `${BASE_URL}/storage/${first.path}`

  return ''
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-semibold text-gray-100">Cars List</h2>

      <VBtn color="primary" @click="$router.push('/seller/cars/create')">
        <VIcon icon="tabler-plus" start />
        Add New Car
      </VBtn>
    </div>

    <!-- Search -->
    <VTextField
      v-model="search"
      placeholder="Search cars..."
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="tabler-search"
      class="w-full max-w-sm mb-6"
      hide-details
    />

    <!-- Table -->
    <VTable v-if="!loading">
      <thead>
      <tr>
        <th style="width: 70px;">ID</th>
        <th style="width: 70px;">Image</th>
        <th>Type</th>
        <th>Title</th>
        <th>Car</th>
        <th>Price</th>
        <th>Year / Mileage</th>
        <th>Created</th>
        <th>Status</th>
        <th class="text-center" style="width: 160px;">Actions</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="car in lists" :key="car.id">
        <td>{{ car.id }}</td>

        <!-- ✅ Main Image -->
        <td>
          <VAvatar size="38" rounded="lg">
            <VImg :src="getMainImageUrl(car)" cover />
          </VAvatar>
        </td>

        <!-- Type -->
        <td>{{ car.type || '-' }}</td>

        <!-- ✅ Title -->
        <td>
          <div class="text-sm font-medium">
            {{ car.title?.en || car.title || '-' }}
          </div>
          <div v-if="car.title?.ar" class="text-xs opacity-70">
            {{ car.title.ar }}
          </div>
        </td>

        <!-- ✅ Brand / Model in one column -->
        <td>
          <div class="text-sm font-medium">
            {{ car.brand?.name?.en || '-' }} / {{ car.model?.name?.en || '-' }}
          </div>
        </td>

        <!-- Price -->
        <td>{{ car.price }}</td>

        <!-- ✅ Year / Mileage -->
        <td>
          <div class="text-sm">{{ car.year || '-' }}</div>
          <div class="text-xs opacity-70">{{ car.mileage ?? '-' }} km</div>
        </td>

        <!-- Created -->
        <td class="text-sm opacity-80">
          {{ car.created_at || '-' }}
        </td>

        <!-- ✅ Status clickable -->
        <td>
          <VChip
            size="small"
            class="cursor-pointer"
            :color="statusColor(car.status)"
            @click="openStatusDialog(car)"
          >
            {{ car.status }}
          </VChip>
        </td>

        <!-- Actions -->
        <td class="text-center">
          <div class="flex justify-center gap-2">
            <VBtn icon @click="handleEdit(car.id)">
              <VIcon icon="tabler-edit" />
            </VBtn>

<!--            <VBtn icon color="primary" variant="tonal" @click="openStatusDialog(car)">-->
<!--              <VIcon icon="tabler-adjustments" />-->
<!--            </VBtn>-->

<!--            <VBtn icon color="error" @click="confirmDelete(car)">-->
<!--              <VIcon icon="tabler-trash" />-->
<!--            </VBtn>-->
          </div>
        </td>
      </tr>
      </tbody>
    </VTable>

    <div v-else class="text-center py-4">Loading...</div>

<!--    &lt;!&ndash; Delete Dialog &ndash;&gt;-->
<!--    <VDialog v-model="deleteDialog" max-width="400">-->
<!--      <VCard>-->
<!--        <VCardTitle class="text-center">Confirm Delete</VCardTitle>-->
<!--        <VCardText class="text-center">-->
<!--          Are you sure you want to delete this car?-->
<!--        </VCardText>-->
<!--        <VCardActions class="justify-center gap-2">-->
<!--          <VBtn variant="tonal" @click="deleteDialog = false">Cancel</VBtn>-->
<!--          <VBtn color="error" :loading="deleting" @click="handleDelete">-->
<!--            Delete-->
<!--          </VBtn>-->
<!--        </VCardActions>-->
<!--      </VCard>-->
<!--    </VDialog>-->

<!--    &lt;!&ndash; ✅ Status Dialog &ndash;&gt;-->
<!--    <VDialog v-model="statusDialog" max-width="420">-->
<!--      <VCard>-->
<!--        <VCardTitle class="text-center">Update Status</VCardTitle>-->

<!--        <VCardText class="text-center">-->
<!--          <div class="mb-3 text-sm opacity-80">-->
<!--            Car: <b>{{ statusCar?.title?.en || statusCar?.title || '-' }}</b>-->
<!--          </div>-->

<!--          <VSelect-->
<!--            v-model="selectedStatus"-->
<!--            :items="statusOptions"-->
<!--            item-title="title"-->
<!--            item-value="value"-->
<!--            label="Select status"-->
<!--            variant="outlined"-->
<!--            density="comfortable"-->
<!--            hide-details-->
<!--          />-->
<!--        </VCardText>-->

<!--        <VCardActions class="justify-center gap-2">-->
<!--          <VBtn variant="tonal" @click="statusDialog = false">Cancel</VBtn>-->
<!--          <VBtn color="primary" :loading="statusUpdating" @click="handleUpdateStatus">-->
<!--            Save-->
<!--          </VBtn>-->
<!--        </VCardActions>-->
<!--      </VCard>-->
<!--    </VDialog>-->

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-500">{{ showingText }}</div>

      <div class="flex gap-1">
        <VBtn icon size="small" :disabled="currentPage === 1" @click="fetchLists(currentPage - 1)">
          <VIcon icon="tabler-chevron-left" />
        </VBtn>

        <VBtn
          v-for="page in lastPage"
          :key="page"
          size="small"
          :color="page === currentPage ? 'primary' : ''"
          variant="outlined"
          @click="fetchLists(page)"
        >
          {{ page }}
        </VBtn>

        <VBtn icon size="small" :disabled="currentPage === lastPage" @click="fetchLists(currentPage + 1)">
          <VIcon icon="tabler-chevron-right" />
        </VBtn>
      </div>
    </div>
  </div>
</template>
