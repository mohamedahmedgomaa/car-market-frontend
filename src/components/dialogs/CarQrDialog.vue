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
const isDownloadingPoster = ref(false)

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
      width: 600,
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
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          direction: ltr;
        }
        .print-container {
          width: 100%;
          height: 100%;
          min-height: 275mm;
          padding: 32px 28px;
          border: 4px solid #0f172a;
          border-radius: 28px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          box-shadow: none;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 3px solid #e2e8f0;
        }
        .brand-logo-img {
          height: 58px;
          object-fit: contain;
          border-radius: 12px;
        }
        .car-id {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          background-color: #f1f5f9;
          padding: 8px 20px;
          border-radius: 24px;
          border: 2px solid #cbd5e1;
        }
        .title-box {
          margin-bottom: 24px;
          padding: 24px;
          background-color: #0f172a;
          border-radius: 24px;
          color: #ffffff;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .car-title-en {
          font-size: 28px;
          font-weight: 900;
          color: #fbbf24;
          line-height: 1.35;
          margin: 0;
          text-align: center;
        }
        .qr-card {
          background-color: #f8fafc;
          border: 3px dashed #cbd5e1;
          border-radius: 28px;
          padding: 32px;
          margin-bottom: 24px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .qr-image-wrapper {
          background-color: #ffffff;
          padding: 16px;
          border-radius: 24px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          margin-bottom: 20px;
        }
        .qr-image {
          width: 280px;
          height: 280px;
          display: block;
          object-fit: contain;
        }
        .qr-hint {
          font-size: 16px;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 8px 0;
          direction: rtl;
        }
        .qr-url {
          font-size: 14px;
          font-family: monospace;
          font-weight: 600;
          color: #64748b;
          margin: 0;
          direction: ltr;
        }
        .price-box {
          display: inline-block;
          background-color: #fbbf24;
          color: #0f172a;
          font-size: 28px;
          font-weight: 900;
          padding: 14px 44px;
          border-radius: 24px;
          border: 3px solid #f59e0b;
          margin-top: auto;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- 1. Header: NegmCars Logo & ID -->
        <div class="header-row">
          <img src="/images/logo-black.png" alt="NegmCars" class="brand-logo-img" />
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
        ${formattedPrice.value ? `<div><div class="price-box">Price: ${formattedPrice.value}</div></div>` : ''}
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

// Download Full Poster Card as High-Res PNG Image
const handleDownloadPoster = async () => {
  isDownloadingPoster.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1600
    const ctx = canvas.getContext('2d')

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1200, 1600)

    // Outer Dark Frame Border
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.roundRect(30, 30, 1140, 1540, 32)
    ctx.stroke()

    // Header divider line
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(60, 160)
    ctx.lineTo(1140, 160)
    ctx.stroke()

    // Draw Company Logo
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.src = '/images/logo-black.png'
    await new Promise(resolve => {
      logoImg.onload = resolve
      logoImg.onerror = resolve
    })

    if (logoImg.complete && logoImg.naturalWidth) {
      const logoHeight = 70
      const logoWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight
      ctx.drawImage(logoImg, 60, 60, logoWidth, logoHeight)
    } else {
      ctx.fillStyle = '#0f172a'
      ctx.font = 'black 42px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('NegmCars', 60, 110)
    }

    // ID Badge
    ctx.fillStyle = '#f1f5f9'
    ctx.beginPath()
    ctx.roundRect(940, 65, 200, 60, 30)
    ctx.fill()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`ID: #${props.car?.id || ''}`, 1040, 106)

    // Title Box
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.roundRect(60, 190, 1080, 200, 28)
    ctx.fill()

    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 38px system-ui, sans-serif'
    ctx.textAlign = 'center'
    
    // Multi-line wrap helper for long car title
    const titleText = carTitleEnOnly.value
    if (titleText.length > 45) {
      const parts = titleText.split(' ')
      const mid = Math.ceil(parts.length / 2)
      const line1 = parts.slice(0, mid).join(' ')
      const line2 = parts.slice(mid).join(' ')
      ctx.fillText(line1, 600, 265)
      ctx.fillText(line2, 600, 335)
    } else {
      ctx.fillText(titleText, 600, 305)
    }

    // QR Code Container Box
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.roundRect(60, 420, 1080, 920, 32)
    ctx.fill()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 4
    ctx.stroke()

    // Draw QR Code Image
    if (qrDataUrl.value) {
      const qrImg = new Image()
      qrImg.src = qrDataUrl.value
      await new Promise(resolve => { qrImg.onload = resolve })

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(320, 480, 560, 560, 28)
      ctx.fill()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.drawImage(qrImg, 350, 510, 500, 500)
    }

    // Scan Hint
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 32px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📷 امسح الكود بالكاميرا لرؤية التفاصيل والصور', 600, 1120)

    // URL
    ctx.fillStyle = '#64748b'
    ctx.font = '26px monospace'
    ctx.fillText(carUrl.value, 600, 1180)

    // Price Banner
    if (formattedPrice.value) {
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.roundRect(300, 1390, 600, 120, 28)
      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 5
      ctx.stroke()

      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 44px system-ui, sans-serif'
      ctx.fillText(`Price: ${formattedPrice.value}`, 600, 1466)
    }

    // Download Canvas as PNG
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `NegmCars-Poster-${props.car?.id || 'car'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Failed to generate poster image:', err)
  } finally {
    isDownloadingPoster.value = false
  }
}

const handleDownloadQr = () => {
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
    max-width="640"
    scrollable
    @update:model-value="handleClose"
  >
    <VCard class="qr-dialog-card rounded-2xl overflow-hidden shadow-2xl border border-slate-700 max-h-[92vh] flex flex-col">
      <!-- Modal Header -->
      <VCardTitle class="d-flex align-center justify-space-between pa-4 bg-surface text-foreground no-print border-b flex-shrink-0">
        <div class="d-flex align-center gap-3">
          <div class="qr-header-icon-box rounded-xl p-2 bg-primary-subtle text-primary">
            <VIcon icon="tabler-qrcode" size="26" />
          </div>
          <div>
            <h3 class="text-base font-bold m-0">بطاقة QR Code للسيارة - NegmCars</h3>
            <p class="text-xs opacity-75 m-0">جاهزة للطباعة وتحميل الصورة على ورقة A4 كامة</p>
          </div>
        </div>

        <VBtn icon="tabler-x" variant="text" density="comfortable" @click="handleClose" />
      </VCardTitle>

      <!-- Action Buttons Bar -->
      <div class="px-4 py-3 bg-slate-900/60 d-flex justify-space-between align-center flex-wrap gap-2 no-print border-b flex-shrink-0">
        <div class="d-flex gap-2">
          <VBtn color="primary" size="small" class="font-bold rounded-lg shadow" @click="handlePrint">
            <VIcon icon="tabler-printer" class="me-1.5" />
            طباعة الورقة (Print A4)
          </VBtn>

          <VBtn color="success" size="small" class="font-bold rounded-lg shadow" :loading="isDownloadingPoster" @click="handleDownloadPoster">
            <VIcon icon="tabler-photo-down" class="me-1.5" />
            تحميل الورقة كـ صورة (PNG)
          </VBtn>

          <VBtn color="secondary" variant="outlined" size="small" class="font-bold rounded-lg" @click="handleDownloadQr">
            <VIcon icon="tabler-download" class="me-1.5" />
            QR فقط
          </VBtn>
        </div>

        <span class="text-xs text-amber-400 font-medium d-flex align-center gap-1">
          <VIcon icon="tabler-info-circle" size="15" />
          تغطية صفحة A4 بالكامل
        </span>
      </div>

      <!-- Printable Windshield Poster Card -->
      <VCardText class="pa-5 printable-wrapper overflow-y-auto flex-grow max-h-[calc(90vh-110px)]">
        <div id="printable-car-flyer" class="car-flyer-poster p-6 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 shadow-xl max-w-[560px] mx-auto text-center">
          
          <!-- 1. Header Branding with Official Logo -->
          <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-slate-200">
            <div class="flex items-center gap-3">
              <img src="/images/logo-black.png" alt="NegmCars" class="h-12 object-contain rounded-lg shadow-sm" />
            </div>

            <div class="text-left">
              <span class="text-xs font-black text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-300">ID: #{{ car?.id }}</span>
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
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="Car QR Code" class="w-56 h-56 object-contain block mx-auto" />
              <div v-else class="w-56 h-56 flex items-center justify-center text-slate-400">
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





