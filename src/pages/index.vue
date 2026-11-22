<script setup>
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'
import FeaturesSection from '@/views/front-pages/landing-page/features.vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import api from '@/api/index.js'

const theme = useTheme()
const { t } = useI18n({ useScope: 'global' })

definePage({ meta: { layout: 'front', public: true } })

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

const CARS = { latest: buildSection('car', '-created_at') }
const MOTOS = { latest: buildSection('motorcycle', '-created_at') }

const ALL_VEHICLES = {
  bestDeals: {
    limit: 8,
    params: {
      'filter[is_best_deal]': 1,
      sort: 'price',
    },
    viewAllTo: { path: '/user/best-deals' },
  },
}

const homeData = ref(null)
const homeLoading = ref(true)

const fetchHomeData = async () => {
  homeLoading.value = true
  try {
    const res = await api.get('/user/home')
    homeData.value = res.data?.data || null
  }
  catch (err) {
    console.error('Failed to load home data:', err)
  }
  finally {
    homeLoading.value = false
  }
}

const isLoadingSections = computed(() => homeLoading.value && !homeData.value)

// Hide a listing section entirely when it has nothing to show (instead of "No cars found")
const hasBikes = computed(() => isLoadingSections.value || (homeData.value?.latest_bikes?.length ?? 0) > 0)
const hasBestDeals = computed(() => isLoadingSections.value || (homeData.value?.best_deals?.length ?? 0) > 0)

/* --- Disclaimer --- */
const showFullDisclaimer = ref(false)

/* --- Scroll Reveal Logic --- */
onMounted(() => {
  fetchHomeData()

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.05 })

  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el))
})
</script>

<template>
  <div
    class="home"
    :class="theme.current.value.dark ? 'index--dark' : 'index--light'"
  >
    <HeroSection
      :controlled="true"
      :initial-banners="homeData?.hero_banners"
      :initial-video-url="homeData?.video_banner"
      :initial-video-link="homeData?.video_banner_link"
      :initial-brands="homeData?.brands"
    />

    <!-- Listings -->
    <div class="listings">
      <div class="reveal-on-scroll">
        <CarsSection
          :controlled="true"
          :title="t('cars')"
          :subtitle="t('browseCars')"
          :cars="homeData?.latest_cars || null"
          :loading="isLoadingSections"
          :limit="CARS.latest.limit"
          :params="CARS.latest.params"
          :view-all-to="CARS.latest.viewAllTo"
        />
      </div>

      <div class="reveal-on-scroll">
        <CarsSection
          v-if="hasBestDeals"
          :controlled="true"
          :title="t('bestDeals')"
          :subtitle="t('bestDealsSubtitle')"
          :cars="homeData?.best_deals || null"
          :loading="isLoadingSections"
          :limit="ALL_VEHICLES.bestDeals.limit"
          :params="ALL_VEHICLES.bestDeals.params"
          :view-all-to="ALL_VEHICLES.bestDeals.viewAllTo"
        />
      </div>

      <div class="reveal-on-scroll">
        <CarsSection
          v-if="hasBikes"
          :controlled="true"
          :title="t('bikes')"
          :subtitle="t('browseBikes')"
          :cars="homeData?.latest_bikes || null"
          :loading="isLoadingSections"
          :limit="MOTOS.latest.limit"
          :params="MOTOS.latest.params"
          :view-all-to="MOTOS.latest.viewAllTo"
        />
      </div>
    </div>

    <!-- How it works + Why us -->
    <div class="reveal-on-scroll">
      <FeaturesSection />
    </div>

    <!-- Sell CTA -->
    <section class="cta-section reveal-on-scroll">
      <VContainer class="home-container">
        <div class="cta-card">
          <div
            class="cta-card__pattern"
            aria-hidden="true"
          />
          <div class="cta-card__content">
            <h2 class="cta-card__title">
              {{ t('readyToSell') }}
            </h2>
            <p class="cta-card__text">
              {{ t('sellCTA') }}
            </p>
            <ul class="cta-card__points">
              <li
                v-for="p in ['ctaPoint1', 'ctaPoint2', 'ctaPoint3']"
                :key="p"
              >
                <VIcon
                  icon="tabler-circle-check-filled"
                  size="18"
                />
                {{ t(p) }}
              </li>
            </ul>
          </div>

          <div class="cta-card__actions">
            <VBtn
              size="x-large"
              variant="flat"
              color="white"
              class="cta-btn cta-btn--primary"
              to="/user/sell"
              prepend-icon="tabler-circle-plus"
            >
              {{ t('addAdNow') }}
            </VBtn>
            <VBtn
              size="x-large"
              variant="outlined"
              color="white"
              class="cta-btn cta-btn--ghost"
              to="/user/cars"
              append-icon="tabler-arrow-up-right"
            >
              {{ t('browseCarsBtn') }}
            </VBtn>
          </div>
        </div>
      </VContainer>
    </section>

    <!-- Disclaimer (compact) -->
    <section class="disclaimer-section reveal-on-scroll">
      <VContainer class="home-container">
        <div class="disclaimer-box">
          <VIcon
            icon="tabler-info-circle"
            size="20"
            class="disclaimer-box__icon"
          />
          <div class="disclaimer-box__body">
            <strong class="disclaimer-box__title">{{ t('disclaimerTitle') }}</strong>
            <p class="disclaimer-box__text">
              {{ showFullDisclaimer ? t('disclaimerText') : t('disclaimerShort') }}
              <button
                type="button"
                class="disclaimer-box__toggle"
                @click="showFullDisclaimer = !showFullDisclaimer"
              >
                {{ showFullDisclaimer ? t('showLess') : t('readMore') }}
              </button>
            </p>
          </div>
        </div>
      </VContainer>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home {
  --home-accent: #ff6b00;
  --home-line: rgba(var(--v-theme-on-surface), 0.08);
  --home-muted: rgba(var(--v-theme-on-surface), 0.6);
}

