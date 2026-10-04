<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({
  meta: { layout: 'front', public: false },
})

const props = defineProps(['activeSectionId'])
const emit = defineEmits(['update:activeSectionId'])

const router = useRouter()
const userId = ref(null)
const isLoaded = ref(false)

const ensureAuth = () => {
  const token = localStorage.getItem('user_token')
  if (!token) {
    router.push('/login')
    return false
  }

  try {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}')
    userId.value = user.id
  } catch (e) {
    console.error('Error parsing user data', e)
    router.push('/login')
    return false
  }

  return true
}

const favoriteParams = computed(() => {
  if (!userId.value) return null
  return {
    'filter[user_id]': userId.value,
    sort: '-created_at',
  }
})

onMounted(async () => {
  if (ensureAuth()) {
    // Add a small delay for better entrance animation
    setTimeout(() => {
      isLoaded.value = true
    }, 100)
  }
})
</script>

<template>
  <div class="favorites-page">
    <!-- Compact Header Section -->
    <section class="favorites-header py-6">
      <VContainer>
        <div class="favorites-header-card d-flex flex-column flex-sm-row align-center justify-space-between gap-4 pa-6 rounded-2xl reveal-up">
          <div class="d-flex align-center gap-4 text-center text-sm-start">
            <div class="header-icon-badge flex-shrink-0 d-flex align-center justify-center">
              <VIcon icon="tabler-heart-filled" color="error" size="24" />
            </div>
            <div>
              <h1 class="text-h4 font-weight-black mb-1">
                My <span class="text-primary">Favorites</span>
              </h1>
              <p class="text-body-2 opacity-70 mb-0">
                All the vehicles you've saved for later. Keep track of your dream cars in one place.
              </p>
            </div>
          </div>

          <VBtn
            v-if="isLoaded"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-search"
            to="/user/cars"
            rounded="pill"
            class="px-6 font-weight-bold flex-shrink-0"
            size="small"
          >
            Browse Cars
          </VBtn>
        </div>
      </VContainer>
      <div class="header-glow"></div>
    </section>

    <!-- Content Section -->
    <VContainer class="pb-12 pt-2 relative-z">
      <div v-if="isLoaded" class="reveal-fade">
        <CarsSection
          v-if="favoriteParams"
          embedded
          title=""
          subtitle=""
          :showViewAll="false"
          :params="favoriteParams"
        />
      </div>

      <div v-else class="py-12 text-center">
        <VProgressCircular indeterminate color="primary" size="48" width="4" class="mb-4" />
        <h3 class="text-body-1 opacity-50 font-weight-medium">Accessing your collection...</h3>
      </div>
    </VContainer>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: 100vh;
}

.favorites-header {
  position: relative;
  overflow: hidden;
}

.favorites-header-card {
  position: relative;
  z-index: 2;
  background: rgba(var(--v-theme-surface), 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.header-glow {
  position: absolute;
  top: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 180%;
  background: radial-gradient(circle at center, rgba(var(--v-theme-primary), 0.12) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.header-icon-badge {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: radial-gradient(circle at center, rgba(255, 77, 77, 0.22) 0%, rgba(255, 77, 77, 0.05) 100%);
  border: 1.5px solid rgba(255, 77, 77, 0.35);
  box-shadow: 0 0 20px rgba(255, 77, 77, 0.25);
}

.relative-z {
  position: relative;
  z-index: 2;
}

/* Animations */
.reveal-up {
  animation: revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.reveal-fade {
  animation: fadeIn 0.6s ease-out forwards;
}

@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem !important;
  }
}
</style>
