<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@core/stores/config'
import { useUserAuth } from '@/stores/userAuth.js'
import { useSellerAuth } from '@/stores/sellerAuth.js'
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
const userAuthStore = useUserAuth()
const sellerAuthStore = useSellerAuth()

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
  errorMessage.value = ''

  if (activeTab.value === 'login') {
    if (!form.value.email || !form.value.password) {
      errorMessage.value = tr('Please enter your email and password.', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }

    loading.value = true

    try {
      // 1) Try logging in as User first
      try {
        await userAuthStore.login(form.value.email, form.value.password)
        router.push('/')
        return
      } catch (userErr) {
        // 2) If user login fails (e.g. 401 Unauthorized or email belongs to a showroom seller)
        try {
          await sellerAuthStore.login(form.value.email, form.value.password)
          // Also set fallback user token/data for unified navbar
          localStorage.setItem('user_token', sellerAuthStore.token)
          localStorage.setItem('user_data', JSON.stringify(sellerAuthStore.seller))
          window.dispatchEvent(new Event('auth:changed'))
          router.push('/seller/dashboard')
          return
        } catch (sellerErr) {
          console.error('Login attempt errors:', { userErr, sellerErr })
          const status = userErr?.response?.status || sellerErr?.response?.status
          const msg = userErr?.response?.data?.message || sellerErr?.response?.data?.message

          if (status === 401 || msg === 'Unauthorized') {
            errorMessage.value = tr(
              'Incorrect email or password. Please try again.',
              'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.'
            )
          } else if (userErr?.response?.data?.errors || sellerErr?.response?.data?.errors) {
            const errs = userErr?.response?.data?.errors || sellerErr?.response?.data?.errors
            errorMessage.value = Object.values(errs).flat().join(' • ')
          } else {
            errorMessage.value = tr(
              'Authentication failed. Please check your credentials.',
              'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.'
            )
          }
        }
      }
    } finally {
      loading.value = false
    }
    return
  }

  // Register Tab
  if (activeTab.value === 'register') {
    if (!form.value.name || !form.value.email || !form.value.password || !form.value.phone) {
      errorMessage.value = tr('Please fill in all required fields.', 'يرجى ملء جميع الحقول المطلوبة.')
      return
    }
    if (form.value.password !== form.value.password_confirmation) {
      errorMessage.value = tr('Passwords do not match.', 'كلمتا المرور غير متطابقتين.')
      return
    }
    if (!form.value.agreeToTerms) {
      errorMessage.value = tr('Please agree to the terms and conditions.', 'يرجى الموافقة على الشروط والأحكام.')
      return
    }
    if (form.value.accountType === 'showroom' && !form.value.showroomName) {
      errorMessage.value = tr('Please enter your showroom name.', 'يرجى إدخال اسم المعرض.')
      return
    }

    loading.value = true

    try {
      if (form.value.accountType === 'showroom') {
        await sellerAuthStore.register({
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          password: form.value.password,
          password_confirmation: form.value.password_confirmation,
          store_name_en: form.value.showroomName,
          store_name_ar: form.value.showroomName,
        })

        // Also set fallback user token/data for unified frontend
        localStorage.setItem('user_token', sellerAuthStore.token)
        localStorage.setItem('user_data', JSON.stringify(sellerAuthStore.seller))
        window.dispatchEvent(new Event('auth:changed'))
        router.push('/seller/dashboard')
      } else {
        await userAuthStore.register({
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          password: form.value.password,
          password_confirmation: form.value.password_confirmation,
        })
        router.push('/')
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (err.response?.data?.errors) {
        errorMessage.value = Object.values(err.response.data.errors).flat().join(' • ')
      } else if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message
      } else {
        errorMessage.value = tr('Registration failed. Please try again.', 'فشل إنشاء الحساب. يرجى المحاولة مجدداً.')
      }
    } finally {
      loading.value = false
    }
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
            <VCol v-if="activeTab === 'register'" cols="12" class="mb-2">
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

              <!-- Dedicated Showroom Form Callout -->
              <div v-if="form.accountType === 'showroom'" class="mt-3 pa-3 rounded-lg border border-primary d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-2" style="background: rgba(var(--v-theme-primary), 0.08);">
                <div class="text-caption">
                  <span class="font-weight-bold d-block text-primary">
                    {{ tr('Looking for full showroom setup?', 'تريد التسجيل الشامل كمعرض معتمد؟') }}
                  </span>
                  <span class="text-medium-emphasis">
                    {{ tr('Add your logo, commercial record, tax card and location.', 'لإضافة الشعار، السجل التجاري، البطاقة الضريبية والموقع.') }}
                  </span>
                </div>
                <VBtn
                  size="small"
                  variant="tonal"
                  color="primary"
                  to="/seller/register"
                  class="flex-shrink-0 font-weight-bold"
                >
                  {{ tr('Open Full Form', 'النموذج الشامل') }}
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
