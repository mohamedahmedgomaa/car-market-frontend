<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

definePage({
  meta: { layout: 'front', public: true },
})

const router = useRouter()

const steps = ref([
  {
    title_ar: 'تجهيز المواصفات الأساسية',
    title_en: 'Prepare Basic Specifications',
    desc_ar: 'الماركة، الموديل، سنة الصنع، نوع ناقل الحركة، سعة المحرك وفئة السيارة.',
    desc_en: 'Brand, Model, Year of manufacture, Transmission type, Engine capacity, and category.',
    icon: 'tabler-settings-automation'
  },
  {
    title_ar: 'تحديد المسافة والسعر',
    title_en: 'Define Mileage & Price',
    desc_ar: 'المسافة المقطوعة بالكيلومترات (KM) والسعر المطلوب بالجنيه المصري (EGP).',
    desc_en: 'The mileage driven in kilometers (KM) and the expected price in Egyptian Pounds (EGP).',
    icon: 'tabler-coin-monetization'
  },
  {
    title_ar: 'التقاط صور ممتازة للسيارة',
    title_en: 'Take High-Quality Photos',
    desc_ar: 'التقاط ما لا يقل عن 5 صور واضحة (الهيكل الخارجي، الطبلون، الكراسي، الإطارات).',
    desc_en: 'Capture at least 5 clear photos (exterior body, dashboard, seats, wheels).',
    icon: 'tabler-camera'
  },
  {
    title_ar: 'إرسال الإعلان أو التسجيل',
    title_en: 'Send Ad or Register',
    desc_ar: 'راسلنا مباشرة لننشر إعلانك مجاناً فوراً، أو سجل كمعرض لإدارة فلاترك.',
    desc_en: 'Contact us directly to post your ad for free, or register as a showroom to manage listings.',
    icon: 'tabler-circle-check'
  }
])

const requiredDetails = ref([
  { name_ar: 'ماركة وموديل السيارة وسنة الصنع', name_en: 'Brand, Model & Year', icon: 'tabler-car' },
  { name_ar: 'الحالة (جديدة أم مستعملة)', name_en: 'Condition (New / Used)', icon: 'tabler-activity-heartbeat' },
  { name_ar: 'المسافة المقطوعة (بالكيلومتر)', name_en: 'Mileage (in Kilometers)', icon: 'tabler-gauge' },
  { name_ar: 'ناقل الحركة (أوتوماتيك / مانيوال)', name_en: 'Transmission (Auto / Manual)', icon: 'tabler-manual-gearbox' },
  { name_ar: 'نوع الوقود (بنزين، ديزل، كهرباء، هجين)', name_en: 'Fuel Type (Petrol, Hybrid, EV)', icon: 'tabler-charging-pile' },
  { name_ar: 'سعة المحرك (مثال: 1600 CC)', name_en: 'Engine Capacity (e.g., 1600 CC)', icon: 'tabler-piston' },
  { name_ar: 'السعر المطلوب ورقم الهاتف للتواصل', name_en: 'Expected Price & Phone Number', icon: 'tabler-cash' },
  { name_ar: 'صور عالية الجودة من الداخل والخارج', name_en: 'High-Quality Photos (In & Out)', icon: 'tabler-photo' },
])

const handleShowroomRegister = () => {
  router.push('/seller/register')
}

const handleWhatsAppContact = () => {
  const phone = '201551552993'
  const message = encodeURIComponent(
    'مرحباً NegmCars، أود بيع سيارتي مجاناً على منصتكم المتميزة.\n\nإليكم تفاصيل السيارة:\n- الماركة والموديل:\n- سنة الصنع:\n- المسافة المقطوعة:\n- ناقل الحركة:\n- سعة المحرك:\n- السعر المطلوب:\n- رقم الهاتف للتواصل:'
  )
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
}
</script>

