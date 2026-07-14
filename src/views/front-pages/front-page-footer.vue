<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import footerDarkBg from '@images/front-pages/backgrounds/footer-bg-dark.png'
import footerLightBg from '@images/front-pages/backgrounds/footer-bg-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import carsUserApi from '@/api/user/carUserApi.js'

const router = useRouter()
const footerBg = useGenerateImageVariant(footerLightBg, footerDarkBg)

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
const contactInfo = [
  { icon: 'tabler-mail', text: 'info@negmcars.com' },
  { icon: 'tabler-phone', text: '+20 155 155 2993' },
  { icon: 'tabler-map-pin', text: 'Cairo, Egypt' },
]

// ✅ Social
const socialLinks = [
  { title: 'facebook', icon: 'tabler-brand-facebook-filled', href: 'https://facebook.com' },
  { title: 'instagram', icon: 'tabler-brand-instagram', href: 'https://instagram.com' },
  { title: 'tiktok', icon: 'tabler-brand-tiktok', href: 'https://tiktok.com' },
  { title: 'youtube', icon: 'tabler-brand-youtube-filled', href: 'https://youtube.com' },
]

onMounted(fetchTopCars)
</script>

<template>
  <div class="footer v-theme--dark">
    <div class="footer-top pt-11">
      <VContainer>
        <VRow>
          <!-- 👉 Brand / About (Column 1) -->
          <VCol cols="12" md="3" sm="6">
            <div class="mb-4">
              <!-- Gorgeous Brand Logo with SVG Shield/Car badge -->
              <div class="app-logo mb-5">
                <div class="logo-icon-wrapper">
                  <svg viewBox="0 0 100 100" class="brand-svg-logo">
                    <!-- Shield outline -->
                    <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" fill="none" stroke="url(#logo-glow)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                    <!-- Sports Car silhouette -->
                    <path d="M30,55 C35,42 45,38 50,38 C55,38 65,42 70,55 C72,60 68,64 64,64 L36,64 C32,64 28,60 30,55 Z" fill="url(#logo-grad)" />
                    <!-- Speed/Chassis lines -->
                    <path d="M25,65 H75 M35,48 L42,52 M65,48 L58,52" stroke="#FFF" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />
                    <defs>
                      <linearGradient id="logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="rgba(var(--v-theme-primary), 1)" />
                        <stop offset="100%" stop-color="#ff9f43" />
                      </linearGradient>
                      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="100%" stop-color="rgba(var(--v-theme-primary), 1)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h1 class="logo-title font-weight-black">
                  Negm<span class="text-primary-glow">Cars</span>
                </h1>
              </div>

              <!-- Brand tagline -->
              <p class="brand-description text-white opacity-70 mb-5">
                Egypt's premier automotive marketplace. Connecting buyers, sellers, and verified showrooms with intelligence and trust.
              </p>

              <!-- ✅ Follow Us -->
              <div class="mb-4">
                <h6 class="footer-title text-white text-subtitle-2 font-weight-bold mb-3 opacity-60">
                  Follow Our Updates
                </h6>
                <div class="d-flex gap-x-3">
                  <a
                    v-for="(item, index) in socialLinks"
                    :key="index"
                    :href="item.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-btn social-btn--small"
                  >
                    <VIcon :icon="item.icon" size="18" />
                  </a>
                </div>
              </div>
            </div>
          </VCol>

          <!-- 👉 Download Our Apps (Column 2) -->
          <VCol cols="12" md="3" sm="6">
            <div class="footer-links">
              <h6 class="footer-title text-white text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-device-mobile" size="20" color="primary" />
                <span>Download Our App</span>
              </h6>
              
              <p class="text-white text-body-2 opacity-60 mb-5 leading-relaxed">
                Enjoy the ultimate vehicle trading experience anytime, anywhere. Get our apps for iOS and Android.
              </p>

              <div class="d-flex flex-column gap-y-3">
                <!-- App Store Button -->
                <a href="#" class="app-download-btn">
                  <div class="app-icon">
                    <svg viewBox="0 0 384 512" fill="currentColor">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48-20.1-77.5-19.6-37.4.5-74.3 21.8-94 54.8-41 67.3-10.7 168.2 28.7 224.4 19.9 28.2 43.1 59.6 74.1 58.4 29.4-1.2 40.3-19 75.8-19 35.4 0 45.6 19 75.8 18.3 31.1-.5 51.1-28.5 70-55.7 22.1-31.9 30.9-63 31.3-64.6-.6-.2-60.4-23.2-61-91.8zM245.8 91.4c24.1-29 40.3-69.1 35.8-109.1-34.4 1.4-76.3 22.8-101 51.6-21.1 24.6-39.7 65.5-34.7 104.9 38.3 3 76.8-18.6 99.9-47.4z" />
                    </svg>
                  </div>
                  <div class="app-text">
                    <span class="app-subtitle text-white">Download on the</span>
                    <span class="app-title text-white">App Store</span>
                  </div>
                </a>

                <!-- Google Play Button -->
                <a href="#" class="app-download-btn">
                  <div class="app-icon">
                    <svg viewBox="0 0 512 512" fill="currentColor">
                      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58-33.2-65.2 65.2 65.2 65.2 58-33.2c22.3-12.7 22.3-34.3 0-47zM385.4 337.5L104.6 499l220.7-126.5 60.1-60.1z" />
                    </svg>
                  </div>
                  <div class="app-text">
                    <span class="app-subtitle text-white">GET IT ON</span>
                    <span class="app-title text-white">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </VCol>

          <!-- 👉 Legal Info (Column 3) -->
          <VCol md="3" sm="6" cols="12">
            <div class="footer-links">
              <h6 class="footer-title text-white text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-info-circle" size="20" color="primary" />
                <span>Official Information</span>
              </h6>

              <div class="registration-box pa-6 rounded-xl glass-panel-dark border border-white-opacity-10">
                <div class="d-flex align-center gap-x-3 mb-4">
                  <div class="status-indicator"></div>
                  <span class="text-white font-weight-bold text-subtitle-1">Registered Platform</span>
                </div>
                <p class="text-white text-body-2 opacity-60 mb-5 leading-relaxed">
                  NegmCars is a legally registered company in Egypt, ensuring highly trusted transactions.
                </p>
                <div class="tax-info-grid">
                  <div class="tax-item">
                    <span class="tax-label">Tax ID</span>
                    <span class="tax-value">725-463-524</span>
                  </div>
                  <div class="tax-item">
                    <span class="tax-label">Comm. Reg</span>
                    <span class="tax-value">215486</span>
                  </div>
                </div>
              </div>
            </div>
          </VCol>

          <!-- 👉 Contact Info (Column 4) -->
          <VCol cols="12" md="3" sm="6">
            <div class="ps-md-6">
              <h6 class="footer-title text-white text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-headset" size="20" color="primary" />
                <span>Get in Touch</span>
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
          <div class="text-white opacity-40 text-caption">
            © {{ new Date().getFullYear() }} <span class="text-white opacity-100 font-weight-bold">{{ themeConfig.app.title }}</span>. All rights reserved.
          </div>

          <div class="footer-bottom-links d-flex gap-x-6">
            <RouterLink to="/" class="bottom-link">Privacy Policy</RouterLink>
            <RouterLink to="/" class="bottom-link">Terms of Service</RouterLink>
            <RouterLink to="/" class="bottom-link">Sitemap</RouterLink>
          </div>
        </div>
      </VContainer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer-title {
  color: #fff;
  letter-spacing: 0.5px;
}

.footer-top {
  border-radius: 60px 60px 0 0;
  background: linear-gradient(180deg, #181818 0%, #0a0a0a 100%);
  color: #fff;
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
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #fff;
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-primary), 1);
  transition: all 0.3s ease;
}

