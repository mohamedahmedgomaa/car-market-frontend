<script setup>
const features = [
  {
    title: 'Trusted Sellers',
    desc: 'We ensure all sellers are verified to guarantee a safe and reliable buying experience.',
    icon: 'tabler-shield-check',
  },
  {
    title: 'Best Prices',
    desc: 'Compare thousands of cars and find the best deals that fit your budget perfectly.',
    icon: 'tabler-currency-dollar',
  },
  {
    title: 'Wide Variety',
    desc: 'From luxury sedans to economy hatchbacks, we have every type of vehicle in one place.',
    icon: 'tabler-car',
  },
  {
    title: 'Easy Viewing',
    desc: 'Schedule a viewing directly through the platform with ease and convenience.',
    icon: 'tabler-calendar-event',
  },
  {
    title: '24/7 Support',
    desc: 'Our team is always available to help you with any inquiries or issues you may have.',
    icon: 'tabler-headset',
  },
  {
    title: 'Smart Search',
    desc: 'Use our advanced filtering tools to find your perfect car in seconds.',
    icon: 'tabler-search',
  },
]
</script>

<template>
  <section id="features" class="features-section py-16">
    <VContainer>
      <div class="text-center mb-16">
        <h2 class="text-h3 font-weight-black mb-4">
          Everything You Need to <span class="text-primary">Buy & Sell</span> Easily
        </h2>
        <p class="text-h6 opacity-60 max-w-700 mx-auto">
          We provide the best tools and services to ensure a seamless and safe experience in the car
          market.
        </p>
      </div>

      <VRow>
        <VCol v-for="(feature, index) in features" :key="index" cols="12" sm="6" md="4">
          <VCard class="feature-card pa-8" elevation="0">
            <div class="feature-icon-wrapper mb-6">
              <VIcon :icon="feature.icon" size="32" color="primary" />
            </div>
            <h3 class="text-h5 font-weight-bold mb-3">{{ feature.title }}</h3>
            <p class="text-body-1 opacity-60 leading-relaxed">{{ feature.desc }}</p>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style lang="scss" scoped>
.features-section {
  background: rgba(255, 255, 255, 0.02);
}

.max-w-700 {
  max-width: 700px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 32px;
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(var(--v-theme-primary), 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.leading-relaxed {
  line-height: 1.7;
}
</style>
