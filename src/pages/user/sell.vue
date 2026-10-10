<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSellerAuth } from '@/stores/sellerAuth'
import { useUserAuth } from '@/stores/userAuth'
import { useI18n } from 'vue-i18n'

definePage({ meta: { layout: 'front', public: true } })

const router = useRouter()
const sellerAuth = useSellerAuth()
const userAuth = useUserAuth()
const { t, locale } = useI18n({ useScope: 'global' })

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

// Showroom dynamic stats
const stats = ref([
  { title: 'Active Ads', title_ar: 'الإعلانات النشطة', count: '1', icon: 'tabler-car', color: 'primary' },
  { title: 'Total Leads', title_ar: 'اتصالات المشترين', count: '48', icon: 'tabler-message-share', color: 'success' },
  { title: 'Rating', title_ar: 'التقييم', count: '4.9 ★', icon: 'tabler-star', color: 'warning' },
  { title: 'Showroom Rank', title_ar: 'مرتبة المعرض', count: 'PRO', icon: 'tabler-badge-check', color: 'info' }
])

const steps = [
  {
    step: '01',
    title_ar: 'إنشاء حساب بائع',
    title_en: 'Create Seller Account',
    desc_ar: 'سجل معرضك أو حسابك الفردي مجاناً في دقيقة واحدة مع إدخال تفاصيل التواصل والموقع.',
    desc_en: 'Register your showroom or individual profile in 1 minute with contact & location details.',
    icon: 'tabler-user-plus',
    gradient: 'linear-gradient(135deg, #FF6B00 0%, #FF9F43 100%)'
  },
  {
    step: '02',
    title_ar: 'إضافة تفاصيل السيارة',
    title_en: 'Add Vehicle Details',
    desc_ar: 'أدخل الماركة، الموديل، المسافة المقطوعة، المواصفات الفنية، والكماليات بدقة فائقة.',
    desc_en: 'Enter brand, model, mileage, technical specs, and key features easily.',
    icon: 'tabler-edit',
    gradient: 'linear-gradient(135deg, #FF9F43 0%, #FEA47F 100%)'
  },
  {
    step: '03',
    title_ar: 'رفع صور عالية الجودة',
    title_en: 'Upload HD Photos',
    desc_ar: 'الصور الاحترافية تجذب المشترين! ارفع صوراً واضحة للسيارة من مختلف الزوايا والداخل.',
    desc_en: 'Upload crisp interior & exterior photos to double your buyer response rate.',
    icon: 'tabler-camera',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
  },
  {
    step: '04',
    title_ar: 'انطلق واستقبل المشترين',
    title_en: 'Go Live & Get Direct Offers',
    desc_ar: 'يُنشر إعلانك فوراً في نتائج البحث، وسيتواصل معك المشترون مباشرة عبر الاتصال والواتساب.',
    desc_en: 'Your listing goes live instantly! Interested buyers contact you directly with zero commission.',
    icon: 'tabler-rocket',
    gradient: 'linear-gradient(135deg, #00CFE8 0%, #1E90FF 100%)'
  }
]

const trustPills = [
  {
    icon: 'tabler-phone-call',
    title_ar: 'تواصل مباشر فوراً',
    title_en: 'Direct Buyer Contact',
    desc_ar: 'اتصال وواتساب مباشر',
    desc_en: 'Calls & WhatsApp'
  },
  {
    icon: 'tabler-percentage-0',
    title_ar: 'عمولة 0%',
    title_en: '0% Commission',
    desc_ar: 'بدون أي رسوم خفية',
    desc_en: 'No hidden fees'
  },
  {
    icon: 'tabler-shield-check',
    title_ar: 'معارض موثوقة',
    title_en: 'Verified Sellers',
    desc_ar: 'بيئة آمنة للمصداقية',
    desc_en: 'Trusted automotive network'
  },
  {
    icon: 'tabler-bolt',
    title_ar: 'انتشار سريع في مصر',
    title_en: 'Nationwide Reach',
    desc_ar: 'آلاف المشترين يومياً',
    desc_en: 'Thousands of daily buyers'
  }
]

