<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import sellerApi from '@/api/sellerApi.js'

import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// نفس صور صفحة seller login
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

const formRef = ref()
const loading = ref(false)
const errorMessage = ref('')

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const authThemeImg = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const form = ref({
  name: '',
  email: '',
  phone: '',

  password: '',
  password_confirmation: '',

  store_name_en: '',
  store_name_ar: '',
  store_description_en: '',
  store_description_ar: '',

  business_license: '',
  bank_account: '',

  store_logo: null, // File
})

// قواعد بسيطة (لو عندك validators جاهزة في مشروعك استعملها بدل دي)
const required = v => !!String(v ?? '').trim() || 'Required'
const emailRule = v => /.+@.+\..+/.test(String(v ?? '')) || 'Invalid email'
const min6 = v => String(v ?? '').length >= 6 || 'Min 6 characters'
const max20 = v => !v || String(v).length <= 20 || 'Max 20 characters'
const max255 = v => !v || String(v).length <= 255 || 'Max 255 characters'

const handleRegister = async () => {
  errorMessage.value = ''

  // Vuetify validate
  const ok = await formRef.value?.validate?.()
  if (ok?.valid === false) return

  // تحقق بسيط لكلمة السر confirmation
  if (form.value.password !== form.value.password_confirmation) {
    errorMessage.value = 'Password confirmation does not match'
    return
  }

  loading.value = true

  try {
    const fd = new FormData()

    // required
    fd.append('name', form.value.name)
    fd.append('email', form.value.email)
    fd.append('password', form.value.password)
    fd.append('password_confirmation', form.value.password_confirmation)
    fd.append('store_name_en', form.value.store_name_en)
    fd.append('store_name_ar', form.value.store_name_ar)

    // nullable
    if (form.value.phone) fd.append('phone', form.value.phone)
    if (form.value.store_description_en) fd.append('store_description_en', form.value.store_description_en)
    if (form.value.store_description_ar) fd.append('store_description_ar', form.value.store_description_ar)
    if (form.value.business_license) fd.append('business_license', form.value.business_license)
    if (form.value.bank_account) fd.append('bank_account', form.value.bank_account)

    // image
    if (form.value.store_logo instanceof File) {
      fd.append('store_logo', form.value.store_logo)
    }

    const response = await sellerApi.register(fd)

    const data = response?.data?.data ?? response?.data
    // متوقع يرجع token + seller (زي login)
    const token = data?.token
    const seller = data?.seller ?? data?.user ?? data

    if (!token) throw new Error('Invalid response from server')

    localStorage.setItem('seller_token', token)
    localStorage.setItem('seller_data', JSON.stringify(seller))

    router.push('/seller/dashboard')
  } catch (err) {
    console.error('Seller register error:', err)

    if (err?.response?.data) {
      errorMessage.value =
        err.response.data.message ||
        err.response.data.error ||
        (err.response.data.errors ? JSON.stringify(err.response.data.errors) : JSON.stringify(err.response.data))
    } else {
      errorMessage.value = err?.message || 'Register failed'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">Seller Portal</h1>
    </div>
  </RouterLink>

  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol md="8" class="d-none d-md-flex">
      <div class="position-relative bg-background w-100 me-0">
        <div class="d-flex align-center justify-center w-100 h-100" style="padding-inline: 6.25rem;">
          <VImg max-width="613" :src="authThemeImg" class="auth-illustration mt-16 mb-2" />
        </div>

        <img
          class="auth-footer-mask flip-in-rtl"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="520" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">Create Seller Account 🏪</h4>
          <p class="mb-0">Register to start selling cars on the platform</p>
        </VCardText>

        <VCardText>
          <VForm ref="formRef" @submit.prevent="handleRegister">
            <VRow>
              <!-- name -->
              <VCol cols="12">
                <AppTextField v-model="form.name" label="Name" :rules="[required]" placeholder="Seller name" />
              </VCol>

              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  label="Email"
                  type="email"
                  :rules="[required, emailRule]"
                  placeholder="seller@email.com"
                />
              </VCol>

              <!-- phone (nullable) -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.phone"
                  label="Phone (optional)"
                  :rules="[max20]"
                  placeholder="05xxxxxxxx"
                />
              </VCol>

              <!-- store names -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.store_name_en"
                  label="Store Name (EN)"
                  :rules="[required, max255]"
                  placeholder="My Store"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.store_name_ar"
                  label="Store Name (AR)"
                  :rules="[required, max255]"
                  placeholder="متجري"
                />
              </VCol>

              <!-- descriptions -->
              <VCol cols="12">
                <AppTextarea
                  v-model="form.store_description_en"
                  label="Store Description (EN) (optional)"
                  rows="2"
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="form.store_description_ar"
                  label="Store Description (AR) (optional)"
                  rows="2"
                />
              </VCol>

              <!-- store logo -->
              <VCol cols="12">
                <VFileInput
                  v-model="form.store_logo"
                  label="Store Logo (optional)"
                  accept="image/*"
                  prepend-icon="tabler-photo"
                  variant="outlined"
                  density="comfortable"
                  show-size
                  clearable
                />
              </VCol>

              <!-- business & bank -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.business_license"
                  label="Business License (optional)"
                  :rules="[max255]"
                  placeholder="License number"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.bank_account"
                  label="Bank Account (optional)"
                  :rules="[max255]"
                  placeholder="IBAN / Account"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :rules="[required, min6]"
                />
              </VCol>

              <!-- password confirmation -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password_confirmation"
                  label="Confirm Password"
                  placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  :rules="[required]"
                />
              </VCol>

              <VCol cols="12" v-if="errorMessage">
                <div class="text-error">{{ errorMessage }}</div>
              </VCol>

              <VCol cols="12">
                <VBtn block type="submit" :loading="loading">
                  Register as Seller
                </VBtn>
              </VCol>

              <VCol cols="12" class="text-body-1 text-center">
                <span>Already have a seller account?</span>
                <RouterLink class="text-primary ms-1" to="/seller/login">Sign in</RouterLink>
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
