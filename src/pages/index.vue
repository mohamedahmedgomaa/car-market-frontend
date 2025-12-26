<script setup>
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'

definePage({ meta: { layout: 'front', public: true } })
</script>

<template>
  <HeroSection title="Hero Section"/>
  <VContainer class="hero__container">
  <!-- أحدث -->
  <CarsSection
    title="Latest Cars"
    subtitle="Browse our newest listings"
    :limit="20"
    :params="{ sort: '-created_at' }"
    :viewAllTo="{ path: '/user/cars', query: { sort: '-created_at' } }"
  />
  <!-- الأغلى -->
  <CarsSection
    title="Top Priced Cars"
    subtitle="The most expensive listings"
    :limit="20"
    :params="{ sort: '-price' }"
    :viewAllTo="{ path: '/user/cars', query: { sort: '-price' } }"
  />

  <!-- الأكثر تفضيلاً -->
  <CarsSection
    title="Most Favorites"
    subtitle="Loved by our users"
    :limit="20"
    :params="{ sort: '-favorites_count' }"
    :viewAllTo="{ path: '/user/cars', query: { sort: '-favorites_count' } }"
  />
  </VContainer>
</template>
