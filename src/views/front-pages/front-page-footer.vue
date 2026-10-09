<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import footerDarkBg from '@images/front-pages/backgrounds/footer-bg-dark.png'
import footerLightBg from '@images/front-pages/backgrounds/footer-bg-light.png'
import logoDark from '@images/logo/logo-dark.png'
import logoLight from '@images/logo/logo-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import carsUserApi from '@/api/user/carUserApi.js'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const footerBg = useGenerateImageVariant(footerLightBg, footerDarkBg)
const appLogo = useGenerateImageVariant(logoLight, logoDark)

// -------------------------
// Top 5 most expensive cars
// -------------------------
const topCars = ref([])
const topCarsLoading = ref(false)

// ✅ Quick search
const quick = ref('')

const goQuick = () => {
  const v = quick.value.trim()
  router.push({
    path: '/user/cars',
    query: v ? { 'filter[global]': v } : {},
  })
}

const formatPrice = (price) => {
  const n = Number(price)
  if (Number.isNaN(n)) return price ?? '—'
  return n.toLocaleString()
}

const normalizeCars = (payload) => {
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

const fetchTopCars = async () => {
  topCarsLoading.value = true
  try {
    const res = await carsUserApi.getAll({
      page: 1,
      perPage: 3,
      'filter[status]': 'approved',
      sort: '-price', // ✅ الأفضل بدل top_expensive
    })
    topCars.value = normalizeCars(res.data)
  } catch (e) {
    console.error('Failed to load top cars', e)
    topCars.value = []
  } finally {
    topCarsLoading.value = false
  }
}

// ✅ Contact
const contactInfo = computed(() => [
  { icon: 'tabler-phone', text: '+20 155 155 2993' },
  { icon: 'tabler-map-pin', text: t('egyptLocation') },
])

// ✅ Social Links (Updated with exact official channels)
const socialLinks = [
  { title: 'facebook', icon: 'tabler-brand-facebook-filled', href: 'https://www.facebook.com/profile.php?id=61594862607985' },
  { title: 'instagram', icon: 'tabler-brand-instagram', href: 'https://www.instagram.com/negmcs/' },
  { title: 'tiktok', icon: 'tabler-brand-tiktok', href: 'https://www.tiktok.com/@negmcars.com?lang=ar' },
  { title: 'youtube', icon: 'tabler-brand-youtube-filled', href: 'https://www.youtube.com/@NegmCars' },
]

onMounted(fetchTopCars)
</script>

<template>
  <div class="footer">
    <div class="footer-top pt-11">
      <VContainer>
        <VRow>
          <!-- 👉 Brand / About (Column 1) -->
          <VCol cols="12" md="3" sm="6">
            <div class="mb-4">
              <!-- Gorgeous Brand Logo with Theme Adaptive Logo -->
              <div class="app-logo mb-5">
                <div class="logo-icon-wrapper">
                  <img :src="appLogo" alt="NegmCars Logo" class="brand-img-logo" />
                </div>
                <h1 class="logo-title font-weight-black">
                  Negm<span class="text-primary-glow">Cars</span>
                </h1>
              </div>

              <!-- Brand tagline -->
              <p class="brand-description text-medium-emphasis mb-5">
                {{ t('brandDesc') }}
              </p>

              <!-- ✅ Follow Us -->
              <div class="mb-4">
                <h6 class="footer-title text-medium-emphasis text-subtitle-2 font-weight-bold mb-3">
                  {{ t('followUpdates') }}
                </h6>
                <div class="d-flex gap-x-3">
                  <a
                    v-for="(item, index) in socialLinks"
                    :key="index"
                    :href="item.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-btn"
                    :class="`social-btn-${item.title}`"
                  >
                    <VIcon :icon="item.icon" size="19" />
                  </a>
                </div>
              </div>
            </div>
          </VCol>

          <!-- 👉 Download Our Apps (Column 2) -->
          <VCol cols="12" md="3" sm="6">
            <div class="footer-links">
              <h6 class="footer-title text-high-emphasis text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-device-mobile" size="20" color="primary" />
                <span>{{ t('downloadAppTitle') }}</span>
                <VChip color="amber" size="x-small" variant="elevated" class="font-weight-black ms-1">SOON</VChip>
              </h6>
              
              <p class="text-medium-emphasis text-body-2 mb-5 leading-relaxed">
                {{ t('downloadAppDesc') }}
              </p>

              <div class="d-flex flex-column gap-y-3">
                <!-- App Store Button -->
                <div class="app-download-btn d-flex align-center justify-space-between opacity-85 cursor-not-allowed">
                  <div class="d-flex align-center gap-3">
                    <div class="app-icon">
                      <svg viewBox="0 0 384 512" fill="currentColor">
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48-20.1-77.5-19.6-37.4.5-74.3 21.8-94 54.8-41 67.3-10.7 168.2 28.7 224.4 19.9 28.2 43.1 59.6 74.1 58.4 29.4-1.2 40.3-19 75.8-19 35.4 0 45.6 19 75.8 18.3 31.1-.5 51.1-28.5 70-55.7 22.1-31.9 30.9-63 31.3-64.6-.6-.2-60.4-23.2-61-91.8zM245.8 91.4c24.1-29 40.3-69.1 35.8-109.1-34.4 1.4-76.3 22.8-101 51.6-21.1 24.6-39.7 65.5-34.7 104.9 38.3 3 76.8-18.6 99.9-47.4z" />
                      </svg>
                    </div>
                    <div class="app-text">
                      <span class="app-subtitle">{{ t('downloadOn') }}</span>
                      <span class="app-title">App Store</span>
                    </div>
                  </div>
                  <VChip color="amber" size="x-small" variant="flat" class="font-weight-black me-2">SOON</VChip>
                </div>

                <!-- Google Play Button -->
                <div class="app-download-btn d-flex align-center justify-space-between opacity-85 cursor-not-allowed">
                  <div class="d-flex align-center gap-3">
                    <div class="app-icon">
                      <svg viewBox="0 0 512 512" width="24" height="24">
                        <path fill="#00D2FF" d="M47 35.3v441.4c0 16.1 8.7 28.5 21.7 35.3l256.6-256L68.7 0C55.7 6.8 47 19.2 47 35.3z" />
                        <path fill="#00F076" d="M385.4 337.5L325.3 277.4 68.7 512l316.7-174.5z" />
                        <path fill="#FFC700" d="M472.2 225.6c11.2 6.4 17.8 17.2 17.8 28.4s-6.6 22-17.8 28.4l-58 33.2-65.2-65.2 65.2-65.2 58 33.2z" />
                        <path fill="#FF3A44" d="M385.4 174.5L68.7 0l256.6 256 60.1-60.1z" />
                      </svg>
                    </div>
                    <div class="app-text">
                      <span class="app-subtitle">{{ t('getItOn') }}</span>
                      <span class="app-title">Google Play</span>
                    </div>
                  </div>
                  <VChip color="amber" size="x-small" variant="flat" class="font-weight-black me-2">SOON</VChip>
                </div>
              </div>
            </div>
          </VCol>

          <!-- 👉 Legal Info (Column 3) -->
          <VCol md="3" sm="6" cols="12">
            <div class="footer-links">
              <h6 class="footer-title text-high-emphasis text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-info-circle" size="20" color="primary" />
                <span>{{ t('officialInfo') }}</span>
              </h6>

              <div class="registration-box pa-6 rounded-xl glass-panel border">
                <div class="d-flex align-center gap-x-3 mb-4">
                  <div class="status-indicator"></div>
                  <span class="text-high-emphasis font-weight-bold text-subtitle-1">{{ t('registeredPlatform') }}</span>
                </div>
                <p class="text-medium-emphasis text-body-2 mb-5 leading-relaxed">
                  {{ t('registeredPlatformDesc') }}
                </p>
                <div class="tax-info-grid">
                  <div class="tax-item">
                    <span class="tax-label">{{ t('taxId') }}</span>
                    <span class="tax-value">Soon</span>
                  </div>
                  <div class="tax-item">
                    <span class="tax-label">{{ t('commReg') }}</span>
                    <span class="tax-value">App Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </VCol>

          <!-- 👉 Contact Info (Column 4) -->
          <VCol cols="12" md="3" sm="6">
            <div class="ps-md-6">
              <h6 class="footer-title text-high-emphasis text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-headset" size="20" color="primary" />
                <span>{{ t('getInTouch') }}</span>
              </h6>

              <div class="d-flex flex-column gap-y-6">
                <div v-for="(item, index) in contactInfo" :key="index" class="contact-item-v2">
                  <div class="contact-icon-v2">
                    <VIcon :icon="item.icon" size="20" />
                  </div>
                  <div class="contact-text-v2">
                    {{ item.text }}
                  </div>
                </div>
              </div>
            </div>
          </VCol>
        </VRow>
      </VContainer>
    </div>

    <!-- 👉 Footer Line -->
    <div class="footer-line w-100 py-6">
      <VContainer>
        <div class="d-flex justify-space-between flex-wrap gap-y-4 align-center">
          <div class="text-medium-emphasis text-caption">
            © {{ new Date().getFullYear() }} <span class="text-high-emphasis font-weight-bold">{{ themeConfig.app.title }}</span>. {{ t('allRightsReserved') }}
          </div>

          <div class="footer-bottom-links d-flex gap-x-6">
            <RouterLink to="/" class="bottom-link">{{ t('privacyPolicy') }}</RouterLink>
            <RouterLink to="/" class="bottom-link">{{ t('termsOfService') }}</RouterLink>
            <RouterLink to="/" class="bottom-link">{{ t('sitemap') }}</RouterLink>
          </div>
        </div>
      </VContainer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer-title {
  color: rgba(var(--v-theme-on-surface), 0.9);
  letter-spacing: 0.5px;
}

.footer-top {
  border-radius: 60px 60px 0 0;
  background: rgba(var(--v-theme-surface), 1);
  color: rgba(var(--v-theme-on-surface), 1);
  position: relative;
  border-top: 3px solid rgba(var(--v-theme-primary), 0.8);
  box-shadow: 0 -15px 40px rgba(var(--v-theme-primary), 0.08);
}

.status-indicator {
  width: 10px;
  height: 10px;
  background: #28a745;
  border-radius: 50%;
  box-shadow: 0 0 10px #28a745;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}

.tax-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border-top: 1px solid rgba(var(--v-border-color), 0.15);
  padding-top: 20px;
}

.tax-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tax-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-weight: 800;
}