const valueProps = [
  {
    title_ar: 'وصول لآلاف المشترين',
    title_en: 'Reach Thousands of Buyers',
    desc_ar: 'تتعرض سيارتك لآلاف الباحثين عن سيارات يومياً في كافة محافظات مصر مع تخصيص عروضك.',
    desc_en: 'Get massive exposure to active car seekers across all Egyptian governorates every single day.',
    icon: 'tabler-users',
    color: '#FF6B00'
  },
  {
    title_ar: 'تواصل مباشر وفوري',
    title_en: 'Direct & Instant Contact',
    desc_ar: 'بدون وسطاء أو عمولات! يتصل بك المشتري مباشرة عبر الهاتف أو الواتساب بنقرة زر.',
    desc_en: 'Zero commission or middleman. Buyers call or WhatsApp you directly in one click.',
    icon: 'tabler-message-circle-2',
    color: '#10B981'
  },
  {
    title_ar: 'لوحة تحكم بائع ذكية',
    title_en: 'Sleek Seller Dashboard',
    desc_ar: 'تعديل، حذف، وتحديث إعلاناتك بسهولة تامة وفي أي وقت ومتابعة إحصائيات المشاهدات.',
    desc_en: 'Easily update, edit, republish, or delete your vehicle listings in real-time.',
    icon: 'tabler-dashboard',
    color: '#00CFE8'
  },
  {
    title_ar: 'نظام بحث وفلاتر ذكية',
    title_en: 'Smart Filter Discovery',
    desc_ar: 'تظهر سيارتك بدقة متناهية في نتائج البحث بفضل نظام الفلاتر المتقدم المطور خصيصاً.',
    desc_en: 'Your listing is accurately discoverable thanks to our responsive, optimized filter search.',
    icon: 'tabler-zoom-check',
    color: '#EA5455'
  }
]
</script>

