<script setup>
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'
import TopSellersSection from '@/views/front-pages/landing-page/top-sellers-section.vue'

definePage({ meta: { layout: 'front', public: true } })

const buildSection = (type, sort) => ({
  limit: 8,
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
}

const MOTOS = {
  latest: buildSection('motorcycle', '-created_at'),
}

const ALL_VEHICLES = {
  topPrice: {
    limit: 8,
    params: {
      sort: '-price',
    },
    viewAllTo: {
      path: '/user/cars',
      query: {
        sort: '-price',
      },
    },
  },
  mostFav: {
    limit: 8,
    params: {
      sort: '-favorites_count',
    },
    viewAllTo: {
      path: '/user/cars',
      query: {
        sort: '-favorites_count',
      },
    },
  },
}
</script>

<template>
  <HeroSection title="Hero Section" />

  <VContainer class="hero__container">
    <!-- ===================== -->
    <!-- Cars Section -->
    <!-- ===================== -->
    <CarsSection
      title="Cars"
      subtitle="Browse our newest car listings"
      :limit="CARS.latest.limit"
      :params="CARS.latest.params"
      :viewAllTo="CARS.latest.viewAllTo"
    />

    <!-- Spacer -->
    <div class="group-spacer"></div>

    <!-- ===================== -->
    <!-- Bikes Section -->
    <!-- ===================== -->
    <CarsSection
      title="Bikes"
      subtitle="Browse our newest motorcycle listings"
      :limit="MOTOS.latest.limit"
      :params="MOTOS.latest.params"
      :viewAllTo="MOTOS.latest.viewAllTo"
    />

    <!-- Spacer -->
    <div class="group-spacer"></div>

    <!-- ===================== -->
    <!-- Best Deals Section -->
    <!-- ===================== -->
    <CarsSection
      title="Best Deals"
      subtitle="The most competitive prices on all vehicles"
      :limit="ALL_VEHICLES.topPrice.limit"
      :params="ALL_VEHICLES.topPrice.params"
      :viewAllTo="ALL_VEHICLES.topPrice.viewAllTo"
    >
      <template #header-extra>
        <VChip size="small" color="error" variant="flat" class="best-deal-badge"> أفضل صفقة </VChip>
      </template>
    </CarsSection>

    <!-- Spacer -->
    <div class="group-spacer"></div>

    <!-- ===================== -->
    <!-- Expat Auto Initiative Section -->
    <!-- ===================== -->
    <CarsSection
      title="Expat Auto Initiative"
      subtitle="Popular choices available for import"
      :limit="ALL_VEHICLES.mostFav.limit"
      :params="ALL_VEHICLES.mostFav.params"
      :viewAllTo="ALL_VEHICLES.mostFav.viewAllTo"
    >
      <template #header-extra>
        <VChip size="small" color="success" variant="flat" class="import-badge">
          متاح للاستيراد
        </VChip>
      </template>
    </CarsSection>
  </VContainer>
</template>

<style scoped>
.hero__container {
  padding-top: 0;
  padding-bottom: 16px;
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

.best-deal-badge {
  background-color: #ff0000 !important;
  color: #ffffff !important;
  font-weight: 600;
}

.import-badge {
  background-color: #4caf50 !important;
  color: #ffffff !important;
  font-weight: 600;
}
</style>
