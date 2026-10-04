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
// Reel / Story Reel Optimized Canvas Exporter (1080 x 1600 Vertical PNG)
// ---------------------------------------------------------
const downloadCardImage = async () => {
  isDownloading.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1600
    const ctx = canvas.getContext('2d')

    // 1. Dark Card Outer Background
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, 1080, 1600)

    // Outer Glow / Border Frame (Reddish-Orange Accent)
    ctx.strokeStyle = '#ff3d00'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.roundRect(24, 24, 1032, 1552, 38)
    ctx.stroke()

    // Inner Card Container
    ctx.fillStyle = '#0f1420'
    ctx.beginPath()
    ctx.roundRect(36, 36, 1008, 1528, 32)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 61, 0, 0.25)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 2. Load & Draw Car Image (Narrower aspect ratio, vertical Reel height: 1008px width x 740px height)
    const carImg = new Image()
    carImg.crossOrigin = 'anonymous'
    carImg.src = carImage.value
    await new Promise(resolve => {
      carImg.onload = resolve
      carImg.onerror = resolve
    })

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(36, 36, 1008, 740, 32)
    ctx.clip()

    if (carImg.complete && carImg.naturalWidth) {
      const imgRatio = carImg.naturalWidth / carImg.naturalHeight
      const targetRatio = 1008 / 740
      let renderW, renderH, offsetX, offsetY

      if (imgRatio > targetRatio) {
        renderH = 740
        renderW = 740 * imgRatio
        offsetX = 36 - (renderW - 1008) / 2
        offsetY = 36
      } else {
        renderW = 1008
        renderH = 1008 / imgRatio
        offsetX = 36
        offsetY = 36 - (renderH - 740) / 2
      }
      ctx.drawImage(carImg, offsetX, offsetY, renderW, renderH)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(36, 36, 1008, 740)
    }
    ctx.restore()

    // FEATURED Badge on Top Left of Image (No Heart Icon!)
    if (isFeatured.value) {
      ctx.fillStyle = '#ff6d00'
      ctx.beginPath()
      ctx.roundRect(60, 60, 220, 54, 27)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('★ FEATURED', 170, 95)
    }

    // 3. Card Title & Specifications
    let yCursor = 840

    ctx.direction = 'ltr'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 44px system-ui, sans-serif'

    const words = carTitle.value.split(' ')
    let currentLine = ''
    const lines = []
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(testLine).width > 940) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    if (currentLine) lines.push(currentLine)

    lines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 60, yCursor)
      yCursor += 56
    })

    yCursor += 20

    // Specs Line 1: Brand | Model | Local
    ctx.font = '600 28px system-ui, sans-serif'
    ctx.fillStyle = '#94a3b8'
    const specLine1 = `${brandName.value}  |  ${modelName.value}  |  ${props.car?.is_import ? 'Import' : 'Local'}`
    ctx.fillText(specLine1, 60, yCursor)

    yCursor += 44

    // Specs Line 2: Year | Condition
    const conditionText = props.car?.condition === 'new' ? 'New' : 'Used'
    const specLine2 = `${props.car?.year || ''}  |  ${conditionText}`
    ctx.fillText(specLine2, 60, yCursor)

    yCursor += 75

    // 4. PRICE & PHONE NUMBER ROW (NO PILL/OVAL BACKGROUND, GREEN PHONE TEXT!)
    ctx.font = 'bold 58px system-ui, sans-serif'
    ctx.fillStyle = '#ff8c00'
    ctx.fillText(formattedPrice.value, 60, yCursor)

    // Phone Number on Right Side of Price Row in WhatsApp/Call Green! (No Oval Container!)
    if (customPhone.value) {
      ctx.textAlign = 'right'
      ctx.font = 'bold 40px system-ui, sans-serif'
      ctx.fillStyle = '#25D366' // Vibrant WhatsApp Green!
      ctx.fillText(`📞 ${customPhone.value}`, 1020, yCursor)
    }

    yCursor += 60

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(60, yCursor)
    ctx.lineTo(1020, yCursor)
    ctx.stroke()

    yCursor += 65

    // 5. ENHANCED SHOWROOM FOOTER: Showroom Logo + Name + High Quality Verified Badge
    ctx.textAlign = 'left'

    // Showroom Logo Avatar
    const logoX = 60
    const logoY = yCursor - 30
    ctx.save()
    ctx.beginPath()
    ctx.arc(logoX + 36, logoY + 36, 36, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(logoX, logoY, 72, 72)

    if (sellerLogo.value) {
      const sLogoImg = new Image()
      sLogoImg.crossOrigin = 'anonymous'
      sLogoImg.src = sellerLogo.value
      await new Promise(resolve => {
        sLogoImg.onload = resolve
        sLogoImg.onerror = resolve
      })
      if (sLogoImg.complete && sLogoImg.naturalWidth) {
        ctx.drawImage(sLogoImg, logoX, logoY, 72, 72)
      }
    }
    ctx.restore()

    // Avatar Circle Border
    ctx.strokeStyle = 'rgba(255, 109, 0, 0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(logoX + 36, logoY + 36, 36, 0, Math.PI * 2)
    ctx.stroke()

    // Showroom Name (Crisp Bold White)
    const nameX = logoX + 90
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 34px system-ui, sans-serif'
    ctx.fillText(sellerName.value, nameX, yCursor + 18)

    const sellerNameW = ctx.measureText(sellerName.value).width

    // Enhanced Verified Badge Icon (Filled Cyan/Blue Badge Circle with White Checkmark)
    const badgeX = nameX + sellerNameW + 20
    const badgeY = yCursor + 7
    ctx.fillStyle = '#00d2ff'
    ctx.beginPath()
    ctx.arc(badgeX, badgeY, 15, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#0c1019'
    ctx.font = 'bold 18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✓', badgeX, badgeY + 6)

    // NegmCars.com Watermark on Right Side
    ctx.textAlign = 'right'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 26px system-ui, sans-serif'
    ctx.fillText('NegmCars.com', 1020, yCursor + 18)

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
    max-width="520"
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
            <h3 class="text-h6 font-weight-black mb-0 text-white">تحميل كارت الريل والسوشيال ميديا</h3>
            <span class="text-caption text-grey-lighten-1">تصميم رأسي مخصص للستوري والريلز (Reel Optimized)</span>
          </div>
        </div>

        <VBtn icon variant="text" size="small" @click="handleClose">
          <VIcon icon="tabler-x" />
        </VBtn>
      </div>

      <!-- Editable Phone Number Control -->
      <div class="phone-input-box mb-5 pa-4 rounded-xl border bg-slate-900">
        <label class="text-caption font-weight-bold text-grey-lighten-1 mb-2 d-block">
          <VIcon icon="tabler-phone" size="16" class="me-1 text-success" />
          رقم الهاتف الظاهر باللون الأخضر على الكارت (بدون أي خلفية):
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
        <div class="preview-header text-caption font-weight-bold text-grey-lighten-2 text-center mb-3">
          معاينة كارت الريلز (Reels / Stories Format)
        </div>

        <!-- Card Mockup Component (No Heart Icon, Green Phone Text, Enhanced Showroom Name & Verified Badge) -->
        <div class="car-share-card-mockup rounded-2xl overflow-hidden border max-w-400 mx-auto">
          <!-- Main Image -->
          <div class="card-media-box position-relative">
            <img :src="carImage" alt="Car Image" class="w-100 h-100 object-cover" />
            <div v-if="isFeatured" class="featured-badge position-absolute top-3 start-3">
              ★ FEATURED
            </div>
            <!-- NO HEART ICON AS REQUESTED -->
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

            <!-- Price & Green Phone Number (No Oval Background!) -->
            <div class="d-flex align-center justify-space-between gap-2 pt-2 pb-3 border-t border-b border-white-10">
              <div class="card-price text-h5 font-weight-black text-primary">
                {{ formattedPrice }} <span class="text-caption font-weight-bold">EGP</span>
              </div>
              <div class="card-phone-green text-subtitle-1 font-weight-black text-success d-inline-flex align-center">
                <VIcon icon="tabler-phone-calling" size="18" class="me-1 text-success" />
                {{ customPhone }}
              </div>
            </div>

            <!-- Footer: Enhanced Showroom Name & Verified Badge -->
            <div class="d-flex align-center justify-space-between pt-3 text-caption text-grey-lighten-1">
              <div class="d-flex align-center gap-2">
                <VAvatar size="26" class="border border-primary">
                  <img v-if="sellerLogo" :src="sellerLogo" alt="logo" />
                  <VIcon v-else icon="tabler-building-store" size="14" color="primary" />
                </VAvatar>
                <span class="font-weight-black text-white text-subtitle-2">{{ sellerName }}</span>
                <VIcon icon="tabler-discount-check-filled" color="info" size="18" class="ms-0.5" />
              </div>
              <span class="text-xxs font-weight-bold text-grey-lighten-1">NegmCars.com</span>
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
          تحميل صورة الريل (PNG)
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

.max-w-400 {
  max-width: 400px;
}

.car-share-card-mockup {
  background: #0f1420;
  border: 1px solid rgba(255, 61, 0, 0.4) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

.card-media-box {
  height: 250px;
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

.border-white-10 {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.shadow-primary {
  box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.4) !important;
}
</style>