<template>
  <div class="sell-onboarding-page py-8 py-md-16 relative overflow-hidden">
    <!-- Ambient Glowing Background Mesh -->
    <div class="ambient-glow ambient-glow-1"></div>
    <div class="ambient-glow ambient-glow-2"></div>
    <div class="ambient-glow ambient-glow-3"></div>

    <VContainer class="relative-z">
      <!-- Hero Header Section -->
      <section class="hero-section text-center mb-12 mb-md-16">
        <template v-if="isSellerLoggedIn && sellerData">
          <!-- Logged-in Seller State -->
          <div class="hero-badge d-inline-flex align-center gap-2 px-4 py-2 rounded-pill mb-6">
            <VIcon icon="tabler-badge-check-filled" size="20" color="success" />
            <span class="badge-text font-weight-bold text-success text-uppercase tracking-wider">
              {{ locale === 'ar' ? 'مسجل كمعرض / بائع معتمد' : 'Logged in as Verified Seller' }}
            </span>
          </div>

          <h1 class="hero-title text-h3 text-sm-h2 text-md-h1 font-weight-black mb-4">
            <span class="gradient-title">
              {{ locale === 'ar' ? `مرحباً بعودتك، ${sellerData.store_name || sellerData.name}!` : `Welcome Back, ${sellerData.store_name || sellerData.name}!` }}
            </span>
          </h1>
          <p class="hero-subtitle text-body-1 text-sm-h6 text-medium-emphasis max-w-750 mx-auto font-weight-medium mb-10">
            {{ locale === 'ar'
              ? 'جاهز لتوسيع قائمة سيارات معرضك؟ أضف سيارة جديدة لمخزونك أو أدر إعلاناتك الحالية بكل سهولة.'
              : 'Ready to expand your showroom inventory? Add a new premium listing or manage your current cars directly.' }}
          </p>

          <!-- Seller Stats Cards -->
          <VRow class="max-w-950 mx-auto mb-10 justify-center">
            <VCol v-for="stat in stats" :key="stat.title" cols="6" sm="3">
              <VCard class="stat-card pa-5 rounded-2xl text-center h-100" elevation="0">
                <VAvatar :color="stat.color" variant="tonal" size="52" class="mb-3">
                  <VIcon :icon="stat.icon" size="26" />
                </VAvatar>
                <div class="text-h4 font-weight-black text-high-emphasis mb-1">{{ stat.count }}</div>
                <div class="text-caption font-weight-bold text-medium-emphasis">
                  {{ locale === 'ar' ? stat.title_ar : stat.title }}
                </div>
              </VCard>
            </VCol>
          </VRow>

          <div class="d-flex align-center justify-center flex-wrap gap-4">
            <VBtn
              color="primary"
              size="x-large"
              rounded="pill"
              to="/seller/cars/create"
              class="px-8 py-3 font-weight-black shadow-glow text-subtitle-1"
              elevation="8"
            >
              <VIcon icon="tabler-circle-plus" size="22" class="me-2" />
              {{ locale === 'ar' ? 'إضافة إعلان جديد' : 'Add New Listing' }}
            </VBtn>

            <VBtn
              variant="tonal"
              color="primary"
              size="x-large"
              rounded="pill"
              to="/seller/dashboard"
              class="px-8 py-3 font-weight-black text-subtitle-1 glass-btn"
            >
              <VIcon icon="tabler-dashboard" size="22" class="me-2" />
              {{ locale === 'ar' ? 'لوحة تحكم المعرض' : 'Seller Dashboard' }}
            </VBtn>
          </div>
        </template>

        <template v-else-if="isUserLoggedIn">
          <!-- Logged-in Individual User State -->
          <div class="hero-badge d-inline-flex align-center gap-2 px-4 py-2 rounded-pill mb-6">
            <VIcon icon="tabler-user-check" size="20" color="success" />
            <span class="badge-text font-weight-bold text-success text-uppercase tracking-wider">
              {{ locale === 'ar' ? 'مسجل كـ مستخدم' : 'Logged in as User' }}
            </span>
          </div>

          <h1 class="hero-title text-h3 text-sm-h2 text-md-h1 font-weight-black mb-4">
            <span class="gradient-title">
              {{ locale === 'ar' ? `مرحباً بك، ${userAuth.user?.name || 'عزيزي البائع'}!` : `Welcome, ${userAuth.user?.name || 'User'}!` }}
            </span>
          </h1>
          <p class="hero-subtitle text-body-1 text-sm-h6 text-medium-emphasis max-w-750 mx-auto font-weight-medium mb-10">
            {{ locale === 'ar'
              ? 'يمكنك الآن إضافة سيارتك للبيع مباشرة على نجم كارز والوصول لآلاف المشترين المهتمين في مصر.'
              : 'You can now list and sell your car directly on NegmCars. Start adding your vehicle details immediately!' }}
          </p>

          <div class="d-flex align-center justify-center flex-wrap gap-4 mb-10">
            <VBtn
              color="primary"
              size="x-large"
              rounded="pill"
              @click="() => {
                localStorage.setItem('seller_token', userAuth.token);
                localStorage.setItem('seller_data', JSON.stringify(userAuth.user));
                sellerAuth.token = userAuth.token;
                sellerAuth.seller = userAuth.user;
                router.push('/seller/cars/create');
              }"
              class="px-8 py-3 font-weight-black shadow-glow text-subtitle-1"
              elevation="8"
            >
              <VIcon icon="tabler-circle-plus" size="22" class="me-2" />
              {{ locale === 'ar' ? 'أضف سيارتك الآن' : 'Add New Listing' }}
            </VBtn>

            <VBtn
              variant="tonal"
              color="primary"
              size="x-large"
              rounded="pill"
              @click="() => {
                localStorage.setItem('seller_token', userAuth.token);
                localStorage.setItem('seller_data', JSON.stringify(userAuth.user));
                sellerAuth.token = userAuth.token;
                sellerAuth.seller = userAuth.user;
                router.push('/seller/dashboard');
              }"
              class="px-8 py-3 font-weight-black text-subtitle-1 glass-btn"
            >
              <VIcon icon="tabler-layout-grid" size="22" class="me-2" />
              {{ locale === 'ar' ? 'إدارات إعلاناتي' : 'My Ads Dashboard' }}
            </VBtn>
          </div>
        </template>

        <template v-else>
          <!-- Guest / Public Visitor State -->
          <div class="hero-badge d-inline-flex align-center gap-2 px-5 py-2 rounded-pill mb-6">
            <span class="pulse-dot"></span>
            <VIcon icon="tabler-sparkles" size="18" color="primary" />
            <span class="badge-text font-weight-bold text-uppercase tracking-wider">
              {{ locale === 'ar' ? 'قريباً • إطلاق ميزة البيع المباشر وسهولة العرض' : 'SOON • Direct Vehicle Listing & Sales' }}
            </span>
          </div>

          <h1 class="hero-title text-h3 text-sm-h2 text-md-h1 font-weight-black mb-4">
            <span class="gradient-title" dir="ltr">{{ t('sellYourCarTitle') }}</span>
          </h1>
          <p class="hero-subtitle text-body-1 text-sm-h6 text-medium-emphasis max-w-750 mx-auto font-weight-medium mb-8">
            {{ t('sellYourCarDesc') }}
          </p>

          <!-- High-Impact Announcement Banner -->
          <div class="soon-banner max-w-850 mx-auto pa-6 rounded-2xl mb-10 text-center relative overflow-hidden">
            <div class="d-flex align-center justify-center gap-3 mb-2 flex-wrap">
              <span class="glow-pill px-3 py-1 font-weight-black">SOON</span>
              <h3 class="text-h6 text-sm-h5 font-weight-black text-gradient-amber mb-0">
                {{ locale === 'ar' ? 'قريباً: ستتمكن من إضافة وعرض سيارتك للبيع مباشرة على نجم كارز!' : 'SOON: You will be able to list & sell your car on NegmCars!' }}
              </h3>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0 max-w-700 mx-auto">
              {{ locale === 'ar' ? 'نحن نضع اللمسات الأخيرة لإطلاق تجربة استثنائية وسلسة تتيح للمعارض والأفراد إدراج سياراتهم والوصول الفوري للمشترين.' : 'We are finalizing this feature to bring you the best vehicle listing experience in Egypt.' }}
            </p>
          </div>

          <!-- Dual Onboarding Action Cards (Showroom vs Individual) -->
          <VRow class="max-w-950 mx-auto mb-12 justify-center">
            <!-- Showroom Registration Card -->
            <VCol cols="12" md="6">
              <VCard class="action-card h-100 pa-8 rounded-3xl text-start relative overflow-hidden d-flex flex-column justify-space-between">
                <div class="card-glow-bg"></div>
                <div>
                  <div class="d-flex align-center justify-space-between mb-4">
                    <VAvatar color="primary" variant="tonal" size="56" class="rounded-2xl">
                      <VIcon icon="tabler-building-store" size="30" />
                    </VAvatar>
                    <span class="glow-pill px-3 py-1 text-caption font-weight-black">
                      {{ locale === 'ar' ? 'للمعارض والتجار' : 'FOR DEALERS' }}
                    </span>
                  </div>

                  <h3 class="text-h4 font-weight-black text-high-emphasis mb-2">
                    {{ locale === 'ar' ? 'تسجيل معرض سيارات' : 'Register Showroom' }}
                  </h3>
                  <p class="text-body-2 text-medium-emphasis mb-6">
                    {{ locale === 'ar'
                      ? 'احصل على صفحة معرض موثوقة، إمكانيات رفع غير محدودة، وشارة الشريك المعتمد في مصر.'
                      : 'Get a verified showroom profile, showcase your entire inventory, and get direct buyer inquiries.' }}
                  </p>

                  <div class="feature-bullets mb-8">
                    <div class="d-flex align-center gap-2 mb-2 text-body-2 text-medium-emphasis font-weight-medium">
                      <VIcon icon="tabler-circle-check-filled" size="18" color="primary" />
                      <span>{{ locale === 'ar' ? 'صفحة خاصة باسم ولوجو المعرض' : 'Dedicated Showroom Branded Page' }}</span>
                    </div>
                    <div class="d-flex align-center gap-2 mb-2 text-body-2 text-medium-emphasis font-weight-medium">
                      <VIcon icon="tabler-circle-check-filled" size="18" color="primary" />
                      <span>{{ locale === 'ar' ? 'إدارة المخزون والتواصل المباشر' : 'Inventory Management & Direct Leads' }}</span>
                    </div>
                    <div class="d-flex align-center gap-2 text-body-2 text-medium-emphasis font-weight-medium">
                      <VIcon icon="tabler-circle-check-filled" size="18" color="primary" />
                      <span>{{ locale === 'ar' ? 'توثيق رسمي ورتبة شريك ممتاز' : 'Official Verification & Elite Badge' }}</span>
                    </div>
                  </div>
                </div>

                <VBtn
                  color="primary"
                  size="x-large"
                  rounded="pill"
                  to="/seller/register"
                  class="w-100 font-weight-black shadow-glow py-3"
                  elevation="6"
                >
                  <VIcon icon="tabler-building-store" size="22" class="me-2" />
                  <span>{{ t('registerShowroom') }}</span>
                  <span class="badge-chip-inside ms-auto">SOON</span>
                </VBtn>
              </VCard>
            </VCol>

            <!-- Individual Seller Card -->
            <VCol cols="12" md="6">
              <VCard class="action-card h-100 pa-8 rounded-3xl text-start relative overflow-hidden d-flex flex-column justify-space-between">
                <div class="card-glow-bg glow-alt"></div>
                <div>
                  <div class="d-flex align-center justify-space-between mb-4">
                    <VAvatar color="success" variant="tonal" size="56" class="rounded-2xl">
                      <VIcon icon="tabler-user-heart" size="30" />
                    </VAvatar>
                    <span class="glow-pill pill-success px-3 py-1 text-caption font-weight-black">
                      {{ locale === 'ar' ? 'للأفراد والسيارات الشخصية' : 'INDIVIDUAL OWNER' }}
                    </span>
                  </div>

                  <h3 class="text-h4 font-weight-black text-high-emphasis mb-2">
                    {{ locale === 'ar' ? 'بيع سيارتك الشخصية' : 'Register Individual' }}
                  </h3>
                  <p class="text-body-2 text-medium-emphasis mb-6">
                    {{ locale === 'ar'
                      ? 'أعن سيارتك بضغطة زر وتواصل مباشرة مع آلاف المشترين الجادين بدون أي عمولة أو وسيط.'
                      : 'List your personal vehicle easily and connect with serious active buyers with 0% commission.' }}
                  </p>

                  <div class="feature-bullets mb-8">
                    <div class="d-flex align-center gap-2 mb-2 text-body-2 text-medium-emphasis font-weight-medium">
                      <VIcon icon="tabler-circle-check-filled" size="18" color="success" />
                      <span>{{ locale === 'ar' ? 'نشر سريع في دقيقة واحدة' : '1-Minute Quick Listing Process' }}</span>
                    </div>
                    <div class="d-flex align-center gap-2 mb-2 text-body-2 text-medium-emphasis font-weight-medium">
                      <VIcon icon="tabler-circle-check-filled" size="18" color="success" />
                      <span>{{ locale === 'ar' ? 'تواصل هاتف وواتساب مباشر' : 'Direct Phone & WhatsApp Buyer Leads' }}</span>
                    </div>
                    <div class="d-flex align-center gap-2 text-body-2 text-medium-emphasis font-weight-medium">
                      <VIcon icon="tabler-circle-check-filled" size="18" color="success" />
                      <span>{{ locale === 'ar' ? 'عمولة 0% وبدون رسوم خفية' : 'Zero Commission & 100% Free' }}</span>
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-column gap-3">
                  <VBtn
                    variant="tonal"
                    color="primary"
                    size="x-large"
                    rounded="pill"
                    to="/login?tab=register"
                    class="w-100 font-weight-black py-3 glass-btn"
                  >
                    <VIcon icon="tabler-user-plus" size="20" class="me-2" />
                    <span>{{ t('registerIndividual') }}</span>
                    <span class="badge-chip-inside ms-auto">SOON</span>
                  </VBtn>
                </div>
              </VCard>
            </VCol>
          </VRow>

          <!-- Quick Sign-In Bar -->
          <div class="signin-bar max-w-850 mx-auto pa-4 px-6 rounded-pill border d-flex flex-column flex-sm-row align-center justify-space-between gap-4 mb-16">
            <div class="d-flex align-center gap-3">
              <VIcon icon="tabler-lock-check" size="24" color="primary" />
              <span class="text-subtitle-1 font-weight-bold text-high-emphasis">
                {{ locale === 'ar' ? 'مسجل بالفعل لدينا؟ تسجيل الدخول لحسابك' : 'Already have an account on NegmCars?' }}
              </span>
            </div>
            <VBtn
              variant="flat"
              color="primary"
              size="large"
              rounded="pill"
              to="/login"
              class="px-6 font-weight-black text-subtitle-2 shadow-glow"
            >
              <VIcon icon="tabler-login" size="20" class="me-2" />
              {{ t('signIn') }}
            </VBtn>
          </div>
        </template>
      </section>

      <!-- Trust & Platform Highlights Grid -->
      <section class="trust-bar-section mb-16">
        <VRow class="justify-center">
          <VCol v-for="pill in trustPills" :key="pill.title_en" cols="12" sm="6" md="3">
            <VCard class="trust-pill-card pa-5 rounded-2xl border text-center h-100" elevation="0">
              <VAvatar color="primary" variant="tonal" size="48" class="mb-3">
                <VIcon :icon="pill.icon" size="24" />
              </VAvatar>
              <h4 class="text-subtitle-1 font-weight-black text-high-emphasis mb-1">
                {{ locale === 'ar' ? pill.title_ar : pill.title_en }}
              </h4>
              <p class="text-caption text-medium-emphasis mb-0 font-weight-medium">
                {{ locale === 'ar' ? pill.desc_ar : pill.desc_en }}
              </p>
            </VCard>
          </VCol>
        </VRow>
      </section>

      <!-- Step-by-Step Timeline Section -->
      <section class="timeline-section mb-16">
        <div class="text-center mb-12">
          <div class="d-inline-flex align-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary text-caption font-weight-bold mb-3">
            <VIcon icon="tabler-list-numbers" size="16" /> Step-By-Step
          </div>
          <h2 class="text-h4 text-sm-h3 font-weight-black text-high-emphasis mb-3">
            <span dir="ltr">{{ t('howItWorksTitle') }}</span>
          </h2>
          <p class="text-body-1 text-medium-emphasis max-w-600 mx-auto">{{ t('howItWorksDesc') }}</p>
        </div>

        <VRow class="justify-center relative">
          <VCol v-for="step in steps" :key="step.step" cols="12" sm="6" lg="3">
            <VCard class="step-card pa-6 rounded-3xl h-100 relative overflow-hidden" elevation="0">
              <div class="step-number-bg absolute font-weight-black select-none">
                {{ step.step }}
              </div>

              <div class="relative-z">
                <div
                  class="step-avatar-wrap d-flex align-center justify-center rounded-2xl mb-6 shadow-sm"
                  :style="{ background: step.gradient }"
                >
                  <VIcon :icon="step.icon" size="28" color="white" />
                </div>

                <div class="step-badge text-caption font-weight-black text-primary mb-2">
                  STEP {{ step.step }}
                </div>

                <h3 class="text-h5 font-weight-black text-high-emphasis mb-3" v-if="locale === 'en'">
                  {{ step.title_en }}
                </h3>
                <h3 class="text-h5 font-weight-black text-high-emphasis mb-3 font-arabic" dir="rtl" v-else>
                  {{ step.title_ar }}
                </h3>

                <p class="text-body-2 text-medium-emphasis mb-0 font-weight-medium lh-relaxed" v-if="locale === 'en'">
                  {{ step.desc_en }}
                </p>
                <p class="text-body-2 text-medium-emphasis mb-0 font-weight-medium font-arabic lh-relaxed" dir="rtl" v-else>
                  {{ step.desc_ar }}
                </p>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </section>

      <!-- Why Sell With Us Grid -->
      <section class="value-props-section py-8 mb-12">
        <div class="text-center mb-12">
          <div class="d-inline-flex align-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary text-caption font-weight-bold mb-3">
            <VIcon icon="tabler-award" size="16" /> Exclusive Advantages
          </div>
          <h2 class="text-h4 text-sm-h3 font-weight-black text-high-emphasis mb-3">
            <span dir="ltr">{{ t('whySellTitle') }}</span>
          </h2>
          <p class="text-body-1 text-medium-emphasis max-w-600 mx-auto">{{ t('whySellDesc') }}</p>
        </div>

        <VRow>
          <VCol v-for="prop in valueProps" :key="prop.title_en" cols="12" sm="6" lg="3">
            <VCard class="prop-card h-100 pa-6 rounded-3xl relative overflow-hidden" elevation="0">
              <div class="prop-icon-wrap d-inline-flex align-center justify-center pa-4 rounded-2xl mb-5" :style="{ background: prop.color + '15' }">
                <VIcon :icon="prop.icon" size="32" :style="{ color: prop.color }" />
              </div>
              
              <h3 class="text-h5 font-weight-black text-high-emphasis mb-2" v-if="locale === 'en'">
                {{ prop.title_en }}
              </h3>
              <h3 class="text-h5 font-weight-black text-high-emphasis mb-2 font-arabic" dir="rtl" v-else>
                {{ prop.title_ar }}
              </h3>

              <p class="text-body-2 text-medium-emphasis mb-0 font-weight-medium lh-relaxed" v-if="locale === 'en'">
                {{ prop.desc_en }}
              </p>
              <p class="text-body-2 text-medium-emphasis mb-0 font-arabic font-weight-medium lh-relaxed" dir="rtl" v-else>
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
  position: relative;
}

