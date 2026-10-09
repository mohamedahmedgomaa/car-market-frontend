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
import { useConfigStore } from '@core/stores/config'
import { useI18n } from 'vue-i18n'
import logoDark from '@images/logo/logo-dark.png'
import logoLight from '@images/logo/logo-light.png'

const props = defineProps({ activeId: String })

const display = useDisplay()
const { y } = useWindowScroll()
const route = useRoute()
const router = useRouter()

const { locale, t } = useI18n({ useScope: 'global' })
const configStore = useConfigStore()
const appLogo = useGenerateImageVariant(logoLight, logoDark)

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

// Ensure langConfig is always a valid array for VList
const safeLangConfig = computed(() => themeConfig.app.i18n.langConfig || [])

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
  <VNavigationDrawer v-model="sidebar" width="290" data-allow-mismatch disable-resize-watcher class="mobile-nav-drawer">
    <PerfectScrollbar :options="{ wheelPropagation: false }" class="h-100">
      <div class="pa-4 d-flex flex-column h-100">
        <!-- Mobile Drawer Header -->
        <div class="d-flex align-center justify-space-between pb-4 border-b mb-4">
          <RouterLink to="/" class="d-flex align-center gap-x-3 text-decoration-none" @click="sidebar = false">
            <div class="navbar-logo-badge">
              <img :src="appLogo" alt="NegmCars" class="navbar-logo-img" />
            </div>
            <h1 class="app-logo-title mb-0">NegmCars</h1>
          </RouterLink>

          <VBtn
            icon="tabler-x"
            variant="tonal"
            size="small"
            color="default"
            rounded="circle"
            @click="sidebar = false"
          />
        </div>

        <div class="d-flex flex-column gap-y-2 flex-grow-1">
          <!-- ✅ Main Links -->
          <RouterLink
            to="/user/cars"
            class="mobile-drawer-link font-weight-bold"
            :class="
              route.path === '/user/cars' && route.query['filter[type]'] !== 'motorcycle'
                ? 'active-drawer-link'
                : ''
            "
            @click="sidebar = false"
          >
            <span>{{ t('cars') }}</span>
          </RouterLink>

          <RouterLink
            to="/user/best-deals"
            class="mobile-drawer-link font-weight-bold"
            :class="route.path.startsWith('/user/best-deals') ? 'active-drawer-link' : ''"
            @click="sidebar = false"
          >
            <span>{{ t('bestDeals') }}</span>
          </RouterLink>

          <RouterLink
            :to="{
              path: '/user/cars',
              query: { 'filter[type]': 'motorcycle', sort: '-created_at' },
            }"
            class="mobile-drawer-link font-weight-bold"
            :class="
              route.path === '/user/cars' && route.query['filter[type]'] === 'motorcycle'
                ? 'active-drawer-link'
                : ''
            "
            @click="sidebar = false"
          >
            <span>{{ t('bikes') }}</span>
          </RouterLink>

          <RouterLink
            to="/user/sell"
            class="mobile-drawer-link font-weight-bold highlight-sell-link"
            :class="route.path === '/user/sell' ? 'active-drawer-link' : ''"
            @click="sidebar = false"
          >
            <span>{{ t('sell') }}</span>
          </RouterLink>

          <RouterLink
            to="/user/favorites"
            class="mobile-drawer-link font-weight-bold"
            :class="route.path.startsWith('/user/favorites') ? 'active-drawer-link' : ''"
            @click="sidebar = false"
          >
            <span>{{ t('favorites') }}</span>
          </RouterLink>

          <RouterLink
            to="/user/sellers"
            class="mobile-drawer-link font-weight-bold"
            :class="route.path === '/user/sellers' ? 'active-drawer-link' : ''"
            @click="sidebar = false"
          >
            <span>{{ t('showrooms') }}</span>
          </RouterLink>

          <VDivider class="my-3" />

          <!-- ✅ Auth (User) -->
          <template v-if="!isLoggedIn">
            <VBtn
              block
              color="primary"
              variant="elevated"
              to="/login"
              size="large"
              rounded="xl"
              class="auth-main-btn mt-1"
              @click="sidebar = false"
            >
              <VIcon icon="tabler-login" class="me-2" size="20" />
              {{ t('login') }}
            </VBtn>
          </template>

          <template v-else>
            <RouterLink
              to="/user/profile"
              class="mobile-drawer-link font-weight-bold"
              :class="route.path.startsWith('/user') ? 'active-drawer-link' : ''"
              @click="sidebar = false"
            >
              <span>{{ t('profile') }}</span>
            </RouterLink>

            <div
              class="mobile-drawer-link font-weight-bold text-error cursor-pointer"
              @click="logout"
            >
              <span>{{ t('logout') }}</span>
            </div>
          </template>

          <VDivider class="my-3" />

          <!-- Mobile Settings Section Card -->
          <div class="drawer-settings-card pa-3 rounded-xl border">
            <div class="text-caption font-weight-bold text-uppercase opacity-70 mb-2 d-flex align-center gap-1">
              <VIcon icon="tabler-settings" size="14" />
              <span>{{ t('settings') }}</span>
            </div>

            <!-- Language Switcher in Drawer -->
            <div class="mb-3">
              <div class="text-xs font-weight-medium opacity-80 mb-1.5">{{ t('language') }}</div>
              <div class="d-flex gap-x-2">
                <VBtn
                  v-for="lang in safeLangConfig"
                  :key="lang.i18nLang"
                  size="small"
                  :variant="locale === lang.i18nLang ? 'elevated' : 'tonal'"
                  color="primary"
                  rounded="lg"
                  class="flex-grow-1 font-weight-bold"
                  @click="locale = lang.i18nLang"
                >
                  {{ lang.label }}
                </VBtn>
              </div>
            </div>

            <!-- Theme Switcher in Drawer -->
            <div>
              <div class="text-xs font-weight-medium opacity-80 mb-1.5">{{ t('theme') }}</div>
              <div class="d-flex gap-x-1.5">
                <VBtn
                  size="small"
                  :variant="configStore.theme === 'light' ? 'elevated' : 'tonal'"
                  color="primary"
                  rounded="lg"
                  class="flex-grow-1 px-1"
                  @click="configStore.theme = 'light'"
                >
                  <VIcon icon="tabler-sun" size="14" class="me-1" />
                  {{ t('light') }}
                </VBtn>
                <VBtn
                  size="small"
                  :variant="configStore.theme === 'dark' ? 'elevated' : 'tonal'"
                  color="primary"
                  rounded="lg"
                  class="flex-grow-1 px-1"
                  @click="configStore.theme = 'dark'"
                >
                  <VIcon icon="tabler-moon" size="14" class="me-1" />
                  {{ t('dark') }}
                </VBtn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PerfectScrollbar>
  </VNavigationDrawer>

  <!-- 👉 Navbar for desktop devices -->
  <div class="front-page-navbar">
    <div class="front-page-navbar">
      <VAppBar
        :color="
          $vuetify.theme.current.dark
            ? 'rgba(var(--v-theme-surface), 0.38)'
            : 'rgba(255, 255, 255, 0.85)'
        "
        :class="[
          y > 10
            ? 'app-bar-scrolled'
            : $vuetify.theme.current.dark
              ? 'app-bar-dark'
              : 'app-bar-light',
          $vuetify.theme.current.dark ? 'is-dark-theme' : 'is-light-theme',
          'elevation-0',
        ]"
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

        <!-- Title & Brand Logo -->
        <VAppBarTitle class="me-sm-8 me-1 logo-title-wrapper" style="flex: 0 1 auto; min-width: 0; max-width: 100%;">
          <RouterLink
            to="/"
            class="d-flex align-center gap-x-2 text-decoration-none"
          >
            <div class="navbar-logo-badge">
              <img :src="appLogo" alt="NegmCars" class="navbar-logo-img" />
            </div>
            <h1 class="app-logo-title mb-0">NegmCars</h1>
          </RouterLink>
        </VAppBarTitle>

        <!-- ✅ Links (Desktop) -->
        <div class="text-base align-center d-none d-md-flex mx-6" style="flex: 1 1 auto; justify-content: space-evenly;">
          <RouterLink
            to="/user/cars"
            class="nav-link font-weight-bold"
            :class="
              route.path === '/user/cars' && route.query['filter[type]'] !== 'motorcycle'
                ? 'active-link'
                : ''
            "
          >
            {{ t('cars') }}
          </RouterLink>

          <RouterLink
            to="/user/best-deals"
            class="nav-link font-weight-bold"
            :class="route.path.startsWith('/user/best-deals') ? 'active-link' : ''"
          >
            {{ t('bestDeals') }}
          </RouterLink>

          <RouterLink
            :to="{
              path: '/user/cars',
              query: { 'filter[type]': 'motorcycle', sort: '-created_at' },
            }"
            class="nav-link font-weight-bold"
            :class="
              route.path === '/user/cars' && route.query['filter[type]'] === 'motorcycle'
                ? 'active-link'
                : ''
            "
          >
            {{ t('bikes') }}
          </RouterLink>

          <RouterLink
            to="/user/sell"
            class="nav-link font-weight-bold"
            :class="route.path === '/user/sell' ? 'active-link' : ''"
          >
            {{ t('sell') }}
          </RouterLink>

          <RouterLink
            to="/user/favorites"
            class="nav-link font-weight-bold"
            :class="route.path.startsWith('/user/favorites') ? 'active-link' : ''"
          >
            {{ t('favorites') }}
          </RouterLink>

          <RouterLink
            to="/user/sellers"
            class="nav-link font-weight-bold"
            :class="route.path === '/user/sellers' ? 'active-link' : ''"
          >
            {{ t('showrooms') }}
          </RouterLink>
        </div>

        <VSpacer class="d-md-none" />

        <!-- ✅ Auth & Settings Area -->
        <template v-if="!isLoggedIn">
          <!-- Settings Dropdown (Before Login) -->
          <VMenu close-on-content-click="false" offset="12px" width="230">
            <template #activator="{ props }">
              <VBtn v-bind="props" variant="text" class="settings-toggle-btn mx-1 d-flex" icon>
                <VIcon icon="tabler-dots-vertical" size="22" />
              </VBtn>
            </template>

            <VList class="settings-menu-list pa-2" style="border-radius: 12px">
              <!-- Language Section -->
              <div class="px-3 py-1 text-caption font-weight-bold text-uppercase opacity-60">
                {{ t('language') }}
              </div>
              <VListItem
                v-for="lang in safeLangConfig"
                :key="lang.i18nLang"
                :value="lang.i18nLang"
                :active="locale === lang.i18nLang"
                color="primary"
                rounded="lg"
                class="mb-1"
                @click="locale = lang.i18nLang"
              >
                <template #prepend>
                  <VIcon
                    :icon="locale === lang.i18nLang ? 'tabler-circle-check-filled' : 'tabler-circle'"
                    size="18"
                    class="me-2"
                  />
                </template>
                <VListItemTitle>{{ lang.label }}</VListItemTitle>
              </VListItem>

              <VDivider class="my-2" />

              <!-- Theme Section -->
              <div class="px-3 py-1 text-caption font-weight-bold text-uppercase opacity-60">
                {{ t('theme') }}
              </div>

              <VListItem
                :active="configStore.theme === 'light'"
                color="primary"
                rounded="lg"
                class="mb-1"
                @click="configStore.theme = 'light'"
              >
                <template #prepend>
                  <VIcon icon="tabler-sun" size="18" class="me-2" />
                </template>
                <VListItemTitle>{{ t('light') }}</VListItemTitle>
              </VListItem>

              <VListItem
                :active="configStore.theme === 'dark'"
                color="primary"
                rounded="lg"
                @click="configStore.theme = 'dark'"
              >
                <template #prepend>
                  <VIcon icon="tabler-moon" size="18" class="me-2" />
                </template>
                <VListItemTitle>{{ t('dark') }}</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <!-- Login Button -->
          <VBtn
            color="primary"
            variant="elevated"
            to="/login"
            class="ms-sm-1 ms-1 auth-main-btn"
            rounded="xl"
          >
            <VIcon icon="tabler-user-circle" class="auth-btn-icon me-sm-2 me-1" size="20" />
            {{ t('login') }}
          </VBtn>
        </template>

        <template v-else>
          <!-- ✅ Unified User Menu (After Login) -->
          <VMenu close-on-content-click="false" offset="12px" width="260">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                variant="tonal"
                class="ms-sm-3 ms-1 profile-main-btn"
                icon
                rounded="circle"
                style="width: 42px; height: 42px;"
              >
                <VIcon icon="tabler-user" size="22" />
              </VBtn>
            </template>

            <VList class="settings-menu-list pa-2" style="border-radius: 12px">
              <!-- User Options -->
              <VListItem
                to="/user/profile"
                color="primary"
                rounded="lg"
                class="mb-1"
              >
                <template #prepend>
                  <VIcon icon="tabler-user-circle" size="20" class="me-2" />
                </template>
                <VListItemTitle class="font-weight-bold">{{ t('profile') }}</VListItemTitle>
              </VListItem>

              <VListItem
                color="error"
                rounded="lg"
                class="mb-1 text-error"
                @click="logout"
              >
                <template #prepend>
                  <VIcon icon="tabler-logout" size="20" class="me-2" />
                </template>
                <VListItemTitle class="font-weight-bold">{{ t('logout') }}</VListItemTitle>
              </VListItem>

              <VDivider class="my-2" />

              <!-- Language Section -->
              <div class="px-3 py-1 text-caption font-weight-bold text-uppercase opacity-60">
                {{ t('language') }}
              </div>
              <VListItem
                v-for="lang in safeLangConfig"
                :key="lang.i18nLang"
                :value="lang.i18nLang"
                :active="locale === lang.i18nLang"
                color="primary"
                rounded="lg"
                class="mb-1"
                @click="locale = lang.i18nLang"
              >
                <template #prepend>
                  <VIcon
                    :icon="locale === lang.i18nLang ? 'tabler-circle-check-filled' : 'tabler-circle'"
                    size="18"
                    class="me-2"
                  />
                </template>
                <VListItemTitle>{{ lang.label }}</VListItemTitle>
              </VListItem>

              <VDivider class="my-2" />

              <!-- Theme Section -->
              <div class="px-3 py-1 text-caption font-weight-bold text-uppercase opacity-60">
                {{ t('theme') }}
              </div>

              <VListItem
                :active="configStore.theme === 'light'"
                color="primary"
                rounded="lg"
                class="mb-1"
                @click="configStore.theme = 'light'"
              >
                <template #prepend>
                  <VIcon icon="tabler-sun" size="18" class="me-2" />
                </template>
                <VListItemTitle>{{ t('light') }}</VListItemTitle>
              </VListItem>

              <VListItem
                :active="configStore.theme === 'dark'"
                color="primary"
                rounded="lg"
                @click="configStore.theme = 'dark'"
              >
                <template #prepend>
                  <VIcon icon="tabler-moon" size="18" class="me-2" />
                </template>
                <VListItemTitle>{{ t('dark') }}</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>
        </template>
      </VAppBar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 750;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  padding: 8px 18px;
  border-radius: 99px;
  border: 1px solid transparent;
  white-space: nowrap;
  height: 42px;
}

