<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'tabler-car-garage',
  },
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
  badge: {
    type: String,
    default: '',
  },
  badgeColor: {
    type: String,
    default: 'primary',
  },
  badgePulse: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div class="page-hero-banner mb-6 pa-6 rounded-2xl elevation-2 position-relative overflow-hidden">
    <div class="page-hero-glow"></div>

    <div class="d-flex flex-wrap align-center justify-space-between gap-5 position-relative">
      <!-- Title & Breadcrumbs -->
      <div class="hero-title-section">
        <!-- Breadcrumbs -->
        <div v-if="breadcrumbs && breadcrumbs.length" class="d-flex align-center gap-2 text-xs text-medium-emphasis mb-2 font-weight-medium">
          <template v-for="(b, idx) in breadcrumbs" :key="idx">
            <RouterLink v-if="b.to" :to="b.to" class="breadcrumb-link d-flex align-center gap-1">
              <VIcon v-if="b.icon" :icon="b.icon" size="14" />
              <span>{{ b.title }}</span>
            </RouterLink>
            <span v-else class="text-primary font-weight-bold">{{ b.title }}</span>

            <VIcon v-if="idx < breadcrumbs.length - 1" icon="tabler-chevron-left" size="12" class="opacity-40" />
          </template>
        </div>

        <!-- Main Title with Glowing Icon -->
        <div class="d-flex align-center gap-3 mb-1">
          <div class="hero-icon-wrapper d-flex align-center justify-center">
            <VIcon :icon="icon" size="30" class="hero-header-icon" />
          </div>
          <div>
            <div class="d-flex align-center gap-2 flex-wrap">
              <h1 class="text-h4 font-weight-black text-high-emphasis tracking-tight mb-0">
                {{ title }}
              </h1>
              <VChip
                v-if="badge"
                size="small"
                :color="badgeColor"
                variant="flat"
                class="hero-status-pill font-weight-bold px-3"
              >
                <span v-if="badgePulse" class="hero-pulse-dot me-1"></span>
                {{ badge }}
              </VChip>
            </div>
            <p v-if="subtitle" class="text-sm text-medium-emphasis mb-0 mt-1">
              {{ subtitle }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right Side: Stats & Actions Slots -->
      <div class="d-flex align-center gap-3 flex-wrap">
        <slot name="stats" />
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-hero-banner {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.08) 0%, rgba(30, 32, 45, 0.7) 100%);
  border: 1px solid rgba(255, 107, 0, 0.2);
  backdrop-filter: blur(12px);
  position: relative;
}

.page-hero-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, rgba(255, 107, 0, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.breadcrumb-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: rgb(var(--v-theme-primary));
}

.hero-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 70, 0, 0.05) 100%);
  border: 1px solid rgba(255, 107, 0, 0.3);
  box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
  flex-shrink: 0;
}

.hero-header-icon {
  color: rgb(var(--v-theme-primary));
}

.hero-pulse-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #28c76f;
  box-shadow: 0 0 8px #28c76f;
  animation: hero-pulse 1.8s infinite;
}

@keyframes hero-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
</style>

