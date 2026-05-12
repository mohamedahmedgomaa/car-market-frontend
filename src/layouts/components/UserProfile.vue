<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import { useRouter } from 'vue-router'
import { useUserAuth } from '@/stores/userAuth'
import { useSellerAuth } from '@/stores/sellerAuth'
import { useAdminAuth } from '@/stores/adminAuth'
import { computed } from 'vue'

const router = useRouter()
const adminAuth = useAdminAuth()
const sellerAuth = useSellerAuth()
const userAuth = useUserAuth()

const currentRole = computed(() => {
  const path = window.location.pathname
  if (path.includes('/admin')) return 'admin'
  if (path.includes('/seller')) return 'seller'
  return 'user'
})

const userData = computed(() => {
  if (currentRole.value === 'admin') return adminAuth.admin
  if (currentRole.value === 'seller') return sellerAuth.seller
  return userAuth.user
})

const handleLogout = async () => {
  try {
    const role = currentRole.value
    let redirectTo = '/login'

    if (role === 'admin') {
      redirectTo = '/admin/login'
      await adminAuth.logout()
    } else if (role === 'seller') {
      redirectTo = '/seller/login'
      await sellerAuth.logout()
    } else {
      await userAuth.logout()
    }

    router.push(redirectTo)
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VAvatar class="cursor-pointer" color="primary" variant="tonal">
      <VImg :src="userData?.avatar || avatar1" />

      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                  <VAvatar color="primary" variant="tonal">
                    <VImg :src="userData?.avatar || avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ userData?.name || 'User' }}
            </VListItemTitle>
            <VListItemSubtitle class="text-uppercase text-caption">
              {{ currentRole }}
            </VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />

          <template v-if="currentRole === 'admin'">
            <VListItem to="/admin/dashboard" link>
              <template #prepend>
                <VIcon class="me-2" icon="tabler-dashboard" size="22" />
              </template>
              <VListItemTitle>Dashboard</VListItemTitle>
            </VListItem>
          </template>

          <template v-else-if="currentRole === 'seller'">
            <VListItem to="/seller/dashboard" link>
              <template #prepend>
                <VIcon class="me-2" icon="tabler-dashboard" size="22" />
              </template>
              <VListItemTitle>Dashboard</VListItemTitle>
            </VListItem>
          </template>

          <template v-else>
            <VListItem to="/user/profile" link>
              <template #prepend>
                <VIcon class="me-2" icon="tabler-user" size="22" />
              </template>
              <VListItemTitle>Profile</VListItemTitle>
            </VListItem>
          </template>

          <VListItem link>
            <template #prepend>
              <VIcon class="me-2" icon="tabler-settings" size="22" />
            </template>
            <VListItemTitle>Settings</VListItemTitle>
          </VListItem>

          <VDivider class="my-2" />

          <VListItem @click.stop.prevent="handleLogout">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-logout" size="22" />
            </template>
            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>
</template>
