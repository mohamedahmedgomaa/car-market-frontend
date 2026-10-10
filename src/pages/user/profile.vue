<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import userApi from '@/api/userApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({ meta: { layout: 'front', public: false } })

const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const activeTab = ref('my-cars') // 'my-cars', 'account-details', 'shortcuts'
const loadingProfile = ref(false)
const savingProfile = ref(false)
const profileError = ref('')
const successMessage = ref('')

const me = ref(null)
const avatarPreview = ref(null)
const avatarFile = ref(null)
const avatarInput = ref(null)

const form = ref({
  name: '',
  phone: '',
  email: '',
})

const ensureAuth = () => {
  const token = localStorage.getItem('user_token')
  if (!token) {
    router.push('/login')
    return false
  }
  return true
}

const normalizeMe = (res) => {
  const d = res?.data?.data ?? res?.data ?? {}
  return d.user ?? d
}

const loadMe = async () => {
  if (!ensureAuth()) return

  loadingProfile.value = true
  profileError.value = ''

  try {
    const res = await userApi.me()
    const u = normalizeMe(res)

    if (!u?.id) {
      profileError.value = locale.value === 'ar' ? 'بيانات المستخدم غير صالحة' : 'Invalid user data'
      me.value = null
      return
    }

    me.value = u
    form.value = {
      name: u.name ?? '',
      phone: u.phone ?? '',
      email: u.email ?? '',
    }
  } catch (e) {
    console.error(e)
    profileError.value = locale.value === 'ar' ? 'فشل تحميل بيانات الملف الشخصي' : 'Failed to load profile'
  } finally {
    loadingProfile.value = false
  }
}

const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const triggerAvatarSelect = () => {
  if (avatarInput.value) avatarInput.value.click()
}

const saveProfile = async () => {
  if (!ensureAuth()) return
  if (!me.value?.id) return

  savingProfile.value = true
  profileError.value = ''
  successMessage.value = ''

  try {
    let payload
    if (avatarFile.value) {
      payload = new FormData()
      payload.append('name', String(form.value.name || '').trim())
      payload.append('phone', String(form.value.phone || '').trim())
      payload.append('avatar', avatarFile.value)
    } else {
      payload = {
        name: String(form.value.name || '').trim(),
        phone: String(form.value.phone || '').trim(),
      }
    }

    const res = await userApi.update(me.value.id, payload)
    const updated = normalizeMe(res) || {}
    me.value = { ...me.value, ...updated }
    
    // update localStorage cache if exists
    try {
      localStorage.setItem('user_data', JSON.stringify(me.value))
    } catch {}

    successMessage.value = locale.value === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Profile updated successfully!'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (e) {
    console.error(e)
    profileError.value = locale.value === 'ar' ? 'فشل حفظ التغييرات' : 'Failed to save profile'
  } finally {
    savingProfile.value = false
  }
}

// User Listed Cars Filter Params
const myCarsParams = computed(() => {
  if (!me.value?.id) return null
  return {
    'filter[user_id]': me.value.id,
    sort: '-created_at',
  }
})

const myCarsViewAllTo = computed(() => {
  if (!me.value?.id) return { path: '/user/cars' }
  return {
    path: '/user/cars',
    query: { 'filter[user_id]': me.value.id, sort: '-created_at' },
  }
})

