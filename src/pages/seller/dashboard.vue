<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import reportSellerApi from '@/api/seller/reportSellerApi.js'
import PageHeroHeader from '@/components/PageHeroHeader.vue'

const router = useRouter()

const loading = ref(true)
const exportLoading = ref(false)
const period = ref('30d')

const overview = ref({
  seller: null,
  inventory: {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    sold: 0,
    archived: 0,
    featured: 0,
    best_deals: 0,
    by_type: { car: 0, motorcycle: 0 },
  },
  financials: {
    active_inventory_value: [],
    sold_revenue: [],
    sold_this_month_count: 0,
    average_days_to_sell: null,
  },
  engagement: {
    total_views: 0,
    car_views: 0,
    profile_views: 0,
    whatsapp_clicks: 0,
    phone_clicks: 0,
    total_leads: 0,
    favorites_count: 0,
    shares_count: 0,
    conversion_rate: 0,
  },
  alerts: {
    rejected_cars_count: 0,
    expiring_ads_soon_count: 0,
    stale_cars_count: 0,
  },
})

const chartData = ref({
  totals_in_period: {
    car_views: 0,
    whatsapp_clicks: 0,
    phone_clicks: 0,
    share_clicks: 0,
  },
  devices_breakdown: {
    mobile: 0,
    desktop: 0,
    tablet: 0,
  },
  labels: [],
  series: {},
})

const rankings = ref({
  top_performing: [],
  needs_attention: [],
  brand_distribution: [],
})

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [overviewRes, chartRes, rankingRes] = await Promise.all([
      reportSellerApi.getOverview(),
      reportSellerApi.getPerformanceChart({ period: period.value }),
      reportSellerApi.getCarsRanking({ limit: 5 }),
    ])

    if (overviewRes?.data?.data) {
      overview.value = overviewRes.data.data
    }
    if (chartRes?.data?.data) {
      chartData.value = chartRes.data.data
    }
    if (rankingRes?.data?.data) {
      rankings.value = rankingRes.data.data
    }
  } catch (err) {
    console.error('Failed to load seller dashboard data:', err)
  } finally {
    loading.value = false
  }
}

const handlePeriodChange = async (newPeriod) => {
  period.value = newPeriod
  try {
    const res = await reportSellerApi.getPerformanceChart({ period: newPeriod })
    if (res?.data?.data) {
      chartData.value = res.data.data
    }
  } catch (err) {
    console.error('Failed to update period chart:', err)
  }
}