.active-link {
  color: #fff !important;
  background: linear-gradient(
    135deg,
    rgba(255, 107, 0, 0.24) 0%,
    rgba(255, 62, 29, 0.12) 100%
  ) !important;
  border-color: rgba(255, 107, 0, 0.55) !important;
  box-shadow:
    0 4px 15px rgba(255, 107, 0, 0.25),
    inset 0 0 8px rgba(255, 107, 0, 0.1) !important;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

/* is-light-theme navbar links style */
.is-light-theme {
  .nav-link {
    &:not(:hover):not(.active-link) {
      color: rgba(47, 43, 61, 0.9) !important;
      font-weight: 800;
    }
    &:hover:not(.active-link) {
      color: #ff6b00 !important;
      background: rgba(255, 107, 0, 0.1);
      border-color: rgba(255, 107, 0, 0.2);
      transform: translateY(-1px);
    }
  }
  .active-link {
    color: #ff6b00 !important;
  }
  .settings-toggle-btn {
    color: rgba(47, 43, 61, 0.9) !important;
    &:hover {
      background: rgba(47, 43, 61, 0.08);
    }
  }
  .profile-main-btn {
    border: 1px solid rgba(47, 43, 61, 0.15) !important;
    background: rgba(47, 43, 61, 0.05) !important;
    color: rgba(47, 43, 61, 0.9) !important;
    &:hover {
      background: rgba(47, 43, 61, 0.1) !important;
      border-color: rgba(47, 43, 61, 0.3) !important;
      transform: translateY(-2px);
    }
  }
}

/* is-dark-theme navbar links style */
.is-dark-theme {
  .nav-link {
    &:not(:hover):not(.active-link) {
      color: rgba(255, 255, 255, 0.8) !important;
    }
    &:hover:not(.active-link) {
      color: #ff6b00 !important;
      background: rgba(255, 107, 0, 0.08);
      border-color: rgba(255, 107, 0, 0.2);
      transform: translateY(-1px);
    }
  }
  .settings-toggle-btn {
    color: rgba(255, 255, 255, 0.8) !important;
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
  .profile-main-btn {
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    background: rgba(255, 255, 255, 0.04) !important;
    color: white !important;
    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      transform: translateY(-2px);
    }
  }
}

.app-bar-light {
  border: 1px solid rgba(47, 43, 61, 0.08) !important;
  border-radius: 99px !important;
  background-color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 10px 30px rgba(47, 43, 61, 0.08) !important;
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
  box-shadow:
    0 15px 35px rgba(0, 0, 0, 0.4),
    0 0 15px rgba(255, 107, 0, 0.05) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.is-light-theme.app-bar-scrolled {
  border: 1px solid rgba(255, 107, 0, 0.15) !important;
  background-color: rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    0 15px 35px rgba(47, 43, 61, 0.1),
    0 0 15px rgba(255, 107, 0, 0.05) !important;
}

.navbar-logo-badge {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface), 0.9);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  padding: 2px;

  &:hover {
    transform: scale(1.08) rotate(4deg);
    border-color: rgba(var(--v-theme-primary), 0.6);
  }
}

