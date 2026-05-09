<script setup>
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'
import FeaturesSection from '@/views/front-pages/landing-page/features.vue'

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
  <HeroSection />

  <VContainer class="hero__container">
    <!-- Cars Section -->
    <CarsSection
      title="Cars"
      subtitle="Browse our newest car listings"
      :limit="CARS.latest.limit"
      :params="CARS.latest.params"
      :viewAllTo="CARS.latest.viewAllTo"
    />

    <div class="group-spacer"></div>

    <!-- Bikes Section -->
    <CarsSection
      title="Bikes"
      subtitle="Browse our newest motorcycle listings"
      :limit="MOTOS.latest.limit"
      :params="MOTOS.latest.params"
      :viewAllTo="MOTOS.latest.viewAllTo"
    />

    <div class="group-spacer"></div>

    <!-- Best Deals Section -->
    <CarsSection
      title="Best Deals"
      subtitle="The most competitive prices on all vehicles"
      :limit="ALL_VEHICLES.topPrice.limit"
      :params="ALL_VEHICLES.topPrice.params"
      :viewAllTo="ALL_VEHICLES.topPrice.viewAllTo"
    >
      <template #header-extra>
        <VChip size="small" color="error" variant="flat" class="best-deal-badge">
          Best Deal
        </VChip>
      </template>
    </CarsSection>

    <div class="group-spacer"></div>

    <!-- Expat Auto Initiative Section -->
    <CarsSection
      title="Expat Auto Initiative"
      subtitle="Popular choices available for import"
      :limit="ALL_VEHICLES.mostFav.limit"
      :params="ALL_VEHICLES.mostFav.params"
      :viewAllTo="ALL_VEHICLES.mostFav.viewAllTo"
    >
      <template #header-extra>
        <VChip size="small" color="success" variant="flat" class="import-badge">
          Import Available
        </VChip>
      </template>
    </CarsSection>
  </VContainer>

  <!-- Features Section -->
  <FeaturesSection />

  <!-- CTA Section -->
  <section class="cta-section py-16">
    <VContainer>
      <VCard class="cta-card pa-12 text-center" elevation="10">
        <h2 class="text-h3 font-weight-black mb-4">
          Ready to <span class="text-primary">Sell Your Car?</span>
        </h2>
        <p class="text-h6 opacity-70 mb-10 max-w-700 mx-auto">
          Join thousands of successful sellers on our platform. List your car today and reach thousands of interested buyers in seconds.
        </p>
        <div class="d-flex flex-wrap justify-center gap-6">
          <VBtn
            color="primary"
            size="large"
            height="56"
            class="px-10 font-weight-bold"
            to="/user/sell"
            prepend-icon="tabler-circle-plus"
          >
            Add Your Ad Now
          </VBtn>
          <VBtn
            variant="outlined"
            color="white"
            size="large"
            height="56"
            class="px-10 font-weight-bold"
            to="/user/cars"
          >
            Browse Cars
          </VBtn>
        </div>
      </VCard>
    </VContainer>
  </section>

  <!-- Disclaimer Footer -->
  <section class="disclaimer-section py-8">
    <VContainer>
      <VAlert
        type="info"
        variant="tonal"
        color="warning"
        border="start"
        class="disclaimer-alert pa-6"
      >
        <div class="text-h6 font-weight-bold mb-2">Important Notice & Disclaimer</div>
        <div class="text-body-2 opacity-80">
          NegmCars is an advertising platform that acts as a bridge between buyers and sellers. We are NOT responsible for any transactions, payments, or the condition of the vehicles listed. We strongly advise users to inspect vehicles thoroughly and meet in safe public locations for transactions. Use of this platform constitutes agreement that NegmCars is not liable for any financial or legal issues arising from deals made between users.
        </div>
      </VAlert>
    </VContainer>
  </section>
</template>

<style scoped>
.hero__container {
  padding-top: 0;
  padding-bottom: 32px;
}

.group-spacer {
  height: 40px;
}

.best-deal-badge, .import-badge {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cta-section {
  background: radial-gradient(circle at center, rgba(var(--v-theme-primary), 0.05), transparent 70%);
}

.cta-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 48px !important;
}

.max-w-700 {
  max-width: 700px;
}

.disclaimer-section {
  background: rgba(0, 0, 0, 0.2);
}

.disclaimer-alert {
  border-radius: 20px !important;
}
</style>