const handleExportCsv = async () => {
  exportLoading.value = true
  try {
    const res = await reportSellerApi.downloadCsv()
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `showroom_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (err) {
    console.error('Export CSV failed:', err)
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

const formattedActiveValue = computed(() => {
  const list = overview.value.financials?.active_inventory_value || []
  if (list.length === 0) return '0 EGP'
  return list.map(item => `${Number(item.total_value || 0).toLocaleString()} ${item.currency}`).join(' / ')
})

const formattedSoldValue = computed(() => {
  const list = overview.value.financials?.sold_revenue || []
  if (list.length === 0) return '0 EGP'
  return list.map(item => `${Number(item.total_revenue || 0).toLocaleString()} ${item.currency}`).join(' / ')
})

const totalDevicesCount = computed(() => {
  const d = chartData.value.devices_breakdown || {}
  return (d.mobile || 0) + (d.desktop || 0) + (d.tablet || 0) || 1
})

const rawTotalDevices = computed(() => {
  const d = chartData.value.devices_breakdown || {}
  return (d.mobile || 0) + (d.desktop || 0) + (d.tablet || 0)
})

const totalPeriodActivity = computed(() => {
  const t = chartData.value.totals_in_period || {}
  return (t.car_views || 0) + (t.whatsapp_clicks || 0) + (t.phone_clicks || 0) + (t.share_clicks || 0)
})

const getDevicePercentage = (count) => {
  if (!rawTotalDevices.value || rawTotalDevices.value === 0) return 0
  return Math.round(((count || 0) / rawTotalDevices.value) * 100)
}
</script>

<template>
  <div class="seller-dashboard p-4">
    <!-- Header / Welcome Hero Banner -->
    <PageHeroHeader
      :title="overview.seller?.store_name?.ar || overview.seller?.store_name?.en || overview.seller?.name || 'لوحة تحكم المعرض'"
      subtitle="لوحة تحكم وإحصائيات أداء المعرض وحركة المبيعات والتفاعل المباشر"
      icon="tabler-dashboard"
      :breadcrumbs="[
        { title: 'لوحة تحكم المعرض' },
      ]"
      :badge="overview.seller?.is_verified ? 'معرض موثق VIP' : 'معرض مسجل'"
      :badge-color="overview.seller?.is_verified ? 'success' : 'primary'"
    >
      <template #stats>
        <div v-if="overview.inventory?.total" class="fleet-stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl">
          <div class="fleet-stat-icon-box bg-primary-subtle text-primary">
            <VIcon icon="tabler-car" size="20" />
          </div>
          <div>
            <div class="stat-caption">إجمالي المخزون</div>
            <div class="stat-value text-primary">
              {{ Number(overview.inventory.total).toLocaleString() }}
              <span class="stat-unit">سيارة</span>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-download"
          :loading="exportLoading"
          @click="handleExportCsv"
        >
          تصدير CSV / Excel
        </VBtn>

        <VBtn
          color="primary"
          prepend-icon="tabler-circle-plus"
          class="font-weight-bold"
          @click="router.push('/seller/cars/create')"
        >
          إضافة سيارة جديدة
        </VBtn>

        <VBtn
          icon="tabler-refresh"
          variant="tonal"
          color="secondary"
          :loading="loading"
          title="تحديث البيانات"
          @click="fetchDashboardData"
        />
      </template>
    </PageHeroHeader>

    <!-- Alerts Strip (if any items need seller action) -->
    <VRow v-if="overview.alerts.rejected_cars_count > 0 || overview.alerts.stale_cars_count > 0" class="mb-4">
      <VCol cols="12">
        <VAlert
          v-if="overview.alerts.rejected_cars_count > 0"
          type="error"
          variant="tonal"
          closable
          class="mb-2"
        >
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div>
              <strong>تنبيه:</strong> لديك <b>{{ overview.alerts.rejected_cars_count }}</b> سيارة تم رفضها من الإدارة وتحتاج لتعديل البيانات وإعادة الإرسال.
            </div>
            <VBtn size="small" color="error" variant="elevated" to="/seller/cars">
              مراجعة الإعلانات المرفوضة
            </VBtn>
          </div>
        </VAlert>

        <VAlert
          v-if="overview.alerts.stale_cars_count > 0"
          type="warning"
          variant="tonal"
          closable
        >
          لديك <b>{{ overview.alerts.stale_cars_count }}</b> سيارة معروضة منذ أكثر من 30 يوماً؛ تفقد التوصيات أدناه لتحفيز البيع وتخفيض السعر.
        </VAlert>
      </VCol>
    </VRow>

    <!-- Top KPI Cards Grid -->
    <VRow class="mb-6">
      <!-- 1. Inventory Status -->
      <VCol cols="12" sm="6" lg="3">
        <VCard elevation="3" class="h-100 rounded-xl stat-card">
          <VCardText class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <VAvatar color="primary" variant="tonal" size="48" rounded="lg">
                <VIcon icon="tabler-car" size="26" />
              </VAvatar>
              <VChip color="success" size="x-small" variant="flat">
                {{ overview.inventory.approved }} Live
              </VChip>
            </div>
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">المخزون الإجمالي</div>
            <div class="text-h3 font-weight-black my-1">
              {{ overview.inventory.total }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex gap-2 flex-wrap mt-2">
              <span><b>{{ overview.inventory.approved }}</b> معتمدة</span> •
              <span><b>{{ overview.inventory.pending }}</b> قيد المراجعة</span> •
              <span><b>{{ overview.inventory.sold }}</b> مباعة</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- 2. Leads & Contacts -->
      <VCol cols="12" sm="6" lg="3">
        <VCard elevation="3" class="h-100 rounded-xl stat-card">
          <VCardText class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <VAvatar color="success" variant="tonal" size="48" rounded="lg">
                <VIcon icon="tabler-phone-call" size="26" />
              </VAvatar>
              <VChip color="success" size="x-small" variant="tonal">
                {{ overview.engagement.conversion_rate }}% Conv. Rate
              </VChip>
            </div>
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">طلبات التواصل (Leads)</div>
            <div class="text-h3 font-weight-black my-1">
              {{ overview.engagement.total_leads }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex gap-2 flex-wrap mt-2">
              <span class="text-success"><VIcon icon="tabler-brand-whatsapp" size="14" /> <b>{{ overview.engagement.whatsapp_clicks }}</b> واتساب</span> •
              <span class="text-info"><VIcon icon="tabler-phone" size="14" /> <b>{{ overview.engagement.phone_clicks }}</b> اتصال</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- 3. Views & Favorites -->
      <VCol cols="12" sm="6" lg="3">
        <VCard elevation="3" class="h-100 rounded-xl stat-card">
          <VCardText class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <VAvatar color="info" variant="tonal" size="48" rounded="lg">
                <VIcon icon="tabler-eye" size="26" />
              </VAvatar>
              <VChip color="error" size="x-small" variant="tonal">
                ❤️ {{ overview.engagement.favorites_count }} المفضلة
              </VChip>
            </div>
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">إجمالي المشاهدات</div>
            <div class="text-h3 font-weight-black my-1">
              {{ overview.engagement.total_views }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex gap-2 flex-wrap mt-2">
              <span><b>{{ overview.engagement.car_views }}</b> مشاهدة للسيارات</span> •
              <span><b>{{ overview.engagement.profile_views }}</b> زيارة للمعرض</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- 4. Active Valuation -->
      <VCol cols="12" sm="6" lg="3">
        <VCard elevation="3" class="h-100 rounded-xl stat-card">
          <VCardText class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <VAvatar color="warning" variant="tonal" size="48" rounded="lg">
                <VIcon icon="tabler-coin" size="26" />
              </VAvatar>
              <VChip v-if="overview.financials.average_days_to_sell" color="primary" size="x-small" variant="tonal">
                ⚡ متوسط البيع {{ overview.financials.average_days_to_sell }} يوم
              </VChip>
            </div>
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">القيمة السوقية للمخزون</div>
            <div class="text-h5 font-weight-black my-1 text-truncate" :title="formattedActiveValue">
              {{ formattedActiveValue }}
            </div>
            <div class="text-caption text-medium-emphasis mt-2 text-truncate" :title="formattedSoldValue">
              مبيعات سابقة: <b>{{ formattedSoldValue }}</b>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Performance Details & Devices Row -->
    <VRow class="mb-6">
      <!-- Activity Summary Bar -->
      <VCol cols="12" md="8">
        <VCard elevation="3" class="h-100 rounded-xl overflow-hidden">
          <VCardTitle class="pa-5 d-flex align-center justify-space-between flex-wrap gap-2">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-chart-line" color="primary" />
              <span class="font-weight-bold">تفاعل العملاء خلال الفترة (Activity Breakdown)</span>
            </div>

            <!-- Period Switcher Buttons -->
            <VBtnToggle
              v-model="period"
              mandatory
              density="compact"
              color="primary"
              variant="outlined"
              @update:model-value="handlePeriodChange"
            >
              <VBtn value="7d">7 Days</VBtn>
              <VBtn value="30d">30 Days</VBtn>
              <VBtn value="90d">90 Days</VBtn>
            </VBtnToggle>
          </VCardTitle>
          <VDivider />

          <VCardText class="pa-6">
            <VRow class="mb-4">
              <!-- Views -->
              <VCol cols="12" sm="6" lg="3">
                <div class="activity-metric-box activity-box-info pa-4 rounded-xl d-flex flex-column align-center text-center">
                  <div class="metric-icon-wrap bg-info-subtle mb-3">
                    <VIcon icon="tabler-eye" size="24" color="info" />
                  </div>
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-1">مشاهدات سيارات</div>
                  <div class="text-h4 font-weight-black text-info my-1">
                    {{ (chartData.totals_in_period.car_views || 0).toLocaleString() }}
                  </div>
                  <span class="text-xs text-medium-emphasis">زيارات الإعلانات</span>
                </div>
              </VCol>

              <!-- WhatsApp -->
              <VCol cols="12" sm="6" lg="3">
                <div class="activity-metric-box activity-box-success pa-4 rounded-xl d-flex flex-column align-center text-center">
                  <div class="metric-icon-wrap bg-success-subtle mb-3">
                    <VIcon icon="tabler-brand-whatsapp" size="24" color="success" />
                  </div>
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-1">نقرات واتساب</div>
                  <div class="text-h4 font-weight-black text-success my-1">
                    {{ (chartData.totals_in_period.whatsapp_clicks || 0).toLocaleString() }}
                  </div>
                  <span class="text-xs text-medium-emphasis">استفسارات مباشرة</span>
                </div>
              </VCol>

              <!-- Phone -->
              <VCol cols="12" sm="6" lg="3">
                <div class="activity-metric-box activity-box-primary pa-4 rounded-xl d-flex flex-column align-center text-center">
                  <div class="metric-icon-wrap bg-primary-subtle mb-3">
                    <VIcon icon="tabler-phone-call" size="24" color="primary" />
                  </div>
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-1">مكالمات اتصال</div>
                  <div class="text-h4 font-weight-black text-primary my-1">
                    {{ (chartData.totals_in_period.phone_clicks || 0).toLocaleString() }}
                  </div>
                  <span class="text-xs text-medium-emphasis">مكالمات هاتفية</span>
                </div>
              </VCol>

              <!-- Shares -->
              <VCol cols="12" sm="6" lg="3">
                <div class="activity-metric-box activity-box-warning pa-4 rounded-xl d-flex flex-column align-center text-center">
                  <div class="metric-icon-wrap bg-warning-subtle mb-3">
                    <VIcon icon="tabler-share" size="24" color="warning" />
                  </div>
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-1">مشاركات الإعلان</div>
                  <div class="text-h4 font-weight-black text-warning my-1">
                    {{ (chartData.totals_in_period.share_clicks || 0).toLocaleString() }}
                  </div>
                  <span class="text-xs text-medium-emphasis">نشر وسوشيال ميديا</span>
                </div>
              </VCol>
            </VRow>

            <!-- Visual Info & Fraud Protection Strip -->
            <div class="activity-summary-banner pa-3 rounded-lg d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-shield-check" size="18" color="success" />
                <span class="text-xs text-medium-emphasis">
                  يتم تسجيل النقرات والزيارات مع حماية ضد التكرار الوهمي لضمان مصداقية معدلات التحويل.
                </span>
              </div>
              <div v-if="totalPeriodActivity > 0" class="text-xs font-weight-bold text-primary">
                إجمالي التفاعلات: {{ totalPeriodActivity.toLocaleString() }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Devices Breakdown -->
      <VCol cols="12" md="4">
        <VCard elevation="3" class="h-100 rounded-xl overflow-hidden">
          <VCardTitle class="pa-5 d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-devices" color="secondary" />
              <span class="font-weight-bold">توزيع أجهزة الزوار</span>
            </div>
            <VChip size="x-small" color="secondary" variant="tonal">
              {{ rawTotalDevices }} زيارة مسجلة
            </VChip>
          </VCardTitle>
          <VDivider />

          <VCardText class="pa-6">
            <div class="d-flex flex-column gap-4">
              <!-- Mobile -->
              <div class="device-item pa-3 rounded-xl">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="d-flex align-center gap-2">
                    <div class="device-icon bg-success-subtle">
                      <VIcon icon="tabler-device-mobile" size="20" color="success" />
                    </div>
                    <div>
                      <div class="font-weight-bold text-sm">الهواتف الذكية</div>
                      <div class="text-xs text-medium-emphasis">Mobile Users</div>
                    </div>
                  </div>
                  <div class="text-end">
                    <span class="font-weight-bold text-sm">{{ chartData.devices_breakdown.mobile || 0 }}</span>
                    <span class="text-xs text-medium-emphasis ms-1">({{ getDevicePercentage(chartData.devices_breakdown.mobile) }}%)</span>
                  </div>
                </div>
                <VProgressLinear
                  :model-value="getDevicePercentage(chartData.devices_breakdown.mobile)"
                  color="success"
                  height="7"
                  rounded
                />
              </div>

              <!-- Desktop -->
              <div class="device-item pa-3 rounded-xl">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="d-flex align-center gap-2">
                    <div class="device-icon bg-primary-subtle">
                      <VIcon icon="tabler-device-desktop" size="20" color="primary" />
                    </div>
                    <div>
                      <div class="font-weight-bold text-sm">أجهزة الكمبيوتر</div>
                      <div class="text-xs text-medium-emphasis">Desktop & Laptop</div>
                    </div>
                  </div>
                  <div class="text-end">
                    <span class="font-weight-bold text-sm">{{ chartData.devices_breakdown.desktop || 0 }}</span>
                    <span class="text-xs text-medium-emphasis ms-1">({{ getDevicePercentage(chartData.devices_breakdown.desktop) }}%)</span>
                  </div>
                </div>
                <VProgressLinear
                  :model-value="getDevicePercentage(chartData.devices_breakdown.desktop)"
                  color="primary"
                  height="7"
                  rounded
                />
              </div>

              <!-- Tablet -->
              <div class="device-item pa-3 rounded-xl">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="d-flex align-center gap-2">
                    <div class="device-icon bg-warning-subtle">
                      <VIcon icon="tabler-device-tablet" size="20" color="warning" />
                    </div>
                    <div>
                      <div class="font-weight-bold text-sm">الأجهزة اللوحية</div>
                      <div class="text-xs text-medium-emphasis">iPad & Tablet</div>
                    </div>
                  </div>
                  <div class="text-end">
                    <span class="font-weight-bold text-sm">{{ chartData.devices_breakdown.tablet || 0 }}</span>
                    <span class="text-xs text-medium-emphasis ms-1">({{ getDevicePercentage(chartData.devices_breakdown.tablet) }}%)</span>
                  </div>
                </div>
                <VProgressLinear
                  :model-value="getDevicePercentage(chartData.devices_breakdown.tablet)"
                  color="warning"
                  height="7"
                  rounded
                />
              </div>
            </div>

            <div class="mt-4 pt-3 border-t text-center text-xs text-medium-emphasis">
              💡 معظم المشترين يتصفحون السيارات عبر الهواتف الذكية
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Top Performing Cars vs Stale Cars -->
    <VRow>
      <!-- Top Performing Inventory -->
      <VCol cols="12" lg="7">
        <VCard elevation="3" class="rounded-xl h-100">
          <VCardTitle class="pa-5 d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-trophy" color="warning" />
              <span class="font-weight-bold">السيارات الأعلى أداءً (Top Performing)</span>
            </div>
            <VBtn variant="text" size="small" color="primary" to="/seller/cars">عرض كل المخزون</VBtn>
          </VCardTitle>
          <VDivider />

          <VTable class="dashboard-table">
            <thead>
              <tr>
                <th>السيارة</th>
                <th>السعر</th>
                <th class="text-center">المشاهدات</th>
                <th class="text-center">الـ Leads</th>
                <th class="text-center">نسبة التحويل</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" v-for="i in 3" :key="i">
                <td colspan="5"><VSkeletonLoader type="table-row" /></td>
              </tr>
              <tr v-else-if="rankings.top_performing.length === 0">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">لا توجد بيانات سيارات كافية حالياً</td>
              </tr>
              <tr v-else v-for="item in rankings.top_performing" :key="item.id">
                <td>
                  <div class="d-flex align-center py-2 gap-3">
                    <VAvatar size="42" rounded="lg">
                      <VImg :src="item.main_image || '/placeholder-car.png'" cover />
                    </VAvatar>
                    <div>
                      <div class="font-weight-bold text-sm">{{ item.title?.ar || item.title?.en || item.title }}</div>
                      <div class="text-xs text-medium-emphasis">{{ item.brand?.name?.en }} • {{ item.year }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="font-weight-bold text-sm">{{ Number(item.price).toLocaleString() }} {{ item.currency }}</div>
                  <VChip v-if="item.is_price_dropped" color="error" size="x-small" variant="flat">
                    انخفض السعر 🔥
                  </VChip>
                </td>
                <td class="text-center font-weight-bold">{{ item.metrics?.views_count || 0 }}</td>
                <td class="text-center font-weight-bold text-success">{{ item.metrics?.total_leads || 0 }}</td>
                <td class="text-center">
                  <VChip color="primary" size="x-small" variant="tonal">
                    {{ item.metrics?.conversion_rate || 0 }}%
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <!-- Needs Attention / Smart Recommendations -->
      <VCol cols="12" lg="5">
        <VCard elevation="3" class="rounded-xl h-100">
          <VCardTitle class="pa-5 d-flex align-center gap-2">
            <VIcon icon="tabler-bulb" color="warning" />
            <span class="font-weight-bold">توصيات ذكية لتحفيز المبيعات</span>
          </VCardTitle>
          <VDivider />

          <VCardText class="pa-5">
            <div v-if="rankings.needs_attention.length === 0" class="text-center py-8 text-medium-emphasis">
              <VIcon icon="tabler-circle-check" size="48" color="success" class="mb-2" />
              <div>جميع سياراتك معروضة بأعلى كفاءة ولا توجد سيارات راكدة!</div>
            </div>

            <div v-else class="d-flex flex-column gap-4">
              <div
                v-for="car in rankings.needs_attention"
                :key="car.id"
                class="pa-3 rounded-lg border bg-surface"
              >
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="font-weight-bold text-sm text-truncate me-2">
                    {{ car.title?.ar || car.title?.en || car.title }}
                  </div>
                  <VChip size="x-small" color="secondary">
                    معروضة منذ {{ car.metrics?.days_listed }} يوم
                  </VChip>
                </div>

                <div v-for="(rec, idx) in car.recommendations" :key="idx" class="d-flex align-start gap-2 text-xs text-warning mt-1">
                  <VIcon icon="tabler-alert-circle" size="14" class="mt-0.5" />
                  <span>{{ rec.ar }}</span>
                </div>

                <div class="d-flex justify-end mt-2">
                  <VBtn size="x-small" variant="tonal" color="primary" :to="`/seller/cars/edit/${car.id}`">
                    تعديل الإعلان الآن
                  </VBtn>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.seller-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.dashboard-table :deep(th) {
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  text-transform: uppercase;
}

.activity-metric-box {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.activity-metric-box:hover {
  transform: translateY(-3px);
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.activity-box-info { border-top: 3px solid rgb(var(--v-theme-info)); }
.activity-box-success { border-top: 3px solid rgb(var(--v-theme-success)); }
.activity-box-primary { border-top: 3px solid rgb(var(--v-theme-primary)); }
.activity-box-warning { border-top: 3px solid rgb(var(--v-theme-warning)); }

.metric-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-info-subtle { background: rgba(var(--v-theme-info), 0.14); }
.bg-success-subtle { background: rgba(var(--v-theme-success), 0.14); }
.bg-primary-subtle { background: rgba(var(--v-theme-primary), 0.14); }
.bg-warning-subtle { background: rgba(var(--v-theme-warning), 0.14); }

.activity-summary-banner {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
}

.device-item {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transition: all 0.2s ease;
}

.device-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.device-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