const getInitials = (name) => {
  if (!name) return 'U'
  const parts = String(name).trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const userAvatarUrl = computed(() => {
  if (avatarPreview.value) return avatarPreview.value
  if (me.value?.avatar_url) return me.value.avatar_url
  if (me.value?.avatar) return me.value.avatar
  return null
})

const handleLogout = () => {
  localStorage.removeItem('user_token')
  localStorage.removeItem('user_data')
  router.push('/login')
}

const refreshAll = async () => {
  await loadMe()
}

onMounted(refreshAll)
</script>

<template>
  <section class="profile-page py-8">
    <VContainer>
      <!-- Loading State -->
      <div v-if="loadingProfile && !me" class="py-16 text-center">
        <VProgressCircular indeterminate color="primary" size="50" class="mb-4" />
        <div class="text-subtitle-1 text-medium-emphasis">
          {{ locale === 'ar' ? 'جاري تحميل الملف الشخصي...' : 'Loading Profile...' }}
        </div>
      </div>

      <template v-else-if="me">
        <!-- Profile Header / Banner Card -->
        <VCard class="profile-header-card pa-6 rounded-3xl elevation-8 mb-8 border relative overflow-hidden">
          <div class="d-flex flex-column flex-md-row align-center align-md-start gap-6 relative z-1">
            <!-- Avatar Circle with Upload Trigger -->
            <div class="avatar-wrapper relative">
              <VAvatar size="110" color="primary" class="profile-avatar elevation-8 font-weight-black text-h3">
                <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Avatar" class="avatar-img" />
                <span v-else class="text-white">{{ getInitials(me.name) }}</span>
              </VAvatar>

              <button class="avatar-upload-btn" @click="triggerAvatarSelect" :title="locale === 'ar' ? 'تغيير الصورة' : 'Change Photo'">
                <VIcon icon="tabler-camera" size="18" />
              </button>
              <input ref="avatarInput" type="file" accept="image/*" class="d-none" @change="handleAvatarChange" />
            </div>

            <!-- User Info Summary -->
            <div class="flex-grow-1 text-center text-md-start">
              <div class="d-flex align-center justify-center justify-md-start gap-2 flex-wrap mb-2">
                <h1 class="text-h3 font-weight-black text-high-emphasis mb-0">
                  {{ me.name || 'User' }}
                </h1>
                <VChip color="success" size="small" variant="flat" class="font-weight-bold px-3">
                  <VIcon icon="tabler-shield-check" size="16" class="me-1" />
                  {{ locale === 'ar' ? 'حساب مفعّل' : 'Verified' }}
                </VChip>
                <VChip color="primary" variant="tonal" size="small" class="font-weight-bold">
                  ID: #{{ me.id }}
                </VChip>
              </div>

              <div class="d-flex align-center justify-center justify-md-start gap-4 flex-wrap text-subtitle-1 text-medium-emphasis mb-4">
                <span class="d-flex align-center gap-1">
                  <VIcon icon="tabler-mail" size="18" color="primary" /> {{ me.email }}
                </span>
                <span v-if="me.phone" class="d-flex align-center gap-1">
                  <VIcon icon="tabler-phone" size="18" color="primary" /> {{ me.phone }}
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex align-center justify-center justify-md-start gap-3 flex-wrap">
                <VBtn color="primary" rounded="pill" to="/user/sell" class="px-6 font-weight-bold">
                  <VIcon icon="tabler-circle-plus" size="20" class="me-2" />
                  {{ locale === 'ar' ? 'عرض سيارة للبيع' : 'Sell Your Car' }}
                </VBtn>

                <VBtn variant="tonal" color="secondary" rounded="pill" @click="activeTab = 'account-details'" class="px-6 font-weight-bold">
                  <VIcon icon="tabler-user-edit" size="18" class="me-2" />
                  {{ locale === 'ar' ? 'تعديل البيانات' : 'Edit Profile' }}
                </VBtn>

                <VBtn variant="outlined" color="primary" rounded="pill" to="/user/favorites" class="px-5 font-weight-bold">
                  <VIcon icon="tabler-heart" size="18" class="me-2" />
                  {{ locale === 'ar' ? 'المفضلة' : 'Favorites' }}
                </VBtn>
              </div>
            </div>
          </div>
        </VCard>

        <!-- Quick Stats Overview Bar -->
        <VRow class="mb-8">
          <VCol cols="12" sm="4">
            <VCard class="stat-box pa-5 rounded-2xl border text-center h-100" elevation="4">
              <VAvatar color="primary" variant="tonal" size="48" class="mb-3">
                <VIcon icon="tabler-car" size="24" />
              </VAvatar>
              <div class="text-h4 font-weight-black text-high-emphasis mb-1">
                {{ locale === 'ar' ? 'إعلاناتي' : 'My Ads' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ locale === 'ar' ? 'السيارات المعروضة لحسابك' : 'Vehicles listed by you' }}
              </div>
            </VCard>
          </VCol>

          <VCol cols="12" sm="4">
            <VCard class="stat-box pa-5 rounded-2xl border text-center h-100 cursor-pointer" elevation="4" @click="router.push('/user/favorites')">
              <VAvatar color="error" variant="tonal" size="48" class="mb-3">
                <VIcon icon="tabler-heart" size="24" />
              </VAvatar>
              <div class="text-h4 font-weight-black text-high-emphasis mb-1">
                {{ locale === 'ar' ? 'المفضلة' : 'Favorites' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ locale === 'ar' ? 'عرض السيارات المحفوظة' : 'View saved cars' }}
              </div>
            </VCard>
          </VCol>

          <VCol cols="12" sm="4">
            <VCard class="stat-box pa-5 rounded-2xl border text-center h-100" elevation="4">
              <VAvatar color="success" variant="tonal" size="48" class="mb-3">
                <VIcon icon="tabler-user-check" size="24" />
              </VAvatar>
              <div class="text-h4 font-weight-black text-high-emphasis mb-1">
                {{ locale === 'ar' ? 'حساب نشط' : 'Active Account' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ locale === 'ar' ? 'جاهز لإضافة واستقبال العروض' : 'Ready to trade & buy' }}
              </div>
            </VCard>
          </VCol>
        </VRow>

        <!-- Main Content Tabs -->
        <VCard class="pa-6 rounded-3xl border elevation-6 mb-8">
          <!-- Tab Navigation Bar -->
          <div class="d-flex align-center gap-3 border-b pb-4 mb-6 flex-wrap">
            <VBtn
              :variant="activeTab === 'my-cars' ? 'flat' : 'tonal'"
              :color="activeTab === 'my-cars' ? 'primary' : 'secondary'"
              rounded="pill"
              class="font-weight-bold px-6"
              @click="activeTab = 'my-cars'"
            >
              <VIcon icon="tabler-car" size="20" class="me-2" />
              {{ locale === 'ar' ? 'سياراتي المعروضة (إعلاناتي)' : 'My Listed Cars' }}
            </VBtn>

            <VBtn
              :variant="activeTab === 'account-details' ? 'flat' : 'tonal'"
              :color="activeTab === 'account-details' ? 'primary' : 'secondary'"
              rounded="pill"
              class="font-weight-bold px-6"
              @click="activeTab = 'account-details'"
            >
              <VIcon icon="tabler-user" size="20" class="me-2" />
              {{ locale === 'ar' ? 'تعديل البيانات والملف' : 'Account Details' }}
            </VBtn>

            <VBtn
              :variant="activeTab === 'shortcuts' ? 'flat' : 'tonal'"
              :color="activeTab === 'shortcuts' ? 'primary' : 'secondary'"
              rounded="pill"
              class="font-weight-bold px-6"
              @click="activeTab = 'shortcuts'"
            >
              <VIcon icon="tabler-layout-grid" size="20" class="me-2" />
              {{ locale === 'ar' ? 'اختصارات سريعة' : 'Quick Shortcuts' }}
            </VBtn>
          </div>

          <!-- TAB 1: MY LISTED CARS -->
          <div v-if="activeTab === 'my-cars'" class="tab-content">
            <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-4">
              <div>
                <h3 class="text-h4 font-weight-black mb-1">
                  {{ locale === 'ar' ? 'سياراتي المعروضة للبيع' : 'My Listed Cars' }}
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ locale === 'ar' ? 'إدارة واستعراض كافة السيارات التي قمت بإضافتها' : 'Manage and view all your published vehicle listings' }}
                </p>
              </div>

              <VBtn color="primary" rounded="pill" to="/user/sell" class="font-weight-bold">
                <VIcon icon="tabler-plus" size="18" class="me-2" />
                {{ locale === 'ar' ? 'إضافة سيارة جديدة' : 'Add New Car' }}
              </VBtn>
            </div>

            <!-- Embedded CarsSection for user's uploaded cars -->
            <CarsSection
              v-if="myCarsParams"
              embedded
              :title="locale === 'ar' ? 'إعلاناتي' : 'My Ads'"
              :subtitle="locale === 'ar' ? 'قائمة السيارات التي أضفتها على المنصة' : 'Cars uploaded by your account'"
              :limit="12"
              :approvedOnly="false"
              :params="myCarsParams"
              :viewAllTo="myCarsViewAllTo"
            />
          </div>

          <!-- TAB 2: ACCOUNT DETAILS & EDIT -->
          <div v-else-if="activeTab === 'account-details'" class="tab-content max-w-700 mx-auto py-4">
            <h3 class="text-h4 font-weight-black mb-2 text-center">
              {{ locale === 'ar' ? 'تعديل البيانات الشخصية' : 'Edit Account Details' }}
            </h3>
            <p class="text-body-2 text-medium-emphasis text-center mb-6">
              {{ locale === 'ar' ? 'قم بتحديث اسمك، رقم هاتفك وصورتك الشخصية' : 'Update your profile name, phone number, and avatar' }}
            </p>

            <VAlert v-if="profileError" type="error" variant="tonal" class="mb-4" closable>
              {{ profileError }}
            </VAlert>

            <VAlert v-if="successMessage" type="success" variant="tonal" class="mb-4" closable>
              {{ successMessage }}
            </VAlert>

            <!-- Avatar Preview in Edit -->
            <div class="text-center mb-6">
              <VAvatar size="90" color="primary" class="elevation-4 mb-2">
                <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Avatar" class="avatar-img" />
                <span v-else class="text-white text-h4 font-weight-black">{{ getInitials(me.name) }}</span>
              </VAvatar>
              <div>
                <VBtn variant="tonal" color="primary" size="small" rounded="pill" @click="triggerAvatarSelect">
                  <VIcon icon="tabler-photo" size="16" class="me-1" />
                  {{ locale === 'ar' ? 'تغيير الصورة الشخصية' : 'Change Profile Picture' }}
                </VBtn>
              </div>
            </div>

            <VForm @submit.prevent="saveProfile">
              <VRow>
                <VCol cols="12" sm="6">
                  <VTextField
                    v-model="form.name"
                    :label="locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'"
                    variant="outlined"
                    prepend-inner-icon="tabler-user"
                    class="mb-3"
                  />
                </VCol>

                <VCol cols="12" sm="6">
                  <VTextField
                    v-model="form.phone"
                    :label="locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'"
                    variant="outlined"
                    prepend-inner-icon="tabler-phone"
                    class="mb-3"
                  />
                </VCol>

                <VCol cols="12">
                  <VTextField
                    v-model="form.email"
                    :label="locale === 'ar' ? 'البريد الإلكتروني (غير قابل للتعديل)' : 'Email Address (Read Only)'"
                    variant="outlined"
                    prepend-inner-icon="tabler-mail"
                    disabled
                    class="mb-4"
                  />
                </VCol>
              </VRow>

              <div class="d-flex align-center justify-end gap-3 mt-4">
                <VBtn
                  color="primary"
                  size="large"
                  rounded="pill"
                  type="submit"
                  :loading="savingProfile"
                  class="px-8 font-weight-black"
                >
                  <VIcon icon="tabler-check" size="20" class="me-2" />
                  {{ locale === 'ar' ? 'حفظ التغيرات' : 'Save Changes' }}
                </VBtn>
              </div>
            </VForm>
          </div>

          <!-- TAB 3: QUICK SHORTCUTS -->
          <div v-else-if="activeTab === 'shortcuts'" class="tab-content py-4">
            <h3 class="text-h4 font-weight-black mb-6">
              {{ locale === 'ar' ? 'اختصارات وإجراءات سريعة' : 'Quick Actions & Shortcuts' }}
            </h3>

            <VRow>
              <VCol cols="12" sm="6" md="4">
                <VCard class="pa-6 rounded-2xl border text-center h-100 shortcut-card" elevation="4" to="/user/favorites">
                  <VAvatar color="error" variant="tonal" size="56" class="mb-4">
                    <VIcon icon="tabler-heart" size="28" />
                  </VAvatar>
                  <h4 class="text-h5 font-weight-black mb-2">{{ locale === 'ar' ? 'قائمة المفضلة' : 'My Favorites' }}</h4>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    {{ locale === 'ar' ? 'عرض كافة السيارات التي قمت بإضافتها للمفضلة' : 'View all cars saved to your favorite list' }}
                  </p>
                </VCard>
              </VCol>

              <VCol cols="12" sm="6" md="4">
                <VCard class="pa-6 rounded-2xl border text-center h-100 shortcut-card" elevation="4" to="/user/sell">
                  <VAvatar color="primary" variant="tonal" size="56" class="mb-4">
                    <VIcon icon="tabler-car-plus" size="28" />
                  </VAvatar>
                  <h4 class="text-h5 font-weight-black mb-2">{{ locale === 'ar' ? 'أضف سيارتك للبيع' : 'Sell Your Car' }}</h4>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    {{ locale === 'ar' ? 'قم بإضافة سيارة جديدة وعرضها للآلاف المشترين' : 'List a new car and reach thousands of buyers' }}
                  </p>
                </VCard>
              </VCol>

              <VCol cols="12" sm="6" md="4">
                <VCard class="pa-6 rounded-2xl border text-center h-100 shortcut-card" elevation="4" to="/seller/dashboard">
                  <VAvatar color="amber" variant="tonal" size="56" class="mb-4">
                    <VIcon icon="tabler-dashboard" size="28" />
                  </VAvatar>
                  <h4 class="text-h5 font-weight-black mb-2">{{ locale === 'ar' ? 'لوحة تحكم المعرض' : 'Seller Dashboard' }}</h4>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    {{ locale === 'ar' ? 'إدارة العروض المتقدمة وإعلانات المعرض' : 'Advanced dashboard for showroom & sellers' }}
                  </p>
                </VCard>
              </VCol>

              <VCol cols="12" sm="6" md="4">
                <VCard class="pa-6 rounded-2xl border text-center h-100 shortcut-card" elevation="4" @click="handleLogout">
                  <VAvatar color="secondary" variant="tonal" size="56" class="mb-4">
                    <VIcon icon="tabler-logout" size="28" />
                  </VAvatar>
                  <h4 class="text-h5 font-weight-black mb-2">{{ locale === 'ar' ? 'تسجيل الخروج' : 'Log Out' }}</h4>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    {{ locale === 'ar' ? 'إنهاء الجلسة الحالية والاطمئنان على الأمان' : 'Safely log out of your current session' }}
                  </p>
                </VCard>
              </VCol>
            </VRow>
          </div>
        </VCard>
      </template>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 80vh;
}

.profile-header-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.15), rgba(24, 30, 44, 0.85)) !important;
  backdrop-filter: blur(25px);
  border: 1px solid rgba(var(--v-theme-primary), 0.35) !important;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.25), transparent 70%);
    pointer-events: none;
  }
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 3px solid rgba(var(--v-theme-primary), 0.6);
  background: linear-gradient(135deg, #FF6B00, #FF9F43) !important;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border: 2px solid #1a202c;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.15);
    background: #ff8533;
  }
}

.stat-box {
  background: rgba(22, 27, 38, 0.5) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(var(--v-theme-primary), 0.35) !important;
  }
}

.shortcut-card {
  background: rgba(22, 27, 38, 0.4) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(var(--v-theme-primary), 0.4) !important;
    background: rgba(30, 38, 54, 0.6) !important;
  }
}

:deep(.cars-section--embedded) { padding: 0 !important; }
:deep(.cars-section__container) { padding: 0 !important; }
:deep(.cars-section__header) { margin-bottom: 16px !important; }
</style>
