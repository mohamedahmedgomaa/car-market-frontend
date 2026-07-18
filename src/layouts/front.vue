<script setup>
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
import { ref } from 'vue'

const activeSectionId = ref() // هنمرره للـ Navbar لو محتاج
</script>

<template>
  <div class="landing-page-wrapper">
    <div class="bg-glow"></div>
    <Navbar :active-id="activeSectionId" />

    <main style="margin-top: 90px">
      <RouterView v-slot="{ Component }">
        <!-- نخلي الصفحة تبعت للـ Layout الـ activeSectionId -->
        <Component :is="Component" v-if="Component" v-model:activeSectionId="activeSectionId" />
      </RouterView>
    </main>

    <Footer />
  </div>
</template>

<style lang="scss">
.v-theme--light .landing-page-wrapper {
  background: #ffffff !important;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
.v-theme--light .bg-glow {
  opacity: 0.12 !important; /* softer glow for light theme */
}

.v-theme--dark .landing-page-wrapper {
  background: #000000 !important; /* pure black background */
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.landing-page-wrapper {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.bg-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 85% 15%, rgba(255, 107, 0, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 15% 85%, rgba(0, 242, 255, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: bgPulse 12s ease-in-out infinite alternate;
}

@keyframes bgPulse {
  0% { opacity: 0.7; transform: scale(1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1.1) rotate(2deg); }
}

@media (max-width: 960px) and (min-width: 600px) {
  .landing-page-wrapper {
    .v-container {
      padding-inline: 2rem !important;
    }
  }
}
</style>
