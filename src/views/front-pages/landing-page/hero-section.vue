<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'

// صور السلايدر
import slide1 from '@images/front-pages/carbase2.png'
import slide2 from '@images/front-pages/carbase2.png'
import slide3 from '@images/front-pages/carbase2.png'

const theme = useTheme()
const router = useRouter()

/* =========================
   ✅ Helpers (Like Cars page)
========================= */
const toNumOrNull = (v) => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// ✅ Between helper: filter[key]=from.to   (dot separator)
const putBetween = (obj, key, from, to) => {
  const a = (from ?? '') === '' ? '' : from
  const b = (to ?? '') === '' ? '' : to
  if (a !== '' || b !== '') obj[`filter[${key}]`] = `${a}.${b}`
}

/* =========================
   ✅ Filters (Hero Form)
========================= */
const filters = ref({
  type: 'car',          // car | motorcycle
  condition: 'used',    // used | new
  brand: '',
  model: '',
  priceFrom: null,
  priceTo: null,
  yearFrom: null,
  yearTo: null,
})

const buildQuery = () => {
  const q = {}
  q['filter[status]'] = 'approved'

  if (filters.value.type) q['filter[type]'] = filters.value.type
  if (filters.value.condition) q['filter[condition]'] = filters.value.condition

  if (filters.value.brand?.trim()) q['filter[brand]'] = filters.value.brand.trim()
  if (filters.value.model?.trim()) q['filter[model]'] = filters.value.model.trim()

  // ✅ IMPORTANT: match /user/cars page format (between scopes)
  const pf = toNumOrNull(filters.value.priceFrom)
  const pt = toNumOrNull(filters.value.priceTo)
  putBetween(q, 'price_between', pf, pt)

  const yf = toNumOrNull(filters.value.yearFrom)
  const yt = toNumOrNull(filters.value.yearTo)
  putBetween(q, 'year_between', yf, yt)

  return q
}

const goSearch = () => {
  router.push({
    path: '/user/cars',
    query: buildQuery(),
  })
}

const resetFilters = () => {
  filters.value = {
    type: 'car',
    condition: 'used',
    brand: '',
    model: '',
    priceFrom: null,
    priceTo: null,
    yearFrom: null,
    yearTo: null,
  }
}

/* =========================
   ✅ Background Slider
========================= */
const slides = ref([
  { light: slide1, dark: slide1 },
  { light: slide2, dark: slide2 },
  { light: slide3, dark: slide3 },
])

const slideIndex = ref(0)
const slideDelayMs = 3000
let timer = null

const currentSlideSrc = computed(() => {
  const s = slides.value[slideIndex.value]
  return theme.current.value.dark ? s.dark : s.light
})

const nextSlide = () => {
  const len = slides.value.length || 1
  slideIndex.value = (slideIndex.value + 1) % len
}

