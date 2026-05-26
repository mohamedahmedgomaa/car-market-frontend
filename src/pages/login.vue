<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
  <div class="auth-wrapper d-flex flex-column align-center justify-center pa-4">
    <!-- App Logo -->
    <RouterLink
      to="/"
      class="auth-logo mb-6 d-flex align-center gap-x-3 text-decoration-none"
    >
      <VNodeRenderer v-slot="{ nodes }" v-if="themeConfig.app.logo" :nodes="themeConfig.app.logo" />
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

        <!-- Social Buttons -->
        <div class="social-section mb-8">
          <VBtn
            block
            variant="outlined"
            class="social-btn apple-btn mb-4"
            height="52"
            @click="errorMessage = 'Apple Sign-in is coming soon! Please use Email/Password for now.'"
          >
            <VIcon icon="tabler-brand-apple-filled" class="me-3" size="24" />
            Sign in with Apple
          </VBtn>

          <VBtn
            block
            variant="outlined"
            class="social-btn google-btn"
            height="52"
            @click="errorMessage = 'Google Sign-in is coming soon! Please use Email/Password for now.'"
          >
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
            <!-- Account Type Selection (Register Only) -->
            <VCol v-if="activeTab === 'register'" cols="12" class="mb-4">
              <label class="input-label">I am registering as:</label>
              <div class="role-selector d-flex gap-2 p-1">
                <VBtn
                  variant="flat"
                  :color="form.accountType === 'individual' ? 'primary' : 'secondary'"
                  class="flex-grow-1"
                  rounded="lg"
                  @click="form.accountType = 'individual'"
                >
                  <VIcon icon="tabler-user" class="me-2" />
                  Individual
                </VBtn>
                <VBtn
                  variant="flat"
                  :color="form.accountType === 'showroom' ? 'primary' : 'secondary'"
                  class="flex-grow-1"
                  rounded="lg"
                  @click="form.accountType = 'showroom'"
                >
                  <VIcon icon="tabler-building-store" class="me-2" />
                  Showroom
                </VBtn>
              </div>
            </VCol>

            <VCol v-if="activeTab === 'register'" cols="12">
              <label class="input-label">Full Name</label>
              <VTextField
                v-model="form.name"
                placeholder="Your full name"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              />
            </VCol>

            <VCol v-if="activeTab === 'register' && form.accountType === 'showroom'" cols="12">
              <label class="input-label">Showroom Name</label>
              <VTextField
                v-model="form.showroomName"
                placeholder="Ex: Golden Motors"
                variant="outlined"
                density="comfortable"
                hide-details
                class="premium-input"
              />
            </VCol>

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

            <VCol v-if="activeTab === 'register'" cols="12">
              <label class="input-label">Phone Number</label>
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

            <VCol v-if="activeTab === 'register'" cols="12">
              <label class="input-label">Confirm Password</label>
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

.role-selector {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
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
