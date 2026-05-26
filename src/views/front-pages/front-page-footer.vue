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
  <div class="footer">
    <div class="footer-top pt-11" :style="{ 'background-image': `url(${footerBg})` }">
      <VContainer>
        <VRow>
          <!-- 👉 Brand / About -->
          <VCol cols="12" md="4">
            <div class="mb-4">
              <div class="app-logo mb-6">
                <VNodeRenderer v-if="themeConfig.app.logo" :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title text-white">
                  {{ themeConfig.app.title }}
                </h1>
              </div>

              <!-- ✅ Follow Us (Moved here) -->
              <div class="mb-8">
                <h6 class="footer-title text-subtitle-2 font-weight-bold mb-4 opacity-60">
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

          <!-- 👉 Legal Info -->
          <VCol md="4" sm="6" cols="12">
            <div class="footer-links">
              <h6 class="footer-title text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
                <VIcon icon="tabler-info-circle" size="20" color="primary" />
                <span>Official Information</span>
              </h6>

              <div class="registration-box pa-6 rounded-xl glass-panel-dark border border-white-opacity-10">
                <div class="d-flex align-center gap-x-3 mb-4">
                  <div class="status-indicator"></div>
                  <span class="text-white font-weight-bold text-subtitle-1">Registered Platform</span>
                </div>
                <p class="text-body-2 opacity-60 mb-5 leading-relaxed">
                  NegmCars is a legally registered company and platform in the Arab Republic of Egypt, ensuring safe and trusted transactions.
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

          <!-- 👉 Contact Info -->
          <VCol cols="12" md="4" sm="6">
            <div class="ps-md-12">
              <h6 class="footer-title text-h6 font-weight-bold mb-6 d-flex align-center gap-x-2">
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
  background-size: cover;
  background-color: #1a1d2e;
  color: #fff;
  position: relative;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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
  opacity: 0.4;
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
  background: #141724;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer {
  position: relative;
  z-index: 10;
}
</style>
