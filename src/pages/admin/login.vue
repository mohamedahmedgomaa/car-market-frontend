<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import adminApi from '@/api/adminApi.js'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

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

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    // ✅ استدعاء API الخاص بالأدمن
    const response = await adminApi.login({
      email: form.value.email,
      password: form.value.password,
    })

    const data = response?.data?.data
    if (!data || !data.token) {
      throw new Error('Invalid response from server')
    }

    const { token, admin } = data

    // ✅ تخزين بيانات الأدمن والتوكن بمفاتيح خاصة
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_data', JSON.stringify(admin))

    router.push('/admin/dashboard')
  } catch (err) {
    console.error('Admin login error:', err)
    if (err.response && err.response.data) {
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
  <div class="auth-wrapper d-flex flex-column align-center justify-center pa-4">
    <!-- App Logo -->
    <RouterLink
      to="/"
      class="auth-logo mb-6 d-flex align-center gap-x-3 text-decoration-none"
    >
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title text-white text-h4 font-weight-bold">{{ themeConfig.app.title }}</h1>
    </RouterLink>

    <VCard class="auth-card" elevation="24">
      <VCardText class="pa-10">
        <!-- Title -->
        <h2 class="text-h4 font-weight-bold mb-2 text-center text-white">
          Admin Portal
        </h2>
        <p class="text-center text-disabled mb-8">Sign in to central management system</p>

        <!-- Form -->
        <VForm @submit.prevent="handleLogin">
          <VRow>
            <VCol cols="12">
              <label class="input-label">Email Address</label>
              <VTextField
                v-model="form.email"
                placeholder="admin@negmcars.com"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
                type="email"
                autofocus
              />
            </VCol>

            <VCol cols="12">
              <label class="input-label">Password</label>
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

              <div class="d-flex align-center flex-wrap justify-space-between my-6">
                <VCheckbox v-model="form.remember" label="Remember me" class="remember-checkbox" hide-details />
                <a href="javascript:void(0)" class="text-body-2 text-disabled text-decoration-underline hover-white">Forgot password?</a>
              </div>
            </VCol>

            <VCol cols="12" class="mt-4">
              <div v-if="errorMessage" class="text-error mb-4 text-center text-body-2 font-weight-bold">{{ errorMessage }}</div>
              <VBtn
                block
                color="primary"
                height="56"
                type="submit"
                :loading="loading"
                class="auth-submit-btn"
              >
                Login to Dashboard
              </VBtn>
            </VCol>

            <!-- Back to website / home link -->
            <VCol cols="12" class="text-center mt-4">
              <RouterLink to="/" class="text-body-2 text-disabled text-decoration-none hover-white d-inline-flex align-center gap-x-1 justify-center">
                <VIcon icon="tabler-arrow-narrow-left" size="18" />
                Back to website
              </RouterLink>
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
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.12) 0%, transparent 80%);
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background-color: #1c1f2e !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #fff;
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &.v-field--focused {
    border-color: rgba(var(--v-theme-primary), 0.8);
  }
}

.auth-submit-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 18px !important;
  text-transform: none !important;
  box-shadow: 0 10px 30px -10px rgba(var(--v-theme-primary), 0.6) !important;
}

.hover-white:hover {
  color: #fff !important;
}

.auth-title {
  letter-spacing: 1px;
}

.remember-checkbox :deep(.v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 14px;
}
</style>

