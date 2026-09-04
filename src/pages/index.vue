<script setup>
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'
import FeaturesSection from '@/views/front-pages/landing-page/features.vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const theme = useTheme()
const { t } = useI18n({ useScope: 'global' })

definePage({ meta: { layout: 'front', public: true } })

const props = defineProps(['activeSectionId'])
const emit = defineEmits(['update:activeSectionId'])

const buildSection = (type, sort) => ({
  limit: 8,
  params: {
    'filter[type]': type,
    'filter[show_on_home]': 1,
    sort,
  },
  viewAllTo: {
    path: '/user/cars',
    query: {
      'filter[type]': type,
      sort,
    },
  },
})

const CARS = {
  latest: buildSection('car', '-created_at'),
}

const MOTOS = {
  latest: buildSection('motorcycle', '-created_at'),
}

const ALL_VEHICLES = {
  bestDeals: {
    limit: 8,
    params: {
      'filter[is_best_deal]': 1,
      sort: 'price',
    },
    viewAllTo: {
      path: '/user/best-deals',
    },
  },
  importCars: {
    limit: 8,
    params: {
      'filter[is_import]': 1,
      sort: '-created_at',
    },
    viewAllTo: {
      path: '/user/negm-sooq',
    },
  },
}

/* --- Scroll Reveal Logic --- */
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
      }
    })
  }, { threshold: 0.1 })

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    observer.observe(el)
  })
})
</script>

<template>
  <div :class="theme.current.value.dark ? 'index--dark' : 'index--light'">
    <HeroSection />

  <VContainer class="hero__container">
    <!-- Cars Section -->
    <div class="reveal-on-scroll">
      <CarsSection
        :title="t('cars')"
        :subtitle="t('browseCars')"
        :limit="CARS.latest.limit"
        :params="CARS.latest.params"
        :viewAllTo="CARS.latest.viewAllTo"
      />
    </div>

    <div class="group-spacer"></div>

    <!-- Bikes Section -->
    <div class="reveal-on-scroll">
      <CarsSection
        :title="t('bikes')"
        :subtitle="t('browseBikes')"
        :limit="MOTOS.latest.limit"
        :params="MOTOS.latest.params"
        :viewAllTo="MOTOS.latest.viewAllTo"
      />
    </div>

    <div class="group-spacer"></div>

    <!-- Best Deals Section -->
    <div class="reveal-on-scroll">
      <CarsSection
        :title="t('bestDeals')"
        :subtitle="t('bestDealsSubtitle')"
        :limit="ALL_VEHICLES.bestDeals.limit"
        :params="ALL_VEHICLES.bestDeals.params"
        :viewAllTo="ALL_VEHICLES.bestDeals.viewAllTo"
      >
        <template #header-extra>
          <VChip size="small" color="error" variant="flat" class="best-deal-badge"> {{ t('bestDealBadge') }} </VChip>
        </template>
      </CarsSection>
    </div>
  </VContainer>

  <!-- Features Section -->
  <div class="reveal-on-scroll">
    <FeaturesSection />
  </div>

  <!-- CTA Section -->
  <section class="cta-section py-16 reveal-on-scroll">
    <VContainer>
      <VCard class="cta-card pa-12 text-center overflow-hidden" elevation="0">
        <div class="cta-glow"></div>
        <div class="cta-content relative-z">
          <h2 class="text-h3 font-weight-black mb-4">
            {{ t('readyToSell') }}
          </h2>
          <p class="text-h6 opacity-70 mb-10 max-w-700 mx-auto">
            {{ t('sellCTA') }}
          </p>
          <div class="d-flex flex-wrap justify-center gap-6">
            <VBtn
              color="primary"
              size="large"
              height="60"
              class="px-10 font-weight-bold premium-btn"
              to="/user/sell"
              prepend-icon="tabler-circle-plus"
              elevation="8"
            >
              {{ t('addAdNow') }}
            </VBtn>
            <VBtn
              variant="outlined"
              :color="theme.current.value.dark ? 'white' : 'black'"
              size="large"
              height="60"
              class="px-10 font-weight-bold premium-btn-outline"
              to="/user/cars"
            >
              {{ t('browseCarsBtn') }}
            </VBtn>
          </div>
        </div>
      </VCard>
    </VContainer>
  </section>

  <!-- Disclaimer Footer -->
  <section class="disclaimer-section py-8 reveal-on-scroll">
    <VContainer>
      <VAlert
        type="info"
        variant="tonal"
        color="warning"
        border="start"
        class="disclaimer-alert pa-6 glass-panel"
      >
        <div class="text-h6 font-weight-bold mb-2">{{ t('disclaimerTitle') }}</div>
        <div class="text-body-2 opacity-80">
          {{ t('disclaimerText') }}
        </div>
      </VAlert>
    </VContainer>
  </section>
  </div>
</template>

<style scoped>
.hero__container {
  padding-top: 0;
  padding-bottom: 32px;
}

.group-spacer {
  height: 40px;
}

.best-deal-badge,
.import-badge {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cta-section {
  background: radial-gradient(
    circle at center,
    rgba(var(--v-theme-primary), 0.05),
    transparent 70%
  );
}

.cta-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 48px !important;
  position: relative;
}

.cta-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(var(--v-theme-primary), 0.15) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.relative-z {
  position: relative;
  z-index: 2;
}

.text-primary-gradient {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 1), #64ffda);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.premium-btn {
  border-radius: 18px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 30px rgba(var(--v-theme-primary), 0.4) !important;
  }
}

.premium-btn-outline {
  border-radius: 18px !important;
  border-width: 2px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    transform: translateY(-4px);
  }
}

.max-w-700 {
  max-width: 700px;
}

.disclaimer-section {
  background: transparent;
}

.disclaimer-alert {
  border-radius: 20px !important;
}

/* =========================================
   ✅ LIGHT THEME OVERRIDES
   ========================================= */
.index--light {
  .cta-card {
    background: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05) !important;
  }

  .cta-glow {
    background: radial-gradient(
      circle at center,
      rgba(var(--v-theme-primary), 0.08) 0%,
      transparent 50%
    );
  }

  .cta-content p, .cta-content h2 {
    color: #000 !important;
  }

  .premium-btn-outline {
    border-color: rgba(0, 0, 0, 0.8) !important;
    color: rgba(0, 0, 0, 0.8) !important;
    &:hover {
      background: rgba(0, 0, 0, 0.04) !important;
      border-color: #000 !important;
      color: #000 !important;
    }
  }

  .disclaimer-alert {
    background: rgba(255, 255, 255, 0.9) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
  }
  
  .disclaimer-alert .text-body-2, .disclaimer-alert .text-h6 {
    color: #000 !important;
  }
}
</style>