.relative-z {
  position: relative;
  z-index: 2;
}

/* Ambient Glowing Background Orbs */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  opacity: 0.35;
  z-index: 1;
}

.ambient-glow-1 {
  width: 500px;
  height: 500px;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 107, 0, 0.4) 0%, rgba(255, 159, 67, 0) 70%);
}

.ambient-glow-2 {
  width: 400px;
  height: 400px;
  top: 300px;
  right: -100px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(52, 211, 153, 0) 70%);
}

.ambient-glow-3 {
  width: 400px;
  height: 400px;
  bottom: 100px;
  left: -100px;
  background: radial-gradient(circle, rgba(0, 207, 232, 0.25) 0%, rgba(30, 144, 255, 0) 70%);
}

/* Dynamic Gradient Titles */
.gradient-title {
  background: linear-gradient(135deg, #FFFFFF 30%, #FF9F43 70%, #FF6B00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-amber {
  background: linear-gradient(135deg, #FF9F43 0%, #FF6B00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Hero Badge with Pulse Animation */
.hero-badge {
  background: rgba(255, 107, 0, 0.08) !important;
  border: 1px solid rgba(255, 107, 0, 0.3) !important;
  backdrop-filter: blur(10px);

  .badge-text {
    color: #FF6B00;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
  }
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #FF6B00;
  box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.7);
  animation: pulse-ring 1.8s infinite cubic-bezier(0.66, 0, 0, 1);
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 107, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 0, 0);
  }
}

