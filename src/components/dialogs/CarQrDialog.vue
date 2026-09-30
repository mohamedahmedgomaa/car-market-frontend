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
  return `${window.location.origin}/user/cars/${props.car.id}`
})

const brandName = computed(() => {
  if (!props.car?.brand) return ''
  const b = props.car.brand
  if (typeof b === 'string') return b
  return b.name?.en || b.name?.ar || b.name || ''
})

const modelName = computed(() => {
  if (!props.car?.model) return ''
  const m = props.car.model
  if (typeof m === 'string') return m
  return m.name?.en || m.name?.ar || m.name || ''
})

const carTitleEnOnly = computed(() => {
  if (!props.car) return ''
  if (typeof props.car.title === 'object' && props.car.title?.en) {
    return props.car.title.en
  }
  if (typeof props.car.title === 'string' && props.car.title) {
    return props.car.title
  }
  return `${brandName.value} ${modelName.value}`.trim()
})

const formattedPrice = computed(() => {
  if (!props.car?.price) return ''
  const amount = Number(props.car.price).toLocaleString()
  const curr = props.car.currency || 'EGP'
  const symbols = {
    EGP: 'EGP',
    USD: '$ USD',
    SYP: 'SYP ليرة',
  }
  return `${amount} ${symbols[curr] || curr}`
})

