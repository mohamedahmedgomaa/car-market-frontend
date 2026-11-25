<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompareStore } from '@/stores/compare'
import { translateText } from '@/utils/brandTranslations.js'
import logoDark from '@images/logo/logo-dark.png'
import logoLight from '@images/logo/logo-light.png'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const compareStore = useCompareStore()
const siteLogo = useGenerateImageVariant(logoDark, logoLight)
const API_BASE = import.meta.env.VITE_BASE_URL

const isComparePage = computed(() => route.path === '/user/compare')
const isAr = computed(() => (locale.value || 'ar') === 'ar')

const _t = (val, parentObj = null) => translateText(val, locale.value || 'ar', parentObj)

const buildImg = (path) => {
  if (!path) return siteLogo.value
  const clean = String(path).replaceAll('\\', '/')
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean
  if (!API_BASE) return clean
  return `${API_BASE.replace(/\/$/, '')}/${clean.replace(/^\//, '')}`
}

const formatPrice = (price) => {
  const n = Number(price)
  if (Number.isNaN(n)) return price ?? '—'
  return n.toLocaleString()
}

const baseCar = computed(() => compareStore.cars[0] || null)

const modeInstruction = computed(() => {
  if (typeof compareStore.replacingIndex === 'number') {
    const slotNum = compareStore.replacingIndex + 1
    return isAr.value
      ? `اختر البديل للمركبة رقم ${slotNum} من أي صفحة بالموقع`
      : `Pick a replacement for Vehicle #${slotNum} anywhere on the site`
  }

  const slotNum = compareStore.targetSlotNumber
  const baseName = baseCar.value ? _t(baseCar.value.title, baseCar.value) : ''
  if (slotNum === 2 && baseName) {
    return isAr.value
      ? `اختر المركبة الثانية للمقارنة مع "${baseName}"`
      : `Pick the 2nd vehicle to compare with "${baseName}"`
  }

  return isAr.value
    ? `اختر المركبة رقم ${slotNum} لإضافتها للمقارنة`
    : `Pick Vehicle #${slotNum} to add to comparison`
})

const goToCompare = () => {
  if (!compareStore.canCompare) return
  compareStore.cancelCompareMode()
  router.push(compareStore.compareRoute)
}

const resumeCompareMode = () => {
  if (compareStore.cars.length === 1) {
    const targetRoute = compareStore.enterAddCarMode()
    if (targetRoute) router.push(targetRoute)
  } else if (compareStore.canCompare) {
    router.push(compareStore.compareRoute)
  }
}

const handleCancelMode = () => {
  const hadMultiple = compareStore.canCompare
  compareStore.cancelCompareMode()
  if (hadMultiple) {
    router.push(compareStore.compareRoute)
  }
}
</script>

