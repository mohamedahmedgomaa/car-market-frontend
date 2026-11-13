<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import notificationSellerApi from '@/api/seller/notificationSellerApi.js'
import PageHeroHeader from '@/components/PageHeroHeader.vue'

const router = useRouter()

const notifications = ref([])
const loading = ref(true)
const markingAll = ref(false)

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await notificationSellerApi.getAll({ perPage: 50 })
    const data = res?.data?.data || []
    notifications.value = Array.isArray(data) ? data : (data.data || [])
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (item) => {
  if (item.is_read) return
  try {
    await notificationSellerApi.markAsRead(item.id)
    item.is_read = true
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
  }
}

const markAllAsRead = async () => {
  markingAll.value = true
  try {
    await notificationSellerApi.markAllAsRead()
    notifications.value.forEach(n => { n.is_read = true })
  } catch (err) {
    console.error('Failed to mark all as read:', err)
  } finally {
    markingAll.value = false
  }
}

const getNotificationColor = (type) => {
  if (type === 'car_approved') return 'success'
  if (type === 'car_rejected') return 'error'
  if (type === 'car_favorited') return 'pink'
  return 'primary'
}

const getNotificationIcon = (type) => {
  if (type === 'car_approved') return 'tabler-circle-check'
  if (type === 'car_rejected') return 'tabler-alert-triangle'
  if (type === 'car_favorited') return 'tabler-heart'
  return 'tabler-bell'
}

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="seller-notifications p-4" style="max-width: 1000px; margin: 0 auto;">
    <!-- Page Hero Header -->
    <PageHeroHeader
      title="مركز إشعارات المعرض"
      subtitle="تنبيهات حالة الإعلانات، موافقة ورفض الإدارة، وتفاعل المشترين لحظة بلحظة"
      icon="tabler-bell"
      :breadcrumbs="[
        { title: 'لوحة التحكم', to: '/seller/dashboard', icon: 'tabler-smart-home' },
        { title: 'الإشعارات' },
      ]"
      :badge="unreadCount ? `${unreadCount} تنبيه جديد` : 'لا توجد تنبيهات جديدة'"
      :badge-color="unreadCount ? 'error' : 'secondary'"
      :badge-pulse="unreadCount > 0"
    >
      <template #actions>
        <VBtn
          variant="tonal"
          color="primary"
          prepend-icon="tabler-checks"
          :loading="markingAll"
          :disabled="notifications.every(n => n.is_read)"
          @click="markAllAsRead"
        >
          تحديد الكل كمقروء
        </VBtn>

        <VBtn
          icon="tabler-refresh"
          variant="tonal"
          color="secondary"
          :loading="loading"
          title="تحديث"
          @click="fetchNotifications"
        />
      </template>
    </PageHeroHeader>

    <VCard elevation="3" class="rounded-xl overflow-hidden">
      <div v-if="loading" class="pa-6 text-center">
        <VProgressCircular indeterminate color="primary" class="my-6" />
        <div class="text-medium-emphasis">جاري تحميل الإشعارات...</div>
      </div>

      <div v-else-if="notifications.length === 0" class="pa-12 text-center">
        <VAvatar color="primary" variant="tonal" size="64" class="mb-4">
          <VIcon icon="tabler-bell-off" size="32" />
        </VAvatar>
        <h3 class="text-h6 font-weight-bold mb-1">لا توجد إشعارات حالياً</h3>
        <p class="text-medium-emphasis mb-0">ستصلك هنا إشعارات عند اعتماد سياراتك أو وجود تفاعل جديد من الزوار.</p>
      </div>

      <VList v-else lines="two" class="py-0">
        <template v-for="(item, index) in notifications" :key="item.id">
          <VListItem
            :class="{ 'unread-item': !item.is_read }"
            class="px-5 py-4 cursor-pointer"
            @click="markAsRead(item)"
          >
            <template #prepend>
              <VAvatar :color="getNotificationColor(item.type)" variant="tonal" size="44" class="me-3">
                <VIcon :icon="getNotificationIcon(item.type)" size="22" />
              </VAvatar>
            </template>

            <VListItemTitle class="font-weight-bold text-base mb-1 d-flex align-center gap-2">
              <span>{{ item.title?.ar || item.title?.en || item.title }}</span>
              <VBadge v-if="!item.is_read" color="primary" dot inline />
            </VListItemTitle>

            <VListItemSubtitle class="text-sm text-medium-emphasis">
              {{ item.body?.ar || item.body?.en || item.body }}
            </VListItemSubtitle>

            <template #append>
              <div class="d-flex flex-column align-end gap-2">
                <span class="text-caption text-medium-emphasis">
                  {{ item.created_at ? new Date(item.created_at).toLocaleDateString() : '' }}
                </span>

                <VBtn
                  v-if="item.data?.car_id"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  @click.stop="router.push(`/seller/cars/edit/${item.data.car_id}`)"
                >
                  عرض الإعلان
                </VBtn>
              </div>
            </template>
          </VListItem>

          <VDivider v-if="index < notifications.length - 1" />
        </template>
      </VList>
    </VCard>
  </div>
</template>

<style scoped>
.unread-item {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-inline-start: 4px solid rgb(var(--v-theme-primary));
}
</style>

