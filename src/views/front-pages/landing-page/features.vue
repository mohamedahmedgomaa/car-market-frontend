<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const theme = useTheme()
const { t } = useI18n({ useScope: 'global' })

const steps = computed(() => [
  { icon: 'tabler-search', title: t('step1Title'), desc: t('step1Desc') },
  { icon: 'tabler-brand-whatsapp', title: t('step2Title'), desc: t('step2Desc') },
  { icon: 'tabler-key', title: t('step3Title'), desc: t('step3Desc') },
])

const features = computed(() => [
  { title: t('feature1Title'), desc: t('feature1Desc'), icon: 'tabler-shield-check' },
  { title: t('feature2Title'), desc: t('feature2Desc'), icon: 'tabler-tag' },
  { title: t('feature3Title'), desc: t('feature3Desc'), icon: 'tabler-car' },
  { title: t('feature4Title'), desc: t('feature4Desc'), icon: 'tabler-calendar-event' },
  { title: t('feature5Title'), desc: t('feature5Desc'), icon: 'tabler-headset' },
  { title: t('feature6Title'), desc: t('feature6Desc'), icon: 'tabler-sparkles' },
])
</script>

<template>
  <section
    id="features"
    class="features-section"
    :class="theme.current.value.dark ? 'features--dark' : 'features--light'"
  >
    <VContainer class="features-container">
      <!-- How to buy -->
      <div class="section-head text-center">
        <span class="section-kicker">{{ t('howItWorksTitle') }}</span>
        <h2 class="section-title">
          {{ t('howToBuyTitle') }}
        </h2>
        <p class="section-sub">
          {{ t('howToBuySubtitle') }}
        </p>
      </div>

      <div class="steps-grid">
        <div
          v-for="(step, i) in steps"
          :key="step.title"
          class="step-card"
        >
          <span class="step-card__num">{{ i + 1 }}</span>
          <div class="step-card__icon">
            <VIcon :icon="step.icon" size="26" />
          </div>
          <h3 class="step-card__title">
            {{ step.title }}
          </h3>
          <p class="step-card__desc">
            {{ step.desc }}
          </p>
        </div>
      </div>

      <!-- Why us -->
      <div class="why-block">
        <div class="why-block__intro">
          <span class="section-kicker">{{ t('whyNegmTitle') }}</span>
          <h2 class="section-title text-start">
            {{ t('featuresTitle1') }}<span class="text-primary">{{ t('featuresTitleBuySell') }}</span>{{ t('featuresTitle2') }}
          </h2>
          <p class="section-sub text-start mb-0">
            {{ t('featuresSubtitle') }}
          </p>
        </div>

        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-item"
          >
            <div class="feature-item__icon">
              <VIcon :icon="feature.icon" size="22" />
            </div>
            <div>
              <h3 class="feature-item__title">
                {{ feature.title }}
              </h3>
              <p class="feature-item__desc">
                {{ feature.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.features-section {
  --f-accent: #ff6b00;
  --f-line: rgba(var(--v-theme-on-surface), 0.08);
  --f-surface: rgba(var(--v-theme-on-surface), 0.03);
  --f-muted: rgba(var(--v-theme-on-surface), 0.62);

  padding-block: 72px;
  border-block: 1px solid var(--f-line);
  background:
    radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255, 107, 0, 0.07), transparent 70%),
    rgba(var(--v-theme-on-surface), 0.015);
}

.features-container {
  max-width: 1340px !important;
}

/* Section heading (shared look) */
.section-head {
  max-width: 680px;
  margin: 0 auto 40px;
}

.section-kicker {
  display: inline-block;
  margin-block-end: 10px;
  color: var(--f-accent);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.section-title {
  margin: 0 0 12px;
  color: rgba(var(--v-theme-on-surface), 0.95);
  font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.2rem);
  font-weight: 900;
  line-height: 1.3;
}

.section-sub {
  margin: 0;
  color: var(--f-muted);
  font-size: 1rem;
  line-height: 1.7;
}

/* Steps */
.steps-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-block-end: 80px;
}

.step-card {
  position: relative;
  padding: 28px 24px;
  border: 1px solid var(--f-line);
  border-radius: 22px;
  background: var(--f-surface);
  transition: transform 0.3s ease, border-color 0.3s ease;

  &:hover {
    border-color: rgba(255, 107, 0, 0.35);
    transform: translateY(-4px);
  }
}

.step-card__num {
  position: absolute;
  inset-block-start: 18px;
  inset-inline-end: 22px;
  color: rgba(var(--v-theme-on-surface), 0.08);
  font-size: 3rem;
  font-weight: 900;
  line-height: 1;
}

.step-card__icon {
  display: grid;
  width: 54px;
  height: 54px;
  margin-block-end: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff6b00 0%, #ff3e1d 100%);
  box-shadow: 0 10px 24px rgba(255, 107, 0, 0.3);
  color: #fff;
  place-items: center;
}

.step-card__title {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 800;
}

.step-card__desc {
  margin: 0;
  color: var(--f-muted);
  font-size: 0.92rem;
  line-height: 1.7;
}

/* Why block */
.why-block {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 2fr);
  gap: 48px;
  align-items: start;
}

.why-block__intro {
  position: sticky;
  top: 110px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feature-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid var(--f-line);
  border-radius: 18px;
  background: var(--f-surface);
  transition: border-color 0.25s ease, background 0.25s ease;

  &:hover {
    border-color: rgba(255, 107, 0, 0.3);
    background: rgba(255, 107, 0, 0.04);
  }
}

.feature-item__icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 12px;
  background: rgba(255, 107, 0, 0.1);
  color: var(--f-accent);
  place-items: center;
}

.feature-item__title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 800;
}

.feature-item__desc {
  margin: 0;
  color: var(--f-muted);
  font-size: 0.88rem;
  line-height: 1.65;
}

/* Light theme */
.features--light {
  .step-card,
  .feature-item {
    background: #fff;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
  }
}

/* Responsive */
@media (max-width: 960px) {
  .why-block {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .why-block__intro {
    position: static;
    text-align: center;

    .section-title,
    .section-sub {
      text-align: center !important;
    }
  }
}

@media (max-width: 760px) {
  .steps-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-block-end: 48px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .features-section {
    padding-block: 40px;
  }

  .section-head {
    margin-block-end: 24px;
  }

  .step-card {
    padding: 20px;
  }

  .feature-item {
    padding: 16px;
  }
}
</style>
