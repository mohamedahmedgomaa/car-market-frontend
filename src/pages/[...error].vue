<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@core/stores/config'
import { themeConfig } from '@themeConfig'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'

definePage({
  alias: '/pages/misc/not-found/:error(.*)',
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const configStore = useConfigStore()

const isAr = computed(() => locale.value === 'ar')
const tr = (en, ar) => (isAr.value ? ar : en)

const safeLangConfig = computed(() => themeConfig.app.i18n?.langConfig || [
  { label: 'English', i18nLang: 'en' },
  { label: 'العربية', i18nLang: 'ar' },
])

const toggleTheme = () => {
  configStore.theme = configStore.theme === 'dark' ? 'light' : 'dark'
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="misc-wrapper d-flex flex-column align-center justify-center pa-4 position-relative">
    <!-- Top Header Bar (Logo + Language & Theme Controls) -->
    <div class="auth-header-bar w-100 d-flex align-center justify-space-between mb-8 px-2" style="max-width: 600px;">
      <!-- App Logo -->
      <RouterLink
        to="/"
        class="auth-logo d-flex align-center gap-x-3 text-decoration-none"
      >
        <VNodeRenderer v-if="themeConfig.app.logo" :nodes="themeConfig.app.logo" />
        <h1 class="auth-title text-white text-h4 font-weight-bold mb-0">
          <span class="logo-brand-text">Negm</span><span class="logo-accent-text">Cars</span>
        </h1>
      </RouterLink>

      <!-- Settings Controls (Language & Theme) -->
      <div class="d-flex align-center gap-2">
        <VMenu close-on-content-click="false" offset="8px" width="180">
          <template #activator="{ props }">
            <VBtn v-bind="props" variant="tonal" color="primary" rounded="pill" size="small" class="font-weight-bold">
              <VIcon icon="tabler-world" class="me-1" size="18" />
              {{ locale === 'ar' ? 'العربية' : 'English' }}
              <VIcon icon="tabler-chevron-down" class="ms-1" size="14" />
            </VBtn>
          </template>
          <VList class="pa-2" style="border-radius: 12px">
            <VListItem
              v-for="lang in safeLangConfig"
              :key="lang.i18nLang"
              :active="locale === lang.i18nLang"
              color="primary"
              rounded="lg"
              class="mb-1"
              @click="locale = lang.i18nLang"
            >
              <template #prepend>
                <VIcon :icon="locale === lang.i18nLang ? 'tabler-circle-check-filled' : 'tabler-circle'" size="16" class="me-2" />
              </template>
              <VListItemTitle>{{ lang.label }}</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VBtn icon variant="tonal" color="primary" rounded="circle" size="small" @click="toggleTheme" title="Toggle Theme">
          <VIcon :icon="configStore.theme === 'dark' ? 'tabler-sun' : 'tabler-moon'" size="18" />
        </VBtn>
      </div>
    </div>

    <!-- Error Card -->
    <VCard class="error-card text-center pa-8 pa-sm-12" elevation="24">
      <!-- Glow Icon Visual -->
      <div class="error-visual mb-6 position-relative d-inline-flex align-center justify-center">
        <div class="pulse-ring"></div>
        <div class="icon-circle d-flex align-center justify-center">
          <VIcon icon="tabler-steering-wheel-off" size="56" color="primary" />
        </div>
      </div>

      <!-- 404 Large Gradient Code -->
      <h1 class="error-code font-weight-black mb-1">
        404
      </h1>

      <!-- Title -->
      <h2 class="text-h4 font-weight-bold text-white mb-3">
        {{ tr('Page Not Found', 'عذراً، هذه الصفحة غير موجودة') }}
      </h2>

      <!-- Description -->
      <p class="error-description text-disabled text-body-1 mx-auto mb-8" style="max-width: 440px;">
        {{ tr(
          "We couldn't find the page you are looking for. It may have been moved, renamed, or no longer exists.",
          "لم نتمكن من العثور على الصفحة المطلوبة. قد يكون تم نقلها أو حذفها أو أن الرابط غير صحيح."
        ) }}
      </p>

      <!-- Action Buttons -->
      <div class="d-flex flex-column flex-sm-row align-center justify-center gap-3 mb-8">
        <VBtn
          to="/"
          color="primary"
          height="50"
          class="action-btn primary-btn px-6 font-weight-bold"
        >
          <VIcon icon="tabler-home" class="me-2" size="20" />
          {{ tr('Back to Home', 'العودة للرئيسية') }}
        </VBtn>

        <VBtn
          to="/user/cars"
          variant="tonal"
          color="primary"
          height="50"
          class="action-btn px-6 font-weight-bold"
        >
          <VIcon icon="tabler-car" class="me-2" size="20" />
          {{ tr('Browse Cars', 'تصفح السيارات') }}
        </VBtn>

        <VBtn
          variant="outlined"
          height="50"
          class="action-btn outline-btn px-5 font-weight-medium"
          @click="goBack"
        >
          <VIcon :icon="isAr ? 'tabler-arrow-right' : 'tabler-arrow-left'" class="me-2" size="18" />
          {{ tr('Previous Page', 'الصفحة السابقة') }}
        </VBtn>
      </div>

      <!-- Quick Helpful Links -->
      <div class="quick-links pt-4">
        <span class="text-caption text-disabled d-block mb-2">
          {{ tr('Popular destinations:', 'روابط قد تهمك:') }}
        </span>
        <div class="d-flex align-center justify-center gap-3 flex-wrap text-body-2">
          <RouterLink to="/user/best-deals" class="quick-link">
            🔥 {{ tr('Best Deals', 'أفضل العروض') }}
          </RouterLink>
          <span class="text-disabled">•</span>
          <RouterLink to="/user/negm-sooq" class="quick-link">
            🏪 {{ tr('Negm Sooq', 'سوق نجم') }}
          </RouterLink>
          <span class="text-disabled">•</span>
          <RouterLink to="/seller/login" class="quick-link">
            💼 {{ tr('Seller Portal', 'بوابة المعارض') }}
          </RouterLink>
        </div>
      </div>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.misc-wrapper {
  min-height: 100vh;
  background-color: #0f111a;
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.12) 0%, transparent 80%);
}

.error-card {
  width: 100%;
  max-width: 600px;
  background-color: #1c1f2e !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

.error-visual {
  width: 110px;
  height: 110px;
  margin: 0 auto;

  .pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(var(--v-theme-primary), 0.15);
    animation: pulse 2.5s infinite ease-out;
  }

  .icon-circle {
    width: 86px;
    height: 86px;
    border-radius: 50%;
    background: rgba(var(--v-theme-primary), 0.12);
    border: 2px solid rgba(var(--v-theme-primary), 0.35);
    z-index: 1;
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(15deg) scale(1.05);
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.2;
  }
  100% {
    transform: scale(0.85);
    opacity: 0.8;
  }
}

.error-code {
  font-size: clamp(4.5rem, 12vw, 7rem);
  line-height: 1;
  letter-spacing: -2px;
  background: linear-gradient(135deg, #FF6B00 0%, #FF9E40 60%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 6px 20px rgba(255, 107, 0, 0.35));
}

.error-description {
  line-height: 1.6;
}

.action-btn {
  border-radius: 14px !important;
  text-transform: none !important;
  letter-spacing: 0.3px;
  min-width: 150px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.primary-btn {
  box-shadow: 0 10px 30px -8px rgba(var(--v-theme-primary), 0.6) !important;
  &:hover {
    box-shadow: 0 14px 35px -6px rgba(var(--v-theme-primary), 0.75) !important;
  }
}

.outline-btn {
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.8) !important;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4) !important;
    color: #fff !important;
  }
}

.quick-links {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.quick-link {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: rgb(var(--v-theme-primary));
    text-decoration: underline;
  }
}

.auth-title {
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;

  .logo-brand-text {
    color: #FFFFFF !important;
  }
  .logo-accent-text {
    color: #FF6B00 !important;
  }
}
</style>