<template>
  <template v-if="!isComparePage">
    <!-- Always-Fixed Large Bottom Compare Dock when Compare Mode is Active -->
    <Transition name="dock-slide">
      <div v-if="compareStore.isCompareMode" class="compare-dock-wrap">
        <div class="compare-dock">
          <!-- Dock Header Row -->
          <div class="compare-dock__header">
            <div class="d-flex align-center gap-3 flex-wrap min-w-0">
              <span class="dock-mode-badge">
                <span class="dock-pulse" />
                <VIcon icon="tabler-swords" size="15" />
                <span>{{ isAr ? 'وضع المقارنة نشط' : 'COMPARE MODE' }}</span>
              </span>
              <span class="dock-instruction text-truncate">
                {{ modeInstruction }}
              </span>
            </div>

            <div class="d-flex align-center gap-2 flex-shrink-0">
              <VBtn
                v-if="compareStore.canCompare"
                color="info"
                variant="elevated"
                rounded="pill"
                size="small"
                class="font-weight-bold px-5"
                prepend-icon="tabler-arrows-diff"
                @click="goToCompare"
              >
                {{ isAr ? `عرض المقارنة (${compareStore.count})` : `Compare Now (${compareStore.count})` }}
              </VBtn>

              <VBtn
                variant="tonal"
                color="error"
                rounded="pill"
                size="small"
                prepend-icon="tabler-x"
                class="font-weight-bold px-4"
                @click="handleCancelMode"
              >
                {{ compareStore.canCompare ? (isAr ? 'العودة للمقارنة' : 'Back to Compare') : (isAr ? 'خروج من المقارنة' : 'Exit Compare') }}
              </VBtn>
            </div>
          </div>

          <!-- Dock Slots Row -->
          <div class="compare-dock__slots">
            <template v-for="slotIdx in compareStore.maxCars" :key="slotIdx">
              <div
                class="compare-slot"
                :class="{
                  'compare-slot--filled': !!compareStore.cars[slotIdx - 1],
                  'compare-slot--target': (typeof compareStore.replacingIndex === 'number' ? compareStore.replacingIndex === (slotIdx - 1) : slotIdx === compareStore.cars.length + 1),
                }"
              >
                <template v-if="compareStore.cars[slotIdx - 1]">
                  <img
                    :src="buildImg(compareStore.cars[slotIdx - 1].image)"
                    :alt="_t(compareStore.cars[slotIdx - 1].title)"
                    class="compare-slot__img"
                  />
                  <div class="compare-slot__meta">
                    <div class="compare-slot__badge">
                      {{ slotIdx === 1 ? (isAr ? 'الأساسية #1' : 'BASE #1') : (isAr ? `المركبة #${slotIdx}` : `VEHICLE #${slotIdx}`) }}
                    </div>
                    <div class="compare-slot__title text-truncate">
                      {{ _t(compareStore.cars[slotIdx - 1].title, compareStore.cars[slotIdx - 1]) }}
                    </div>
                    <div class="compare-slot__price">
                      {{ formatPrice(compareStore.cars[slotIdx - 1].price) }}
                      <span>{{ compareStore.cars[slotIdx - 1].currency || 'EGP' }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="compare-slot__remove"
                    :aria-label="isAr ? 'إزالة' : 'Remove'"
                    @click="compareStore.removeCar(compareStore.cars[slotIdx - 1].id)"
                  >
                    <VIcon icon="tabler-x" size="15" />
                  </button>
                </template>

                <template v-else>
                  <div class="compare-slot__empty">
                    <div class="compare-slot__empty-icon">
                      <VIcon :icon="slotIdx === compareStore.cars.length + 1 ? 'tabler-hand-click' : 'tabler-plus'" size="18" />
                    </div>
                    <div class="compare-slot__empty-text">
                      <div class="compare-slot__empty-title">
                        {{
                          slotIdx === compareStore.cars.length + 1
                            ? (isAr ? `اختر المركبة #${slotIdx}` : `Pick Vehicle #${slotIdx}`)
                            : (isAr ? `خانة إضافية #${slotIdx}` : `Optional Slot #${slotIdx}`)
                        }}
                      </div>
                      <div v-if="slotIdx === compareStore.cars.length + 1" class="compare-slot__empty-sub d-none d-sm-block">
                        {{ isAr ? 'اضغط على أي كارت سيارة بالصفحة' : 'Click any vehicle card above' }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- VS Divider between Slot 1 and Slot 2 -->
              <div v-if="slotIdx === 1" class="dock-vs-chip d-none d-md-flex">
                VS
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Compact Mini Pill when Compare has items in background -->
    <div v-if="!compareStore.isCompareMode && compareStore.count > 0" class="compare-mini-pill">
      <button
        type="button"
        class="compare-mini-pill__main"
        @click="resumeCompareMode"
      >
        <VIcon icon="tabler-arrows-diff" size="18" class="text-info" />
        <span class="font-weight-bold">
          {{
            compareStore.canCompare
              ? (isAr ? `عرض المقارنة (${compareStore.count})` : `View Compare (${compareStore.count})`)
              : (isAr ? 'أكمل اختيار السيارة الثانية' : 'Pick 2nd Car to Compare')
          }}
        </span>
      </button>
      <button
        type="button"
        class="compare-mini-pill__close"
        :aria-label="isAr ? 'مسح المقارنة' : 'Clear comparison'"
        @click="compareStore.clearAll()"
      >
        <VIcon icon="tabler-x" size="14" />
      </button>
    </div>
  </template>
</template>

<style lang="scss" scoped>
.dock-slide-enter-active,
.dock-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.dock-slide-enter-from,
.dock-slide-leave-to {
  transform: translateY(28px);
  opacity: 0;
}

.compare-dock-wrap {
  position: fixed;
  bottom: 14px;
  left: 0;
  right: 0;
  z-index: 1100;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;

  @media (max-width: 600px) {
    bottom: 10px;
    padding: 0 10px;
  }
}

.compare-dock {
  pointer-events: auto;
  width: 100%;
  max-width: 1160px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(7, 22, 42, 0.96), rgba(10, 30, 56, 0.95));
  color: #fff;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border: 2px solid rgba(56, 189, 248, 0.6);
  box-shadow:
    0 22px 60px rgba(2, 6, 23, 0.68),
    0 0 0 4px rgba(14, 165, 233, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);

  @media (max-width: 600px) {
    padding: 10px 12px;
    gap: 8px;
    border-radius: 18px;
  }
}

.compare-dock__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dock-mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0284c7, #06b6d4);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.45);
}

