<script setup>
import { useWindowScroll } from '@vueuse/core'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useDisplay } from 'vuetify'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserAuth } from '@/stores/userAuth.js'

const props = defineProps({ activeId: String })

const display = useDisplay()
const { y } = useWindowScroll()
const route = useRoute()
const router = useRouter()

const sidebar = ref(false)

// نفس سلوك Vuexy الأصلي
watch(
  () => display,
  () => {
    return display.mdAndUp ? (sidebar.value = false) : sidebar.value
  },
  { deep: true },
)

// ✅ Search => filter[global]
const search = ref(String(route.query['filter[global]'] || ''))

watch(
  () => route.query['filter[global]'],
  (val) => {
    search.value = String(val || '')
  },
)

const goSearch = async () => {
  const value = search.value.trim()

  await router.push({
    path: '/user/cars',
    query: value ? { 'filter[global]': value } : {},
  })

  sidebar.value = false
}


// ✅ force reactive re-check for localStorage changes (login/logout)
const authKey = ref(0)
const syncAuth = () => {
  authKey.value++
}

onMounted(() => {
  window.addEventListener('auth:changed', syncAuth)
})
onBeforeUnmount(() => {
  window.removeEventListener('auth:changed', syncAuth)
})

const isLoggedIn = computed(() => {
  authKey.value // ✅ makes it reactive
  return !!localStorage.getItem('user_token')
})

const logout = async () => {
  const userAuth = useUserAuth()
  await userAuth.logout()

  sidebar.value = false

  if (route.path.startsWith('/user')) {
    await router.push('/')
  }
}
</script>