.navbar-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.app-logo-title {
  font-size: 1.65rem;
  font-weight: 900;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #ff6b00 0%, #ffa800 100%);
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

.logo-title-wrapper .v-toolbar-title__placeholder {
  overflow: visible !important;
  text-overflow: clip !important;
}

.auth-main-btn {
  font-weight: 800 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  height: 42px !important;
  padding-inline: 22px !important;
  background: linear-gradient(135deg, #ff6b00 0%, #ff3e1d 100%) !important;
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
    padding-inline: 10px !important;
    font-size: 0.82rem !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }
}

.auth-btn-icon {
  @media (max-width: 600px) {
    font-size: 16px !important;
    margin-inline-end: 4px !important;
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
      padding-inline: 8px !important; /* ✅ Less padding on mobile to prevent clipping */
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      overflow: hidden !important;
    }
  }

  .v-toolbar {
    inset-inline: 0 !important;
    margin-block-start: 1rem !important;
    margin-inline: auto !important;

    @media (max-width: 600px) {
      margin-block-start: 0.5rem !important;
      max-inline-size: calc(100% - 16px) !important;
      width: calc(100% - 16px) !important;
    }
  }
}

/* ✅ Responsive max-width rules (Wider width) */
@media (min-width: 1920px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 96px);
    }
  }
}

