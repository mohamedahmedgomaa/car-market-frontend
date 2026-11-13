<script setup>
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import CarMotionLoader from '@/components/CarMotionLoader.vue'
import { useGlobalLoader } from '@/composables/useGlobalLoader'
import { isApiLoading } from '@/composables/useApiProgress'
import initCore from '@core/initCore'
import {
  initConfigStore,
  useConfigStore,
} from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'

const { global } = useTheme()
const router = useRouter()
const { isGlobalLoading, globalLoadingText, globalLoadingSubtitle, showLoader, hideLoader } = useGlobalLoader()

// Sync router transitions with the sleek car motion loader
let isInitialRoute = true
if (router) {
  router.beforeEach((to, from, next) => {
    // Prevent double-loading flash on initial hard refresh
    if (isInitialRoute) {
      isInitialRoute = false
      next()
      return
    }
    if (to.path !== from.path) {
      const pageTitle = to.meta?.title || 'جاري تحميل الصفحة...'
      showLoader(pageTitle)
    }
    next()
  })

  router.afterEach(() => {
    hideLoader(250)
  })
}

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <!-- Real-Time Top Nitro Bar during any API network requests -->
      <div v-if="isApiLoading" class="top-api-nitro-bar" />

      <!-- Global Full-Page Driving Car Loader -->
      <Transition name="fade">
        <CarMotionLoader
          v-if="isGlobalLoading"
          mode="page"
          :title="globalLoadingText"
          :subtitle="globalLoadingSubtitle"
        />
      </Transition>

      <RouterView />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>

<style>
/* Real-Time API Activity Top Laser Bar */
.top-api-nitro-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
  background: linear-gradient(90deg, #ff3b00, #ff6b00, #ffaa00, #ffffff, #ff6b00, #ff3b00);
  background-size: 200% 100%;
  animation: api-nitro-sweep 1s linear infinite;
  box-shadow: 0 0 14px rgba(255, 107, 0, 0.9), 0 0 6px #ffaa00;
  z-index: 99999999;
  pointer-events: none;
}

@keyframes api-nitro-sweep {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
