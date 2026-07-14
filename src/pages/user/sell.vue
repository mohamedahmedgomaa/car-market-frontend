<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSellerAuth } from '@/stores/sellerAuth'
import { useUserAuth } from '@/stores/userAuth'

definePage({ meta: { layout: 'front', public: true } })

const router = useRouter()
const sellerAuth = useSellerAuth()
const userAuth = useUserAuth()

const isSellerLoggedIn = computed(() => !!sellerAuth.token)
const isUserLoggedIn = computed(() => !!userAuth.token)
const sellerData = computed(() => {
  if (!isSellerLoggedIn.value) return null
  try {
    const data = localStorage.getItem('seller_data')
    return data ? JSON.parse(data) : sellerAuth.seller
  } catch {
    return sellerAuth.seller
  }
})

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

// Showroom dynamic stats
const stats = ref([
  { title: 'Active Ads', title_ar: 'الإعلانات النشطة', count: '1', icon: 'tabler-car', color: 'primary' },
  { title: 'Total Leads', title_ar: 'اتصالات المشترين', count: '48', icon: 'tabler-message-share', color: 'success' },
  { title: 'Rating', title_ar: 'التقييم', count: '4.9 ★', icon: 'tabler-star', color: 'amber' }
])

const steps = [
  {
    step: '01',
    title_ar: 'إنشاء حساب بائع',
    title_en: 'Create a Seller Account',
    desc_ar: 'سجل معرضك أو حسابك الفردي مجاناً في دقيقة واحدة مع إدخال رقم هاتفك وموقعك الجغرافي.',
    desc_en: 'Register your showroom or individual profile in 1 minute with your contact & location details.',
    icon: 'tabler-user-plus',
    color: 'primary'
  },
  {
    step: '02',
    title_ar: 'إضافة تفاصيل السيارة',
    title_en: 'Add Vehicle Details',
    desc_ar: 'أدخل الماركة، الموديل، المسافة المقطوعة، المواصفات الفنية، والكماليات بدقة فائقة.',
    desc_en: 'Enter the brand, model, mileage, technical specifications, and key optional features.',
    icon: 'tabler-edit',
    color: 'warning'
  },
  {
    step: '03',
    title_ar: 'رفع صور عالية الجودة',
    title_en: 'Upload High-Quality Images',
    desc_ar: 'الصور الاحترافية تجذب المشترين! ارفع صوراً واضحة للسيارة من مختلف الزوايا والداخل.',
    desc_en: 'Professional photos sell! Upload high-resolution interior & exterior angles of the car.',
    icon: 'tabler-photo',
    color: 'success'
  },
  {
    step: '04',
    title_ar: 'انطلق واستقبل المشترين',
    title_en: 'Go Live & Get Offers',
    desc_ar: 'يُنشر إعلانك فوراً في محركات بحث المشترين المتقدمة، وسيتواصلون معك مباشرة عبر الهاتف والواتساب.',
    desc_en: 'Your listing goes live instantly in advanced searches. Buyers contact you directly via phone or WhatsApp!',
    icon: 'tabler-rocket',
    color: 'info'
  }
]

const valueProps = [
  {
    title_ar: 'وصول لآلاف المشترين',
    title_en: 'Reach Thousands of Buyers',
    desc_ar: 'تتعرض سيارتك لآلاف الباحثين عن سيارات يومياً في كافة محافظات مصر.',
    desc_en: 'Get massive exposure to active car seekers across all Egyptian governorates every single day.',
    icon: 'tabler-users',
    color: '#FF9F43'
  },
  {
    title_ar: 'تواصل مباشر وفوري',
    title_en: 'Direct & Instant Contact',
    desc_ar: 'بدون وسطاء أو عمولات! يتصل بك المشتري مباشرة عبر الهاتف أو الواتساب بنقرة زر.',
    desc_en: 'Zero commission or middleman. Buyers call or WhatsApp you directly in one click.',
    icon: 'tabler-message-circle-2',
    color: '#28C76F'
  },
  {
    title_ar: 'لوحة تحكم بائع ذكية',
    title_en: 'Sleek Seller Dashboard',
    desc_ar: 'تعديل، حذف، وتحديث إعلاناتك بسهولة تامة وفي أي وقت ومتابعة الزيارات.',
    desc_en: 'Easily update, edit, republish, or delete your vehicle listings in real-time.',
    icon: 'tabler-dashboard',
    color: '#00CFE8'
  },
  {
    title_ar: 'نظام بحث متطور',
    title_en: 'Smart Filter Discovery',
    desc_ar: 'تظهر سيارتك بدقة في نتائج البحث بفضل نظام الفلاتر المتجاوب المتطور الذي قمنا بتحسينه.',
    desc_en: 'Your listing is accurately discoverable thanks to our responsive, optimized filter search.',
    icon: 'tabler-zoom-check',
    color: '#EA5455'
  }
]
</script>

