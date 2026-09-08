<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  car: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['update:isDialogVisible'])

const qrDataUrl = ref('')
const isGenerating = ref(false)

const carUrl = computed(() => {
  if (!props.car?.id) return ''
  return `${window.location.origin}/cars/${props.car.id}`
})

const carTitleEn = computed(() => {
  if (!props.car) return ''
  return props.car.title?.en || props.car.title || `${props.car.brand?.name?.en || ''} ${props.car.model?.name?.en || ''}`
})

const carTitleAr = computed(() => {
  if (!props.car) return ''
  return props.car.title?.ar || props.car.title || `${props.car.brand?.name?.ar || ''} ${props.car.model?.name?.ar || ''}`
})

const carMainImage = computed(() => {
  if (!props.car) return ''
  if (props.car.main_image_url) return props.car.main_image_url
  const main = props.car.images?.find(i => i.is_main === 1 || i.is_main === true)
  if (main?.path) return main.path
  return props.car.images?.[0]?.path || ''
})

const formattedPrice = computed(() => {
  if (!props.car?.price) return 'تواصل للسعر'
  return `${Number(props.car.price).toLocaleString()} EGP`
})

const generateQrCode = async () => {
  if (!carUrl.value) return
  isGenerating.value = true
  try {
    qrDataUrl.value = await QRCode.toDataURL(carUrl.value, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
  } catch (err) {
    console.error('Failed to generate QR Code:', err)
  } finally {
    isGenerating.value = false
  }
}

watch(
  () => props.isDialogVisible,
  (val) => {
    if (val && props.car) {
      nextTick(() => {
        generateQrCode()
      })
    }
  },
  { immediate: true }
)

watch(
  () => props.car,
  (newCar) => {
    if (newCar && props.isDialogVisible) {
      generateQrCode()
    }
  }
)

const handleClose = () => {
  emit('update:isDialogVisible', false)
}

const handlePrint = () => {
  window.print()
}

const handleDownload = () => {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.href = qrDataUrl.value
  link.download = `car-qr-${props.car?.id || 'poster'}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <VDialog
    :model-value="isDialogVisible"
    max-width="750"
    scrollable
    @update:model-value="handleClose"
  >
    <VCard class="qr-dialog-card rounded-2xl overflow-hidden shadow-2xl border border-slate-700 max-h-[88vh] flex flex-col">
      <!-- Modal Header -->
      <VCardTitle class="d-flex align-center justify-space-between pa-4 bg-surface text-foreground no-print border-b flex-shrink-0">
        <div class="d-flex align-center gap-3">
          <div class="qr-header-icon-box rounded-xl p-2 bg-primary-subtle text-primary">
            <VIcon icon="tabler-qrcode" size="26" />
          </div>
          <div>
            <h3 class="text-base font-bold m-0">بطاقة QR Code للسيارة</h3>
            <p class="text-xs opacity-75 m-0">جاهزة للطباعة والتعليق على زجاج السيارة للمعرض</p>
          </div>
        </div>

        <VBtn icon="tabler-x" variant="text" density="comfortable" @click="handleClose" />
      </VCardTitle>

      <!-- Action Buttons Bar -->
      <div class="px-4 py-3 bg-slate-900/60 d-flex justify-space-between align-center flex-wrap gap-2 no-print border-b flex-shrink-0">
        <div class="d-flex gap-2">
          <VBtn color="primary" size="small" class="font-bold rounded-lg shadow" @click="handlePrint">
            <VIcon icon="tabler-printer" class="me-1.5" />
            طباعة الورقة (Print)
          </VBtn>

          <VBtn color="secondary" variant="outlined" size="small" class="font-bold rounded-lg" @click="handleDownload">
            <VIcon icon="tabler-download" class="me-1.5" />
            تحميل الـ QR فقط
          </VBtn>
        </div>

        <span class="text-xs text-amber-400 font-medium d-flex align-center gap-1">
          <VIcon icon="tabler-info-circle" size="15" />
          اختر A4 عند الطباعة
        </span>
      </div>

      <!-- Printable Windshield Poster Card -->
      <VCardText class="pa-4 printable-wrapper overflow-y-auto flex-grow max-h-[calc(88vh-110px)]">
        <div id="printable-car-flyer" class="car-flyer-poster p-6 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 shadow-xl">
          <!-- Poster Header Branding -->
          <div class="flex justify-between items-center pb-4 mb-4 border-b-2 border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl shadow">
                NC
              </div>
              <div>
                <h2 class="text-2xl font-black tracking-tight text-slate-900 m-0">NegmCars</h2>
                <p class="text-xs font-bold text-slate-500 m-0">معرض السيارات الرقمي - Digital Car Showroom</p>
              </div>
            </div>

            <div class="text-right">
              <span class="inline-block bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                معروضة للبيع
              </span>
              <p class="text-xs font-bold text-slate-400 mt-1 mb-0">ID: #{{ car?.id }}</p>
            </div>
          </div>

          <!-- Car Title & Main Banner -->
          <div class="bg-slate-900 text-white rounded-xl p-4 mb-5 text-center shadow">
            <h1 class="text-2xl font-black text-amber-400 mb-1 leading-tight">{{ carTitleEn || carTitleAr }}</h1>
            <p v-if="carTitleAr && carTitleAr !== carTitleEn" class="text-sm font-medium text-slate-300 m-0">{{ carTitleAr }}</p>
            
            <div class="mt-3 inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-5 py-2 rounded-xl text-xl font-black shadow-md">
              <span>{{ formattedPrice }}</span>
            </div>
          </div>

          <!-- QR & Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-4">
            <!-- Left Side: Large QR Code -->
            <div class="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
              <div class="relative bg-white p-3 rounded-xl shadow-md border border-slate-200 mb-3">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="Car QR Code" class="w-40 h-40 object-contain" />
                <div v-else class="w-40 h-40 flex items-center justify-center text-slate-400">
                  <VProgressCircular indeterminate color="primary" />
                </div>
              </div>
              <p class="text-xs font-black text-slate-800 m-0 flex items-center gap-1 justify-center">
                <VIcon icon="tabler-scan" size="16" class="text-amber-600" />
                امسح الكود بالكاميرا لرؤية التفاصيل والصور
              </p>
              <span class="text-[10px] text-slate-500 font-mono mt-1 block truncate max-w-[200px]">{{ carUrl }}</span>
            </div>

            <!-- Right Side: Specs Grid -->
            <div class="md:col-span-7 space-y-3">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <!-- Year -->
                <div class="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span class="text-xs text-slate-500 font-bold block mb-1">📅 سنة الصنع</span>
                  <span class="font-black text-slate-900 text-base">{{ car?.year || 'غير محدد' }}</span>
                </div>

                <!-- Mileage -->
                <div class="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span class="text-xs text-slate-500 font-bold block mb-1">🛣️ العداد (الكيلومتر)</span>
                  <span class="font-black text-slate-900 text-base">{{ car?.mileage != null ? Number(car.mileage).toLocaleString() + ' km' : '0 km' }}</span>
                </div>

                <!-- Transmission -->
                <div class="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span class="text-xs text-slate-500 font-bold block mb-1">⚙️ ناقل الحركة</span>
                  <span class="font-black text-slate-900 text-base">{{ car?.transmission || 'أتوماتيك' }}</span>
                </div>

                <!-- Fuel Type -->
                <div class="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span class="text-xs text-slate-500 font-bold block mb-1">⛽ نوع الوقود</span>
                  <span class="font-black text-slate-900 text-base">{{ car?.fuel_type || 'بنزين' }}</span>
                </div>
              </div>

              <!-- Location & Showroom Info -->
              <div class="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-slate-900">
                <div class="flex justify-between items-center text-xs font-bold mb-1">
                  <span class="text-amber-800">📍 المكان والمعرض:</span>
                  <span class="text-slate-700">{{ car?.city?.name?.ar || car?.city?.name?.en || car?.city?.name || 'مصر' }}</span>
                </div>
                <div class="font-black text-slate-900 text-sm">
                  {{ car?.seller?.name || 'معرض NegmCars' }}
                </div>
                <div v-if="car?.seller?.phone || car?.phone" class="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                  <span>📞 للتواصل والواتساب:</span>
                  <span dir="ltr">{{ car?.seller?.phone || car?.phone || '01000000000' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Notice -->
          <div class="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500 font-medium">
            <span>حقوق النشر والطبع محفوظة منصة NegmCars © {{ new Date().getFullYear() }}</span>
            <span>قم بمسح QR لمعرفة خطط التقسيط المتاحة</span>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.qr-header-icon-box {
  background-color: rgba(var(--v-theme-primary), 0.15);
}

.car-flyer-poster {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  direction: rtl;
}

/* Print Optimization CSS */
@media print {
  body * {
    visibility: hidden !important;
  }
  
  .v-overlay-container,
  .v-overlay,
  .v-dialog {
    position: static !important;
    display: block !important;
    background: transparent !important;
  }

  .no-print {
    display: none !important;
  }

  #printable-car-flyer,
  #printable-car-flyer * {
    visibility: visible !important;
  }

  #printable-car-flyer {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 24px !important;
    box-shadow: none !important;
    border: 3px solid #0f172a !important;
    background: #ffffff !important;
    color: #0f172a !important;
    z-index: 999999 !important;
    page-break-inside: avoid !important;
  }
}
</style>
