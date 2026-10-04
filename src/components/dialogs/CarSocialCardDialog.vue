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
// Reel / Story Reel Optimized Canvas Exporter (Tightly Cropped Vertical PNG)
// ---------------------------------------------------------
const downloadCardImage = async () => {
  isDownloading.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = 1060 // Tightly cropped height (Ends right below showroom footer)
    const ctx = canvas.getContext('2d')

    // 1. Dark Card Outer Background
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, 900, 1060)

    // Outer Glow / Border Frame (Reddish-Orange Accent)
    ctx.strokeStyle = '#ff3d00'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.roundRect(20, 20, 860, 1020, 36)
    ctx.stroke()

    // Inner Card Container
    ctx.fillStyle = '#0f1420'
    ctx.beginPath()
    ctx.roundRect(32, 32, 836, 996, 28)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 61, 0, 0.25)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 2. Load & Draw Car Image (836px width x 560px height)
    const carImg = new Image()
    carImg.crossOrigin = 'anonymous'
    carImg.src = carImage.value
    await new Promise(resolve => {
      carImg.onload = resolve
      carImg.onerror = resolve
    })

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(32, 32, 836, 560, 28)
    ctx.clip()

    if (carImg.complete && carImg.naturalWidth) {
      const imgRatio = carImg.naturalWidth / carImg.naturalHeight
      const targetRatio = 836 / 560
      let renderW, renderH, offsetX, offsetY

      if (imgRatio > targetRatio) {
        renderH = 560
        renderW = 560 * imgRatio
        offsetX = 32 - (renderW - 836) / 2
        offsetY = 32
      } else {
        renderW = 836
        renderH = 836 / imgRatio
        offsetX = 32
        offsetY = 32 - (renderH - 560) / 2
      }
      ctx.drawImage(carImg, offsetX, offsetY, renderW, renderH)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(32, 32, 836, 560)
    }
    ctx.restore()

    // FEATURED Badge on Top Left of Image
    if (isFeatured.value) {
      ctx.fillStyle = '#ff6d00'
      ctx.beginPath()
      ctx.roundRect(52, 52, 200, 48, 24)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 20px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('★ FEATURED', 152, 83)
    }

    // 3. Card Title & Specifications
    let yCursor = 650

    ctx.direction = 'ltr'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 38px system-ui, sans-serif'

    const words = carTitle.value.split(' ')
    let currentLine = ''
    const lines = []
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(testLine).width > 770) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    if (currentLine) lines.push(currentLine)

    lines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 55, yCursor)
      yCursor += 48
    })

    yCursor += 15

    // Specs Line 1: Brand | Model | Local
    ctx.font = '600 24px system-ui, sans-serif'
    ctx.fillStyle = '#94a3b8'
    const specLine1 = `${brandName.value}  |  ${modelName.value}  |  ${props.car?.is_import ? 'Import' : 'Local'}`
    ctx.fillText(specLine1, 55, yCursor)

    yCursor += 38

    // Specs Line 2: Year | Condition
    const conditionText = props.car?.condition === 'new' ? 'New' : 'Used'
    const specLine2 = `${props.car?.year || ''}  |  ${conditionText}`
    ctx.fillText(specLine2, 55, yCursor)

    yCursor += 65

    // 4. PRICE & PHONE NUMBER ROW (GREEN CALL ICON + GREEN PHONE TEXT!)
    ctx.font = 'bold 50px system-ui, sans-serif'
    ctx.fillStyle = '#ff8c00'
    ctx.fillText(formattedPrice.value, 55, yCursor)

    // Phone Number on Right Side with Green Call Icon
    if (customPhone.value) {
      ctx.textAlign = 'right'
      ctx.font = 'bold 34px system-ui, sans-serif'
      ctx.fillStyle = '#25D366' // Vibrant WhatsApp Green!
      ctx.fillText(customPhone.value, 845, yCursor)

      // Measure phone text width to draw green call icon in front of it
      const phoneW = ctx.measureText(customPhone.value).width
      const iconX = 845 - phoneW - 40
      const iconY = yCursor - 28

      // Draw Green Handset Icon
      ctx.save()
      ctx.fillStyle = '#25D366'
      ctx.translate(iconX, iconY)
      const handsetPath = new Path2D("M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z")
      ctx.scale(1.2, 1.2)
      ctx.fill(handsetPath)
      ctx.restore()
    }

    yCursor += 45

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(55, yCursor)
    ctx.lineTo(845, yCursor)
    ctx.stroke()

    yCursor += 55

    // 5. SHOWROOM FOOTER: Showroom Logo + Name + Verified Badge + ORANGE NegmCars.com (Right at the bottom!)
    ctx.textAlign = 'left'

    // Showroom Logo Avatar
    const logoX = 55
    const logoY = yCursor - 28
    ctx.save()
    ctx.beginPath()
    ctx.arc(logoX + 32, logoY + 32, 32, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(logoX, logoY, 64, 64)

    if (sellerLogo.value) {
      const sLogoImg = new Image()
      sLogoImg.crossOrigin = 'anonymous'
      sLogoImg.src = sellerLogo.value
      await new Promise(resolve => {
        sLogoImg.onload = resolve
        sLogoImg.onerror = resolve
      })
      if (sLogoImg.complete && sLogoImg.naturalWidth) {
        ctx.drawImage(sLogoImg, logoX, logoY, 64, 64)
      }
    }
    ctx.restore()

    // Avatar Circle Border
    ctx.strokeStyle = 'rgba(255, 109, 0, 0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(logoX + 32, logoY + 32, 32, 0, Math.PI * 2)
    ctx.stroke()

    // Showroom Name (Crisp Bold White)
    const nameX = logoX + 80
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 30px system-ui, sans-serif'
    ctx.fillText(sellerName.value, nameX, yCursor + 14)

    const sellerNameW = ctx.measureText(sellerName.value).width

    // Verified Badge Icon (Filled Cyan Badge Circle with White Checkmark)
    const badgeX = nameX + sellerNameW + 18
    const badgeY = yCursor + 4
    ctx.fillStyle = '#00d2ff'
    ctx.beginPath()
    ctx.arc(badgeX, badgeY, 13, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#0c1019'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✓', badgeX, badgeY + 5)

    // NegmCars.com Watermark on Right Side in ORANGE!
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ff6d00' // Orange Color!
    ctx.font = 'bold 25px system-ui, sans-serif'
    ctx.fillText('NegmCars.com', 845, yCursor + 14)

    // Trigger Image Download
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `NegmCars-ReelCard-${props.car?.id || 'promo'}.png`
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
    max-width="450"
    persistent
    @update:model-value="val => emit('update:isDialogVisible', val)"
  >
    <VCard class="social-card-modal pa-5 rounded-3xl elevation-24">
      <!-- Modal Header -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-2">
          <VAvatar color="primary" variant="tonal" size="38">
            <VIcon icon="tabler-photo-share" size="20" />
          </VAvatar>
          <div>
            <h3 class="text-h6 font-weight-black mb-0 text-white">تحميل كارت الريل والسوشيال ميديا</h3>
            <span class="text-caption text-grey-lighten-1">تصميم رأسي مخصص للستوري والريلز (Reel Optimized)</span>
          </div>
        </div>

        <VBtn icon variant="text" size="small" @click="handleClose">
          <VIcon icon="tabler-x" />
        </VBtn>
      </div>

      <!-- Editable Phone Number Control -->
      <div class="phone-input-box mb-4 pa-3 rounded-xl border bg-slate-900">
        <label class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-block">
          <VIcon icon="tabler-phone" size="16" class="me-1 style-green-icon" />
          رقم الهاتف الظاهر باللون الأخضر على الكارت:
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
      <div class="card-preview-container mb-5 pa-3 rounded-2xl border bg-black">
        <div class="preview-header text-caption font-weight-bold text-grey-lighten-2 text-center mb-3">
          معاينة كارت الريلز (Reels / Stories Format)
        </div>

        <!-- Card Mockup Component (Tightly cropped height right below showroom footer) -->
        <div class="car-share-card-mockup rounded-2xl overflow-hidden border max-w-330 mx-auto">
          <!-- Main Image -->
          <div class="card-media-box position-relative">
            <img :src="carImage" alt="Car Image" class="w-100 h-100 object-cover" />
            <div v-if="isFeatured" class="featured-badge position-absolute top-3 start-3">
              ★ FEATURED
            </div>
          </div>

          <!-- Card Content (Tightly wrapped, no empty dark space below footer) -->
          <div class="card-body-box pa-4 pb-3">
            <h4 class="card-title text-h6 font-weight-black text-white mb-2 line-clamp-2">
              {{ carTitle }}
            </h4>

            <div class="card-specs-line text-caption font-weight-medium text-grey-lighten-1 mb-1">
              {{ brandName }} &nbsp;|&nbsp; {{ modelName }} &nbsp;|&nbsp; {{ props.car?.is_import ? 'Import' : 'Local' }}
            </div>
            <div class="card-specs-line text-caption font-weight-medium text-grey-lighten-1 mb-4">
              {{ props.car?.year }} &nbsp;|&nbsp; {{ props.car?.condition === 'new' ? 'New' : 'Used' }}
            </div>

            <!-- Price & Green Phone Number + Green Icon -->
            <div class="d-flex align-center justify-space-between gap-2 pt-2 pb-2 border-t border-b border-white-10 mb-3">
              <div class="card-price text-h6 font-weight-black text-primary">
                {{ formattedPrice }} <span class="text-caption font-weight-bold">EGP</span>
              </div>
              <div class="card-phone-green text-subtitle-2 font-weight-black d-inline-flex align-center">
                <VIcon icon="tabler-phone-calling" size="16" class="me-1 style-green-icon" />
                {{ customPhone }}
              </div>
            </div>

            <!-- Footer: Showroom Name & Verified Badge + Orange NegmCars.com at the Bottom -->
            <div class="d-flex align-center justify-space-between pt-1 pb-1 text-caption">
              <div class="d-flex align-center gap-1.5">
                <VAvatar size="24" class="border border-primary">
                  <img v-if="sellerLogo" :src="sellerLogo" alt="logo" />
                  <VIcon v-else icon="tabler-building-store" size="14" color="primary" />
                </VAvatar>
                <span class="font-weight-black text-white text-subtitle-2">{{ sellerName }}</span>
                <VIcon icon="tabler-discount-check-filled" color="info" size="16" class="ms-0.5" />
              </div>
              <span class="text-xs font-weight-black text-orange-domain">NegmCars.com</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex align-center gap-3">
        <VBtn
          color="primary"
          block
          height="48"
          size="large"
          rounded="pill"
          class="font-weight-black shadow-primary text-subtitle-1 flex-grow-1"
          :loading="isDownloading"
          @click="downloadCardImage"
        >
          <VIcon icon="tabler-download" class="me-2" size="20" />
          تحميل صورة الريل (PNG)
        </VBtn>

        <VBtn
          variant="tonal"
          color="secondary"
          height="48"
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

.max-w-330 {
  max-width: 330px;
}

.car-share-card-mockup {
  background: #0f1420;
  border: 1px solid rgba(255, 61, 0, 0.4) !important;
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
  padding: 4px 12px;
  border-radius: 9999px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.card-phone-green {
  color: #25D366 !important;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(37, 211, 102, 0.2);
}

.style-green-icon {
  color: #25D366 !important;
}

.text-orange-domain {
  color: #ff6d00 !important;
  text-shadow: 0 0 8px rgba(255, 109, 0, 0.25);
}

.border-white-10 {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.4) !important;
}
</style>
