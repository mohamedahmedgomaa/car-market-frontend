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

// ✅ Account
const accountLinks = [
  { name: 'Login', to: '/login' },
  { name: 'Register', to: '/register' },
  { name: 'Profile', to: '/profile' },
]

// ✅ Contact
const contactInfo = [
  { icon: 'tabler-mail', text: 'support@yourdomain.com' },
  { icon: 'tabler-phone', text: '+966 5X XXX XXXX' },
  { icon: 'tabler-map-pin', text: 'Saudi Arabia' },
]

// ✅ Social
const socialLinks = [
  { title: 'facebook', icon: 'tabler-brand-facebook-filled', href: 'https://facebook.com' },
  { title: 'twitter', icon: 'tabler-brand-twitter-filled', href: 'https://twitter.com' },
  { title: 'instagram', icon: 'tabler-brand-instagram', href: 'https://instagram.com' },
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
          <VCol cols="12" md="5">
            <div class="mb-4" :class="$vuetify.display.smAndDown ? 'w-100' : 'w-75'">
              <div class="app-logo mb-6">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title text-white">
                  {{ themeConfig.app.title }}
                </h1>
              </div>

              <div class="mb-6" :class="$vuetify.theme.current.dark ? 'text-body-1' : 'text-white-variant'">
                Find your next car بسهولة — ابحث، فلتر، وقارن بين الإعلانات المعتمدة.
              </div>

              <!-- ✅ Quick Search -->
              <VForm class="subscribe-form d-flex align-center" @submit.prevent="goQuick">
                <AppTextField
                  v-model="quick"
                  label="Quick search"
                  placeholder="Search cars..."
                  @keyup.enter="goQuick"
                />
                <VBtn class="align-self-end rounded-s-0" @click="goQuick">
                  Browse
                </VBtn>
              </VForm>
            </div>
          </VCol>

          <!-- 👉 Top 5 Cars -->
          <VCol md="2" sm="4" xs="6">
            <div class="footer-links">
              <h6 class="footer-title text-h6 mb-6">
                Top 5 Expensive
              </h6>

              <div v-if="topCarsLoading" :class="$vuetify.theme.current.dark ? 'text-body-1' : 'text-white-variant'">
                Loading...
              </div>

              <div
                v-else-if="!topCars.length"
                :class="$vuetify.theme.current.dark ? 'text-body-1' : 'text-white-variant'"
              >
                No cars found.
              </div>

              <ul v-else style="list-style: none; padding: 0; margin: 0;">
                <li v-for="car in topCars" :key="car.id" class="mb-4">
                  <RouterLink
                    :to="`/user/cars/${car.id}`"
                    :class="$vuetify.theme.current.dark ? 'text-body-1' : 'text-white-variant'"
                    class="d-inline-flex flex-column"
                    style="text-decoration: none;"
                  >
                    <span class="font-weight-medium">
                      {{ car?.title?.en || car?.title?.ar || `Car #${car.id}` }}
                    </span>
                    <span style="opacity:.8; font-size: 12px;">
                      {{ formatPrice(car.price) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </div>
          </VCol>

          <!-- 👉 Account -->
          <VCol md="2" sm="4" xs="6">
            <div class="footer-links">
              <h6 class="footer-title text-h6 mb-6">
                Account
              </h6>

              <ul style="list-style: none; padding: 0; margin: 0;">
                <li v-for="(item, index) in accountLinks" :key="index" class="mb-4">
                  <RouterLink
                    :to="item.to"
                    :class="$vuetify.theme.current.dark ? 'text-body-1' : 'text-white-variant'"
                  >
                    {{ item.name }}
                  </RouterLink>
                </li>
              </ul>
            </div>
          </VCol>

          <!-- 👉 Contact -->
          <VCol cols="12" md="3" sm="4">
            <div>
              <h6 class="footer-title text-h6 mb-6">
                Contact
              </h6>

              <div class="d-flex flex-column gap-y-4">
                <div v-for="(item, index) in contactInfo" :key="index" class="d-flex align-center gap-x-3">
                  <VIcon :icon="item.icon" size="18" color="white" />
                  <div :class="$vuetify.theme.current.dark ? 'text-body-1' : 'text-white-variant'">
                    {{ item.text }}
                  </div>
                </div>

                <div class="d-flex gap-x-6 mt-2">
                  <a v-for="(item, index) in socialLinks" :key="index" :href="item.href" target="_blank" rel="noopener noreferrer">
                    <VIcon :icon="item.icon" size="16" color="white" />
                  </a>
                </div>
              </div>
            </div>
          </VCol>
        </VRow>
      </VContainer>
    </div>

    <!-- 👉 Footer Line -->
    <div class="footer-line w-100">
      <VContainer>
        <div class="d-flex justify-space-between flex-wrap gap-y-4 align-center">
          <div class="text-white-variant">
            © {{ new Date().getFullYear() }} {{ themeConfig.app.title }} — All rights reserved.
          </div>

          <div class="text-white-variant">
            Developed by
            <a
              href="https://portfolio-gomaa.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white font-weight-medium ms-1"
            >
              Mohamed Gomaa
            </a>
          </div>
        </div>
      </VContainer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer-title {
  color: rgba(255, 255, 255, 92%);
}

.footer-top {
  border-radius: 60px 60px 0 0;
  background-size: cover;
  color: #fff;
}

.footer-links {
  .text-white-variant,
  .text-body-1 {
    &:hover {
      color: #fff;
    }
  }
}

.footer-line {
  background: #282c3e;
}
</style>

<style lang="scss">
.subscribe-form {
  .v-label {
    color: rgba(225, 222, 245, 90%) !important;
  }

  .v-field {
    border-end-end-radius: 0;
    border-end-start-radius: 10px;
    border-start-end-radius: 0;
    border-start-start-radius: 10px;

    input.v-field__input::placeholder {
      color: rgba(225, 222, 245, 40%) !important;
    }

    input.v-field__input {
      color: rgba(255, 255, 255, 78%);
    }
  }
}

.footer {
  border-radius: 50%;

  @media (min-width: 600px) and (max-width: 960px) {
    .v-container {
      padding-inline: 2rem !important;
    }

    .footer-logo-buttons {
      gap: 0.75rem;
    }
  }
}
</style>