.dock-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fde047;
  animation: dockPulse 1.4s infinite;
}

@keyframes dockPulse {
  0% { box-shadow: 0 0 0 0 rgba(253, 224, 71, 0.9); }
  70% { box-shadow: 0 0 0 8px rgba(253, 224, 71, 0); }
  100% { box-shadow: 0 0 0 0 rgba(253, 224, 71, 0); }
}

.dock-instruction {
  font-size: 0.92rem;
  font-weight: 700;
  color: #e2e8f0;

  @media (max-width: 600px) {
    font-size: 0.8rem;
  }
}

.compare-dock__slots {
  display: flex;
  align-items: stretch;
  gap: 12px;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
}

.dock-vs-chip {
  width: 42px;
  min-width: 42px;
  height: 42px;
  align-self: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #ff6b00);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 950;
  font-style: italic;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.45);
}

.compare-slot {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px dashed rgba(255, 255, 255, 0.25);
  transition: all 0.2s ease;
  overflow: hidden;

  &--filled {
    border-style: solid;
    border-color: rgba(56, 189, 248, 0.65);
    background: rgba(14, 165, 233, 0.16);
    box-shadow: inset 0 0 20px rgba(14, 165, 233, 0.14);
  }

  &--target {
    border: 2px dashed #38bdf8;
    background: rgba(14, 165, 233, 0.14);
    box-shadow: inset 0 0 22px rgba(56, 189, 248, 0.22);
    animation: slotPulse 2s ease-in-out infinite;
  }

  @media (max-width: 600px) {
    min-height: 54px;
    padding: 6px 8px;
    gap: 6px;
    border-radius: 12px;
  }
}

@keyframes slotPulse {
  0%, 100% { border-color: rgba(56, 189, 248, 0.55); }
  50% { border-color: rgba(125, 211, 252, 1); }
}

.compare-slot__img {
  width: 72px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);

  @media (max-width: 600px) {
    width: 36px;
    height: 30px;
    border-radius: 7px;
  }
}

.compare-slot__meta {
  min-width: 0;
  flex: 1;
}

.compare-slot__badge {
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #38bdf8;
  margin-bottom: 1px;

  @media (max-width: 600px) {
    display: none;
  }
}

.compare-slot__title {
  font-size: 0.9rem;
  font-weight: 800;
  color: #f8fafc;

  @media (max-width: 600px) {
    font-size: 0.72rem;
  }
}

.compare-slot__price {
  font-size: 0.84rem;
  font-weight: 800;
  color: #fbbf24;

  @media (max-width: 600px) {
    font-size: 0.68rem;
  }
}

.compare-slot__remove {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.9);
  }
}

.compare-slot__empty {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(226, 232, 240, 0.85);
}

.compare-slot__empty-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(56, 189, 248, 0.16);
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 24px;
    height: 24px;
    border-radius: 7px;
  }
}

.compare-slot__empty-text {
  min-width: 0;
}

.compare-slot__empty-title {
  font-size: 0.86rem;
  font-weight: 800;

  @media (max-width: 600px) {
    font-size: 0.68rem;
  }
}

.compare-slot__empty-sub {
  font-size: 0.72rem;
  color: #94a3b8;
}

.compare-slot--target .compare-slot__empty-title {
  color: #7dd3fc;
}

.compare-mini-pill {
  position: fixed;
  bottom: 20px;
  inset-inline-end: 20px;
  z-index: 1050;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  border: 1.5px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(12px);
}

.compare-mini-pill__main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.compare-mini-pill__close {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(239, 68, 68, 0.85);
  }
}
</style>
