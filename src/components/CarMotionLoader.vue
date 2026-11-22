<script setup>
import { computed } from 'vue'

// Brand loader (logo only). Name kept for backwards compatibility with existing imports.
const props = defineProps({
  mode: {
    type: String,
    default: 'table', // 'page' | 'table' | 'inline'
  },
  title: {
    type: String,
    default: 'جاري تحميل البيانات...',
  },
  subtitle: {
    type: String,
    default: 'لحظات ونكون جاهزين بأحدث العروض والتفاصيل',
  },
  height: {
    type: [String, Number],
    default: null,
  },
})

const containerStyle = computed(() => {
  if (props.mode === 'page')
    return { position: 'fixed', inset: '0', zIndex: 99999 }

  if (props.height)
    return { minHeight: typeof props.height === 'number' ? `${props.height}px` : props.height }

  return { minHeight: props.mode === 'table' ? '280px' : '160px' }
})

const isPage = computed(() => props.mode === 'page')
</script>

<template>
  <div
    class="brand-loader d-flex flex-column align-center justify-center"
    :class="[`brand-loader--${mode}`, isPage ? 'brand-loader--backdrop' : 'py-8 px-4']"
    :style="containerStyle"
    role="status"
    aria-live="polite"
  >
    <div class="brand-loader__mark">
      <svg class="brand-loader__ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="brand-loader__ring-track" cx="50" cy="50" r="46" />
        <circle class="brand-loader__ring-arc" cx="50" cy="50" r="46" />
      </svg>
      <span class="brand-loader__glow" />
      <img
        src="/images/logo/logo-dark.png"
        alt="NegmCars"
        class="brand-loader__logo"
      >
    </div>

    <div class="brand-loader__text text-center">
      <h4 class="brand-loader__title">
        {{ title }}
      </h4>
      <p
        v-if="subtitle"
        class="brand-loader__subtitle"
      >
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.brand-loader {
  --bl-size: 64px;
  --bl-accent: #ff6b00;

  width: 100%;
  gap: 18px;
  user-select: none;
}

.brand-loader--page {
  --bl-size: 84px;
}

.brand-loader--inline {
  --bl-size: 48px;

  gap: 12px;
}

.brand-loader--backdrop {
  background: rgba(11, 13, 20, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.brand-loader--table {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
}

/* Logo + spinning ring */
.brand-loader__mark {
  position: relative;
  display: grid;
  width: calc(var(--bl-size) + 28px);
  height: calc(var(--bl-size) + 28px);
  place-items: center;
}

.brand-loader__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  animation: bl-spin 1.1s linear infinite;
}

.brand-loader__ring-track,
.brand-loader__ring-arc {
  fill: none;
  stroke-width: 3;
}

.brand-loader__ring-track {
  stroke: rgba(var(--v-theme-on-surface), 0.08);
}

.brand-loader__ring-arc {
  stroke: var(--bl-accent);
  stroke-dasharray: 70 220;
  stroke-linecap: round;
}

.brand-loader__glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 107, 0, 0.45) 0%, transparent 70%);
  filter: blur(10px);
  inset: 8px;
  animation: bl-glow 1.6s ease-in-out infinite alternate;
}

.brand-loader__logo {
  position: relative;
  width: var(--bl-size);
  height: var(--bl-size);
  border-radius: 22%;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
  object-fit: contain;
  animation: bl-breathe 1.6s ease-in-out infinite alternate;
}

/* Text */
.brand-loader__title {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.95rem;
  font-weight: 700;
}

.brand-loader--backdrop .brand-loader__title {
  color: #fff;
}

.brand-loader__subtitle {
  margin: 4px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.78rem;
}

.brand-loader--backdrop .brand-loader__subtitle {
  color: rgba(255, 255, 255, 0.55);
}

@keyframes bl-spin {
  to { transform: rotate(360deg); }
}

@keyframes bl-glow {
  from { opacity: 0.35; transform: scale(0.9); }
  to { opacity: 0.8; transform: scale(1.08); }
}

@keyframes bl-breathe {
  from { transform: scale(1); }
  to { transform: scale(1.04); }
}

@media (prefers-reduced-motion: reduce) {
  .brand-loader__ring,
  .brand-loader__glow,
  .brand-loader__logo {
    animation-duration: 3s;
  }
}
</style>