<template>
  <div class="sell-onboarding-page py-16">
    <VContainer>
      <!-- Hero / Greeting Section -->
      <section class="hero-section text-center mb-12 animate-fade-in">
        <template v-if="isSellerLoggedIn && sellerData">
          <!-- Greet logged-in seller -->
          <div class="d-inline-flex align-center gap-2 px-4 py-1 rounded-pill bg-success-subtle mb-4">
            <VIcon icon="tabler-discount-check-filled" size="18" color="success" />
            <span class="text-caption font-weight-bold text-success text-uppercase tracking-wider">
              Logged in as Verified Seller
            </span>
          </div>

          <h1 class="text-h2 font-weight-black text-high-emphasis mb-3">
            <span dir="ltr">Welcome Back, {{ sellerData.store_name || sellerData.name }}!</span>
          </h1>
          <p class="text-h6 text-medium-emphasis max-w-700 mx-auto font-weight-medium mb-8">
            Ready to expand your showroom? Add a new premium listing to your online inventory or manage your current cars directly.
          </p>

          <!-- Seller Stats Quick-Look -->
          <VRow class="max-w-900 mx-auto mb-10 justify-center">
            <VCol v-for="stat in stats" :key="stat.title" cols="12" sm="4" md="3">
              <VCard class="stat-card pa-5 rounded-2xl border text-center h-100" elevation="6">
                <VAvatar :color="stat.color" variant="tonal" size="52" class="mb-3">
                  <VIcon :icon="stat.icon" size="24" />
                </VAvatar>
                <div class="text-h4 font-weight-black text-high-emphasis mb-1">{{ stat.count }}</div>
                <div class="text-caption font-weight-medium text-medium-emphasis">{{ stat.title }}</div>
              </VCard>
            </VCol>
          </VRow>

          <div class="d-flex align-center justify-center flex-wrap gap-4">
            <VBtn
              color="primary"
              size="x-large"
              rounded="pill"
              to="/seller/cars/create"
              class="px-8 py-3 font-weight-black shadow-primary text-subtitle-1"
              elevation="8"
            >
              <VIcon icon="tabler-circle-plus" size="22" class="me-2" />
              Add New Listing
            </VBtn>

            <VBtn
              variant="tonal"
              color="secondary"
              size="x-large"
              rounded="pill"
              to="/seller/dashboard"
              class="px-8 py-3 font-weight-black text-subtitle-1"
            >
              <VIcon icon="tabler-dashboard" size="22" class="me-2" />
              Seller Dashboard
            </VBtn>
          </div>
        </template>

        <template v-else-if="isUserLoggedIn">
          <!-- Logged in as normal user but not seller -->
          <div class="d-inline-flex align-center gap-2 px-4 py-1 rounded-pill bg-amber-subtle mb-4">
            <VIcon icon="tabler-alert-circle" size="18" color="amber-darken-1" />
            <span class="text-caption font-weight-bold text-amber-darken-1 text-uppercase tracking-wider">
              Seller Account Required
            </span>
          </div>

          <h1 class="text-h2 font-weight-black text-high-emphasis mb-3">
            <span dir="ltr">Upgrade to Seller Profile</span>
          </h1>
          <p class="text-h6 text-medium-emphasis max-w-700 mx-auto font-weight-medium mb-8">
            You are logged in as an individual. To start listing and selling your cars on NegmCars, please register your showroom/seller profile.
          </p>

          <!-- Call to Action Card for Upgrading/Registering as Seller -->
          <VCard class="cta-card max-w-850 mx-auto pa-8 rounded-3xl elevation-12 border relative overflow-hidden mb-12">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between gap-6 relative z-1">
              <div class="text-center text-md-start">
                <div class="d-inline-flex align-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary mb-3 text-caption font-weight-bold">
                  <VIcon icon="tabler-shield-check" size="16" /> Verified Seller Status
                </div>
                <h2 class="text-h4 font-weight-black text-high-emphasis mb-2">Create Your Seller Account</h2>
                <p class="text-subtitle-1 text-medium-emphasis mb-0">
                  Fill in your showroom or personal seller details to unlock the vehicle listing features immediately.
                </p>
              </div>

              <div class="d-flex flex-column gap-3 flex-shrink-0 w-100 w-md-auto">
                <VBtn
                  color="primary"
                  size="x-large"
                  rounded="pill"
                  to="/seller/register"
                  class="px-8 py-3 font-weight-black shadow-primary text-subtitle-1"
                  elevation="8"
                >
                  <VIcon icon="tabler-user-plus" size="22" class="me-2" />
                  Register as Seller
                </VBtn>

                <VBtn
                  variant="outlined"
                  color="secondary"
                  size="large"
                  rounded="pill"
                  to="/seller/login"
                  class="font-weight-bold text-subtitle-2"
                >
                  <VIcon icon="tabler-login" size="18" class="me-2" />
                  Log in as Seller
                </VBtn>
              </div>
            </div>
          </VCard>
        </template>

        <template v-else>
          <!-- Guest / Not Logged In at all -->
          <div class="d-inline-flex align-center gap-2 px-4 py-1 rounded-pill bg-amber-subtle mb-4">
            <VIcon icon="tabler-rocket" size="18" color="amber-darken-1" />
            <span class="text-caption font-weight-bold text-amber-darken-1 text-uppercase tracking-wider">
              Sell Your Vehicle Fast
            </span>
          </div>

          <h1 class="text-h2 font-weight-black text-high-emphasis mb-3">
            <span dir="ltr">Sell Your Car in Egypt Online</span>
          </h1>
          <p class="text-h6 text-medium-emphasis max-w-700 mx-auto font-weight-medium mb-8">
            NegmCars connects you directly with thousands of verified active buyers in Egypt. List your showroom inventory or personal car easily.
          </p>

          <!-- Call to Action Card for Registration -->
          <VCard class="cta-card max-w-850 mx-auto pa-8 rounded-3xl elevation-12 border relative overflow-hidden mb-12">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between gap-6 relative z-1">
              <div class="text-center text-md-start">
                <div class="d-inline-flex align-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary mb-3 text-caption font-weight-bold">
                  <VIcon icon="tabler-gift" size="16" /> Easy Onboarding
                </div>
                <h2 class="text-h4 font-weight-black text-high-emphasis mb-2"><span dir="ltr">Ready to Sell Your Vehicle?</span></h2>
                <p class="text-subtitle-1 text-medium-emphasis mb-0">
                  Register as a showroom or an individual seller to start listing your car on NegmCars and connect with active buyers instantly.
                </p>
              </div>

              <div class="d-flex flex-column gap-3 flex-shrink-0 w-100 w-md-auto">
                <VBtn
                  color="primary"
                  size="x-large"
                  rounded="pill"
                  to="/seller/register"
                  class="px-8 py-3 font-weight-black shadow-primary text-subtitle-1"
                  elevation="8"
                >
                  <VIcon icon="tabler-building-store" size="22" class="me-2" />
                  Register Showroom
                </VBtn>

                <VBtn
                  variant="tonal"
                  color="primary"
                  size="large"
                  rounded="pill"
                  to="/login?tab=register"
                  class="font-weight-bold text-subtitle-2"
                >
                  <VIcon icon="tabler-user-plus" size="18" class="me-2" />
                  Register Individual
                </VBtn>

                <VBtn
                  variant="outlined"
                  color="secondary"
                  size="large"
                  rounded="pill"
                  to="/login"
                  class="font-weight-bold text-subtitle-2"
                >
                  <VIcon icon="tabler-login" size="18" class="me-2" />
                  Sign In
                </VBtn>
              </div>
            </div>
          </VCard>
        </template>
      </section>

      <!-- Step-by-Step Timeline Section -->
      <section class="timeline-section mb-16">
        <div class="text-center mb-10">
          <h2 class="text-h3 font-weight-black text-high-emphasis mb-2"><span dir="ltr">How It Works</span></h2>
          <p class="text-body-1 text-medium-emphasis">Simple steps to get your car listed and sold</p>
        </div>

        <VRow class="justify-center">
          <VCol v-for="step in steps" :key="step.step" cols="12" sm="6" lg="3">
            <div class="step-card pa-6 rounded-2xl h-100 relative">
              <div class="step-number absolute font-weight-black text-h1 opacity-10 top-2 right-4">
                {{ step.step }}
              </div>

              <VAvatar :color="step.color" variant="tonal" size="56" class="mb-4">
                <VIcon :icon="step.icon" size="26" />
              </VAvatar>

              <h3 class="text-h5 font-weight-black text-high-emphasis mb-2">
                {{ step.title_en }}
                <div class="text-subtitle-2 font-weight-bold text-primary-subtle mt-1 font-arabic" dir="rtl">
                  {{ step.title_ar }}
                </div>
              </h3>

              <p class="text-body-2 text-medium-emphasis mb-0 font-weight-medium">
                {{ step.desc_en }}
              </p>
              <p class="text-caption text-medium-emphasis mt-2 border-top pt-2 opacity-75 font-arabic font-weight-medium" dir="rtl">
                {{ step.desc_ar }}
              </p>
            </div>
          </VCol>
        </VRow>
      </section>

      <!-- Why Sell With Us Grid -->
      <section class="value-props-section py-8">
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-black text-high-emphasis mb-2"><span dir="ltr">Why Sell On NegmCars?</span></h2>
          <p class="text-body-1 text-medium-emphasis">Premium tools and network engineered for your sales success</p>
        </div>

        <VRow>
          <VCol v-for="prop in valueProps" :key="prop.title_en" cols="12" sm="6" lg="3">
            <VCard class="prop-card h-100 pa-6 rounded-2xl border" elevation="4">
              <VIcon :icon="prop.icon" size="36" :style="{ color: prop.color }" class="mb-4" />
              
              <h3 class="text-h5 font-weight-bold text-high-emphasis mb-2">
                {{ prop.title_en }}
                <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mt-1 font-arabic" dir="rtl">
                  {{ prop.title_ar }}
                </div>
              </h3>

              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ prop.desc_en }}
              </p>
              <p class="text-caption text-medium-emphasis mt-2 border-top pt-2 opacity-75 font-arabic" dir="rtl">
                {{ prop.desc_ar }}
              </p>
            </VCard>
          </VCol>
        </VRow>
      </section>
    </VContainer>
  </div>