.contact-text-v2 {
  font-size: 15px;
  opacity: 0.8;
  color: #fff;
}

.bottom-link {
  color: #fff;
  opacity: 0.4;
  text-decoration: none;
  font-size: 12px;
  transition: all 0.3s ease;
  &:hover {
    opacity: 1;
    color: rgba(var(--v-theme-primary), 1);
  }
}

.social-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;

  &:hover {
    background: rgba(var(--v-theme-primary), 1);
    border-color: rgba(var(--v-theme-primary), 1);
    color: #fff;
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(var(--v-theme-primary), 0.3);
  }
}

.social-btn--small {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.footer-line {
  background: #050505;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(var(--v-theme-primary), 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: rotate(5deg) scale(1.08);
    background: rgba(var(--v-theme-primary), 0.15);
    border-color: rgba(var(--v-theme-primary), 0.4);
    box-shadow: 0 8px 35px rgba(var(--v-theme-primary), 0.25);
  }
}

.brand-svg-logo {
  width: 34px;
  height: 34px;
  filter: drop-shadow(0 2px 8px rgba(var(--v-theme-primary), 0.3));
}

.logo-title {
  font-size: 1.8rem;
  letter-spacing: 0.5px;
  color: #fff;
  
  .text-primary-glow {
    color: rgba(var(--v-theme-primary), 1);
    text-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.45);
  }
}

.brand-description {
  font-size: 13.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
}

// Download Buttons
.app-download-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);

  .app-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
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
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(var(--v-theme-primary), 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.15), 0 0 15px rgba(var(--v-theme-primary), 0.1);
    
    .app-icon {
      color: rgba(var(--v-theme-primary), 1);
      transform: scale(1.1);
    }
  }
}
</style>
