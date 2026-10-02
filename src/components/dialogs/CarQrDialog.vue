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

const sellerName = computed(() => {
  if (!props.car?.seller) return ''
  const s = props.car.seller
  if (typeof s.store_name === 'object' && s.store_name) {
    return s.store_name?.ar || s.store_name?.en || s.name || ''
  }
  return s.store_name || s.name || ''
})

const sellerLogo = computed(() => {
  if (!props.car?.seller) return ''
  return props.car.seller.store_logo || props.car.seller.logo || ''
})

const sellerPhone = computed(() => {
  return props.car?.seller?.phone || props.car?.phone_number || props.car?.phone || ''
})

const generateQrCode = async () => {
  if (!carUrl.value) return
  isGenerating.value = true
  try {
    qrDataUrl.value = await QRCode.toDataURL(carUrl.value, {
      width: 700,
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
  iframe.style.left = '0'
  iframe.style.top = '0'
  iframe.style.width = '1000px'
  iframe.style.height = '1400px'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.zIndex = '-1'
  
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
    <head>
      <meta charset="utf-8">
      <title>NegmCars.com - ${carTitleEnOnly.value}</title>
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
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          direction: ltr;
        }
        .print-container {
          box-sizing: border-box;
          width: 100%;
          height: 260mm;
          max-height: 260mm;
          margin: 0 auto !important;
          padding: 20px 24px;
          border: 4px solid #0f172a;
          border-radius: 24px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          box-shadow: none;
          page-break-inside: avoid !important;
          page-break-before: avoid !important;
          page-break-after: avoid !important;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 3px solid #e2e8f0;
        }
        .brand-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-logo-img {
          height: 38px;
          max-height: 38px;
          width: auto;
          object-fit: contain;
          border-radius: 6px;
        }
        .brand-text {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .brand-cars {
          color: #f97316;
        }
        .car-id {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          background-color: #f1f5f9;
          padding: 5px 16px;
          border-radius: 18px;
          border: 2px solid #cbd5e1;
        }
        .showroom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fffbe6;
          border: 2px solid #fde047;
          border-radius: 16px;
          padding: 10px 16px;
          margin-bottom: 14px;
          direction: ltr;
        }
        .showroom-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .showroom-logo {
          width: 36px !important;
          height: 36px !important;
          max-width: 36px !important;
          max-height: 36px !important;
          object-fit: contain !important;
          border-radius: 8px !important;
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          flex-shrink: 0 !important;
        }
        .showroom-icon {
          font-size: 22px;
        }
        .showroom-name {
          font-size: 17px;
          font-weight: 900;
          color: #0f172a;
        }
        .showroom-phone {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          direction: ltr;
        }
        .title-box {
          margin-bottom: 14px;
          padding: 16px;
          background-color: #f8fafc;
          border: 2px solid #cbd5e1;
          border-radius: 20px;
          color: #0f172a;
        }
        .car-title-en {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.3;
          margin: 0;
          text-align: center;
        }
        .qr-card {
          background-color: #f8fafc;
          border: 3px dashed #cbd5e1;
          border-radius: 24px;
          padding: 22px 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .qr-image-wrapper {
          background-color: #ffffff;
          padding: 14px;
          border-radius: 20px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          margin-bottom: 14px;
        }
        .qr-image {
          width: 270px;
          height: 270px;
          display: block;
          object-fit: contain;
        }
        .qr-hint {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          direction: rtl;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- 1. Header: NegmCars.com Logo & Orange Brand Name & ID -->
        <div class="header-row">
          <div class="brand-box">
            <img src="/images/logo-black.png" alt="NegmCars" class="brand-logo-img" />
            <h2 class="brand-text">Negm<span class="brand-cars">Cars.com</span></h2>
          </div>
          <div class="car-id">ID: #${props.car?.id || ''}</div>
        </div>

        ${sellerName.value ? `
        <!-- Showroom Info Bar (Left to Right) -->
        <div class="showroom-bar">
          <div class="showroom-info">
            ${sellerLogo.value ? `<img src="${sellerLogo.value}" class="showroom-logo" alt="Showroom Logo" />` : '<span class="showroom-icon">🏪</span>'}
            <span class="showroom-name">${sellerName.value}</span>
          </div>
          ${sellerPhone.value ? `<div class="showroom-phone">📞 ${sellerPhone.value}</div>` : ''}
        </div>
        ` : ''}

        <!-- 2. English Title ONLY (Light Background with Black Text) -->
        <div class="title-box">
          <h1 class="car-title-en">${carTitleEnOnly.value}</h1>
        </div>

        <!-- 3. CENTER: Large QR Code -->
        <div class="qr-card">
          <div class="qr-image-wrapper">
            <img src="${qrDataUrl.value}" class="qr-image" alt="Car QR Code" />
          </div>
          <p class="qr-hint">لرؤية التفاصيل والسعر استخدم qr</p>
        </div>
      </div>
    </body>
    </html>
  `)
  doc.close()

  // Wait for all images inside iframe to finish loading before triggering print dialog
  const images = doc.querySelectorAll('img')
  let loadedCount = 0
  const totalImages = images.length

  const triggerPrintWindow = () => {
    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 2000)
    }, 200)
  }

  if (totalImages === 0) {
    triggerPrintWindow()
  } else {
    images.forEach(img => {
      if (img.complete && img.naturalWidth !== 0) {
        loadedCount++
        if (loadedCount === totalImages) triggerPrintWindow()
      } else {
        img.onload = img.onerror = () => {
          loadedCount++
          if (loadedCount === totalImages) triggerPrintWindow()
        }
      }
    })
    setTimeout(() => {
      if (loadedCount < totalImages) triggerPrintWindow()
    }, 1200)
  }
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

    let startX = 60
    if (logoImg.complete && logoImg.naturalWidth) {
      const logoHeight = 64
      const logoWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight
      ctx.drawImage(logoImg, 60, 60, logoWidth, logoHeight)
      startX = 60 + logoWidth + 20
    }

    // NegmCars.com text (Negm in Slate, Cars.com in Orange)
    ctx.textAlign = 'left'
    ctx.font = 'bold 44px system-ui, sans-serif'
    ctx.fillStyle = '#0f172a'
    ctx.fillText('Negm', startX, 108)
    const negmWidth = ctx.measureText('Negm').width
    ctx.fillStyle = '#f97316'
    ctx.fillText('Cars.com', startX + negmWidth, 108)

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

    let currentY = 190

    // Showroom Box if seller exists (Left to Right)
    if (sellerName.value) {
      ctx.fillStyle = '#fffbe6'
      ctx.beginPath()
      ctx.roundRect(60, currentY, 1080, 95, 20)
      ctx.fill()
      ctx.strokeStyle = '#fde047'
      ctx.lineWidth = 3
      ctx.stroke()

      let textLeftX = 90
      // Load Showroom Logo if available
      if (sellerLogo.value) {
        const sLogoImg = new Image()
        sLogoImg.crossOrigin = 'anonymous'
        sLogoImg.src = sellerLogo.value
        await new Promise(resolve => {
          sLogoImg.onload = resolve
          sLogoImg.onerror = resolve
        })
        if (sLogoImg.complete && sLogoImg.naturalWidth) {
          const maxDim = 60
          let drawW = maxDim
          let drawH = maxDim
          const aspect = sLogoImg.naturalWidth / sLogoImg.naturalHeight
          if (aspect > 1) {
            drawH = maxDim / aspect
          } else {
            drawW = maxDim * aspect
          }
          ctx.drawImage(sLogoImg, 90, currentY + 17.5 + (maxDim - drawH) / 2, drawW, drawH)
          textLeftX = 90 + maxDim + 20
        }
      }

      ctx.direction = 'ltr'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 32px system-ui, sans-serif'
      ctx.fillText(sellerName.value, textLeftX, currentY + 58)

      if (sellerPhone.value) {
        ctx.direction = 'ltr'
        ctx.textAlign = 'right'
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 26px system-ui, sans-serif'
        ctx.fillText(`📞 ${sellerPhone.value}`, 1110, currentY + 58)
      }

      currentY += 115
    }

    // Title Box (Light Background & Black Text)
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.roundRect(60, currentY, 1080, 180, 28)
    ctx.fill()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.direction = 'ltr'
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 38px system-ui, sans-serif'
    ctx.textAlign = 'center'
    
    // Multi-line wrap helper for long car title
    const titleText = carTitleEnOnly.value
    if (titleText.length > 45) {
      const parts = titleText.split(' ')
      const mid = Math.ceil(parts.length / 2)
      const line1 = parts.slice(0, mid).join(' ')
      const line2 = parts.slice(mid).join(' ')
      ctx.fillText(line1, 600, currentY + 70)
      ctx.fillText(line2, 600, currentY + 135)
    } else {
      ctx.fillText(titleText, 600, currentY + 105)
    }

    currentY += 200

    // QR Code Container Box
    const qrBoxHeight = 1530 - currentY
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.roundRect(60, currentY, 1080, qrBoxHeight, 32)
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
      ctx.roundRect(260, currentY + 50, 680, 680, 32)
      ctx.fill()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.drawImage(qrImg, 290, currentY + 80, 620, 620)
    }

    // Scan Hint
    ctx.direction = 'rtl'
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('لرؤية التفاصيل والسعر استخدم qr', 600, currentY + 800)

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
            <h3 class="text-base font-bold m-0">بطاقة QR Code للسيارة - NegmCars.com</h3>
            <p class="text-xs opacity-75 m-0">جاهزة للطباعة وتحميل الصورة على ورقة A4 كاملة</p>
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
          طباعة صفحة A4 واحدة
        </span>
      </div>

      <!-- Printable Windshield Poster Card -->
      <VCardText class="pa-4 printable-wrapper overflow-y-auto flex-grow max-h-[calc(88vh-110px)]">
        <div id="printable-car-flyer" class="car-flyer-poster p-5 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 shadow-xl max-w-[480px] mx-auto text-center">
          
          <!-- 1. Header Branding with Official Logo & Orange .com Text -->
          <div class="flex justify-between items-center pb-3 mb-3 border-b-2 border-slate-200">
            <div class="flex items-center gap-2.5">
              <img
                src="/images/logo-black.png"
                alt="NegmCars"
                style="height: 34px !important; width: auto !important; max-height: 34px !important; max-width: 120px !important; object-fit: contain !important; display: inline-block !important;"
                class="rounded-md flex-shrink-0"
              />
              <span class="text-xl font-black tracking-tight text-slate-900 leading-none">
                Negm<span class="text-amber-500">Cars.com</span>
              </span>
            </div>

            <div class="text-left">
              <span class="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-300">ID: #{{ car?.id }}</span>
            </div>
          </div>

          <!-- 2. Showroom Info Badge (Left to Right layout without "المعرض الناشر") -->
          <div v-if="sellerName" class="flex items-center justify-between bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 mb-3 dir-ltr">
            <div class="flex items-center gap-2.5">
              <img
                v-if="sellerLogo"
                :src="sellerLogo"
                alt="Showroom Logo"
                style="width: 34px !important; height: 34px !important; max-width: 34px !important; max-height: 34px !important; object-fit: contain !important; border-radius: 8px !important; flex-shrink: 0 !important;"
                class="bg-white border border-amber-300"
              />
              <VIcon v-else icon="tabler-building-store" size="22" class="text-amber-700" />
              <span class="text-base font-black text-slate-900">{{ sellerName }}</span>
            </div>
            <div v-if="sellerPhone" class="text-xs font-bold text-slate-800 flex items-center gap-1">
              <VIcon icon="tabler-phone" size="14" class="text-amber-700" />
              {{ sellerPhone }}
            </div>
          </div>

          <!-- 3. Car Title (Light Background with Black Text) -->
          <div class="bg-slate-100 border-2 border-slate-200 text-slate-900 rounded-xl p-3.5 mb-3.5 text-center shadow-sm">
            <h1 class="text-lg font-black text-slate-900 m-0 leading-snug dir-ltr">
              {{ carTitleEnOnly }}
            </h1>
          </div>

          <!-- 4. CENTER: Large QR Code -->
          <div class="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
            <div class="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 mb-3 flex items-center justify-center" style="width: 220px !important; height: 220px !important; margin: 0 auto !important;">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="Car QR Code"
                style="width: 194px !important; height: 194px !important; max-width: 194px !important; max-height: 194px !important; object-fit: contain !important; display: block !important; margin: 0 auto !important;"
              />
              <div v-else class="w-48 h-48 flex items-center justify-center text-slate-400">
                <VProgressCircular indeterminate color="primary" />
              </div>
            </div>
            <p class="text-xs font-black text-slate-800 m-0 flex items-center gap-1.5 justify-center">
              <VIcon icon="tabler-scan" size="16" class="text-amber-600" />
              لرؤية التفاصيل والسعر استخدم qr
            </p>
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






