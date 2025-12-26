<script setup>
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
import { ref } from 'vue'

const activeSectionId = ref() // هنمرره للـ Navbar لو محتاج
</script>

<template>
  <div class="landing-page-wrapper">
    <Navbar :active-id="activeSectionId" />

    <main style="margin-top: 90px;">
      <RouterView v-slot="{ Component }">
        <!-- نخلي الصفحة تبعت للـ Layout الـ activeSectionId -->
        <Component :is="Component" v-model:activeSectionId="activeSectionId" />
      </RouterView>
    </main>

    <Footer />
  </div>
</template>

<style lang="scss">
@media (max-width: 960px) and (min-width: 600px) {
  .landing-page-wrapper {
    .v-container {
      padding-inline: 2rem !important;
    }
  }
}
</style>