/* Glow Pill Badges */
.glow-pill {
  background: rgba(255, 107, 0, 0.15) !important;
  color: #FF6B00 !important;
  border: 1px solid rgba(255, 107, 0, 0.4) !important;
  border-radius: 12px;
  font-size: 0.72rem;
  letter-spacing: 1px;

  &.pill-success {
    background: rgba(16, 185, 129, 0.15) !important;
    color: #10B981 !important;
    border-color: rgba(16, 185, 129, 0.4) !important;
  }
}

.badge-chip-inside {
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 2px 7px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Shadow Glows */
.shadow-glow {
  box-shadow: 0 8px 25px rgba(255, 107, 0, 0.4) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(255, 107, 0, 0.55) !important;
  }
}

.glass-btn {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

/* Announcement Box */
.soon-banner {
  background: rgba(255, 107, 0, 0.05) !important;
  border: 1px solid rgba(255, 107, 0, 0.25) !important;
  backdrop-filter: blur(12px);
}

/* Dual Action Onboarding Cards */
.action-card {
  position: relative;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  .card-glow-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 140px;
    background: radial-gradient(circle at top left, rgba(255, 107, 0, 0.15), transparent 70%);
    pointer-events: none;

    &.glow-alt {
      background: radial-gradient(circle at top left, rgba(16, 185, 129, 0.15), transparent 70%);
    }
  }

  &:hover {
    transform: translateY(-6px);
  }
}

