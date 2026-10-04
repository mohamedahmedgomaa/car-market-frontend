<script setup>
import { ref, watch, computed } from 'vue'

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

const isDownloading = ref(false)
const customPhone = ref('')

// Watch car to update phone number default
watch(
  () => props.car,
  (newCar) => {
    if (newCar) {
      customPhone.value = newCar.seller?.phone || newCar.phone_number || newCar.phone || '+20 155 155 2993'
    }
  },
  { immediate: true }
)

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

const carTitle = computed(() => {
  if (!props.car) return ''
  if (typeof props.car.title === 'object') {
    return props.car.title.en || props.car.title.ar || ''
  }
  if (typeof props.car.title === 'string' && props.car.title.trim()) {
    return props.car.title
  }
  return `${brandName.value} ${modelName.value} ${props.car.year || ''}`.trim()
})

const carImage = computed(() => {
  if (!props.car) return 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80'
  if (props.car.main_image) return props.car.main_image
  if (Array.isArray(props.car.images) && props.car.images.length > 0) {
    const first = props.car.images[0]
    return typeof first === 'string' ? first : first.url || first.path
  }
  return 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80'
})

const formattedPrice = computed(() => {
  if (!props.car?.price) return '—'
  const p = Number(props.car.price)
  if (Number.isNaN(p)) return props.car.price
  return p.toLocaleString()
})

const sellerName = computed(() => {
  if (!props.car?.seller) return 'NegmCars'
  const s = props.car.seller
  if (typeof s.store_name === 'object' && s.store_name) {
    return s.store_name.en || s.store_name.ar || s.name || 'NegmCars'
  }
  return s.store_name || s.name || 'NegmCars'
})

const sellerLogo = computed(() => {
  if (!props.car?.seller) return ''
  return props.car.seller.store_logo || props.car.seller.logo || ''
})

const isFeatured = computed(() => Boolean(props.car?.is_featured))

const handleClose = () => {
  emit('update:isDialogVisible', false)
}

