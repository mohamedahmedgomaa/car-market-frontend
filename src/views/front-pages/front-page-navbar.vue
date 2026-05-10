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
            :class="route.path === '/user/cars' && !route.query.sort && !route.query['filter[type]'] ? 'active-link' : ''"
            @click="sidebar = false"
          >
            Cars
          </RouterLink>

          <RouterLink
            :to="{ path: '/user/cars', query: { sort: '-price' } }"
            class="nav-link font-weight-medium"
            :class="route.path === '/user/cars' && route.query.sort === '-price' ? 'active-link' : ''"
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
            NegmSooq
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
            :class="route.path.startsWith('/user/sell') ? 'active-link' : ''"
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
          <VAppBarTitle class="me-6">
            <RouterLink
              to="/"
              class="d-flex gap-x-4"
              :class="$vuetify.display.mdAndUp ? 'd-block' : 'd-block'"
              style="text-decoration: none;"
            >
              <h1 class="app-logo-title" style="font-size: 1.75rem; font-weight: 800; letter-spacing: 0.5px; color: rgb(var(--v-theme-primary));">NegmCars</h1>
            </RouterLink>
          </VAppBarTitle>

          <!-- ✅ Links (Desktop) -->
          <div class="text-base align-center d-none d-md-flex gap-x-6 ms-8">
            <RouterLink
              to="/user/cars"
              class="nav-link font-weight-bold py-2 px-3"
              :class="route.path === '/user/cars' && !route.query.sort && !route.query['filter[type]'] ? 'active-link' : ''"
            >
              Cars
            </RouterLink>

            <RouterLink
              :to="{ path: '/user/cars', query: { sort: '-price' } }"
              class="nav-link font-weight-bold py-2 px-3"
              :class="route.path === '/user/cars' && route.query.sort === '-price' ? 'active-link' : ''"
            >
              Best Deals
            </RouterLink>

            <RouterLink
              to="/user/negm-sooq"
              class="nav-link font-weight-bold py-2 px-3"
              :class="route.path.startsWith('/user/negm-sooq') ? 'active-link' : ''"
            >
              NegmSooq
            </RouterLink>

            <RouterLink
              :to="{ path: '/user/cars', query: { 'filter[type]': 'motorcycle', sort: '-created_at' } }"
              class="nav-link font-weight-bold py-2 px-3"
              :class="route.path === '/user/cars' && route.query['filter[type]'] === 'motorcycle' ? 'active-link' : ''"
            >
              Bikes
            </RouterLink>

            <RouterLink
              to="/user/sell"
              class="nav-link font-weight-bold py-2 px-3"
              :class="route.path.startsWith('/user/sell') ? 'active-link' : ''"
            >
              Sell
            </RouterLink>

            <RouterLink
              to="/user/favorites"
              class="nav-link font-weight-bold py-2 px-3"
              :class="route.path.startsWith('/user/favorites') ? 'active-link' : ''"
            >
              Favorites
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
            class="ms-3 auth-main-btn px-6"
            rounded="xl"
          >
            <VIcon icon="tabler-user-circle" class="me-2" size="20" />
            Login
          </VBtn>
        </template>

        <template v-else>
          <VBtn
            variant="tonal"
            to="/user/profile"
            class="ms-3 px-6"
            rounded="xl"
          >
            <VIcon icon="tabler-user" class="me-2" size="20" />
            Profile
          </VBtn>

          <VBtn
            icon
            variant="text"
            color="error"
            class="ms-2"
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
  font-size: 1.05rem;
  transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;

  &:not(:hover) {
    color: rgb(var(--v-theme-on-surface));
  }

  &:hover {
    color: rgb(var(--v-theme-primary));
    transform: translateY(-1px);
  }
}

.active-link {
  color: rgb(var(--v-theme-primary)) !important;
}

.app-bar-light {
  border: 2px solid rgba(var(--v-theme-surface), 68%);
  border-radius: 0.5rem;
  background-color: rgba(var(--v-theme-surface), 38%);
  transition: all 0.1s ease-in-out;
}

.app-bar-dark {
  border: 2px solid rgba(var(--v-theme-surface), 68%);
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 4%);
  transition: all 0.1s ease-in-out;
}

.app-bar-scrolled {
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 0.5rem;
  background-color: rgb(var(--v-theme-surface)) !important;
  transition: all 0.1s ease-in-out;
}

/* ✅ نفس حجم Vuexy الأصلي */
.front-page-navbar::after {
  position: fixed;
  z-index: 2;
  backdrop-filter: saturate(100%) blur(6px);
  block-size: 5rem;
  content: '';
  inline-size: 100%;
}
</style>

<style lang="scss">
.front-page-navbar {
  .v-toolbar__content {
    padding-inline: 30px !important; /* ✅ نفس الأصل */
  }

  .v-toolbar {
    inset-inline: 0 !important;
    margin-block-start: 1rem !important;
    margin-inline: auto !important;
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
      max-inline-size: calc(100% - 32px);
    }
  }
}

.auth-main-btn {
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  height: 44px !important;
  box-shadow: 0 8px 20px -6px rgba(var(--v-theme-primary), 0.4) !important;
  transition: all 0.3s ease !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 25px -6px rgba(var(--v-theme-primary), 0.5) !important;
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