.home-container {
  max-width: 1340px !important;
}

.home-section-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
}

.home-section-sub {
  margin: 4px 0 0;
  color: var(--home-muted);
  font-size: 0.9rem;
}

/* ---------- Brands strip ---------- */
.brands-strip {
  padding-block: 8px 8px;
}

.brands-strip__inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brands-strip__list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px 7px 7px;
  padding-inline: 7px 16px;
  border: 1px solid var(--home-line);
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 107, 0, 0.5);
    background: rgba(255, 107, 0, 0.08);
    color: var(--home-accent);
    transform: translateY(-2px);
  }
}

.brand-pill__badge {
  display: grid;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: var(--home-accent);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.3px;
  place-items: center;
}

.brand-pill--all {
  border-style: dashed;
}

/* ---------- Listings ---------- */
.listings {
  padding-block: 8px 24px;
}

/* ---------- CTA ---------- */
.cta-section {
  padding-block: 72px 32px;
}

.cta-card {
  position: relative;
  display: grid;
  overflow: hidden;
  align-items: center;
  padding: 48px 56px;
  border-radius: 32px;
  background: linear-gradient(120deg, #ff6b00 0%, #ff3e1d 100%);
  box-shadow: 0 30px 70px rgba(255, 80, 0, 0.28);
  color: #fff;
  gap: 32px;
  grid-template-columns: minmax(0, 1.4fr) auto;
}

.cta-card__pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.22), transparent 40%),
    radial-gradient(circle at 10% 110%, rgba(0, 0, 0, 0.2), transparent 45%);
  pointer-events: none;
}

.cta-card__content,
.cta-card__actions {
  position: relative;
  z-index: 1;
}

.cta-card__title {
  margin: 0 0 10px;
  color: #fff;
  font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.4rem);
  font-weight: 900;
  line-height: 1.25;
}

.cta-card__text {
  max-width: 560px;
  margin: 0 0 18px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.7;
}

.cta-card__points {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  gap: 10px 22px;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    font-weight: 700;
  }
}

.cta-card__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 240px;
}

.cta-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease, border-color 0.25s ease !important;

  :deep(.v-btn__overlay) {
    display: none !important;
  }
}

.cta-btn--primary {
  background-color: #ffffff !important;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2) !important;
  color: #e85400 !important;

  &:hover,
  &:focus-visible,
  &:active {
    background-color: #0f172a !important;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35) !important;
    color: #ffffff !important;
    transform: translateY(-2px);
  }
}

.cta-btn--ghost {
  border: 2px solid rgba(255, 255, 255, 0.78) !important;
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;

  &:hover,
  &:focus-visible,
  &:active {
    border-color: #ffffff !important;
    background-color: #ffffff !important;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.22) !important;
    color: #e85400 !important;
    transform: translateY(-2px);
  }
}

/* ---------- Disclaimer ---------- */
.disclaimer-section {
  padding-block: 8px 40px;
}

.disclaimer-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px 20px;
  border: 1px solid var(--home-line);
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.disclaimer-box__icon {
  flex-shrink: 0;
  margin-block-start: 2px;
  color: #f59e0b;
}

.disclaimer-box__title {
  display: block;
  margin-block-end: 2px;
  font-size: 0.88rem;
}

.disclaimer-box__text {
  margin: 0;
  color: var(--home-muted);
  font-size: 0.82rem;
  line-height: 1.7;
}

.disclaimer-box__toggle {
  padding: 0;
  border: 0;
  margin-inline-start: 4px;
  background: none;
  color: var(--home-accent);
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
}

/* ---------- Light theme ---------- */
.index--light {
  .brand-pill {
    background: #fff;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  }

  .disclaimer-box {
    background: #fff;
  }
}

/* ---------- Responsive ---------- */
@media (max-width: 960px) {
  .cta-card {
    padding: 36px 28px;
    grid-template-columns: 1fr;
    text-align: center;
  }

  .cta-card__text {
    margin-inline: auto;
  }

  .cta-card__points {
    justify-content: center;
  }

  .cta-card__actions {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .brands-strip__list {
    flex-wrap: nowrap;
    margin-inline: -12px;
    overflow-x: auto;
    padding-block-end: 6px;
    padding-inline: 12px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .brand-pill {
    flex-shrink: 0;
  }

  .cta-section {
    padding-block: 40px 16px;
  }

  .cta-card {
    padding: 28px 18px;
    border-radius: 24px;
  }

  .cta-card__actions {
    flex-direction: column;
    min-width: 0;
  }

  .cta-btn {
    width: 100%;
  }
}
</style>
