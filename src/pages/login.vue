<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@core/stores/config'
import userApi from '@/api/userApi.js'
import sellerApi from '@/api/sellerApi.js'
import { themeConfig } from '@themeConfig'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })
const configStore = useConfigStore()

const isAr = computed(() => locale.value === 'ar')
const tr = (en, ar) => (isAr.value ? ar : en)

const safeLangConfig = computed(() => themeConfig.app.i18n?.langConfig || [
  { label: 'English', i18nLang: 'en' },
  { label: 'العربية', i18nLang: 'ar' },
])

const toggleTheme = () => {
  configStore.theme = configStore.theme === 'dark' ? 'light' : 'dark'
}

// Tab state: 'login' | 'register'
const activeTab = ref(route.query.tab === 'register' ? 'register' : 'login')

const form = ref({
  name: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
  accountType: 'individual', // 'individual' | 'showroom'
  showroomName: '',
  remember: false,
  agreeToTerms: false,
})

const loading = ref(false)
const errorMessage = ref('')
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const handleAuth = async () => {
  if (activeTab.value === 'register') {
    if (!form.value.name || !form.value.email || !form.value.password || !form.value.phone) {
      errorMessage.value = 'Please fill in all required fields.'
      return
    }
    if (form.value.password !== form.value.password_confirmation) {
      errorMessage.value = 'Passwords do not match.'
      return
    }
    if (!form.value.agreeToTerms) {
      errorMessage.value = 'Please agree to the terms and conditions.'
      return
    }
    if (form.value.accountType === 'showroom' && !form.value.showroomName) {
      errorMessage.value = 'Please enter your showroom name.'
      return
    }
  }

  errorMessage.value = ''
  loading.value = true

  let userType = 'user'
  try {
    let response
    if (activeTab.value === 'login') {
      try {
        response = await userApi.login({
          email: form.value.email,
          password: form.value.password,
        })
        userType = 'user'
      } catch (userErr) {
        // If user login fails, try seller login
        try {
          response = await sellerApi.login({
            email: form.value.email,
            password: form.value.password,
          })
          userType = 'seller'
        } catch (sellerErr) {
          // If both fail, throw the error
          throw userErr
        }
      }
    } else {
      userType = form.value.accountType === 'showroom' ? 'seller' : 'user'
      if (userType === 'seller') {
        response = await sellerApi.register({
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          password: form.value.password,
          password_confirmation: form.value.password_confirmation,
          store_name_en: form.value.showroomName,
          store_name_ar: form.value.showroomName, // Using same for both for simplicity
        })
      } else {
        response = await userApi.register({
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          password: form.value.password,
          password_confirmation: form.value.password_confirmation,
        })
      }
    }

    const data = response?.data?.data
    if (!data || !data.token) {
      throw new Error('Invalid response from server')
    }

    const tokenKey = `${userType}_token`
    localStorage.setItem(tokenKey, data.token)
    localStorage.setItem('user_token', data.token) // Fallback
    
    // Handle both 'user' and 'seller' keys in response
    const userData = data.user || data.seller
    localStorage.setItem('user_data', JSON.stringify(userData))
    localStorage.setItem('user_type', userType)
    
    window.dispatchEvent(new Event('auth:changed'))
    router.push('/')
  } catch (err) {
    console.error('Auth error:', err)
    if (err.response && err.response.data) {
      // Handle Laravel validation errors
      if (err.response.data.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0]
        errorMessage.value = firstError
      } else {
        errorMessage.value = err.response.data.message || err.response.data.error || 'Authentication failed'
      }
    } else {
      errorMessage.value = err.message || 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex flex-column align-center justify-center pa-4 position-relative">
    <!-- Header Top Bar (Logo + Language & Theme Controls) -->
    <div class="auth-header-bar w-100 d-flex align-center justify-space-between mb-6 px-2" style="max-width: 500px;">
      <!-- App Logo -->
      <RouterLink
        to="/"
        class="auth-logo d-flex align-center gap-x-3 text-decoration-none"
      >
        <VNodeRenderer v-slot="{ nodes }" v-if="themeConfig.app.logo" :nodes="themeConfig.app.logo" />
        <h1 class="auth-title text-h4 font-weight-bold mb-0">
          <span class="logo-brand-text">Negm</span><span class="logo-accent-text">Cars</span>
        </h1>
      </RouterLink>

      <!-- Settings Controls (Language & Theme) -->
      <div class="d-flex align-center gap-2">
        <VMenu close-on-content-click="false" offset="8px" width="180">
          <template #activator="{ props }">
            <VBtn v-bind="props" variant="tonal" color="primary" rounded="pill" size="small" class="font-weight-bold">
              <VIcon icon="tabler-world" class="me-1" size="18" />
              {{ locale === 'ar' ? 'العربية' : 'English' }}
              <VIcon icon="tabler-chevron-down" class="ms-1" size="14" />
            </VBtn>
          </template>
          <VList class="pa-2" style="border-radius: 12px">
            <VListItem
              v-for="lang in safeLangConfig"
              :key="lang.i18nLang"
              :active="locale === lang.i18nLang"
              color="primary"
              rounded="lg"
              class="mb-1"
              @click="locale = lang.i18nLang"
            >
              <template #prepend>
                <VIcon :icon="locale === lang.i18nLang ? 'tabler-circle-check-filled' : 'tabler-circle'" size="16" class="me-2" />
              </template>
              <VListItemTitle>{{ lang.label }}</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VBtn icon variant="tonal" color="primary" rounded="circle" size="small" @click="toggleTheme" title="Toggle Theme">
          <VIcon :icon="configStore.theme === 'dark' ? 'tabler-sun' : 'tabler-moon'" size="18" />
        </VBtn>
      </div>
    </div>

    <VCard class="auth-card" elevation="24">
      <!-- Tabs Header -->
      <div class="auth-tabs">
        <button
          class="auth-tab"
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          {{ tr('Sign In', 'تسجيل الدخول') }}
        </button>
        <button
          class="auth-tab"
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          {{ tr('Register', 'حساب جديد') }}
        </button>
      </div>

      <VCardText class="pa-10">
        <!-- Title -->
        <h2 class="text-h4 font-weight-bold mb-8 text-center text-high-emphasis">
          {{ activeTab === 'login' ? tr('Hello! Welcome back!', 'مرحباً بك مجدداً!') : tr('Create your account!', 'أنشئ حسابك الجديد!') }}
        </h2>

        <!-- Social Buttons -->
        <div class="social-section mb-8">
          <VBtn
            block
            variant="outlined"
            class="social-btn apple-btn mb-4"
            height="52"
            @click="errorMessage = tr('Apple Sign-in is coming soon! Please use Email/Password for now.', 'تسجيل الدخول عبر Apple سيتوفر قريباً! يرجى استخدام البريد الإلكتروني حالياً.')"
          >
            <VIcon icon="tabler-brand-apple-filled" class="me-3" size="24" />
            {{ tr('Sign in with Apple', 'تسجيل الدخول عبر Apple') }}
          </VBtn>

          <VBtn
            block
            variant="outlined"
            class="social-btn google-btn"
            height="52"
            @click="errorMessage = tr('Google Sign-in is coming soon! Please use Email/Password for now.', 'تسجيل الدخول عبر Google سيتوفر قريباً! يرجى استخدام البريد الإلكتروني حالياً.')"
          >
            <VIcon icon="tabler-brand-google-filled" class="me-3 google-icon" size="24" />
            {{ tr('Sign in with Google', 'تسجيل الدخول عبر Google') }}
          </VBtn>
        </div>

        <!-- Divider -->
        <div class="d-flex align-center my-8 text-disabled">
          <VDivider /><span class="mx-4 font-weight-bold opacity-60">{{ tr('or', 'أو') }}</span><VDivider />
        </div>

        <!-- Form -->
        <VForm @submit.prevent="handleAuth">
          <VRow>
            <!-- Account Type Selection (Register Only) -->
            <VCol v-if="activeTab === 'register'" cols="12" class="mb-4">
              <label class="input-label">{{ tr('I am registering as:', 'التسجيل كـ:') }}</label>
              <div class="role-selector d-flex gap-2 p-1">
                <VBtn
                  variant="flat"
                  :color="form.accountType === 'individual' ? 'primary' : 'secondary'"
                  class="flex-grow-1"
                  rounded="lg"
                  @click="form.accountType = 'individual'"
                >
                  <VIcon icon="tabler-user" class="me-2" />
                  {{ tr('Individual', 'حساب فردي') }}
                </VBtn>
                <VBtn
                  variant="flat"
                  :color="form.accountType === 'showroom' ? 'primary' : 'secondary'"
                  class="flex-grow-1"
                  rounded="lg"
                  @click="form.accountType = 'showroom'"
                >
                  <VIcon icon="tabler-building-store" class="me-2" />
                  {{ tr('Showroom', 'معرض سيارات') }}
                </VBtn>
              </div>
            </VCol>

            <VCol v-if="activeTab === 'register'" cols="12">
              <label class="input-label">{{ tr('Full Name', 'الاسم الكامل') }}</label>
              <VTextField
                v-model="form.name"
                :placeholder="tr('Your full name', 'ادخل اسمك الكامل')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              />
            </VCol>

            <VCol v-if="activeTab === 'register' && form.accountType === 'showroom'" cols="12">
              <label class="input-label">{{ tr('Showroom Name', 'اسم المعرض') }}</label>
              <VTextField
                v-model="form.showroomName"
                :placeholder="tr('Ex: Golden Motors', 'مثال: معرض الذهبي للسيارات')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              />
            </VCol>

            <VCol cols="12">
              <label class="input-label">{{ tr('Email Address', 'البريد الإلكتروني') }}</label>
              <VTextField
                v-model="form.email"
                placeholder="name@example.com"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              />
            </VCol>

            <VCol v-if="activeTab === 'register'" cols="12">
              <label class="input-label">{{ tr('Phone Number', 'رقم الهاتف') }}</label>
              <VTextField
                v-model="form.phone"
                placeholder="+20 123 456 7890"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              />
            </VCol>

            <VCol cols="12">
              <label class="input-label">{{ tr('Password', 'كلمة المرور') }}</label>
              <VTextField
                v-model="form.password"
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />

              <div v-if="activeTab === 'login'" class="mt-4 text-end">
                <a href="javascript:void(0)" class="text-body-2 text-disabled text-decoration-underline hover-white"><span>{{ tr('Forgot password?', 'نسيت كلمة المرور؟') }}</span></a>
              </div>
            </VCol>

            <VCol v-if="activeTab === 'register'" cols="12">
              <label class="input-label">{{ tr('Confirm Password', 'تأكيد كلمة المرور') }}</label>
              <VTextField
                v-model="form.password_confirmation"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
                :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
              />
            </VCol>

            <!-- Register Requirements -->
            <VCol v-if="activeTab === 'register'" cols="12">
              <div class="password-requirements d-flex flex-column gap-y-2 mt-4">
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2 text-success" />
                  {{ tr('Min. 8 characters', '٨ عناصر على الأقل') }}
                </div>
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2 text-success" />
                  {{ tr('Includes letters', 'تتضمن أحرفاً') }}
                </div>
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2 text-success" />
                  {{ tr('Numbers or symbols', 'أرقام أو رموز') }}
                </div>
              </div>

              <VCheckbox
                v-model="form.agreeToTerms"
                class="mt-6"
                hide-details
              >
                <template #label>
                  <div class="text-body-2 text-disabled line-height-1-6">
                    {{ tr('I agree to the processing of my data as described in the', 'أوافق على معالجة بياناتي كما هو موضح في') }}
                    <a href="#" class="text-high-emphasis text-decoration-underline font-weight-bold">{{ tr('privacy policy', 'سياسة الخصوصية') }}</a>.
                  </div>
                </template>
              </VCheckbox>
            </VCol>

            <VCol cols="12" class="mt-8">
              <div v-if="errorMessage" class="text-error mb-4 text-center text-body-2 font-weight-bold">{{ errorMessage }}</div>
              <VBtn
                block
                color="primary"
                height="56"
                type="submit"
                :loading="loading"
                class="auth-submit-btn"
              >
                {{ activeTab === 'login' ? tr('Login', 'تسجيل الدخول') : tr('Register', 'إنشاء حساب') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
        <!-- Terms Footer -->
        <div v-if="activeTab === 'register'" class="mt-8 text-center text-caption text-disabled px-4 line-height-1-6">
          {{ tr('The AGB of NegmCars apply. Information on data processing is described in the', 'تطبق الشروط والأحكام الخاصة بـ NegmCars. معلومات معالجة البيانات مبيّنة في') }}
          <a href="#" class="text-high-emphasis font-weight-bold">{{ tr('Privacy Policy', 'سياسة الخصوصية') }}</a>.
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.auth-wrapper {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-background));
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.12) 0%, transparent 80%);
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background-color: rgba(var(--v-theme-surface), 0.9) !important;
  border-radius: 28px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
}

