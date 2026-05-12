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
    <!-- Header Section -->
    <section class="favorites-header py-16">
      <VContainer>
        <div class="text-center mb-12 reveal-up">
          <div class="d-flex align-center justify-center mb-4">
            <div class="header-icon-wrapper">
              <VIcon icon="tabler-heart-filled" color="error" size="32" />
            </div>
          </div>
          <h1 class="text-h2 font-weight-black text-white mb-4">
            My <span class="text-primary-gradient">Favorites</span>
          </h1>
          <p class="text-h6 opacity-70 max-w-600 mx-auto">
            All the vehicles you've saved for later. Keep track of your dream cars in one place.
          </p>
        </div>
      </VContainer>
      <div class="header-glow"></div>
    </section>

    <!-- Content Section -->
    <VContainer class="pb-16 mt-n8 relative-z">
      <div v-if="isLoaded" class="reveal-fade">
        <CarsSection
          v-if="favoriteParams"
          embedded
          :showViewAll="false"
          :params="favoriteParams"
          subtitle=""
        />
        
        <div class="text-center mt-12">
          <VBtn
            variant="tonal"
            color="primary"
            prepend-icon="tabler-search"
            to="/user/cars"
            class="px-8"
            rounded="xl"
          >
            Browse More Cars
          </VBtn>
        </div>
      </div>

      <div v-else class="py-16 text-center">
        <VProgressCircular indeterminate color="primary" size="64" width="6" class="mb-6" />
        <h3 class="text-h5 opacity-50 font-weight-medium">Accessing your collection...</h3>
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
  background: radial-gradient(circle at center, rgba(var(--v-theme-primary), 0.08) 0%, transparent 70%);
}

.header-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(var(--v-theme-primary), 0.1) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.header-icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(var(--v-theme-error), 0.1);
  border: 1px solid rgba(var(--v-theme-error), 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.text-primary-gradient {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 1), #64ffda);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.max-w-600 {
  max-width: 600px;
}

.relative-z {
  position: relative;
  z-index: 2;
}

/* Animations */
.reveal-up {
  animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.reveal-fade {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(30px);
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
  .text-h2 {
    font-size: 2.5rem !important;
  }
}
</style>
