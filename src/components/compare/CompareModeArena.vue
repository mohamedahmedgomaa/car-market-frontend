<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompareStore } from '@/stores/compare'
import { translateText } from '@/utils/brandTranslations.js'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const compareStore = useCompareStore()

const isAr = computed(() => (locale.value || 'ar') === 'ar')
const isVisible = computed(() => compareStore.isCompareMode && route.path !== '/user/compare')
const _t = (val, parentObj = null) => translateText(val, locale.value || 'ar', parentObj)

const baseCar = computed(() => compareStore.cars[0] || null)

const headlineText = computed(() => {
  if (typeof compareStore.replacingIndex === 'number') {
    const slotNum = compareStore.replacingIndex + 1
    return isAr.value
      ? `اختر البديل للمركبة رقم ${slotNum} من القائمة بالأسفل`
      : `Pick a replacement for Vehicle #${slotNum} from the listings below`
  }

  const baseName = baseCar.value ? _t(baseCar.value.title, baseCar.value) : ''
  if (compareStore.cars.length === 2) {
    return isAr.value
      ? 'اختر المركبة الثالثة بالأسفل أو اضغط عرض المقارنة'
      : 'Pick a 3rd challenger below, or click Compare Now'
  }

  return isAr.value
    ? `تصفح السيارات بالأسفل واضغط على أي سيارة لمقارنتها مع "${baseName}"`
    : `Browse freely below and click any car to compare with "${baseName}"`
})

const handleExit = () => {
  const hadMultiple = compareStore.canCompare
  compareStore.cancelCompareMode()
  if (hadMultiple) {
    router.push(compareStore.compareRoute)
  }
}
</script>

<template>
  <section v-if="isVisible" class="compare-top-strip">
    <VContainer class="py-2">
      <div class="compare-top-strip__bar">
        <div class="d-flex align-center gap-3 flex-wrap min-w-0">
          <span class="strip-badge">
            <span class="strip-pulse" />
            <VIcon icon="tabler-swords" size="14" />
            <span>{{ isAr ? 'وضع المقارنة' : 'COMPARE MODE' }}</span>
          </span>

          <span class="strip-text text-truncate">
            {{ headlineText }}
          </span>
        </div>

        <VBtn
          size="x-small"
          variant="tonal"
          color="error"
          rounded="pill"
          prepend-icon="tabler-x"
          class="font-weight-bold flex-shrink-0"
          @click="handleExit"
        >
          {{ compareStore.canCompare ? (isAr ? 'رجوع' : 'Back') : (isAr ? 'خروج' : 'Exit') }}
        </VBtn>
      </div>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.compare-top-strip {
  position: relative;
  z-index: 10;
}

.compare-top-strip__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 16px;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.2), rgba(6, 182, 212, 0.14), rgba(14, 165, 233, 0.2));
  border: 1.5px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 8px 26px rgba(14, 165, 233, 0.18);
  backdrop-filter: blur(12px);
}

.strip-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0284c7, #06b6d4);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.strip-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fde047;
  animation: stripPulse 1.4s infinite;
}

@keyframes stripPulse {
  0% { box-shadow: 0 0 0 0 rgba(253, 224, 71, 0.9); }
  70% { box-shadow: 0 0 0 7px rgba(253, 224, 71, 0); }
  100% { box-shadow: 0 0 0 0 rgba(253, 224, 71, 0); }
}

.strip-text {
  font-size: 0.88rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}
</style>
