<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const theme = useTheme()
const { t } = useI18n({ useScope: 'global' })

const features = computed(() => [
  {
    title: t('feature1Title'),
    desc: t('feature1Desc'),
    icon: 'tabler-shield-check',
  },
  {
    title: t('feature2Title'),
    desc: t('feature2Desc'),
    icon: 'tabler-currency-dollar',
  },
  {
    title: t('feature3Title'),
    desc: t('feature3Desc'),
    icon: 'tabler-car',
  },
  {
    title: t('feature4Title'),
    desc: t('feature4Desc'),
    icon: 'tabler-calendar-event',
  },
  {
    title: t('feature5Title'),
    desc: t('feature5Desc'),
    icon: 'tabler-headset',
  },
  {
    title: t('feature6Title'),
    desc: t('feature6Desc'),
    icon: 'tabler-search',
  },
])
</script>

<template>
  <section id="features" class="features-section py-16" :class="theme.current.value.dark ? 'features--dark' : 'features--light'">
    <VContainer>
      <div class="text-center mb-16">
        <h2 class="text-h3 font-weight-black mb-4">
          {{ t('featuresTitle1') }}<span class="text-primary">{{ t('featuresTitleBuySell') }}</span>{{ t('featuresTitle2') }}
        </h2>
        <p class="text-h6 opacity-60 max-w-700 mx-auto">
          {{ t('featuresSubtitle') }}
        </p>
      </div>

      <VRow>
        <VCol v-for="(feature, index) in features" :key="index" cols="12" sm="6" md="4">
          <VCard class="feature-card pa-8" elevation="0">
            <div class="feature-icon-wrapper mb-6">
              <VIcon :icon="feature.icon" size="32" color="primary" />
            </div>
            <h3 class="text-h5 font-weight-bold mb-3">{{ feature.title }}</h3>
            <p class="text-body-1 opacity-60 leading-relaxed">{{ feature.desc }}</p>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.features-section {
  background: rgba(255, 255, 255, 0.02);
}

.max-w-700 {
  max-width: 700px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 32px;
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(var(--v-theme-primary), 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.leading-relaxed {
  line-height: 1.7;
}

/* =========================================
   ✅ LIGHT THEME OVERRIDES
   ========================================= */
.features--light {
  &.features-section {
    background: rgba(0, 0, 0, 0.02);
  }

  .feature-card {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;

    &:hover {
      background: #ffffff;
      border-color: rgba(var(--v-theme-primary), 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08) !important;
    }
  }

  .feature-icon-wrapper {
    background: rgba(var(--v-theme-primary), 0.1);
    border: 1px solid rgba(var(--v-theme-primary), 0.15);
  }

  h2, h3, p {
    color: #000 !important;
  }
}
</style>
