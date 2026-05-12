<script setup>
import { ref, onMounted } from 'vue'
import dashboardAdminApi from '@/api/admin/dashboardAdminApi'

const stats = ref({
  cars: { total: 0, pending: 0, approved: 0 },
  users: { total: 0 },
  sellers: { total: 0 }
})

const brandStats = ref([])
const recentCars = ref([])
const loading = ref(true)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const res = await dashboardAdminApi.getStats()
    const data = res.data.data
    stats.value = data.stats
    brandStats.value = data.brandStats
    recentCars.value = data.recentCars
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

const statCards = [
  { title: 'Total Vehicles', key: 'cars.total', icon: 'tabler-car', color: 'primary' },
  { title: 'Pending Review', key: 'cars.pending', icon: 'tabler-hourglass-high', color: 'warning' },
  { title: 'Active Sellers', key: 'sellers.total', icon: 'tabler-user-dollar', color: 'success' },
  { title: 'Total Users', key: 'users.total', icon: 'tabler-users', color: 'info' },
]

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}
</script>

<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Overview Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Welcome back! Here's what's happening with NegmCars today.</p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-refresh"
        variant="tonal"
        :loading="loading"
        @click="fetchDashboardData"
      >
        Refresh Data
      </VBtn>
    </div>

    <!-- Stats Grid -->
    <VRow class="mb-8">
      <VCol
        v-for="card in statCards"
        :key="card.title"
        cols="12"
        sm="6"
        md="3"
      >
        <VCard class="stat-card" elevation="2">
          <VCardText class="d-flex align-center pa-6">
            <VAvatar
              :color="card.color"
              variant="tonal"
              size="54"
              rounded="lg"
              class="me-4"
            >
              <VIcon :icon="card.icon" size="30" />
            </VAvatar>
            <div>
              <div class="text-caption text-uppercase font-weight-bold opacity-70">{{ card.title }}</div>
              <div class="text-h4 font-weight-black">
                <VSkeletonLoader v-if="loading" type="text" width="50" />
                <span v-else>{{ getNestedValue(stats, card.key) }}</span>
              </div>
            </div>
          </VCardText>
          <div class="stat-progress" :style="{ background: `var(--v-${card.color}-base)`, opacity: 0.1 }"></div>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <!-- Recent Inventory -->
      <VCol cols="12" md="8">
        <VCard class="dashboard-card h-100 overflow-hidden">
          <VCardTitle class="pa-6 d-flex align-center">
            <VIcon icon="tabler-list-details" class="me-3 text-primary" />
            <span class="font-weight-bold">Recent Inventory Arrivals</span>
            <VSpacer />
            <VBtn variant="text" size="small" to="/admin/cars" class="text-none">View All Listings</VBtn>
          </VCardTitle>
          <VDivider />
          <VTable class="recent-cars-table">
            <thead>
              <tr>
                <th class="text-uppercase text-caption font-weight-bold">Vehicle</th>
                <th class="text-uppercase text-caption font-weight-bold">Seller</th>
                <th class="text-uppercase text-caption font-weight-bold">Status</th>
                <th class="text-uppercase text-caption font-weight-bold text-end">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" v-for="i in 5" :key="i">
                <td colspan="4"><VSkeletonLoader type="table-row" /></td>
              </tr>
              <tr v-else v-for="car in recentCars" :key="car.id">
                <td>
                  <div class="d-flex align-center py-2">
                    <VAvatar size="40" rounded="lg" class="me-3">
                      <VImg :src="car.main_image_url || car.images?.[0]?.path || '/placeholder-car.png'" cover />
                    </VAvatar>
                    <div>
                      <div class="text-body-2 font-weight-bold">{{ car.title?.en || car.title }}</div>
                      <div class="text-caption">{{ car.brand?.name?.en }} {{ car.model?.name?.en }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="text-body-2">{{ car.seller?.name || 'Anonymous' }}</div>
                </td>
                <td>
                  <VChip
                    :color="car.status === 'approved' ? 'success' : car.status === 'pending' ? 'warning' : 'error'"
                    size="x-small"
                    class="text-uppercase font-weight-bold"
                  >
                    {{ car.status }}
                  </VChip>
                </td>
                <td class="text-end text-caption text-medium-emphasis">
                  {{ new Date(car.created_at).toLocaleDateString() }}
                </td>
              </tr>
              <tr v-if="!loading && recentCars.length === 0">
                <td colspan="4" class="text-center py-8 text-medium-emphasis">No recent inventory found</td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <!-- Distribution by Brand -->
      <VCol cols="12" md="4">
        <VCard class="dashboard-card h-100 overflow-hidden">
          <VCardTitle class="pa-6 d-flex align-center">
            <VIcon icon="tabler-chart-pie" class="me-3 text-secondary" />
            <span class="font-weight-bold">Brand Distribution</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-6">
            <div v-if="loading" class="d-flex flex-column gap-4">
              <VSkeletonLoader v-for="i in 5" :key="i" type="list-item-two-line" />
            </div>
            <div v-else class="d-flex flex-column gap-6">
              <div v-for="(brand, idx) in brandStats" :key="brand.brand_id" class="brand-stat-item">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="font-weight-medium text-body-1">{{ brand.brand?.name?.en || 'Unknown' }}</div>
                  <div class="text-caption font-weight-bold">{{ brand.total }} units</div>
                </div>
                <VProgressLinear
                  :model-value="(brand.total / stats.cars.total) * 100"
                  height="8"
                  rounded
                  :color="['primary', 'secondary', 'info', 'warning', 'error'][idx % 5]"
                />
              </div>
              <div v-if="brandStats.length === 0" class="text-center py-8 text-medium-emphasis">
                No brand data available
              </div>
            </div>
          </VCardText>
          <VDivider />
          <VCardActions class="pa-4 justify-center">
            <VBtn variant="text" size="small" color="secondary">Detailed Report</VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.admin-dashboard {
  padding: 24px;
}

.gradient-text {
  background: linear-gradient(135deg, #1867c0 0%, #5cbbf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-card {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-border-color), 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0,0,0,0.1) !important;
}

.stat-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: 100%;
}

.dashboard-card {
  border-radius: 20px !important;
  border: 1px solid rgba(var(--v-border-color), 0.05);
  background: rgba(var(--v-theme-surface), 0.9) !important;
  backdrop-filter: blur(8px);
}

.recent-cars-table :deep(thead) {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.recent-cars-table :deep(th) {
  height: 48px !important;
}

.brand-stat-item {
  position: relative;
}

.brand-stat-item :deep(.v-progress-linear) {
  background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
}
</style>
