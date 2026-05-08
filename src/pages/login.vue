<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import userApi from '@/api/userApi.js'
import { themeConfig } from '@themeConfig'

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

const socialProviders = [
  { name: 'Apple', icon: 'tabler-brand-apple-filled', color: '#000000', textColor: '#FFFFFF' },
  { name: 'Google', icon: 'tabler-brand-google-filled', color: '#DB4437', textColor: '#FFFFFF' },
  { name: 'Facebook', icon: 'tabler-brand-facebook-filled', color: '#1877F2', textColor: '#FFFFFF' },
  { name: 'Phone', icon: 'tabler-phone-filled', color: '#28A745', textColor: '#FFFFFF' },
]

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
    
    // Dispatch event to sync navbar
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
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard class="auth-card" elevation="24">
      <!-- Tabs Header -->
      <div class="auth-tabs">
        <button
          class="auth-tab"
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          Login
        </button>
        <button
          class="auth-tab"
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          Register
        </button>
      </div>

      <VCardText class="pa-8">
        <!-- Title -->
        <h2 class="text-h4 font-weight-bold mb-6 text-center text-white">
          {{ activeTab === 'login' ? 'Hello! Welcome back!' : 'Erstelle Dein NegmCars Konto!' }}
        </h2>

        <!-- Social Buttons (Full Professional Layout) -->
        <div class="social-grid mb-6">
          <VBtn
            v-for="provider in socialProviders"
            :key="provider.name"
            block
            variant="flat"
            class="social-btn"
            :style="{ backgroundColor: provider.color, color: provider.textColor }"
            height="50"
          >
            <VIcon :icon="provider.icon" class="me-2" size="22" />
            <span class="font-weight-bold">{{ activeTab === 'login' ? 'Mit' : 'Mit' }} {{ provider.name }} {{ activeTab === 'login' ? 'anmelden' : 'registrieren' }}</span>
          </VBtn>
        </div>

        <!-- Divider -->
        <div class="d-flex align-center my-8 text-disabled">
          <VDivider /><span class="mx-4 text-lowercase font-weight-bold opacity-60">oder</span><VDivider />
        </div>

        <!-- Form -->
        <VForm @submit.prevent="handleAuth">
          <VRow>
            <VCol cols="12">
              <label class="input-label">E-Mail-Adresse</label>
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
              <label class="input-label">Passwort</label>
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

              <div v-if="activeTab === 'login'" class="mt-3">
                <a href="javascript:void(0)" class="text-body-2 text-disabled text-decoration-underline hover-white">Passwort vergessen?</a>
              </div>
            </VCol>

            <!-- Register Requirements -->
            <VCol v-if="activeTab === 'register'" cols="12">
              <div class="password-requirements d-flex flex-column gap-y-2 mt-3">
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2" />
                  Min. 8 Zeichen
                </div>
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2" />
                  Buchstaben
                </div>
                <div class="req-item d-flex align-center text-disabled">
                  <VIcon icon="tabler-circle-check" size="16" class="me-2" />
                  Zahlen oder Sonderzeichen
                </div>
              </div>

              <VCheckbox
                v-model="form.agreeToTerms"
                class="mt-6"
                hide-details
              >
                <template #label>
                  <div class="text-body-2 text-disabled line-height-1-6">
                    Ich stimme der Verarbeitung meiner Daten wie in der
                    <a href="#" class="text-white text-decoration-underline font-weight-bold">Einwilligungserklärung</a> beschrieben zu.
                  </div>
                </template>
              </VCheckbox>
            </VCol>

            <VCol cols="12" class="mt-6">
              <div v-if="errorMessage" class="text-error mb-4 text-center text-body-2 font-weight-bold">{{ errorMessage }}</div>
              <VBtn
                block
                color="primary"
                height="56"
                type="submit"
                :loading="loading"
                class="auth-submit-btn"
              >
                {{ activeTab === 'login' ? 'Anmelden' : 'Registrieren' }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>

        <!-- Terms Footer -->
        <div v-if="activeTab === 'register'" class="mt-8 text-center text-caption text-disabled px-4 line-height-1-6">
          Es gelten die NegmCars <a href="#" class="text-white font-weight-bold">AGB</a>. Informationen zur Verarbeitung aller Daten werden in der
          <a href="#" class="text-white font-weight-bold">Datenschutzerklärung</a> beschrieben.
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.auth-wrapper {
  min-height: 100vh;
  background-color: #0f111a;
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.08) 0%, transparent 70%);
}

.auth-card {
  width: 100%;
  max-width: 500px;
  background-color: #1c1f2e !important;
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.15);
}

.auth-tab {
  flex: 1;
  padding: 20px;
  border: 0;
  background: transparent;
  color: #fff;
  font-weight: 800;
  font-size: 17px;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    opacity: 0.7;
    background: rgba(255, 255, 255, 0.02);
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
      box-shadow: 0 -2px 10px rgba(var(--v-theme-primary), 0.5);
    }
  }
}

.social-grid {
  display: grid;
  gap: 12px;
}

.social-btn {
  text-transform: none !important;
  font-weight: 700 !important;
  border-radius: 12px !important;
  transition: transform 0.2s ease, filter 0.2s ease !important;

  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.premium-input :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.v-field--focused {
    border-color: rgba(var(--v-theme-primary), 0.6);
  }
}

.auth-submit-btn {
  border-radius: 14px !important;
  font-weight: 800 !important;
  font-size: 18px !important;
  text-transform: none !important;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.85) 100%) !important;
  box-shadow: 0 10px 25px -8px rgba(var(--v-theme-primary), 0.6) !important;

  &:hover {
    box-shadow: 0 15px 30px -8px rgba(var(--v-theme-primary), 0.7) !important;
  }
}

.password-requirements {
  padding-left: 4px;
}

.req-item {
  font-size: 13px;
  font-weight: 500;
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
</style>
