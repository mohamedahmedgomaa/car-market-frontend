<script setup>
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
import CompareModeArena from '@/components/compare/CompareModeArena.vue'
import CompareModeDock from '@/components/compare/CompareModeDock.vue'
import { useCompareStore } from '@/stores/compare'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const activeSectionId = ref() // هنمرره للـ Navbar لو محتاج
const compareStore = useCompareStore()
const route = useRoute()

const isCompareModeLayout = computed(() => compareStore.isCompareMode && route.path !== '/user/compare')
</script>

<template>
  <div class="landing-page-wrapper" :class="{ 'is-compare-mode': isCompareModeLayout }">
    <div class="bg-pattern" aria-hidden="true"></div>
    <div class="bg-glow"></div>
    <Navbar :active-id="activeSectionId" />

    <main style="margin-top: 84px">
      <CompareModeArena />
      <RouterView v-slot="{ Component }">
        <!-- نخلي الصفحة تبعت للـ Layout الـ activeSectionId -->
        <Component :is="Component" v-if="Component" v-model:activeSectionId="activeSectionId" />
      </RouterView>
    </main>

    <CompareModeDock />
    <Footer />
  </div>
</template>

<style lang="scss">
main {
  margin-top: 84px;
  @media (max-width: 600px) {
    margin-top: 66px !important;
  }
}

.v-theme--light .landing-page-wrapper {
  background: linear-gradient(180deg, #F1F3F7 0%, #E8ECF2 100%) !important;
  min-height: 100vh;
  position: relative;
  overflow-x: clip;
}
.v-theme--light .bg-glow {
  opacity: 0.18 !important;
  background:
    radial-gradient(circle at 85% 15%, rgba(255, 107, 0, 0.15) 0%, transparent 45%),
    radial-gradient(circle at 15% 85%, rgba(148, 163, 184, 0.3) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(203, 213, 225, 0.25) 0%, transparent 70%);
}

.v-theme--dark .landing-page-wrapper {
  background: #0b0d14 !important;
  min-height: 100vh;
  position: relative;
  overflow-x: clip;
}
.v-theme--dark .bg-glow {
  opacity: 0.2 !important;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 107, 0, 0.06) 0%, transparent 60%),
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
}