</template>

<style lang="scss" scoped>
.sell-onboarding-page {
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.08), transparent 60%),
              radial-gradient(circle at bottom left, rgba(var(--v-theme-surface), 0.7), transparent 70%);
}

.text-medium-emphasis {
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
}

.max-w-700 {
  max-width: 700px;
}

.max-w-850 {
  max-width: 850px;
}

.max-w-900 {
  max-width: 900px;
}

.tracking-wider {
  letter-spacing: 1.5px;
}

.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.45) !important;
}

.font-arabic {
  font-family: 'Cairo', 'Inter', sans-serif !important;
}

/* Onboarding CTA Card */
.cta-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.25), rgba(var(--v-theme-surface), 0.85)) !important;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(var(--v-theme-primary), 0.4) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.15) !important;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.35), transparent 70%);
    z-index: 0;
  }
}

.bg-primary-subtle {
  background: rgba(var(--v-theme-primary), 0.15);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

.bg-success-subtle {
  background: rgba(40, 199, 111, 0.15);
  border: 1px solid rgba(40, 199, 111, 0.3);
}

.bg-amber-subtle {
  background: rgba(255, 159, 67, 0.15);
  border: 1px solid rgba(255, 159, 67, 0.3);
}

.primary-subtle-text {
  color: rgba(var(--v-theme-primary), 0.9) !important;
}

/* Stat Cards */
.stat-card {
  background: rgba(var(--v-theme-surface), 0.4) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4) !important;
  }
}

/* Timeline Cards */
.step-card {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  .step-number {
    color: rgba(var(--v-theme-on-surface), 0.9);
    pointer-events: none;
    line-height: 1;
    font-size: 80px;
    font-weight: 900;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(var(--v-theme-on-surface), 0.15);
    background: rgba(var(--v-theme-on-surface), 0.05);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35) !important;
  }
}

/* Value Props Cards */
.prop-card {
  background: rgba(var(--v-theme-surface), 0.35) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(var(--v-theme-primary), 0.4) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(var(--v-theme-primary), 0.15) !important;
  }
}
</style>
