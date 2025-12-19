<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import userApi from '@/api/userApi.js' // الآن هذا الكائن به دالة login
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// assets
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

const form = ref({
  email: '',
  password: '',
  remember: false,
})
const loading = ref(false)
const errorMessage = ref('')
const isPasswordVisible = ref(false)

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    // استدعاء دالة login من userApi (هترسل الطلب فعلياً)
    const response = await userApi.login({
      email: form.value.email,
      password: form.value.password,
    })

    // تأكد من بنية الاستجابة قبل الاستخدام
    const data = response?.data?.data
    if (!data || !data.token) {
      throw new Error('Invalid response from server')
    }

    const { token, user } = data

    // حفظ التوكن والمستخدم باسم مخصص للمستخدم العادي
    localStorage.setItem('user_token', token)
    localStorage.setItem('user_data', JSON.stringify(user))

    // التوجيه للداشبورد الرئيسي
    router.push('/')
  } catch (err) {
    console.error('Login error:', err)

    // رسائل خطأ أوضح (لو في استجابة من السيرفر استعملها)
    if (err.response && err.response.data) {
      // حاول تختار رسالة من body
      errorMessage.value =
        err.response.data.message ||
        err.response.data.error ||
        JSON.stringify(err.response.data)
    } else {
      errorMessage.value = err.message || 'Login failed. Please check your credentials.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">{{ themeConfig.app.title }}</h1>
    </div>
  </a>

  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol md="8" class="d-none d-md-flex">
      <div class="position-relative bg-background w-100 me-0">
        <div class="d-flex align-center justify-center w-100 h-100" style="padding-inline: 6.25rem;">
          <VImg max-width="613" :src="authThemeImg" class="auth-illustration mt-16 mb-2" />
        </div>

        <img class="auth-footer-mask flip-in-rtl" :src="authThemeMask" alt="auth-footer-mask" height="280" width="100" />
      </div>
    </VCol>

    <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻</h4>
          <p class="mb-0">Please sign in to your account to continue</p>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="handleLogin">
            <VRow>
              <VCol cols="12">
                <AppTextField v-model="form.email" label="Email" type="email" placeholder="johndoe@email.com" required />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="current-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  required
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox v-model="form.remember" label="Remember me" />
                  <a class="text-primary" href="javascript:void(0)">Forgot Password?</a>
                </div>

                <div v-if="errorMessage" class="text-error mb-4">{{ errorMessage }}</div>

                <VBtn block type="submit" :loading="loading">Login</VBtn>
              </VCol>

              <VCol cols="12" class="text-body-1 text-center">
                <span>New on our platform?</span>
                <a class="text-primary ms-1" href="javascript:void(0)">Create an account</a>
              </VCol>

              <VCol cols="12" class="d-flex align-center">
                <VDivider /><span class="mx-4">or</span><VDivider />
              </VCol>

              <VCol cols="12" class="text-center">
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
