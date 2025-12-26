<script setup>
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant'

import heroImgDark from '@images/front-pages/carbase2.png'
import heroImgLight from '@images/front-pages/carbase2.png'

const theme = useTheme()
const router = useRouter()

const heroImg = useGenerateImageVariant(heroImgLight, heroImgDark)
const search = ref('')

const goSearch = () => {
  const v = search.value.trim()
  router.push({
    path: '/user/cars',
    query: v ? { 'filter[global]': v } : {},
  })
}

// Cards config
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
  <!-- HERO (Small) -->
  <section
    id="home"
    class="hero"
    :class="theme.current.value.dark ? 'hero--dark' : 'hero--light'"
  >
    <VContainer class="hero__container">
      <div class="hero__grid">
        <!-- Left -->
        <div class="hero__left">
          <div class="hero__badge">
            ✅ Approved listings only
          </div>

          <h1 class="hero__title">
            Find your next car <span class="hero__accent">today</span>
          </h1>

          <p class="hero__subtitle">
            Search, filter, and compare verified ads — the fastest way to find the right car.
          </p>

          <div class="hero__search">
            <VTextField
              v-model="search"
              placeholder="Search by brand, model, year..."
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="tabler-search"
              hide-details
              @keyup.enter="goSearch"
            />
            <VBtn color="primary" class="hero__btn" @click="goSearch">
              Search
            </VBtn>
          </div>

          <div class="hero__actions">
            <VBtn color="primary" variant="elevated" @click="$router.push('/user/cars')">
              Browse Cars
            </VBtn>
            <VBtn variant="tonal" @click="$router.push('/seller/register')">
              Sell Your Car
            </VBtn>
          </div>
        </div>

        <!-- Right -->
        <div class="hero__right">
          <div class="hero__media">
            <img :src="heroImg" alt="Car preview" class="hero__img">
            <div class="hero__glow" />
          </div>
        </div>
      </div>
    </VContainer>
  </section>

  <!-- 3 QUICK CARDS -->
  <section class="quick">
    <VContainer>
      <div class="quick__grid">
        <VCard
          v-for="c in quickCards"
          :key="c.title"
          rounded="lg"
          class="quick-card"
          @click="$router.push(c.to)"
        >
          <div class="quick-card__top">
            <div class="quick-card__icon">
              <VIcon :icon="c.icon" size="20" />
            </div>

            <div class="quick-card__chip">
              {{ c.chip }}
            </div>
          </div>

          <div class="quick-card__body">
            <div class="quick-card__title">{{ c.title }}</div>
            <div class="quick-card__subtitle">{{ c.subtitle }}</div>
          </div>

          <div class="quick-card__footer">
            <span class="quick-card__action">{{ c.actionText }}</span>
            <VIcon icon="tabler-arrow-right" size="18" />
          </div>
        </VCard>
      </div>
    </VContainer>
  </section>
</template>

<style scoped lang="scss">
/* =========================
   HERO (SMALL)
   ========================= */
.hero {
  border-radius: 0 0 50px 50px;
  overflow: hidden;
  position: relative;
}

.hero__container {
  padding-top: 36px;
  padding-bottom: 36px;
}

.hero--dark {
  background-color: #25293c;
  background-image: url("@images/front-pages/backgrounds/hero-bg.png");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.hero--light {
  background:
    url("@images/front-pages/backgrounds/hero-bg.png") center no-repeat,
    linear-gradient(138.18deg, #eae8fd 0%, #fce5e6 94.44%);
  background-size: cover;
}

.hero__grid {
  min-height: 380px; /* ✅ المطلوب */
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 22px;
  align-items: center;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  margin-bottom: 12px;
  background: rgba(255,255,255,.08);
}

.hero__title {
  font-size: 36px;
  line-height: 42px;
  font-weight: 900;
  margin: 0;
}

.hero__accent {
  background: linear-gradient(135deg, #28c76f 0%, #5a4aff 47.92%, #ff3739 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero__subtitle {
  margin-top: 10px;
  opacity: .8;
  max-width: 560px;
}

.hero__search {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.hero__btn {
  height: 44px;
  padding-inline: 18px;
}

.hero__actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* media */
.hero__right {
  display: flex;
  justify-content: center;
}

.hero__media {
  position: relative;
  width: 100%;
  max-width: 520px;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255,255,255,.04);
}

.hero__img {
  width: 100%;
  height: auto;
  display: block;
}

.hero__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(90,74,255,.35), transparent 55%),
  radial-gradient(circle at 80% 70%, rgba(40,199,111,.18), transparent 55%);
  pointer-events: none;
}

/* Responsive */
@media (max-width: 960px) {
  .hero__grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .hero__title {
    font-size: 30px;
    line-height: 36px;
  }
  .hero__search {
    grid-template-columns: 1fr;
  }
  .hero__btn {
    width: 100%;
  }
}

/* =========================
   QUICK CARDS
   ========================= */
.quick {
  margin-top: -18px; /* ✅ يخلي الكروت تدخل على الهيرو شوية */
  padding-bottom: 18px;
}

.quick__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.quick-card {
  cursor: pointer;
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  transition: transform .15s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
}

.quick-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.06);
}

.quick-card__chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  font-weight: 800;
  opacity: .9;
}

.quick-card__body {
  margin-top: 12px;
}

.quick-card__title {
  font-weight: 900;
  font-size: 16px;
}

.quick-card__subtitle {
  opacity: .75;
  font-size: 13px;
  margin-top: 4px;
}

.quick-card__footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: .9;
}

.quick-card__action {
  font-weight: 800;
  font-size: 13px;
}

@media (max-width: 960px) {
  .quick__grid {
    grid-template-columns: 1fr;
  }
}
</style>