onMounted(() => {
  timer = window.setInterval(nextSlide, slideDelayMs)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

watch(() => theme.current.value.dark, () => {})

/* =========================
   ✅ Quick cards
========================= */
const quickCards = computed(() => ([
  {
    title: 'Latest',
    subtitle: 'Newest approved listings',
    icon: 'tabler-clock',
    actionText: 'Browse',
    to: { path: '/user/cars', query: { 'filter[status]': 'approved', sort: '-created_at' } },
    chip: 'New',
  },
  {
    title: 'Top Price',
    subtitle: 'Most expensive cars',
    icon: 'tabler-currency-dollar',
    actionText: 'View',
    to: { path: '/user/cars', query: { 'filter[status]': 'approved', sort: '-price' } },
    chip: 'Hot',
  },
  {
    title: 'Most Favorited',
    subtitle: 'Loved by users',
    icon: 'tabler-heart',
    actionText: 'Explore',
    to: { path: '/user/cars', query: { 'filter[status]': 'approved', sort: '-favorites_count' } },
    chip: 'Top',
  },
]))
</script>

<template>
  <section
    id="home"
    class="hero hero--full"
    :class="theme.current.value.dark ? 'hero--dark' : 'hero--light'"
  >
    <div class="heroBg">
      <Transition name="bgfade" mode="out-in">
        <div
          :key="currentSlideSrc"
          class="heroBg__img"
          :style="{ backgroundImage: `url(${currentSlideSrc})` }"
        />
      </Transition>

      <div class="heroBg__overlay" />
      <div class="heroBg__glow" />

      <div class="heroBg__dots" v-if="slides.length > 1">
        <button
          v-for="(_, i) in slides"
          :key="i"
          class="dot"
          :class="{ active: i === slideIndex }"
          type="button"
          aria-label="Go to slide"
          @click="slideIndex = i"
        />
      </div>
    </div>

    <VContainer class="hero__container">
      <div class="heroCenter">
        <div class="heroTop">
          <div class="hero__badge">✅ Approved listings only</div>

          <h1 class="hero__title">
            Find your next <span class="hero__accent">vehicle</span>
          </h1>

          <p class="hero__subtitle">
            Choose filters, then jump to search results instantly.
          </p>
        </div>

        <!-- ✅ Filters Form -->
        <VCard class="filterCard" rounded="xl" elevation="0">
          <div class="filterCard__grid">
            <VSelect
              v-model="filters.type"
              label="Type"
              :items="[
                { title: 'Car', value: 'car' },
                { title: 'Motorcycle', value: 'motorcycle' },
              ]"
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="tabler-category"
            />

            <VSelect
              v-model="filters.condition"
              label="Condition"
              :items="[
                { title: 'Used', value: 'used' },
                { title: 'New', value: 'new' },
              ]"
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="tabler-badge"
            />

            <VTextField
              v-model="filters.brand"
              label="Brand"
              placeholder="Toyota, BMW..."
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="tabler-car"
            />

            <VTextField
              v-model="filters.model"
              label="Model"
              placeholder="Corolla, X5..."
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="tabler-settings"
            />

            <!-- Price range -->
            <div class="rangeRow">
              <div class="rangeRow__label">Price Range</div>
              <div class="rangeRow__grid">
                <VTextField
                  v-model="filters.priceFrom"
                  type="number"
                  placeholder="Min"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="tabler-currency-dollar"
                />
                <VTextField
                  v-model="filters.priceTo"
                  type="number"
                  placeholder="Max"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="tabler-currency-dollar"
                />
              </div>
            </div>

            <!-- Year range -->
            <div class="rangeRow">
              <div class="rangeRow__label">Year</div>
              <div class="rangeRow__grid">
                <VTextField
                  v-model="filters.yearFrom"
                  type="number"
                  placeholder="Min"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="tabler-calendar"
                />
                <VTextField
                  v-model="filters.yearTo"
                  type="number"
                  placeholder="Max"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="tabler-calendar"
                />
              </div>
            </div>
          </div>

          <div class="filterCard__actions">
            <VBtn color="primary" class="btnMain" @click="goSearch" prepend-icon="tabler-search">
              Search
            </VBtn>

            <VBtn variant="tonal" class="btnGhost" @click="resetFilters" prepend-icon="tabler-rotate">
              Reset
            </VBtn>

            <div class="filterCard__spacer" />

            <VBtn color="primary" variant="elevated" class="btnSmall" @click="$router.push('/user/cars')">
              Browse Cars
            </VBtn>

            <VBtn variant="tonal" class="btnSmall" @click="$router.push('/seller/register')">
              Sell Your Car
            </VBtn>
          </div>
        </VCard>

        <!-- ✅ QUICK CARDS -->
        <div class="quickInHero">
          <VCard
            v-for="c in quickCards"
            :key="c.title"
            class="quickInHero__card"
            rounded="xl"
            elevation="0"
            @click="$router.push(c.to)"
          >
            <div class="qTop">
              <div class="qIcon">
                <VIcon :icon="c.icon" size="18" />
              </div>
              <span class="qChip">{{ c.chip }}</span>
            </div>

            <div class="qBody">
              <div class="qTitle">{{ c.title }}</div>
              <div class="qSub">{{ c.subtitle }}</div>
            </div>

            <div class="qFoot">
              <span class="qAction">{{ c.actionText }}</span>
              <VIcon icon="tabler-arrow-right" size="16" />
            </div>
          </VCard>
        </div>
      </div>
    </VContainer>
  </section>
</template>

