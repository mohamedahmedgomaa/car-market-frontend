<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import userApi from '@/api/userApi.js'

import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()

const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const formRef = ref(null)

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  privacyPolicies: false,
})

const loading = ref(false)
const errorMessage = ref('')

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const extractErrorMessage = (err) => {
  // Laravel validation: { message, errors: {field:[...] } }
  const data = err?.response?.data
  if (!data) return err?.message || 'Register failed'

  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0]
    const firstMsg = data.errors[firstKey]?.[0]
    if (firstMsg) return firstMsg
  }

  return data.message || data.error || JSON.stringify(data)
}

const handleRegister = async () => {
  errorMessage.value = ''

  // لو عندك validators شغالة في AppTextField هتشتغل تلقائيًا
  // ولو عايز تتحقق من VForm:
  const isValid = await formRef.value?.validate?.()
  if (isValid === false) return

  if (!form.value.privacyPolicies) {
    errorMessage.value = 'You must agree to privacy policy & terms.'
    return
  }

  loading.value = true
  try {
    const response = await userApi.register({
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })

    // نفس منطق اللوجين (حسب شكل الريسبونس عندك)
    const data = response?.data?.data ?? response?.data
    const token = data?.token
    const user = data?.user ?? data?.data ?? data?.me ?? null

    // لو API بيرجع token بعد التسجيل
    if (token) {
      localStorage.setItem('user_token', token)
    }
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user))
    }

    // روح لصفحة البروفايل أو الهوم
    router.push('/user/profile')
  } catch (err) {
    console.error('User register error:', err)
    errorMessage.value = extractErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol md="8" class="d-none d-md-flex">
      <div class="position-relative bg-background w-100 me-0">
        <div class="d-flex align-center justify-center w-100 h-100" style="padding-inline: 100px;">
          <VImg max-width="500" :src="imageVariant" class="auth-illustration mt-16 mb-2" />
        </div>

        <img
          class="auth-footer-mask"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));"
    >
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-4">
        <VCardText>
          <h4 class="text-h4 mb-1">Create your account 🚀</h4>
          <p class="mb-0">Join us and start browsing cars!</p>
        </VCardText>

        <VCardText>
          <VForm ref="formRef" @submit.prevent="handleRegister">
            <VRow>
              <!-- Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.name"
                  :rules="[requiredValidator]"
                  autofocus
                  label="Name"
                  placeholder="Mohamed Gomaa"
                />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  type="email"
                  placeholder="mohamed@email.com"
                />
              </VCol>

              <!-- Phone -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.phone"
                  :rules="[requiredValidator]"
                  label="Phone"
                  placeholder="05xxxxxxxx"
                />
              </VCol>

              <!-- Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  :rules="[requiredValidator]"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- Confirm Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password_confirmation"
                  :rules="[requiredValidator]"
                  label="Confirm Password"
                  placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex align-center my-4">
                  <VCheckbox id="privacy-policy" v-model="form.privacyPolicies" inline />
                  <VLabel for="privacy-policy" style="opacity: 1;">
                    <span class="me-1 text-high-emphasis">I agree to</span>
                    <a href="javascript:void(0)" class="text-primary">privacy policy & terms</a>
                  </VLabel>
                </div>

                <div v-if="errorMessage" class="text-error mb-4">
                  {{ errorMessage }}
                </div>

                <VBtn block type="submit" :loading="loading">
                  Sign up
                </VBtn>
              </VCol>

              <VCol cols="12" class="text-center text-base">
                <span class="d-inline-block">Already have an account?</span>
                <RouterLink class="text-primary ms-1 d-inline-block" :to="{ name: 'login' }">
                  Sign in instead
                </RouterLink>
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
