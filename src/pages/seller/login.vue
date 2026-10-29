<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@core/stores/config'
import sellerApi from '@/api/sellerApi.js'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()
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

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const errorMessage = ref('')
const isPasswordVisible = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''

  if (!form.value.email || !form.value.password) {
    errorMessage.value = tr('Please enter your email and password.', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.')
    return
  }

  loading.value = true

  try {
    const response = await sellerApi.login({
      email: form.value.email,
      password: form.value.password,
    })

    const data = response?.data?.data
    if (!data || !data.token) {
      throw new Error('Invalid response from server')
    }

    const { token, seller } = data

    // Store seller token and details
    localStorage.setItem('seller_token', token)
    localStorage.setItem('seller_data', JSON.stringify(seller))
    localStorage.setItem('user_token', token)
    localStorage.setItem('user_data', JSON.stringify(seller))
    localStorage.setItem('user_type', 'seller')

    window.dispatchEvent(new Event('auth:changed'))

    router.push('/seller/dashboard')
  } catch (err) {
    console.error('Seller login error:', err)
    if (err.response && err.response.data) {
      if (err.response.status === 401 || err.response.data.message === 'Unauthorized') {
        errorMessage.value = tr(
          'Incorrect email or password. Please try again.',
          'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.'
        )
      } else if (err.response.data.errors) {
        errorMessage.value = Object.values(err.response.data.errors).flat().join(' • ')
      } else {
        errorMessage.value = err.response.data.message || err.response.data.error || 'Login failed'
      }
    } else {
      errorMessage.value = err.message || tr('Login failed. Please check your credentials.', 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex flex-column align-center justify-center pa-4 position-relative">
    <!-- Top Header Bar (Logo + Language & Theme Controls) -->
    <div class="auth-header-bar w-100 d-flex align-center justify-space-between mb-6 px-2" style="max-width: 500px;">
      <!-- App Logo -->
      <RouterLink
        to="/"
        class="auth-logo d-flex align-center gap-x-3 text-decoration-none"
      >
        <VNodeRenderer v-if="themeConfig.app.logo" :nodes="themeConfig.app.logo" />
        <h1 class="auth-title text-white text-h4 font-weight-bold mb-0">
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

    <!-- Main Auth Card -->
    <VCard class="auth-card" elevation="24">
      <VCardText class="pa-8 pa-sm-10">
        <!-- Badge & Title -->
        <div class="text-center mb-6">
          <div class="portal-badge d-inline-flex align-center gap-x-2 px-4 py-1 rounded-pill mb-3">
            <VIcon icon="tabler-building-store" size="18" class="text-primary" />
            <span class="text-caption font-weight-bold text-uppercase tracking-wider">
              {{ tr('Seller & Showroom Portal', 'بوابة المعارض والوكلاء') }}
            </span>
          </div>

          <h2 class="text-h4 font-weight-bold mb-2 text-white">
            {{ tr('Welcome Back 👋', 'مرحباً بك مجدداً 👋') }}
          </h2>
          <p class="text-disabled text-body-2 mb-0">
            {{ tr('Sign in to manage your showroom, stock and sales', 'سجّل الدخول لإدارة معرضك، مخزون سياراتك، والمبيعات') }}
          </p>
        </div>

        <!-- Form -->
        <VForm @submit.prevent="handleLogin">
          <VRow>
            <!-- Email -->
            <VCol cols="12">
              <label class="input-label">
                {{ tr('Email Address', 'البريد الإلكتروني') }}
              </label>
              <VTextField
                v-model="form.email"
                placeholder="seller@negmcars.com"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
                type="email"
                autofocus
                prepend-inner-icon="tabler-mail"
              />
            </VCol>

            <!-- Password -->
            <VCol cols="12">
              <label class="input-label">
                {{ tr('Password', 'كلمة المرور') }}
              </label>
              <VTextField
                v-model="form.password"
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••••••"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
                autocomplete="current-password"
                prepend-inner-icon="tabler-lock"
                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />

              <div class="d-flex align-center flex-wrap justify-space-between mt-4">
                <VCheckbox
                  v-model="form.remember"
                  :label="tr('Remember me', 'تذكرني')"
                  class="remember-checkbox"
                  hide-details
                />
                <a href="javascript:void(0)" class="text-body-2 text-disabled text-decoration-underline hover-white">
                  {{ tr('Forgot Password?', 'نسيت كلمة المرور؟') }}
                </a>
              </div>
            </VCol>

            <!-- Error message -->
            <VCol v-if="errorMessage" cols="12">
              <div class="error-alert d-flex align-center gap-x-2 pa-3 rounded-lg">
                <VIcon icon="tabler-alert-circle" size="20" color="error" />
                <span class="text-error text-body-2 font-weight-medium">{{ errorMessage }}</span>
              </div>
            </VCol>

            <!-- Submit Button -->
            <VCol cols="12" class="mt-2">
              <VBtn
                block
                color="primary"
                height="54"
                type="submit"
                :loading="loading"
                class="auth-submit-btn"
              >
                <VIcon icon="tabler-login-2" class="me-2" size="20" />
                {{ tr('Login to Showroom Dashboard', 'الدخول إلى لوحة المعرض') }}
              </VBtn>
            </VCol>

            <!-- Divider -->
            <VCol cols="12" class="d-flex align-center my-2">
              <VDivider />
              <span class="mx-4 text-disabled text-caption font-weight-bold opacity-60">
                {{ tr('or', 'أو') }}
              </span>
              <VDivider />
            </VCol>

            <!-- Register Link -->
            <VCol cols="12" class="text-center text-body-2">
              <span class="text-disabled">
                {{ tr('New showroom partner?', 'معرض جديد أو تاجر سيارات؟') }}
              </span>
              <RouterLink
                to="/seller/register"
                class="text-primary font-weight-bold ms-2 text-decoration-none hover-underline"
              >
                {{ tr('Create Seller Account', 'سجّل حساب معرض جديد') }}
              </RouterLink>
            </VCol>

            <!-- Customer Login Link & Back to website -->
            <VCol cols="12" class="text-center pt-2">
              <div class="d-flex align-center justify-center gap-4 flex-wrap text-caption text-disabled">
                <RouterLink
                  to="/login"
                  class="text-decoration-none hover-white d-inline-flex align-center gap-x-1"
                >
                  <VIcon icon="tabler-user" size="14" />
                  {{ tr('Customer Login', 'دخول المستخدمين') }}
                </RouterLink>

                <span>•</span>

                <RouterLink
                  to="/"
                  class="text-decoration-none hover-white d-inline-flex align-center gap-x-1"
                >
                  <VIcon :icon="isAr ? 'tabler-arrow-narrow-right' : 'tabler-arrow-narrow-left'" size="14" />
                  {{ tr('Back to Homepage', 'العودة للرئيسية') }}
                </RouterLink>
              </div>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.auth-wrapper {
  min-height: 100vh;
  background-color: #0f111a;
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.14) 0%, transparent 80%);
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background-color: #1c1f2e !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

.portal-badge {
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  color: rgb(var(--v-theme-primary));
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(0, 0, 0, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff !important;

  input {
    color: #fff !important;
  }

  &.v-field--focused {
    border-color: rgba(var(--v-theme-primary), 0.8);
  }
}

.auth-submit-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  text-transform: none !important;
  box-shadow: 0 10px 30px -10px rgba(var(--v-theme-primary), 0.6) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 35px -8px rgba(var(--v-theme-primary), 0.75) !important;
  }
}

.error-alert {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.hover-white {
  transition: color 0.2s ease;
  &:hover {
    color: #fff !important;
  }
}

.hover-underline:hover {
  text-decoration: underline !important;
}

.auth-title {
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;

  .logo-brand-text {
    color: #FFFFFF !important;
  }
  .logo-accent-text {
    color: #FF6B00 !important;
  }
}

.remember-checkbox :deep(.v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 14px;
}

.tracking-wider {
  letter-spacing: 0.05em;
}
</style>
