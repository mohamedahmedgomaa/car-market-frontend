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
  background: linear-gradient(180deg, #F1F3F7 0%, #E8ECF2 100%) !important;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
.v-theme--light .bg-glow {
  opacity: 0.18 !important;
  background: 
    radial-gradient(circle at 85% 15%, rgba(255, 107, 0, 0.15) 0%, transparent 45%),
    radial-gradient(circle at 15% 85%, rgba(148, 163, 184, 0.3) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(203, 213, 225, 0.25) 0%, transparent 70%);
}

.v-theme--dark .landing-page-wrapper {
  background: #000000 !important;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
.v-theme--dark .bg-glow {
  opacity: 0.45 !important;
  background: 
    radial-gradient(circle at 85% 15%, rgba(255, 107, 0, 0.15) 0%, transparent 45%),
    radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.04) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(39, 39, 42, 0.25) 0%, transparent 70%);
}

.landing-page-wrapper {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;

  .v-container {
    max-width: 1340px !important;
  }
}

.bg-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  animation: bgPulse 12s ease-in-out infinite alternate;
}

@keyframes bgPulse {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.08) rotate(2deg); }
}

@media (max-width: 960px) and (min-width: 600px) {
  .landing-page-wrapper {
    .v-container {
      padding-inline: 2rem !important;
    }
  }
}
</style>