.tax-value {
  font-size: 14px;
  font-weight: 700;
  color: rgba(var(--v-theme-primary), 1);
}

.contact-item-v2 {
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  &:hover {
    transform: translateX(5px);
    .contact-icon-v2 {
      background: rgba(var(--v-theme-primary), 1);
      color: #fff;
    }
  }
}

.contact-icon-v2 {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-primary), 1);
  transition: all 0.3s ease;
}

.contact-text-v2 {
  font-size: 15px;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.bottom-link {
  color: rgba(var(--v-theme-on-surface), 0.7);
  text-decoration: none;
  font-size: 12px;
  transition: all 0.3s ease;
  &:hover {
    color: rgba(var(--v-theme-primary), 1);
  }
}

.social-btn {
  width: 42px !important;
  height: 42px !important;
  border-radius: 50% !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
  text-decoration: none !important;
}

.social-btn-facebook {
  color: #1877F2 !important;
  &:hover {
    background: #1877F2 !important;
    color: #ffffff !important;
    border-color: #1877F2 !important;
    box-shadow: 0 0 20px rgba(24, 119, 242, 0.6) !important;
    transform: translateY(-4px) scale(1.08);
  }
}

.social-btn-instagram {
  color: #E1306C !important;
  &:hover {
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
    color: #ffffff !important;
    border-color: #E1306C !important;
    box-shadow: 0 0 20px rgba(225, 48, 108, 0.6) !important;
    transform: translateY(-4px) scale(1.08);
  }
}

.social-btn-youtube {
  color: #FF0000 !important;
  &:hover {
    background: #FF0000 !important;
    color: #ffffff !important;
    border-color: #FF0000 !important;
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.6) !important;
    transform: translateY(-4px) scale(1.08);
  }
}