const generateQrCode = async () => {
  if (!carUrl.value) return
  isGenerating.value = true
  try {
    qrDataUrl.value = await QRCode.toDataURL(carUrl.value, {
      width: 500,
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
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.zIndex = '-9999'
  
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
    <head>
      <meta charset="utf-8">
      <title>NegmCars - ${carTitleEnOnly.value}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          direction: ltr;
        }
        .print-container {
          width: 100%;
          max-width: 620px;
          margin: 0 auto;
          padding: 32px;
          border: 3px solid #0f172a;
          border-radius: 24px;
          background: #ffffff;
          text-align: center;
          box-shadow: none;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-badge {
          width: 48px;
          height: 48px;
          background-color: #0f172a;
          color: #fbbf24;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 22px;
        }
        .brand-name {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .car-id {
          font-size: 15px;
          font-weight: 800;
          color: #475569;
          background-color: #f1f5f9;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid #cbd5e1;
        }
        .title-box {
          margin-bottom: 28px;
          padding: 20px;
          background-color: #0f172a;
          border-radius: 20px;
          color: #ffffff;
        }
        .car-title-en {
          font-size: 24px;
          font-weight: 900;
          color: #fbbf24;
          line-height: 1.35;
          margin: 0;
          text-align: center;
        }
        .qr-card {
          background-color: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-image-wrapper {
          background-color: #ffffff;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          margin-bottom: 16px;
        }
        .qr-image {
          width: 240px;
          height: 240px;
          display: block;
          object-fit: contain;
        }
        .qr-hint {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 6px 0;
          direction: rtl;
        }
        .qr-url {
          font-size: 12px;
          font-family: monospace;
          color: #64748b;
          margin: 0;
          direction: ltr;
        }
        .price-box {
          display: inline-block;
          background-color: #fbbf24;
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
          padding: 12px 36px;
          border-radius: 20px;
          border: 2px solid #f59e0b;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- 1. Header: NegmCars & ID -->
        <div class="header-row">
          <div class="brand-logo">
            <div class="logo-badge">NC</div>
            <h2 class="brand-name">NegmCars</h2>
          </div>
          <div class="car-id">ID: #${props.car?.id || ''}</div>
        </div>

        <!-- 2. English Title ONLY -->
        <div class="title-box">
          <h1 class="car-title-en">${carTitleEnOnly.value}</h1>
        </div>

        <!-- 3. QR Code -->
        <div class="qr-card">
          <div class="qr-image-wrapper">
            <img src="${qrDataUrl.value}" class="qr-image" alt="Car QR Code" />
          </div>
          <p class="qr-hint">📷 امسح الكود بالكاميرا لرؤية التفاصيل والصور</p>
          <p class="qr-url">${carUrl.value}</p>
        </div>

        <!-- 4. Price Banner -->
        ${formattedPrice.value ? `<div class="price-box">Price: ${formattedPrice.value}</div>` : ''}
      </div>
    </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 2000)
  }, 400)
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
    max-width="620"
    scrollable
    @update:model-value="handleClose"
  >
    <VCard class="qr-dialog-card rounded-2xl overflow-hidden shadow-2xl border border-slate-700 max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <VCardTitle class="d-flex align-center justify-space-between pa-4 bg-surface text-foreground no-print border-b flex-shrink-0">
        <div class="d-flex align-center gap-3">
          <div class="qr-header-icon-box rounded-xl p-2 bg-primary-subtle text-primary">
            <VIcon icon="tabler-qrcode" size="26" />
          </div>
          <div>
            <h3 class="text-base font-bold m-0">بطاقة QR Code للسيارة - NegmCars</h3>
            <p class="text-xs opacity-75 m-0">جاهزة للطباعة على ورقة A4 واحدة للتعليق على السيارة</p>
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
          طباعة A4 صفحة واحدة
        </span>
      </div>

      <!-- Printable Windshield Poster Card -->
      <VCardText class="pa-5 printable-wrapper overflow-y-auto flex-grow max-h-[calc(90vh-110px)]">
        <div id="printable-car-flyer" class="car-flyer-poster p-6 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 shadow-xl max-w-[560px] mx-auto text-center">
          
          <!-- 1. Header Branding -->
          <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-2xl shadow">
                NC
              </div>
              <div>
                <h2 class="text-2xl font-black tracking-tight text-slate-900 m-0 leading-none">NegmCars</h2>
              </div>
            </div>

            <div class="text-left">
              <span class="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300">ID: #{{ car?.id }}</span>
            </div>
          </div>

          <!-- 2. Car Title (English Only) -->
          <div class="bg-slate-900 text-white rounded-2xl p-5 mb-6 text-center shadow-md">
            <h1 class="text-2xl font-black text-amber-400 m-0 leading-snug dir-ltr">
              {{ carTitleEnOnly }}
            </h1>
          </div>

          <!-- 3. CENTER: QR Code -->
          <div class="flex flex-col items-center justify-center p-6 mb-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
            <div class="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 mb-3">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="Car QR Code" class="w-52 h-52 object-contain block mx-auto" />
              <div v-else class="w-52 h-52 flex items-center justify-center text-slate-400">
                <VProgressCircular indeterminate color="primary" />
              </div>
            </div>
            <p class="text-sm font-black text-slate-800 m-0 flex items-center gap-1.5 justify-center">
              <VIcon icon="tabler-scan" size="18" class="text-amber-600" />
              امسح الكود بالكاميرا لرؤية التفاصيل والصور
            </p>
            <span class="text-xs text-slate-500 font-mono mt-1 block truncate max-w-[260px] dir-ltr">{{ carUrl }}</span>
          </div>

          <!-- 4. Price Banner -->
          <div v-if="formattedPrice" class="text-center">
            <div class="inline-flex items-center justify-center bg-amber-400 text-slate-950 px-8 py-2.5 rounded-2xl text-2xl font-black shadow-md border-2 border-amber-300">
              <span class="text-xs text-slate-900 ml-2 font-bold">Price:</span>
              <span>{{ formattedPrice }}</span>
            </div>
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
}

.dir-ltr {
  direction: ltr;
}

/* Print Optimization CSS */
@media print {
  html, body {
    background: #ffffff !important;
    height: 100vh !important;
    overflow: hidden !important;
  }

  body > *:not(.v-overlay-container) {
    display: none !important;
  }

  .v-overlay-container,
  .v-overlay,
  .v-overlay__container,
  .v-overlay__content,
  .v-dialog,
  .qr-dialog-card,
  .printable-wrapper {
    position: static !important;
    display: block !important;
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
    transform: none !important;
    opacity: 1 !important;
  }

  .no-print {
    display: none !important;
  }

  #printable-car-flyer,
  #printable-car-flyer * {
    visibility: visible !important;
  }

  #printable-car-flyer {
    display: block !important;
    position: relative !important;
    width: 100% !important;
    margin: 0 auto !important;
    padding: 24px !important;
    border: 3px solid #0f172a !important;
    box-shadow: none !important;
    background: #ffffff !important;
    color: #0f172a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-inside: avoid !important;
    page-break-after: avoid !important;
  }
}
</style>