<template>
  <div class="sell-page py-12">
    <VContainer>
      <!-- Hero Section -->
      <div class="sell-hero text-center mb-16">
        <div class="badge-glow mb-4">
          <span class="text-caption font-weight-bold px-4 py-2 rounded-xl text-primary premium-badge">
            <VIcon icon="tabler-sparkles" size="14" class="me-1" />
            طريقة ذكية، سريعة ومجانية تماماً | 100% Free & Secure
          </span>
        </div>
        <h1 class="text-h3 font-weight-black text-white mb-4 hero-title">
          ابدأ بيع سيارتك اليوم على <span class="text-primary-gradient">NegmCars</span>
        </h1>
        <p class="text-subtitle-1 text-secondary max-w-3xl mx-auto hero-subtitle">
          سواء كنت صاحب سيارة فرد وتريد بيعها بسرعة وبأفضل سعر، أو صاحب معرض سيارات محترف وتبحث عن إدارة ذكية لإعلاناتك؛ لدينا الحل الأمثل لك!
        </p>
      </div>

      <!-- Main Options Row -->
      <VRow class="mb-16 d-flex align-stretch">
        <!-- Private Seller Option (WhatsApp) -->
        <VCol cols="12" md="6" class="d-flex">
          <VCard class="option-card private-card w-100 pa-8 rounded-xl d-flex flex-column justify-space-between">
            <div>
              <div class="d-flex align-center justify-space-between mb-6">
                <div class="card-icon-wrapper whatsapp-glow">
                  <VIcon icon="tabler-brand-whatsapp" size="40" color="#25D366" />
                </div>
                <span class="text-xs font-weight-bold card-tag text-success">الأسرع للأفراد | For Individuals</span>
              </div>

              <h2 class="text-h4 font-weight-bold text-white mb-3">
                إعلان خاص سريع <span class="text-success-gradient">(عبر الواتساب)</span>
              </h2>
              <p class="text-body-1 text-secondary mb-6 leading-relaxed">
                هل تفضل الطريقة الأسهل وبدون تسجيل حساب؟ أرسل لنا صور سيارتك ومواصفاتها مباشرة عبر الواتساب، وسيقوم فريق الدعم الفني لدينا بمراجعة إعلانك ورفعه على الموقع مجاناً بالكامل خلال دقائق!
              </p>

              <!-- Preparation Checklist -->
              <div class="preparation-list mb-8">
                <div class="list-title mb-4 font-weight-bold text-white text-subtitle-1">
                  <VIcon icon="tabler-checklist" size="18" class="me-2 text-success" />
                  بيانات نرجو تجهيزها قبل المراسلة:
                </div>
                <VRow dense>
                  <VCol v-for="item in requiredDetails" :key="item.name_en" cols="12" sm="6" class="py-1">
                    <div class="d-flex align-center gap-x-2 check-item">
                      <VIcon :icon="item.icon" size="15" class="text-success" />
                      <div class="text-xs text-secondary-light">
                        <span class="font-weight-medium d-block text-white">{{ item.name_ar }}</span>
                        <span class="text-muted text-3xs">{{ item.name_en }}</span>
                      </div>
                    </div>
                  </VCol>
                </VRow>
              </div>
            </div>

            <div>
              <VDivider class="my-6 border-opacity-10" />
              <VBtn
                block
                color="#25D366"
                height="56"
                class="whatsapp-btn text-white font-weight-black rounded-xl"
                @click="handleWhatsAppContact"
              >
                <VIcon icon="tabler-brand-whatsapp" size="24" class="me-2" />
                ابدأ البيع عبر الواتساب الآن
              </VBtn>
            </div>
          </VCard>
        </VCol>

        <!-- Showroom/Dealer Option (Register) -->
        <VCol cols="12" md="6" class="d-flex">
          <VCard class="option-card dealer-card w-100 pa-8 rounded-xl d-flex flex-column justify-space-between">
            <div>
              <div class="d-flex align-center justify-space-between mb-6">
                <div class="card-icon-wrapper primary-glow">
                  <VIcon icon="tabler-building-store" size="40" color="rgb(var(--v-theme-primary))" />
                </div>
                <span class="text-xs font-weight-bold card-tag text-primary">للتجار والمعارض | For Showrooms</span>
              </div>

              <h2 class="text-h4 font-weight-bold text-white mb-3">
                التسجيل <span class="text-primary-gradient">كتاجر / معرض سيارات</span>
              </h2>
              <p class="text-body-1 text-secondary mb-6 leading-relaxed">
                هل أنت صاحب معرض سيارات أو شركة تجارة سيارات؟ سجل معنا كتاجر رسمي لتحصل على لوحة تحكم ذكية وشاملة لإدارة مخزون سياراتك، إضافة وتعديل وحذف الإعلانات بلا حدود، وتلقي اتصالات المشترين مباشرة وبشكل احترافي!
              </p>

              <!-- Showroom Features -->
              <div class="showroom-benefits mb-8">
                <div class="list-title mb-4 font-weight-bold text-white text-subtitle-1">
                  <VIcon icon="tabler-award" size="18" class="me-2 text-primary" />
                  مميزات حساب المعارض الاحترافي:
                </div>
                <div class="d-flex flex-column gap-y-3">
                  <div class="benefit-item d-flex align-start gap-x-3">
                    <VIcon icon="tabler-circle-check-filled" size="16" class="text-primary mt-1" />
                    <div>
                      <strong class="text-white text-sm d-block">لوحة تحكم ذكية ومتكاملة</strong>
                      <span class="text-xs text-secondary">إدارة مخزون سياراتك، تعديل الأسعار، ومتابعة الفلاتر بسهولة فائقة.</span>
                    </div>
                  </div>
                  <div class="benefit-item d-flex align-start gap-x-3">
                    <VIcon icon="tabler-circle-check-filled" size="16" class="text-primary mt-1" />
                    <div>
                      <strong class="text-white text-sm d-block">شعار المعرض والصفحة الخاصة</strong>
                      <span class="text-xs text-secondary">ستحصل على صفحة معرض مخصصة تحمل اسمك، شعارك، بيانات الاتصال، وخريطتك الجغرافية.</span>
                    </div>
                  </div>
                  <div class="benefit-item d-flex align-start gap-x-3">
                    <VIcon icon="tabler-circle-check-filled" size="16" class="text-primary mt-1" />
                    <div>
                      <strong class="text-white text-sm d-block">توثيق المعرض (Verified badge)</strong>
                      <span class="text-xs text-secondary">إشارة التوثيق تمنح المشترين ثقة مطلقة وتزيد من فرصة بيع سياراتك بسرعة مضاعفة.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <VDivider class="my-6 border-opacity-10" />
              <VBtn
                block
                color="primary"
                height="56"
                class="register-btn font-weight-black rounded-xl"
                @click="handleShowroomRegister"
              >
                <VIcon icon="tabler-user-plus" size="22" class="me-2" />
                إنشاء حساب معرض سيارات الآن
              </VBtn>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Roadmap Section -->
      <div class="roadmap-section mt-16">
        <div class="text-center mb-12">
          <h2 class="text-h4 font-weight-bold text-white mb-2">
            خطوات بسيطة لإعلانك الاحترافي
          </h2>
          <p class="text-body-1 text-secondary">
            اتبع هذه الخطوات الأربع البسيطة لضمان بيع سيارتك بأسرع وقت وأعلى سعر
          </p>
        </div>

        <VRow>
          <VCol v-for="(step, idx) in steps" :key="step.title_en" cols="12" sm="6" lg="3">
            <VCard class="step-card pa-6 text-center rounded-xl h-100">
              <div class="step-number-badge mb-4">
                0{{ idx + 1 }}
              </div>
              <div class="step-icon-wrapper mb-4">
                <VIcon :icon="step.icon" size="32" color="rgb(var(--v-theme-primary))" />
              </div>
              <h3 class="text-h6 font-weight-bold text-white mb-2">
                {{ step.title_ar }}
              </h3>
              <div class="text-3xs text-muted mb-2 font-weight-medium">
                {{ step.title_en }}
              </div>
              <p class="text-xs text-secondary leading-relaxed">
                {{ step.desc_ar }}
              </p>
            </VCard>
          </VCol>
        </VRow>
      </div>
    </VContainer>
  </div>