<template>
  <!-- 👉 Navigation drawer for mobile devices -->
  <VNavigationDrawer v-model="sidebar" width="275" data-allow-mismatch disable-resize-watcher>
    <PerfectScrollbar :options="{ wheelPropagation: false }" class="h-100">
      <div>
        <div class="d-flex flex-column gap-y-4 pa-4">

          <!-- ✅ Links -->
          <RouterLink
            to="/user/cars"
            class="nav-link font-weight-medium"
            :class="route.path === '/user/cars' && route.query['filter[type]'] !== 'motorcycle' ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Cars
          </RouterLink>

          <RouterLink
            to="/user/best-deals"
            class="nav-link font-weight-medium"
            :class="route.path.startsWith('/user/best-deals') ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Best Deals
          </RouterLink>

          <RouterLink
            to="/user/negm-sooq"
            class="nav-link font-weight-medium"
            :class="route.path.startsWith('/user/negm-sooq') ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Import Cars
          </RouterLink>

          <RouterLink
            :to="{ path: '/user/cars', query: { 'filter[type]': 'motorcycle', sort: '-created_at' } }"
            class="nav-link font-weight-medium"
            :class="route.path === '/user/cars' && route.query['filter[type]'] === 'motorcycle' ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Bikes
          </RouterLink>

          <RouterLink
            to="/user/sell"
            class="nav-link font-weight-medium"
            :class="route.path === '/user/sell' ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Sell
          </RouterLink>

          <RouterLink
            to="/user/favorites"
            class="nav-link font-weight-medium"
            :class="route.path.startsWith('/user/favorites') ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Favorites
          </RouterLink>

          <RouterLink
            to="/user/sellers"
            class="nav-link font-weight-medium"
            :class="route.path === '/user/sellers' ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Showrooms
          </RouterLink>



          <VDivider class="my-2" />

          <!-- ✅ Auth (User) -->
          <template v-if="!isLoggedIn">
            <VBtn
              block
              color="primary"
              variant="elevated"
              to="/login"
              class="mt-2"
              @click="sidebar = false"
            >
              <VIcon icon="tabler-login" class="me-2" />
              Login
            </VBtn>
          </template>

          <template v-else>
            <RouterLink
              to="/user/profile"
              class="nav-link font-weight-medium"
              :class="route.path.startsWith('/user') ? 'active-link' : ''"
              @click="sidebar = false"
            >
              Profile
            </RouterLink>

            <div
              class="nav-link font-weight-medium cursor-pointer"
              style="color: rgba(var(--v-theme-on-surface))"
              @click="logout"
            >
              Logout
            </div>
          </template>
        </div>
      </div>

      <!-- Navigation drawer close icon -->
      <VIcon
        id="navigation-drawer-close-btn"
        icon="tabler-x"
        size="20"
        @click="sidebar = !sidebar"
      />
    </PerfectScrollbar>
  </VNavigationDrawer>

  <!-- 👉 Navbar for desktop devices -->
  <div class="front-page-navbar">
    <div class="front-page-navbar">
      <VAppBar
        :color="
          $vuetify.theme.current.dark
            ? 'rgba(var(--v-theme-surface),0.38)'
            : 'rgba(var(--v-theme-surface), 0.38)'
        "
        :class="
          y > 10
            ? 'app-bar-scrolled'
            : [$vuetify.theme.current.dark ? 'app-bar-dark' : 'app-bar-light', 'elevation-0']
        "
        class="navbar-blur"
      >
        <!-- toggle icon for mobile device -->
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 me-2 d-inline-block d-md-none"
          @click="sidebar = !sidebar"
        >
          <VIcon size="26" icon="tabler-menu-2" color="rgba(var(--v-theme-on-surface))" />
        </IconBtn>

        <!-- Title -->
        <div class="d-flex align-center">
          <VAppBarTitle class="me-sm-6 me-1 logo-title-wrapper">
            <RouterLink
              to="/"
              class="d-flex gap-x-4"
              :class="$vuetify.display.mdAndUp ? 'd-block' : 'd-block'"
              style="text-decoration: none;"
            >
              <h1 class="app-logo-title">NegmCars</h1>
            </RouterLink>
          </VAppBarTitle>

          <!-- ✅ Links (Desktop) -->
          <div class="text-base align-center d-none d-md-flex gap-x-4 ms-6">
            <RouterLink
              to="/user/cars"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path === '/user/cars' && route.query['filter[type]'] !== 'motorcycle' ? 'active-link' : ''"
            >
              Cars
            </RouterLink>

            <RouterLink
              to="/user/best-deals"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path.startsWith('/user/best-deals') ? 'active-link' : ''"
            >
              Best Deals
            </RouterLink>

            <RouterLink
              to="/user/negm-sooq"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path.startsWith('/user/negm-sooq') ? 'active-link' : ''"
            >
              Import Cars
            </RouterLink>

            <RouterLink
              :to="{ path: '/user/cars', query: { 'filter[type]': 'motorcycle', sort: '-created_at' } }"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path === '/user/cars' && route.query['filter[type]'] === 'motorcycle' ? 'active-link' : ''"
            >
              Bikes
            </RouterLink>

            <RouterLink
              to="/user/sell"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path === '/user/sell' ? 'active-link' : ''"
            >
              Sell
            </RouterLink>

            <RouterLink
              to="/user/favorites"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path.startsWith('/user/favorites') ? 'active-link' : ''"
            >
              Favorites
            </RouterLink>

            <RouterLink
              to="/user/sellers"
              class="nav-link font-weight-bold py-2 px-2"
              :class="route.path === '/user/sellers' ? 'active-link' : ''"
            >
              Showrooms
            </RouterLink>
          </div>
        </div>

        <VSpacer />


        <!-- ✅ Unified Auth button -->
        <template v-if="!isLoggedIn">
          <VBtn
            color="primary"
            variant="elevated"
            to="/login"
            class="ms-sm-3 ms-1 auth-main-btn"
            rounded="xl"
          >
            <VIcon icon="tabler-user-circle" class="auth-btn-icon me-sm-2 me-1" size="20" />
            Login
          </VBtn>
        </template>

        <template v-else>
          <VBtn
            variant="tonal"
            to="/user/profile"
            class="ms-sm-3 ms-1 profile-main-btn"
            rounded="xl"
          >
            <VIcon icon="tabler-user" class="auth-btn-icon me-sm-2 me-1" size="20" />
            Profile
          </VBtn>

          <VBtn
            icon
            variant="text"
            color="error"
            class="ms-sm-2 ms-1 logout-btn"
            @click="logout"
          >
            <VIcon icon="tabler-logout" size="22" />
          </VBtn>
        </template>
      </VAppBar>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.nav-link {
  font-size: 0.95rem;
  font-weight: 750;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  padding: 8px 16px;
  border-radius: 99px;

  &:not(:hover) {
    color: rgba(255, 255, 255, 0.8) !important;
  }

  &:hover {
    color: #FF6B00 !important;
    background: rgba(255, 107, 0, 0.08);
    transform: translateY(-1px);
  }
}

