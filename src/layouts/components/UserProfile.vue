<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import { useRouter } from 'vue-router'
import { useUserAuth } from '@/stores/userAuth'
import { useSellerAuth } from '@/stores/sellerAuth'
import { useAdminAuth } from '@/stores/adminAuth'

const router = useRouter()

const handleLogout = async () => {
  try {
    const path = window.location.pathname
    let role = 'user'
    let redirectTo = '/login'

    if (path.includes('/admin')) {
      role = 'admin'
      redirectTo = '/admin/login'
      await useAdminAuth().logout()
    } else if (path.includes('/seller')) {
      role = 'seller'
      redirectTo = '/seller/login'
      await useSellerAuth().logout()
    } else {
      await useUserAuth().logout()
    }

    // نحذف التوكين الخاص بالمستخدم الحالي فقط
    localStorage.removeItem(`${role}_token`)

    // نرجعه لصفحة اللوجين الخاصة بيه
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
      <VImg :src="avatar1" />

      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                  <VAvatar color="primary" variant="tonal">
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">Admin</VListItemTitle>
<!--            <VListItemSubtitle>Admin</VListItemSubtitle>-->
          </VListItem>

          <VDivider class="my-2" />

          <VListItem link>
            <template #prepend>
              <VIcon class="me-2" icon="tabler-user" size="22" />
            </template>
            <VListItemTitle>Profile</VListItemTitle>
          </VListItem>

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