/* ✅ Brand-derived Theme #1: Sunset Ivory (Warm Orange-tinted Light) */
.v-theme--amberLight .landing-page-wrapper {
  background-color: #fbf3eb !important;
  background-image: linear-gradient(180deg, #fef8f3 0%, #f6eae0 55%, #fbf3eb 100%) !important;
}
.v-theme--amberLight .bg-glow {
  opacity: 0.36 !important;
  background:
    radial-gradient(circle at 85% 12%, rgba(255, 107, 0, 0.2) 0%, transparent 45%),
    radial-gradient(circle at 15% 80%, rgba(255, 168, 0, 0.16) 0%, transparent 48%),
    radial-gradient(circle at 50% 45%, rgba(255, 214, 179, 0.24) 0%, transparent 65%) !important;
}

/* ✅ Brand-derived Theme #2: Ember Dark (Deepest Obsidian-Crimson) */
.v-theme--emberDark .landing-page-wrapper {
  background-color: #090504 !important;
  background-image:
    repeating-linear-gradient(-45deg, rgba(255, 107, 0, 0.018) 0px, rgba(255, 107, 0, 0.018) 1px, transparent 1px, transparent 14px),
    linear-gradient(180deg, #090504 0%, #0E0706 50%, #070403 100%) !important;
  background-attachment: fixed, fixed !important;
}
.v-theme--emberDark .bg-glow {
  opacity: 0.28 !important;
  background:
    radial-gradient(circle at 20% 10%, rgba(255, 107, 0, 0.14) 0%, transparent 48%),
    radial-gradient(circle at 82% 22%, rgba(255, 62, 29, 0.1) 0%, transparent 46%),
    radial-gradient(circle at 50% 85%, rgba(255, 130, 40, 0.07) 0%, transparent 52%) !important;
}

.landing-page-wrapper {
  min-height: 100vh;
  position: relative;
  overflow-x: clip;

  .v-container {
    max-width: 1340px !important;
  }
}

/* ✅ Subtle Static Automotive Icons Background Pattern */
.bg-pattern {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.02;
  background-color: #94a3b8;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='translate(18,18) rotate(-8 24 14)'%3E%3Cpath d='M5 18h3l3-7h18l5 7h5a3 3 0 0 1 3 3v4h-5'/%3E%3Cpath d='M13 25h16'/%3E%3Ccircle cx='11' cy='25' r='3.5'/%3E%3Ccircle cx='33' cy='25' r='3.5'/%3E%3Cpath d='M2 18v5a2 2 0 0 0 2 2h3'/%3E%3C/g%3E%3Cg transform='translate(142,20) rotate(10 18 18)'%3E%3Cpath d='M6 25a15 15 0 1 1 24 0'/%3E%3Ccircle cx='18' cy='18' r='2.5'/%3E%3Cpath d='M18 18l7-6'/%3E%3Cpath d='M18 6v2M9 10l1.5 1.5M27 10l-1.5 1.5'/%3E%3C/g%3E%3Cg transform='translate(78,86) rotate(-12 18 18)'%3E%3Ccircle cx='18' cy='18' r='13'/%3E%3Ccircle cx='18' cy='18' r='3.5'/%3E%3Cpath d='M6 16h8.5M21.5 16H30M18 21.5V31'/%3E%3C/g%3E%3Cg transform='translate(186,92) rotate(14 18 18)'%3E%3Ccircle cx='18' cy='18' r='13'/%3E%3Ccircle cx='18' cy='18' r='7.5'/%3E%3Ccircle cx='18' cy='18' r='2'/%3E%3Cpath d='M18 10.5v5.5M18 20v5.5M10.5 18h5.5M20 18h5.5'/%3E%3C/g%3E%3Cg transform='translate(24,158) rotate(8 16 16)'%3E%3Crect x='4' y='4' width='24' height='24' rx='6'/%3E%3Cpath d='M10 10v12M16 10v12M22 10v7M10 16h12'/%3E%3C/g%3E%3Cg transform='translate(132,160) rotate(-14 18 14)'%3E%3Crect x='3' y='7' width='15' height='12' rx='4'/%3E%3Ccircle cx='8.5' cy='13' r='1.8'/%3E%3Cpath d='M18 13h13v4M26 13v3'/%3E%3C/g%3E%3Cg transform='translate(192,190) rotate(6 14 14)'%3E%3Cpath d='M15 3L7 16h7l-2 9 9-13h-7l1-9z'/%3E%3C/g%3E%3Cg transform='translate(80,192) rotate(-6 16 16)'%3E%3Cpath d='M5 24h20l3-6H8l-3 6z'/%3E%3Cpath d='M10 18l3-7h10l3 7'/%3E%3Ccircle cx='11' cy='24' r='2'/%3E%3Ccircle cx='23' cy='24' r='2'/%3E%3C/g%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='translate(18,18) rotate(-8 24 14)'%3E%3Cpath d='M5 18h3l3-7h18l5 7h5a3 3 0 0 1 3 3v4h-5'/%3E%3Cpath d='M13 25h16'/%3E%3Ccircle cx='11' cy='25' r='3.5'/%3E%3Ccircle cx='33' cy='25' r='3.5'/%3E%3Cpath d='M2 18v5a2 2 0 0 0 2 2h3'/%3E%3C/g%3E%3Cg transform='translate(142,20) rotate(10 18 18)'%3E%3Cpath d='M6 25a15 15 0 1 1 24 0'/%3E%3Ccircle cx='18' cy='18' r='2.5'/%3E%3Cpath d='M18 18l7-6'/%3E%3Cpath d='M18 6v2M9 10l1.5 1.5M27 10l-1.5 1.5'/%3E%3C/g%3E%3Cg transform='translate(78,86) rotate(-12 18 18)'%3E%3Ccircle cx='18' cy='18' r='13'/%3E%3Ccircle cx='18' cy='18' r='3.5'/%3E%3Cpath d='M6 16h8.5M21.5 16H30M18 21.5V31'/%3E%3C/g%3E%3Cg transform='translate(186,92) rotate(14 18 18)'%3E%3Ccircle cx='18' cy='18' r='13'/%3E%3Ccircle cx='18' cy='18' r='7.5'/%3E%3Ccircle cx='18' cy='18' r='2'/%3E%3Cpath d='M18 10.5v5.5M18 20v5.5M10.5 18h5.5M20 18h5.5'/%3E%3C/g%3E%3Cg transform='translate(24,158) rotate(8 16 16)'%3E%3Crect x='4' y='4' width='24' height='24' rx='6'/%3E%3Cpath d='M10 10v12M16 10v12M22 10v7M10 16h12'/%3E%3C/g%3E%3Cg transform='translate(132,160) rotate(-14 18 14)'%3E%3Crect x='3' y='7' width='15' height='12' rx='4'/%3E%3Ccircle cx='8.5' cy='13' r='1.8'/%3E%3Cpath d='M18 13h13v4M26 13v3'/%3E%3C/g%3E%3Cg transform='translate(192,190) rotate(6 14 14)'%3E%3Cpath d='M15 3L7 16h7l-2 9 9-13h-7l1-9z'/%3E%3C/g%3E%3Cg transform='translate(80,192) rotate(-6 16 16)'%3E%3Cpath d='M5 24h20l3-6H8l-3 6z'/%3E%3Cpath d='M10 18l3-7h10l3 7'/%3E%3Ccircle cx='11' cy='24' r='2'/%3E%3Ccircle cx='23' cy='24' r='2'/%3E%3C/g%3E%3C/svg%3E");
  -webkit-mask-size: 240px 240px;
  mask-size: 240px 240px;
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;
}

.v-theme--light .bg-pattern {
  background-color: #475569;
  opacity: 0.022;
}

.v-theme--dark .bg-pattern {
  background-color: #cbd5e1;
  opacity: 0.02;
}

.v-theme--amberLight .bg-pattern {
  background-color: #e05500;
  opacity: 0.028;
}

.v-theme--emberDark .bg-pattern {
  background-color: #ff8a4c;
  opacity: 0.025;
}

.landing-page-wrapper.is-compare-mode .bg-pattern {
  background-color: #38bdf8 !important;
  opacity: 0.032 !important;
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

@media (max-width: 600px) {
  .landing-page-wrapper {
    .v-container {
      padding-inline: 12px !important;
    }
  }
}

/* ✅ Distinct visual ambiance when Compare Selection Mode is active (respecting Dark & Light themes) */
.v-theme--dark .landing-page-wrapper.is-compare-mode {
  padding-bottom: 165px;
  background-color: #061322 !important;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, #061322 0%, #091d34 55%, #050f1c 100%) !important;
  background-size: 38px 38px, 38px 38px, 100% 100% !important;
  box-shadow: inset 0 0 0 2.5px rgba(56, 189, 248, 0.55);
}

.v-theme--dark .landing-page-wrapper.is-compare-mode .bg-glow {
  opacity: 0.55 !important;
  background:
    radial-gradient(circle at 18% 12%, rgba(14, 165, 233, 0.34) 0%, transparent 48%),
    radial-gradient(circle at 82% 25%, rgba(6, 182, 212, 0.24) 0%, transparent 45%),
    radial-gradient(circle at 50% 88%, rgba(255, 107, 0, 0.12) 0%, transparent 52%) !important;
}

.v-theme--light .landing-page-wrapper.is-compare-mode {
  padding-bottom: 165px;
  background-color: #e4f2fe !important;
  background-image:
    linear-gradient(rgba(14, 165, 233, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.07) 1px, transparent 1px),
    linear-gradient(180deg, #e4f2fe 0%, #d8ecfc 55%, #eaf5ff 100%) !important;
  background-size: 38px 38px, 38px 38px, 100% 100% !important;
  box-shadow: inset 0 0 0 2.5px rgba(14, 165, 233, 0.45);
}

.v-theme--light .landing-page-wrapper.is-compare-mode .bg-glow {
  opacity: 0.4 !important;
  background:
    radial-gradient(circle at 18% 12%, rgba(14, 165, 233, 0.24) 0%, transparent 48%),
    radial-gradient(circle at 82% 75%, rgba(6, 182, 212, 0.2) 0%, transparent 45%) !important;
}
</style>