.social-btn-tiktok {
  color: #00F2FE !important;
  &:hover {
    background: #000000 !important;
    border-color: #FE2C55 !important;
    color: #ffffff !important;
    box-shadow: 0 0 20px rgba(254, 44, 85, 0.6) !important;
    transform: translateY(-4px) scale(1.08);
  }
}

.footer-line {
  background: rgba(var(--v-theme-background), 1);
  border-top: 1px solid rgba(var(--v-border-color), 0.15);
}

.footer {
  position: relative;
  z-index: 10;
}

// ----------------------------------------------------
// Redesigned Brand Header and app-logo Styles
// ----------------------------------------------------
.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon-wrapper {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 14px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(var(--v-theme-primary), 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 46px;
  height: 46px;
  overflow: hidden;
  
  &:hover {
    transform: rotate(5deg) scale(1.08);
    background: rgba(var(--v-theme-primary), 0.15);
    border-color: rgba(var(--v-theme-primary), 0.4);
    box-shadow: 0 8px 35px rgba(var(--v-theme-primary), 0.25);
  }
}

.brand-img-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.logo-title {
  font-size: 1.8rem;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 1);
  
  .text-primary-glow {
    color: rgba(var(--v-theme-primary), 1);
    text-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.45);
  }
}

.brand-description {
  font-size: 13.5px;
  line-height: 1.6;
}

// Download Buttons
.app-download-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), 0.15);
  text-decoration: none;
  color: rgba(var(--v-theme-on-surface), 1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);

  .app-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(var(--v-theme-on-surface), 1);
    transition: all 0.3s ease;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }

  .app-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .app-subtitle {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.6;
    font-weight: 500;
  }

  .app-title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.1);
    border-color: rgba(var(--v-theme-primary), 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.15), 0 0 15px rgba(var(--v-theme-primary), 0.1);
    
    .app-icon {
      color: rgba(var(--v-theme-primary), 1);
      transform: scale(1.1);
    }
  }
}

@media (max-width: 600px) {
  .footer-top {
    border-radius: 28px 28px 0 0 !important;
    padding-top: 28px !important;
  }

  .ps-md-6 {
    padding-left: 0 !important;
  }

  .footer-line {
    padding-top: 16px !important;
    padding-bottom: 16px !important;

    .d-flex {
      justify-content: center !important;
      text-align: center;
      flex-direction: column-reverse;
      gap: 12px !important;
    }
  }

  .footer-bottom-links {
    justify-content: center !important;
    width: 100%;
    gap: 16px !important;
  }
}
</style>