/* Timeline Step Cards */
.step-card {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  .step-number-bg {
    top: -10px;
    right: 12px;
    font-size: 90px;
    line-height: 1;
    pointer-events: none;
    opacity: 0.06;
  }

  .step-avatar-wrap {
    width: 58px;
    height: 58px;
  }

  &:hover {
    transform: translateY(-6px);
  }
}

/* Value Props Grid */
.prop-card {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-6px);
  }
}

.trust-pill-card {
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-3px);
  }
}

.lh-relaxed {
  line-height: 1.6;
}

.max-w-600 { max-width: 600px; }
.max-w-700 { max-width: 700px; }
.max-w-750 { max-width: 750px; }
.max-w-850 { max-width: 850px; }
.max-w-950 { max-width: 950px; }

/* ====================================================
   LIGHT THEME PARITY
   ==================================================== */
.v-theme--light {
  .gradient-title {
    background: linear-gradient(135deg, #0F172A 0%, #FF6B00 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .soon-banner {
    background: #FFF8F0 !important;
    border: 1px solid rgba(255, 107, 0, 0.25) !important;
    box-shadow: 0 10px 30px rgba(255, 107, 0, 0.08) !important;
  }

  .action-card {
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06) !important;

    &:hover {
      border-color: rgba(255, 107, 0, 0.4) !important;
      box-shadow: 0 15px 40px rgba(255, 107, 0, 0.12) !important;
    }
  }

  .signin-bar {
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06) !important;
  }

  .stat-card,
  .trust-pill-card,
  .step-card,
  .prop-card {
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05) !important;

    &:hover {
      border-color: rgba(255, 107, 0, 0.35) !important;
      box-shadow: 0 12px 35px rgba(255, 107, 0, 0.1) !important;
    }
  }

  .step-number-bg {
    color: #0F172A !important;
  }
}

/* ====================================================
   DARK THEME PARITY (OBSIDIAN NO-PURPLE)
   ==================================================== */
.v-theme--dark {
  .action-card {
    background: rgba(18, 22, 32, 0.75) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(20px);

    &:hover {
      border-color: rgba(255, 107, 0, 0.45) !important;
      background: rgba(24, 29, 42, 0.85) !important;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5) !important;
    }
  }

  .signin-bar {
    background: rgba(18, 22, 32, 0.7) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    backdrop-filter: blur(16px);
  }

  .stat-card,
  .trust-pill-card,
  .step-card,
  .prop-card {
    background: rgba(18, 22, 32, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(16px);

    &:hover {
      border-color: rgba(255, 107, 0, 0.4) !important;
      background: rgba(24, 29, 42, 0.8) !important;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45) !important;
    }
  }

  .step-number-bg {
    color: #FFFFFF !important;
  }
}

.bg-primary-subtle {
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
}
</style>