@media (min-width: 1280px) and (max-width: 1919px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 64px);
    }
  }
}

@media (min-width: 960px) and (max-width: 1279px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 48px);
    }
  }
}

@media (min-width: 600px) and (max-width: 959px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 48px);
    }
  }
}

@media (max-width: 600px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 16px) !important;
      width: calc(100% - 16px) !important;
    }
  }
}

#navigation-drawer-close-btn {
  position: absolute;
  cursor: pointer;
  inset-block-start: 0.5rem;
  inset-inline-end: 1rem;
}

/* ✅ Mobile Nav Drawer Styles */
.mobile-drawer-link {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 14px;
  color: rgba(var(--v-theme-on-surface), 0.85);
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.25s ease;
  border: 1px solid transparent;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.08);
    color: rgba(var(--v-theme-primary), 1);
  }
}

.active-drawer-link {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 62, 29, 0.08) 100%) !important;
  color: #ff6b00 !important;
  border-color: rgba(255, 107, 0, 0.3) !important;
  box-shadow: 0 4px 15px rgba(255, 107, 0, 0.15);
}

.highlight-sell-link {
  background: rgba(255, 168, 0, 0.08);
  border: 1px dashed rgba(255, 168, 0, 0.4);
}

.drawer-settings-card {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-color: rgba(var(--v-border-color), 0.12) !important;
}
</style>
