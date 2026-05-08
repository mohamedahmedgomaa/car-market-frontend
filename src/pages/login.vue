<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import userApi from '@/api/userApi.js'
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

// Tab state: 'login' | 'register'
const activeTab = ref(route.query.tab === 'register' ? 'register' : 'login')

const form = ref({
  email: '',
  password: '',
  remember: false,
  agreeToTerms: false,
})

const loading = ref(false)
const errorMessage = ref('')
const isPasswordVisible = ref(false)

const handleAuth = async () => {
  if (activeTab.value === 'register' && !form.value.agreeToTerms) {
    errorMessage.value = 'Please agree to the terms and conditions.'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    let response
    if (activeTab.value === 'login') {
      response = await userApi.login({
        email: form.value.email,
        password: form.value.password,
      })
    } else {
      response = await userApi.register({
        email: form.value.email,
        password: form.value.password,
      })
    }

    const data = response?.data?.data
    if (!data || !data.token) {
      throw new Error('Invalid response from server')
    }

    localStorage.setItem('user_token', data.token)
    localStorage.setItem('user_data', JSON.stringify(data.user))
    
    window.dispatchEvent(new Event('auth:changed'))
    router.push('/')
  } catch (err) {
    console.error('Auth error:', err)
    if (err.response && err.response.data) {
      errorMessage.value = err.response.data.message || err.response.data.error || 'Authentication failed'
    } else {
      errorMessage.value = err.message || 'Something went wrong. Please try again.'
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
      <!-- Tabs Header -->
      <div class="auth-tabs">
        <button
          class="auth-tab"
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          Sign In
        </button>
        <button
          class="auth-tab"
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          Register
        </button>
      </div>

      <VCardText class="pa-10">
        <!-- Title -->
        <h2 class="text-h4 font-weight-bold mb-8 text-center text-white">
          {{ activeTab === 'login' ? 'Hello! Welcome back!' : 'Create your account!' }}
        </h2>

        <!-- Social Buttons (Only Apple & Google) -->
        <div class="social-section mb-8">
          <VBtn
            block
            variant="outlined"
            class="social-btn apple-btn mb-4"
            height="52"
          >
            <VIcon icon="tabler-brand-apple-filled" class="me-3" size="24" />
            Sign in with Apple
          </VBtn>

          <VBtn
            block
            variant="outlined"
            class="social-btn google-btn"
            height="52"
          >
            <!-- Custom Google Icon Colors via CSS filter or multi-icon if available -->
            <VIcon icon="tabler-brand-google-filled" class="me-3 google-icon" size="24" />
            Sign in with Google
          </VBtn>
        </div>

        <!-- Divider -->
        <div class="d-flex align-center my-8 text-disabled">
          <VDivider /><span class="mx-4 font-weight-bold opacity-60">or</span><VDivider />
        </div>

        <!-- Form -->
        <VForm @submit.prevent="handleAuth">
          <VRow>
            <VCol cols="12">
              <label class="input-label">Email Address</label>
              <VTextField
                v-model="form.email"
                placeholder="name@example.com"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
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

              <div v-if="activeTab === 'login'" class="mt-4 text-end">
                <a href="javascript:void(0)" class="text-body-2 text-disabled text-decoration-underline hover-white">Forgot password?</a>
              </div>
            </VCol>

            <!-- Register Requirements -->
            <VCol v-if="activeTab === 'register'" cols="12">
              <div class="password-requirements d-flex flex-column gap-y-2 mt-4">
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2 text-success" />
                  Min. 8 characters
                </div>
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2 text-success" />
                  Includes letters
                </div>
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2 text-success" />
                  Numbers or symbols
                </div>
              </div>

              <VCheckbox
                v-model="form.agreeToTerms"
                class="mt-6"
                hide-details
              >
                <template #label>
                  <div class="text-body-2 text-disabled line-height-1-6">
                    I agree to the processing of my data as described in the 
                    <a href="#" class="text-white text-decoration-underline font-weight-bold">privacy policy</a>.
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
                {{ activeTab === 'login' ? 'Login' : 'Register' }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>

        <!-- Terms Footer -->
        <div v-if="activeTab === 'register'" class="mt-8 text-center text-caption text-disabled px-4 line-height-1-6">
          The <a href="#" class="text-white font-weight-bold">AGB</a> of NegmCars apply. Information on data processing is described in the
          <a href="#" class="text-white font-weight-bold">Privacy Policy</a>.
        </div>
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

.auth-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
}

.auth-tab {
  flex: 1;
  padding: 22px;
  border: 0;
  background: transparent;
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    opacity: 0.7;
    background: rgba(255, 255, 255, 0.03);
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
  border: 1.5px solid rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
  transition: all 0.3s ease !important;

  &:hover {
    background: rgba(255, 255, 255, 0.05) !important;
    border-color: #a855f7 !important; /* Purple border like screenshot */
    transform: translateY(-2px);
  }
}

.google-icon {
  color: #ea4335; /* Base red for Google */
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
  letter-spacing: 1px;
}
</style>
