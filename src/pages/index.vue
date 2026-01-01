<script setup>
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'
import TopSellersSection from '@/views/front-pages/landing-page/top-sellers-section.vue'

definePage({ meta: { layout: 'front', public: true } })

const buildSection = (type, sort) => ({
  limit: 20,
  params: {
    'filter[type]': type,
    sort,
  },
  viewAllTo: {
    path: '/user/cars',
    query: {
      'filter[type]': type,
      sort,
    },
  },
})

const CARS = {
  latest: buildSection('car', '-created_at'),
  topPrice: buildSection('car', '-price'),
  mostFav: buildSection('car', '-favorites_count'),
}

const MOTOS = {
  latest: buildSection('motorcycle', '-created_at'),
  topPrice: buildSection('motorcycle', '-price'),
  mostFav: buildSection('motorcycle', '-favorites_count'),
}
</script>

<template>
  <HeroSection title="Hero Section" />

  <VContainer class="hero__container">
    <!-- ===================== -->
    <!-- Cars Group -->
    <!-- ===================== -->
    <div class="group-head">
      <div>
        <h2 class="group-title">Cars</h2>
        <p class="group-subtitle">Explore car listings by newest, price, and favorites</p>
      </div>
      <VChip size="small" variant="tonal">Type: car</VChip>
    </div>

    <VDivider class="mb-6" />

    <CarsSection
      title="Latest Cars"
      subtitle="Browse our newest car listings"
      :limit="CARS.latest.limit"
      :params="CARS.latest.params"
      :viewAllTo="CARS.latest.viewAllTo"
    />

    <CarsSection
      title="Top Priced Cars"
      subtitle="The most expensive car listings"
      :limit="CARS.topPrice.limit"
      :params="CARS.topPrice.params"
      :viewAllTo="CARS.topPrice.viewAllTo"
    />

    <CarsSection
      title="Most Favorite Cars"
      subtitle="Most favorited car listings"
      :limit="CARS.mostFav.limit"
      :params="CARS.mostFav.params"
      :viewAllTo="CARS.mostFav.viewAllTo"
    />

    <!-- Spacer -->
    <div class="group-spacer"></div>

    <!-- ===================== -->
    <!-- Motorcycles Group -->
    <!-- ===================== -->
    <div class="group-head">
      <div>
        <h2 class="group-title">Motorcycles</h2>
        <p class="group-subtitle">Explore motorcycles by newest, price, and favorites</p>
      </div>
      <VChip size="small" variant="tonal">Type: motorcycle</VChip>
    </div>

    <VDivider class="mb-6" />

    <CarsSection
      title="Latest Motorcycles"
      subtitle="Browse our newest motorcycle listings"
      :limit="MOTOS.latest.limit"
      :params="MOTOS.latest.params"
      :viewAllTo="MOTOS.latest.viewAllTo"
    />

    <CarsSection
      title="Top Priced Motorcycles"
      subtitle="The most expensive motorcycle listings"
      :limit="MOTOS.topPrice.limit"
      :params="MOTOS.topPrice.params"
      :viewAllTo="MOTOS.topPrice.viewAllTo"
    />

    <CarsSection
      title="Most Favorite Motorcycles"
      subtitle="Most favorited motorcycle listings"
      :limit="MOTOS.mostFav.limit"
      :params="MOTOS.mostFav.params"
      :viewAllTo="MOTOS.mostFav.viewAllTo"
    />

    <TopSellersSection
      title="Top Sellers"
      subtitle="Sellers with the most listings"
      :limit="12"
      :params="{ 'filter[cars.status]': 'approved' }"
    />
  </VContainer>
</template>

<style scoped>
.hero__container {
  padding-top: 18px;
  padding-bottom: 32px;
}

.group-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
}

.group-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
}

.group-subtitle {
  margin: 6px 0 0;
  opacity: 0.75;
  font-size: 14px;
}

.group-spacer {
  height: 18px;
}
</style>