// ---------------------------------------------------------
// Ultra High Resolution Canvas Exporter (1080 x 1350 4:5 PNG)
// ---------------------------------------------------------
const downloadCardImage = async () => {
  isDownloading.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    const ctx = canvas.getContext('2d')

    // 1. Dark Card Background
    ctx.fillStyle = '#0c1019'
    ctx.fillRect(0, 0, 1080, 1350)

    // Outer Glow / Border Frame
    ctx.strokeStyle = '#ff6d00'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.roundRect(24, 24, 1032, 1302, 36)
    ctx.stroke()

    // 2. Load Car Image
    const carImg = new Image()
    carImg.crossOrigin = 'anonymous'
    carImg.src = carImage.value
    await new Promise(resolve => {
      carImg.onload = resolve
      carImg.onerror = resolve
    })

    // Draw Car Image (Top Container: 1000px width x 620px height)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(40, 40, 1000, 620, 28)
    ctx.clip()

    if (carImg.complete && carImg.naturalWidth) {
      // Cover crop calculation
      const imgRatio = carImg.naturalWidth / carImg.naturalHeight
      const targetRatio = 1000 / 620
      let renderW, renderH, offsetX, offsetY

      if (imgRatio > targetRatio) {
        renderH = 620
        renderW = 620 * imgRatio
        offsetX = 40 - (renderW - 1000) / 2
        offsetY = 40
      } else {
        renderW = 1000
        renderH = 1000 / imgRatio
        offsetX = 40
        offsetY = 40 - (renderH - 620) / 2
      }
      ctx.drawImage(carImg, offsetX, offsetY, renderW, renderH)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(40, 40, 1000, 620)
    }
    ctx.restore()

    // FEATURED Badge on Top Left of Image
    if (isFeatured.value) {
      ctx.fillStyle = '#ff6d00'
      ctx.beginPath()
      ctx.roundRect(64, 64, 210, 52, 26)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('★ FEATURED', 169, 98)
    }

    // Heart Icon Circle on Top Right
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
    ctx.beginPath()
    ctx.arc(976, 90, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = '26px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('♥', 976, 98)

    // 3. Card Title & Specifications (Middle Content Area)
    let yCursor = 720

    ctx.direction = 'ltr'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 44px system-ui, sans-serif'

    // Multi-line title wrap (max width 980px)
    const words = carTitle.value.split(' ')
    let currentLine = ''
    const lines = []
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(testLine).width > 980) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    if (currentLine) lines.push(currentLine)

    lines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 50, yCursor)
      yCursor += 54
    })

    yCursor += 16

    // Specs Line 1: Brand | Model | Local
    ctx.font = '600 28px system-ui, sans-serif'
    ctx.fillStyle = '#94a3b8'
    const specLine1 = `${brandName.value}  |  ${modelName.value}  |  ${props.car?.is_import ? 'Import' : 'Local'}`
    ctx.fillText(specLine1, 50, yCursor)

    yCursor += 42

    // Specs Line 2: Year | Condition
    const conditionText = props.car?.condition === 'new' ? 'New' : 'Used'
    const specLine2 = `${props.car?.year || ''}  |  ${conditionText}`
    ctx.fillText(specLine2, 50, yCursor)

    yCursor += 65

    // 4. PRICE & PHONE NUMBER ROW (REPLACES LOCATION AS REQUESTED BY USER)
    ctx.font = 'bold 54px system-ui, sans-serif'
    ctx.fillStyle = '#ff8c00'
    ctx.fillText(formattedPrice.value, 50, yCursor)

    // Phone Number on Right side of Price Row
    if (customPhone.value) {
      ctx.textAlign = 'right'
      ctx.font = 'bold 34px system-ui, sans-serif'
      ctx.fillStyle = '#ffffff'
      
      // Phone pill container
      ctx.beginPath()
      ctx.roundRect(580, yCursor - 46, 450, 62, 31)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#38bdf8'
      ctx.fillText(`📞 ${customPhone.value}`, 1000, yCursor - 4)
    }

    yCursor += 50

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, yCursor)
    ctx.lineTo(1030, yCursor)
    ctx.stroke()

    yCursor += 50

    // 5. FOOTER ROW: Seller Logo + Seller Name + Verified Badge + Timestamp
    ctx.textAlign = 'left'

    // Seller Logo Circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(90, yCursor + 20, 36, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(54, yCursor - 16, 72, 72)

    if (sellerLogo.value) {
      const sLogoImg = new Image()
      sLogoImg.crossOrigin = 'anonymous'
      sLogoImg.src = sellerLogo.value
      await new Promise(resolve => {
        sLogoImg.onload = resolve
        sLogoImg.onerror = resolve
      })
      if (sLogoImg.complete && sLogoImg.naturalWidth) {
        ctx.drawImage(sLogoImg, 54, yCursor - 16, 72, 72)
      }
    }
    ctx.restore()

    // Seller Name & Verified Badge
    ctx.fillStyle = '#c084fc'
    ctx.font = 'bold 32px system-ui, sans-serif'
    ctx.fillText(sellerName.value, 145, yCursor + 28)

    const sellerNameW = ctx.measureText(sellerName.value).width
    ctx.fillStyle = '#38bdf8'
    ctx.font = '24px system-ui'
    ctx.fillText('✓', 155 + sellerNameW, yCursor + 28)

    // Timestamp / Branding Watermark on Right
    ctx.textAlign = 'right'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 26px system-ui, sans-serif'
    ctx.fillText('NegmCars.com • Available Now', 1030, yCursor + 28)

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `NegmCars-PromoCard-${props.car?.id || 'share'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    console.error('Failed to export social card image:', err)
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="isDialogVisible"
    max-width="580"
    persistent
    @update:model-value="val => emit('update:isDialogVisible', val)"
  >
    <VCard class="social-card-modal pa-6 rounded-3xl elevation-24">
      <!-- Modal Header -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-2">
          <VAvatar color="primary" variant="tonal" size="40">
            <VIcon icon="tabler-photo-share" size="22" />
          </VAvatar>
          <div>
            <h3 class="text-h6 font-weight-black mb-0 text-white">تحميل كارت الإعلان للسوشيال ميديا</h3>
            <span class="text-caption text-grey-lighten-1">بطاقة مصممة خصيصاً للإنستغرام والتواصل</span>
          </div>
        </div>

        <VBtn icon variant="text" size="small" @click="handleClose">
          <VIcon icon="tabler-x" />
        </VBtn>
      </div>

      <!-- Editable Phone Number Control -->
      <div class="phone-input-box mb-5 pa-4 rounded-xl border bg-slate-900">
        <label class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-block">
          <VIcon icon="tabler-phone" size="16" class="me-1 text-primary" />
          رقم الهاتف الظاهر على كارت الصورة (بدلاً من الموقع الجغرافي):
        </label>
        <VTextField
          v-model="customPhone"
          placeholder="أدخل رقم الهاتف للاتصال"
          variant="outlined"
          density="comfortable"
          hide-details
          class="phone-field"
          prefix="📞"
        />
      </div>

      <!-- Live Interactive Preview of Card -->
      <div class="card-preview-container mb-6 pa-3 rounded-2xl border bg-black">
        <div class="preview-header text-caption font-weight-bold text-grey-lighten-2 text-center mb-2">
          معاينة الكارت المصدر (يحتوي على رقم الهاتف بدلاً من الموقع الجغرافي)
        </div>

        <!-- Card Mockup Component matching Image 1 -->
        <div class="car-share-card-mockup rounded-2xl overflow-hidden border">
          <!-- Main Image -->
          <div class="card-media-box position-relative">
            <img :src="carImage" alt="Car Image" class="w-100 h-100 object-cover" />
            <div v-if="isFeatured" class="featured-badge position-absolute top-3 start-3">
              ★ FEATURED
            </div>
            <div class="heart-btn position-absolute top-3 end-3">
              ♥
            </div>
          </div>

          <!-- Card Content -->
          <div class="card-body-box pa-5">
            <h4 class="card-title text-h6 font-weight-black text-white mb-2 line-clamp-2">
              {{ carTitle }}
            </h4>

            <div class="card-specs-line text-caption font-weight-medium text-grey-lighten-1 mb-1">
              {{ brandName }} &nbsp;|&nbsp; {{ modelName }} &nbsp;|&nbsp; {{ props.car?.is_import ? 'Import' : 'Local' }}
            </div>
            <div class="card-specs-line text-caption font-weight-medium text-grey-lighten-1 mb-4">
              {{ props.car?.year }} &nbsp;|&nbsp; {{ props.car?.condition === 'new' ? 'New' : 'Used' }}
            </div>

            <!-- Price & Custom Phone Row -->
            <div class="d-flex align-center justify-space-between gap-2 pt-2 pb-3 border-t border-b border-white-10">
              <div class="card-price text-h5 font-weight-black text-primary">
                {{ formattedPrice }} <span class="text-caption font-weight-bold">EGP</span>
              </div>
              <div class="card-phone-pill d-inline-flex align-center px-3 py-1 rounded-pill bg-info-subtle text-info text-caption font-weight-bold">
                <VIcon icon="tabler-phone-calling" size="14" class="me-1" />
                {{ customPhone }}
              </div>
            </div>

            <!-- Footer -->
            <div class="d-flex align-center justify-space-between pt-3 text-caption text-grey-lighten-1">
              <div class="d-flex align-center gap-2">
                <VAvatar size="24" color="surface">
                  <img v-if="sellerLogo" :src="sellerLogo" alt="logo" />
                  <VIcon v-else icon="tabler-building-store" size="14" />
                </VAvatar>
                <span class="font-weight-bold text-white">{{ sellerName }}</span>
                <VIcon icon="tabler-discount-check-filled" color="info" size="16" />
              </div>
              <span class="text-xxs">NegmCars.com</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex align-center gap-3">
        <VBtn
          color="primary"
          block
          height="52"
          size="large"
          rounded="pill"
          class="font-weight-black shadow-primary text-subtitle-1 flex-grow-1"
          :loading="isDownloading"
          @click="downloadCardImage"
        >
          <VIcon icon="tabler-download" class="me-2" size="22" />
          تحميل صورة الكارت (PNG)
        </VBtn>

        <VBtn
          variant="tonal"
          color="secondary"
          height="52"
          rounded="pill"
          class="font-weight-bold"
          @click="handleClose"
        >
          إلغاء
        </VBtn>
      </div>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.social-card-modal {
  background: rgba(15, 23, 42, 0.96) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(25px);
}

.car-share-card-mockup {
  background: #0f1420;
  border: 1px solid rgba(255, 109, 0, 0.4) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

.card-media-box {
  height: 220px;
  background: #1e293b;
  overflow: hidden;
}

.featured-badge {
  background: linear-gradient(135deg, #ff6d00, #ff9f43);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 9999px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.heart-btn {
  background: rgba(15, 23, 42, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-phone-pill {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.border-white-10 {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.4) !important;
}
</style>