.active-link {
  color: #FF6B00 !important;
  background: rgba(255, 107, 0, 0.12);
}

.app-bar-light {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 99px !important;
  background-color: rgba(15, 17, 26, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-bar-dark {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 99px !important;
  background-color: rgba(15, 17, 26, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-bar-scrolled {
  border: 1px solid rgba(255, 107, 0, 0.15) !important;
  border-radius: 99px !important;
  background-color: rgba(15, 17, 26, 0.85) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 107, 0, 0.05) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-logo-title {
  font-size: 1.65rem;
  font-weight: 900;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #FF6B00 0%, #FFA800 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 8px rgba(255, 107, 0, 0.15));

  &:hover {
    transform: scale(1.04);
    filter: drop-shadow(0 4px 12px rgba(255, 107, 0, 0.35));
  }

  @media (max-width: 600px) {
    font-size: 1.3rem !important;
  }
}

.auth-main-btn {
  font-weight: 800 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  height: 42px !important;
  padding-inline: 22px !important;
  background: linear-gradient(135deg, #FF6B00 0%, #FF3E1D 100%) !important;
  color: white !important;
  border-radius: 99px !important;
  box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 0, 0.55) !important;
  }

  @media (max-width: 600px) {
    height: 36px !important;
    padding-inline: 12px !important;
    font-size: 0.85rem !important;
  }
}

.profile-main-btn {
  font-weight: 800 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  height: 42px !important;
  padding-inline: 22px !important;
  border-radius: 99px !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  background: rgba(255, 255, 255, 0.04) !important;
  color: white !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px);
  }

  @media (max-width: 600px) {
    height: 36px !important;
    padding-inline: 12px !important;
    font-size: 0.85rem !important;
  }
}

.auth-btn-icon {
  @media (max-width: 600px) {
    size: 16px !important;
  }
}

.logout-btn {
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
  @media (max-width: 600px) {
    width: 32px !important;
    height: 32px !important;
  }
}

/* ✅ نفس حجم Vuexy الأصلي */
.front-page-navbar::after {
  position: fixed;
  z-index: 2;
  backdrop-filter: saturate(100%) blur(6px);
  block-size: 5rem;
  content: '';
  inline-size: 100%;
  pointer-events: none;
}
</style>

<style lang="scss">
.front-page-navbar {
  .v-toolbar__content {
    padding-inline: 30px !important; /* ✅ نفس الأصل */

    @media (max-width: 600px) {
      padding-inline: 12px !important; /* ✅ Less padding on mobile to prevent clipping */
    }
  }

  .v-toolbar {
    inset-inline: 0 !important;
    margin-block-start: 1rem !important;
    margin-inline: auto !important;

    @media (max-width: 600px) {
      margin-block-start: 0.5rem !important;
    }
  }
}

/* ✅ نفس max-width rules بتاعة الأصل */
@media (min-width: 1920px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(1440px - 32px);
    }
  }
}

@media (min-width: 1280px) and (max-width: 1919px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(1200px - 32px);
    }
  }
}

@media (min-width: 960px) and (max-width: 1279px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(900px - 32px);
    }
  }
}

@media (min-width: 600px) and (max-width: 959px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 64px);
    }
  }
}

@media (max-width: 600px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 24px) !important; /* Let it expand slightly more on very small screens */
    }
  }
}

#navigation-drawer-close-btn {
  position: absolute;
  cursor: pointer;
  inset-block-start: 0.5rem;
  inset-inline-end: 1rem;
}
</style>

// دي الجزء بتاع التوب بار الي في الصفحه الاساسيه