<style scoped lang="scss">
/* (نفس الـ CSS بتاعك زي ما هو بدون تغيير) */
.hero{ border-radius: 0 0 50px 50px; overflow: hidden; position: relative; }
.hero__container{ padding-top: 42px; padding-bottom: 42px; position: relative; z-index: 2; }
.hero--dark{ background-color:#25293c; }
.hero--light{ background: linear-gradient(138.18deg, #eae8fd 0%, #fce5e6 94.44%); }

.heroBg{ position:absolute; inset:0; z-index: 1; }
.heroBg__img{ position:absolute; inset:0; background-size: cover; background-position: center; transform: scale(1.04); filter: saturate(1.05) contrast(1.05); }
.heroBg__overlay{
  position:absolute; inset:0;
  background:
    linear-gradient(90deg, rgba(10,12,22,.78), rgba(10,12,22,.55) 45%, rgba(10,12,22,.62)),
    radial-gradient(circle at 15% 25%, rgba(90,74,255,.30), transparent 55%),
    radial-gradient(circle at 85% 70%, rgba(40,199,111,.16), transparent 55%);
  backdrop-filter: blur(6px);
}
.heroBg__glow{
  position:absolute; inset:-40px; pointer-events:none;
  background:
    radial-gradient(circle at 20% 15%, rgba(90,74,255,.18), transparent 45%),
    radial-gradient(circle at 70% 85%, rgba(255,55,57,.12), transparent 50%);
}
.heroBg__dots{
  position:absolute; left: 50%; bottom: 18px; transform: translateX(-50%);
  display:flex; gap:8px; padding: 8px 10px; border-radius: 999px;
  background: rgba(0,0,0,.22); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.10);
}
.dot{ width: 8px; height: 8px; border-radius: 999px; border: 0; cursor: pointer; opacity: .55; background: #fff; }
.dot.active{ opacity: 1; }
.bgfade-enter-active, .bgfade-leave-active{ transition: opacity .45s ease; }
.bgfade-enter-from, .bgfade-leave-to{ opacity: 0; }

.heroCenter{ max-width: 980px; margin-inline: auto; }
.heroTop{ max-width: 720px; }
.hero__badge{
  display:inline-flex; align-items:center; padding: 6px 12px; border-radius: 999px;
  font-weight: 800; font-size: 13px; margin-bottom: 12px;
  background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.10);
}
.hero__title{ font-size: 40px; line-height: 46px; font-weight: 950; margin: 0; }
.hero__accent{
  background: linear-gradient(135deg, #28c76f 0%, #5a4aff 47.92%, #ff3739 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.hero__subtitle{ margin-top: 10px; opacity: .82; max-width: 560px; }

.filterCard{
  margin-top: 18px; padding: 16px; border-radius: 24px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(14px); box-shadow: 0 18px 60px rgba(0,0,0,.22);
}
.filterCard__grid{ display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.rangeRow{
  grid-column: span 2; padding: 10px; border-radius: 16px;
  background: rgba(0,0,0,.14); border: 1px solid rgba(255,255,255,.10);
}
.rangeRow__label{ font-size: 12px; font-weight: 900; opacity: .78; margin-bottom: 8px; }
.rangeRow__grid{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }

:deep(.v-field){ border-radius: 14px; background: rgba(0,0,0,.16); }
:deep(.v-field__outline){ opacity: .35; }
:deep(.v-field:hover .v-field__outline){ opacity: .55; }
:deep(.v-label){ opacity: .82; font-weight: 800; }

.filterCard__actions{ margin-top: 14px; display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
.filterCard__spacer{ flex: 1; }
.btnMain, .btnGhost{ height: 44px; border-radius: 14px; padding-inline: 16px; }
.btnSmall{ height: 44px; border-radius: 14px; padding-inline: 14px; }

.quickInHero{ margin-top: 14px; display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.quickInHero__card{
  cursor:pointer; padding: 14px; border-radius: 18px;
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.10);
  backdrop-filter: blur(12px);
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
}
.quickInHero__card:hover{
  transform: translateY(-2px);
  background: rgba(255,255,255,.10);
  border-color: rgba(255,255,255,.16);
}
.qTop{ display:flex; align-items:center; justify-content:space-between; gap: 10px; }
.qIcon{
  width: 34px; height: 34px; border-radius: 12px;
  display:flex; align-items:center; justify-content:center;
  background: rgba(0,0,0,.18); border: 1px solid rgba(255,255,255,.10);
}
.qChip{
  font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 999px;
  background: rgba(0,0,0,.18); border: 1px solid rgba(255,255,255,.10); opacity: .95;
}
.qBody{ margin-top: 12px; }
.qTitle{ font-weight: 950; font-size: 15px; }
.qSub{ margin-top: 4px; font-size: 12.5px; opacity: .78; line-height: 1.5; }
.qFoot{ margin-top: 12px; display:flex; align-items:center; justify-content:space-between; opacity: .9; }
.qAction{ font-weight: 900; font-size: 12.5px; }

@media (max-width: 1100px){
  .filterCard__grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rangeRow{ grid-column: span 2; }
  .quickInHero{ grid-template-columns: 1fr; }
}
@media (max-width: 640px){
  .hero__title{ font-size: 32px; line-height: 38px; }
  .filterCard__grid{ grid-template-columns: 1fr; }
  .rangeRow{ grid-column: span 1; }
  .rangeRow__grid{ grid-template-columns: 1fr; }
  .filterCard__spacer{ display:none; }
}
</style>