.auth-tab {
  flex: 1;
  padding: 22px;
  border: 0;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    opacity: 0.7;
    background: rgba(var(--v-theme-on-surface), 0.03);
  }

  &.active {
    opacity: 1;
    color: rgb(var(--v-theme-primary));

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: rgb(var(--v-theme-primary));
      box-shadow: 0 -2px 12px rgba(var(--v-theme-primary), 0.6);
    }
  }
}

.social-btn {
  text-transform: none !important;
  font-weight: 700 !important;
  border-radius: 14px !important;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.15) !important;
  color: rgba(var(--v-theme-on-surface), 0.9) !important;
  transition: all 0.3s ease !important;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.05) !important;
    border-color: #a855f7 !important;
    transform: translateY(-2px);
  }
}

.google-icon {
  color: #ea4335;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);

  &.v-field--focused {
    border-color: rgba(var(--v-theme-primary), 0.8);
  }
}

.role-selector {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.auth-submit-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 18px !important;
  text-transform: none !important;
  box-shadow: 0 10px 30px -10px rgba(var(--v-theme-primary), 0.6) !important;
}

.req-item {
  font-size: 13px;
  font-weight: 600;
}

.line-height-1-6 {
  line-height: 1.6;
}

.hover-white:hover {
  color: #fff !important;
}

.opacity-60 {
  opacity: 0.6;
}

.auth-title {
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;

  .logo-brand-text {
    transition: color 0.3s ease;
  }
  .logo-accent-text {
    color: #FF6B00 !important;
  }
}

.v-theme--dark .auth-title .logo-brand-text {
  color: #FFFFFF !important;
}
.v-theme--light .auth-title .logo-brand-text {
  color: #0F172A !important;
}
</style>