</template>

<style lang="scss" scoped>
.sell-page {
  position: relative;
  z-index: 1;
}

.max-w-3xl {
  max-width: 48rem;
}

.leading-relaxed {
  line-height: 1.625;
}

.text-3xs {
  font-size: 0.65rem;
}

.text-secondary-light {
  color: #a3a8b8;
}

.text-muted {
  color: rgba(255, 255, 255, 0.4) !important;
}

.text-success-gradient {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-primary-gradient {
  background: linear-gradient(135deg, #ff6b00 0%, #ff9f43 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Premium Badge */
.premium-badge {
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.25);
  box-shadow: 0 4px 15px rgba(255, 107, 0, 0.05);
}

.hero-title {
  letter-spacing: -0.5px;
}

.hero-subtitle {
  line-height: 1.7;
}

/* Cards & Layout */
.option-card {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.03) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5) !important;
  }
}

.private-card:hover {
  border-color: rgba(37, 211, 102, 0.35) !important;
  box-shadow: 0 30px 60px rgba(37, 211, 102, 0.08) !important;
}

.dealer-card:hover {
  border-color: rgba(255, 107, 0, 0.35) !important;
  box-shadow: 0 30px 60px rgba(255, 107, 0, 0.08) !important;
}

.card-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-center: center;
  justify-content: center;
}

.whatsapp-glow {
  background: rgba(37, 211, 102, 0.1);
  border: 1px solid rgba(37, 211, 102, 0.25);
}

.primary-glow {
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.25);
}

.card-tag {
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.72rem;
  letter-spacing: 0.3px;
}

.text-success {
  color: #25D366 !important;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.card-tag.text-success {
  background: rgba(37, 211, 102, 0.1);
  border: 1px solid rgba(37, 211, 102, 0.2);
}

.card-tag.text-primary {
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.2);
}

/* Checklist & Benefits */
.check-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.benefit-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 12px 16px;
  border-radius: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

/* Action Buttons */
.whatsapp-btn {
  text-transform: none !important;
  font-size: 1.05rem;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
  box-shadow: 0 10px 25px -6px rgba(37, 211, 102, 0.4) !important;
  transition: all 0.3s ease !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -6px rgba(37, 211, 102, 0.6) !important;
  }

  &:active {
    transform: scale(0.98);
  }
}

.register-btn {
  text-transform: none !important;
  font-size: 1.05rem;
  letter-spacing: 0.5px;
  box-shadow: 0 10px 25px -6px rgba(var(--v-theme-primary), 0.4) !important;
  transition: all 0.3s ease !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -6px rgba(var(--v-theme-primary), 0.6) !important;
  }

  &:active {
    transform: scale(0.98);
  }
}

/* Roadmap & Steps */
.step-card {
  background: rgba(255, 255, 255, 0.01) !important;
  border: 1px solid rgba(255, 255, 255, 0.04) !important;
  transition: all 0.3s ease !important;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.02) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4) !important;
  }
}

.step-number-badge {
  display: inline-block;
  background: rgba(255, 107, 0, 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 900;
  font-size: 0.9rem;
  padding: 4px 12px;
  border-radius: 30px;
  border: 1px solid rgba(255, 107, 0, 0.2);
}

.step-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
