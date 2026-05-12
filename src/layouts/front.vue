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
        <Component :is="Component" v-model:activeSectionId="activeSectionId" />
      </RouterView>
    </main>

    <Footer />
  </div>
</template>

<style lang="scss">
.landing-page-wrapper {
  background: #090a11;
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
    radial-gradient(circle at 80% 20%, rgba(var(--v-theme-primary), 0.12) 0%, transparent 40%),
    radial-gradient(circle at 20% 80%, rgba(100, 255, 218, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: bgPulse 15s ease-in-out infinite alternate;
}

@keyframes bgPulse {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}

@media (max-width: 960px) and (min-width: 600px) {
  .landing-page-wrapper {
    .v-container {
      padding-inline: 2rem !important;
    }
  }
}
</style>
