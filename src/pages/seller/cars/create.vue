<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import carSellerApi from '../../../api/seller/carSellerApi.js'
import brandUserApi from '../../../api/user/brandUserApi.js'
import modelUserApi from '../../../api/user/modelUserApi.js'
import countryUserApi from '../../../api/user/countryUserApi.js'
import governorateUserApi from '../../../api/user/governorateUserApi.js'
import cityUserApi from '../../../api/user/cityUserApi.js'
import FeaturesManager from '@/components/FeaturesManager.vue'
import PageHeroHeader from '@/components/PageHeroHeader.vue'
import { customBrandFilter } from '@/utils/brandTranslations.js'
import { processCarImages } from '@/utils/imageProcessor.js'

const router = useRouter()

/* ================= Wizard Step State ================= */
const currentStep = ref(1)
const showSmartParser = ref(false)

const steps = [
  { step: 1, title: 'هوية المركبة', subtitle: 'النوع والماركة والموديل', icon: 'tabler-car' },
  { step: 2, title: 'المواصفات الفنية', subtitle: 'المحرك، الفتيس، العداد', icon: 'tabler-engine' },
  { step: 3, title: 'السعر والموقع', subtitle: 'السعر والتواصل والمكان', icon: 'tabler-cash' },
  { step: 4, title: 'الصور والمميزات', subtitle: 'صور الإعلان والوصف', icon: 'tabler-photo' },
  { step: 5, title: 'مراجعة ونشر', subtitle: 'المعاينة النهائية للإعلان', icon: 'tabler-send' },
]

const progressPercent = computed(() => ((currentStep.value) / steps.length) * 100)

/* ================= Form State ================= */
const form = ref({
  brand_id: null,
  model_id: null,

  country_id: null,
  governorate_id: null,
  city_id: null,

  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',

  price: '',
  year: new Date().getFullYear(),
  mileage: '',

  type: 'car',
  transmission: 'automatic',
  fuel_type: 'petrol',
  drivetrain: 'FWD',
  color: '#FFFFFF',
  condition: 'used',
  is_import: '0',
  cylinders: 4,
  engine_capacity: '1600',
  acceleration: '',
  weight: '',

  phone_number: '',
  whatsapp_number: '',

  features: [],
  images: [],
  main_image: null,
})

const brands = ref([])
const models = ref([])
const features = ref([])
const countries = ref([])
const governorates = ref([])
const cities = ref([])

const imagePreviews = ref([])
const isDragging = ref(false)

const loading = ref(false)
const errors = ref({})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

/* ================= Smart Parser State ================= */
const pastedSpecsText = ref('')
const specsFeedbackMessage = ref('')

const commonColors = [
  { name: 'أبيض / White', hex: '#FFFFFF' },
  { name: 'أسود / Black', hex: '#000000' },
  { name: 'فضي / Silver', hex: '#C0C0C0' },
  { name: 'رمادي / Grey', hex: '#808080' },
  { name: 'أحمر / Red', hex: '#E53935' },
  { name: 'أزرق / Blue', hex: '#1E88E5' },
  { name: 'بني / Brown', hex: '#6D4C41' },
  { name: 'بيج / Beige', hex: '#F5F5DC' },
  { name: 'ذهبي / Gold', hex: '#FFD700' },
  { name: 'كحلي / Navy', hex: '#0D47A1' },
]

const engineCapacityOptions = [
  { title: '1000 CC (1.0L)', value: '1000' },
  { title: '1200 CC (1.2L)', value: '1200' },
  { title: '1300 CC (1.3L)', value: '1300' },
  { title: '1400 CC (1.4L Turbo)', value: '1400' },
  { title: '1500 CC (1.5L Turbo)', value: '1500' },
  { title: '1600 CC (1.6L)', value: '1600' },
  { title: '1800 CC (1.8L)', value: '1800' },
  { title: '2000 CC (2.0L Turbo)', value: '2000' },
  { title: '2400 CC (2.4L)', value: '2400' },
  { title: '2500 CC (2.5L)', value: '2500' },
  { title: '3000 CC (3.0L V6)', value: '3000' },
  { title: '3500 CC (3.5L V6)', value: '3500' },
  { title: '4000 CC+ (V8)', value: '4000' },
  { title: 'كهرباء بالكامل (Electric - 0 CC)', value: '0' },
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear() + 1
  const years = []
  for (let y = currentYear; y >= 1990; y--) {
    years.push(y)
  }
  return years
})

const safeItemTitle = (obj) => obj?.name?.ar ? `${obj.name.ar} (${obj.name.en || ''})` : (obj?.name?.en ?? obj?.name ?? '-')

/* ================= Auto Title Suggester ================= */
const suggestTitles = () => {
  const brandObj = brands.value.find(b => b.id === form.value.brand_id)
  const modelObj = models.value.find(m => m.id === form.value.model_id)
  const brandNameAr = brandObj?.name?.ar || brandObj?.name?.en || ''
  const brandNameEn = brandObj?.name?.en || brandObj?.name?.ar || ''
  const modelNameAr = modelObj?.name?.ar || modelObj?.name?.en || ''
  const modelNameEn = modelObj?.name?.en || modelObj?.name?.ar || ''
  const year = form.value.year || ''

  if (brandNameAr && modelNameAr) {
    if (!form.value.title_ar) {
      form.value.title_ar = `${brandNameAr} ${modelNameAr} موديل ${year} بحالة ممتازة`
    }
    if (!form.value.title_en) {
      form.value.title_en = `${brandNameEn} ${modelNameEn} ${year}`
    }
  }
}

/* ================= Loaders ================= */
const loadModels = async () => {
  form.value.model_id = null
  if (!form.value.brand_id) return

  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': form.value.brand_id })
    models.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load models:', err)
  }
}

const loadGovernorates = async () => {
  form.value.governorate_id = null
  form.value.city_id = null
  governorates.value = []
  cities.value = []
  if (!form.value.country_id) return

  try {
    const res = await governorateUserApi.getAll({ 'filter[country_id]': form.value.country_id })
    governorates.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load governorates:', err)
  }
}

const loadCities = async () => {
  form.value.city_id = null
  cities.value = []
  if (!form.value.governorate_id) return

  try {
    const res = await cityUserApi.getAll({ 'filter[governorate_id]': form.value.governorate_id })
    cities.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load cities:', err)
  }
}

/* ================= Smart Parser Logic ================= */
const handleParseSpecs = async () => {
  if (!pastedSpecsText.value.trim()) return

  const text = pastedSpecsText.value
  let matchedCount = 0
  const extractedDetails = []
  const cleanVal = (v) => v.replace(/^['"\s]+|['"\s]+$/g, '').trim()

  const keysList = [
    { field: 'type', synonyms: ['type', 'النوع', 'نوع المركبة', 'نوع'] },
    { field: 'brand_id', synonyms: ['brand', 'الماركة', 'الشركة', 'ماركة', 'شركة'] },
    { field: 'model_id', synonyms: ['model', 'الموديل', 'موديل', 'طراز'] },
    { field: 'price', synonyms: ['price', 'السعر', 'سعر', 'المطلوب'] },
    { field: 'year', synonyms: ['year', 'السنة', 'سنة', 'سنة الصنع', 'عام', 'موديل'] },
    { field: 'mileage', synonyms: ['mileage', 'الممشى', 'ممشى', 'العداد', 'عداد', 'المسافة المقطوعة'] },
    { field: 'engine_capacity', synonyms: ['engine capacity', 'engine', 'سعة المحرك', 'المحرك', 'سعة', 'cc'] },
    { field: 'cylinders', synonyms: ['cylinders', 'سلندر', 'السلندرات', 'عدد السلندرات'] },
    { field: 'transmission', synonyms: ['transmission', 'ناقل الحركة', 'الفتيس', 'ناقل', 'جير'] },
    { field: 'fuel_type', synonyms: ['fuel type', 'fuel', 'نوع الوقود', 'الوقود'] },
    { field: 'drivetrain', synonyms: ['drivetrain', 'نظام الدفع', 'الدفع'] },
    { field: 'condition', synonyms: ['condition', 'الحالة', 'حالة السيارة'] },
    { field: 'color', synonyms: ['color', 'اللون', 'لون'] },
  ]

  const lines = text.split(/\r?\n/)
  const keyValueMap = {}
  lines.forEach(line => {
    const match = line.match(/^\s*(.+?)\s*[:=-]\s*(.*)$/)
    if (match) {
      const potKey = match[1].toLowerCase().trim()
      const val = match[2].trim()
      for (const item of keysList) {
        if (item.synonyms.includes(potKey)) {
          keyValueMap[item.field] = cleanVal(val)
          break
        }
      }
    }
  })

  // Match Brand
  let brandVal = keyValueMap['brand_id']
  if (brandVal && brands.value.length) {
    const bLower = brandVal.toLowerCase().trim()
    const foundBrand = brands.value.find(b => {
      const en = String(b.name?.en ?? b.name ?? '').toLowerCase()
      const ar = String(b.name?.ar ?? b.name ?? '').toLowerCase()
      return en === bLower || ar === bLower || en.includes(bLower) || ar.includes(bLower)
    })
    if (foundBrand) {
      form.value.brand_id = foundBrand.id
      matchedCount++
      extractedDetails.push(`الماركة: ${foundBrand.name?.ar || foundBrand.name?.en}`)
      await loadModels()
    }
  }

  // Match Model
  let modelVal = keyValueMap['model_id']
  if (form.value.brand_id && models.value.length) {
    const mLower = (modelVal || '').toLowerCase().trim()
    const foundModel = models.value.find(m => {
      const en = String(m.name?.en ?? m.name ?? '').toLowerCase()
      const ar = String(m.name?.ar ?? m.name ?? '').toLowerCase()
      return (mLower && (en === mLower || ar === mLower || en.includes(mLower))) || (en && text.toLowerCase().includes(en))
    })
    if (foundModel) {
      form.value.model_id = foundModel.id
      matchedCount++
      extractedDetails.push(`الموديل: ${foundModel.name?.en}`)
    }
  }

  // Price
  if (keyValueMap['price']) {
    const num = keyValueMap['price'].replace(/[^\d.]/g, '')
    if (num) {
      form.value.price = num
      matchedCount++
      extractedDetails.push(`السعر: ${Number(num).toLocaleString()} EGP`)
    }
  }

  // Year
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/)
  if (yearMatch) {
    form.value.year = Number(yearMatch[1])
    matchedCount++
    extractedDetails.push(`السنة: ${yearMatch[1]}`)
  }

  // Mileage
  if (keyValueMap['mileage']) {
    const km = keyValueMap['mileage'].replace(/[^\d]/g, '')
    if (km) {
      form.value.mileage = km
      matchedCount++
      extractedDetails.push(`العداد: ${km} km`)
    }
  }

  suggestTitles()

  if (matchedCount > 0) {
    specsFeedbackMessage.value = `تم استخراج ${matchedCount} حقول بنجاح: ${extractedDetails.join(' | ')}`
    showSmartParser.value = false
  } else {
    specsFeedbackMessage.value = 'لم يتم التعرف على مواصفات مطابقة تلقائياً. يمكنك تعبئة الحقول يدوياً.'
  }
}

/* ================= Images Management ================= */
const handleFilesSelect = async (files) => {
  if (!files || !files.length) return

  const fileArray = Array.from(files)
  const processed = await processCarImages(fileArray, 20)
  form.value.images = [...form.value.images, ...processed]

  processed.forEach((file) => {
    imagePreviews.value.push({
      file,
      url: URL.createObjectURL(file),
    })
  })

  if (form.value.main_image === null && imagePreviews.value.length > 0) {
    form.value.main_image = 0
  }
}

const onDropFiles = (e) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    handleFilesSelect(e.dataTransfer.files)
  }
}

const removeImage = (idx) => {
  if (imagePreviews.value[idx]?.url) {
    URL.revokeObjectURL(imagePreviews.value[idx].url)
  }
  imagePreviews.value.splice(idx, 1)
  form.value.images.splice(idx, 1)

  if (form.value.main_image === idx) {
    form.value.main_image = imagePreviews.value.length ? 0 : null
  } else if (form.value.main_image > idx) {
    form.value.main_image--
  }
}

const setAsMainImage = (idx) => {
  form.value.main_image = idx
}

/* ================= Step Navigation & Validation ================= */
const validateStep = (step) => {
  errors.value = {}
  if (step === 1) {
    if (!form.value.brand_id) {
      errors.value.brand_id = ['يرجى اختيار ماركة السيارة']
      return false
    }
    if (!form.value.model_id) {
      errors.value.model_id = ['يرجى اختيار موديل السيارة']
      return false
    }
    if (!form.value.year) {
      errors.value.year = ['يرجى تحديد سنة الصنع']
      return false
    }
  }

  if (step === 3) {
    if (!form.value.price || Number(form.value.price) <= 0) {
      errors.value.price = ['يرجى إدخال سعر صحيح للسيارة']
      return false
    }
  }

  return true
}

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    if (currentStep.value === 1) {
      suggestTitles()
    }
    if (currentStep.value < steps.length) {
      currentStep.value++
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else {
    snackbarMessage.value = 'يرجى استكمال الحقول المطلوبة في هذه الخطوة للمتابعة.'
    snackbarColor.value = 'warning'
    snackbar.value = true
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToStep = (target) => {
  if (target < currentStep.value || validateStep(currentStep.value)) {
    currentStep.value = target
  }
}

/* ================= Submit Form ================= */
const handleSubmit = async () => {
  if (!validateStep(1) || !validateStep(3)) {
    snackbarMessage.value = 'يرجى مراجعة الحقول الأساسية وتصحيحها قبل النشر.'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  loading.value = true
  errors.value = {}

  try {
    const formData = new FormData()

    let descAr = (form.value.description_ar || '').replace(/\n\n<!--specs:.*?-->/g, '').replace(/<!--specs:.*?-->/g, '').trim()
    let descEn = (form.value.description_en || '').replace(/\n\n<!--specs:.*?-->/g, '').replace(/<!--specs:.*?-->/g, '').trim()

    const specsData = {}
    if (form.value.acceleration) specsData.acceleration = String(form.value.acceleration)
    if (form.value.weight) specsData.weight = String(form.value.weight)

    if (Object.keys(specsData).length > 0) {
      const tag = `<!--specs:${JSON.stringify(specsData)}-->`
      if (descAr) descAr += `\n\n${tag}`
      else descAr = tag
      if (descEn) descEn += `\n\n${tag}`
      else descEn = tag
    }

    Object.entries(form.value).forEach(([key, value]) => {
      if (key === 'description_ar') {
        formData.append('description_ar', descAr)
        return
      }
      if (key === 'description_en') {
        formData.append('description_en', descEn)
        return
      }
      if (key === 'is_import') {
        formData.append('is_import', String(value ?? '0'))
      } else if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images[]', file))
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, v))
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0')
      } else if (value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    await carSellerApi.create(formData)

    snackbarMessage.value = 'تمت إضافة ونشر السيارة في مخزون المعرض بنجاح!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/seller/cars'), 1200)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      snackbarMessage.value = 'يرجى مراجعة الأخطاء الموضحة وتصحيحها'
    } else {
      snackbarMessage.value = err.response?.data?.message || 'فشلت إضافة السيارة، يرجى المحاولة لاحقاً'
    }
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

/* ================= Selected Objects for Preview ================= */
const selectedBrandName = computed(() => {
  const b = brands.value.find(item => item.id === form.value.brand_id)
  return b?.name?.ar || b?.name?.en || '-'
})

const selectedModelName = computed(() => {
  const m = models.value.find(item => item.id === form.value.model_id)
  return m?.name?.ar || m?.name?.en || '-'
})

const selectedGovCityName = computed(() => {
  const gov = governorates.value.find(g => g.id === form.value.governorate_id)
  const city = cities.value.find(c => c.id === form.value.city_id)
  const gName = gov?.name?.ar || gov?.name?.en || ''
  const cName = city?.name?.ar || city?.name?.en || ''
  return [cName, gName].filter(Boolean).join(' - ') || 'مصر'
})

const loadCountriesIfNeeded = async () => {
  if (countries.value.length > 0) return
  try {
    const res = await countryUserApi.getAll()
    countries.value = res.data?.data || []
    if (countries.value.length > 0 && !form.value.country_id) {
      const egypt = countries.value.find(c => c.name?.en?.toLowerCase() === 'egypt' || c.name?.ar?.includes('مصر'))
      form.value.country_id = egypt ? egypt.id : countries.value[0].id
    }
  } catch (err) {
    console.error('Failed to load countries:', err)
  }
}

watch(currentStep, (step) => {
  if (step === 3) {
    loadCountriesIfNeeded()
  }
})

/* ================= Initial Mount ================= */
onMounted(async () => {
  try {
    const brandsRes = await brandUserApi.getAll()
    brands.value = brandsRes.data?.data || []
  } catch (err) {
    console.error('Failed to load initial form data:', err)
  }
})
</script>

<template>
  <div class="seller-create-car-wizard py-6 px-3 px-md-6 max-w-6xl mx-auto">
    <!-- Top Hero Header -->
    <PageHeroHeader
      title="إضافة سيارة جديدة لمخزون المعرض"
      subtitle="معالج إضافة السيارات الذكي: أضف سيارتك بـ 5 خطوات منظمة واحترافية وسريعة"
      icon="tabler-car-crash"
      :breadcrumbs="[
        { title: 'لوحة التحكم', to: '/seller/dashboard', icon: 'tabler-smart-home' },
        { title: 'أسطول السيارات', to: '/seller/cars' },
        { title: 'إضافة سيارة جديدة' },
      ]"
      badge="معالج ذكي"
      badge-color="primary"
    >
      <template #actions>
        <VBtn
          variant="tonal"
          color="primary"
          prepend-icon="tabler-wand"
          class="font-weight-bold"
          @click="showSmartParser = !showSmartParser"
        >
          {{ showSmartParser ? 'إغلاق التعبئة الذكية' : 'تعبئة سريعة من نص خارجي ✨' }}
        </VBtn>

        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-arrow-right"
          @click="router.push('/seller/cars')"
        >
          العودة للقائمة
        </VBtn>
      </template>
    </PageHeroHeader>

    <!-- Smart Text Parser Collapsible Card -->
    <VExpandTransition>
      <VCard
        v-if="showSmartParser"
        variant="outlined"
        color="primary"
        class="mb-6 pa-5 rounded-2xl relative overflow-hidden"
        style="background: rgba(var(--v-theme-primary), 0.04); border-width: 1.5px;"
      >
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-sparkles" color="primary" size="24" />
            <h3 class="text-subtitle-1 font-weight-bold text-primary mb-0">
              استخراج المواصفات تلقائياً من نص خارجي (Smart Auto-Fill)
            </h3>
          </div>
          <span class="text-caption text-medium-emphasis font-weight-medium">
            انسخ أي مواصفات من واتساب أو منشور أو موقع، والصقها هنا ليتم توزيعها على الحقول بضغطة زر!
          </span>
        </div>

        <VTextarea
          v-model="pastedSpecsText"
          rows="3"
          placeholder="مثال: مرسيدس C180 موديل 2024 عداد 15000 كم السعر 2850000 ج.م فابريكا رمادي أوتوماتيك بنزين..."
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-3"
        />

        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <span v-if="specsFeedbackMessage" class="text-xs text-success font-weight-bold d-flex align-center gap-1">
            <VIcon icon="tabler-check" size="16" /> {{ specsFeedbackMessage }}
          </span>
          <span v-else></span>

          <div class="d-flex gap-2">
            <VBtn
              size="small"
              variant="tonal"
              color="secondary"
              @click="pastedSpecsText = ''"
              :disabled="!pastedSpecsText"
            >
              مسح
            </VBtn>
            <VBtn
              size="small"
              color="primary"
              prepend-icon="tabler-wand"
              @click="handleParseSpecs"
              :disabled="!pastedSpecsText"
            >
              استخراج وتوزيع على الحقول
            </VBtn>
          </div>
        </div>
      </VCard>
    </VExpandTransition>

    <!-- Stepper Navigation Header -->
    <VCard class="pa-4 pa-md-5 rounded-2xl mb-6 elevation-2" style="background: rgba(var(--v-theme-surface), 0.85); backdrop-filter: blur(12px);">
      <!-- Step Pills Row -->
      <div class="stepper-track d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
        <div
          v-for="s in steps"
          :key="s.step"
          class="step-pill d-flex align-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition"
          :class="{
            'active-step': currentStep === s.step,
            'completed-step': currentStep > s.step,
            'pending-step': currentStep < s.step
          }"
          @click="goToStep(s.step)"
        >
          <div class="step-num d-flex align-center justify-center font-weight-black">
            <VIcon v-if="currentStep > s.step" icon="tabler-check" size="16" />
            <span v-else>{{ s.step }}</span>
          </div>
          <div class="step-info">
            <div class="step-title font-weight-bold text-xs text-sm-body-2">{{ s.title }}</div>
            <div class="step-sub text-caption text-medium-emphasis d-none d-md-block">{{ s.subtitle }}</div>
          </div>
        </div>
      </div>

      <!-- Linear Progress Bar -->
      <VProgressLinear
        :model-value="progressPercent"
        color="primary"
        height="6"
        rounded
        striped
      />
    </VCard>

    <!-- Step Content Containers -->
    <VCard class="pa-6 pa-md-8 rounded-2xl elevation-3 mb-6">
      <VForm @submit.prevent="handleSubmit">

        <!-- ================= STEP 1: Basic Info ================= -->
        <div v-show="currentStep === 1">
          <div class="d-flex align-center gap-2 mb-6 border-b pb-3">
            <VAvatar color="primary" variant="tonal" size="36">
              <VIcon icon="tabler-car" size="20" />
            </VAvatar>
            <div>
              <h3 class="text-h6 font-weight-black mb-0">الخطوة 1: هوية المركبة وبياناتها الأساسية</h3>
              <p class="text-xs text-medium-emphasis mb-0">حدد نوع المركبة، الماركة، الموديل وسنة الصنع</p>
            </div>
          </div>

          <VRow>
            <!-- Vehicle Type Selection (Cards) -->
            <VCol cols="12">
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">نوع المركبة *</div>
              <div class="d-flex gap-4 flex-wrap">
                <div
                  class="type-choice-card d-flex align-center gap-3 px-5 py-3 rounded-xl cursor-pointer border flex-1"
                  :class="{ 'selected-choice': form.type === 'car' }"
                  @click="form.type = 'car'"
                >
                  <VAvatar :color="form.type === 'car' ? 'primary' : 'secondary'" variant="tonal" size="42">
                    <VIcon icon="tabler-car" size="24" />
                  </VAvatar>
                  <div>
                    <div class="font-weight-bold text-body-1">سيارة ملاكي / نقل (Car)</div>
                    <div class="text-caption text-medium-emphasis">سيدان، SUV، هاتشباك، كروس أوفر</div>
                  </div>
                </div>

                <div
                  class="type-choice-card d-flex align-center gap-3 px-5 py-3 rounded-xl cursor-pointer border flex-1"
                  :class="{ 'selected-choice': form.type === 'motorcycle' }"
                  @click="form.type = 'motorcycle'"
                >
                  <VAvatar :color="form.type === 'motorcycle' ? 'primary' : 'secondary'" variant="tonal" size="42">
                    <VIcon icon="tabler-motorbike" size="24" />
                  </VAvatar>
                  <div>
                    <div class="font-weight-bold text-body-1">دراجة نارية (Motorcycle)</div>
                    <div class="text-caption text-medium-emphasis">سكوتر، ريس، موتوسيكل</div>
                  </div>
                </div>
              </div>
            </VCol>

            <!-- Brand Selection -->
            <VCol cols="12" md="4">
              <VAutocomplete
                v-model="form.brand_id"
                :items="brands"
                :item-title="b => safeItemTitle(b)"
                item-value="id"
                label="الماركة (Brand) *"
                placeholder="ابحث عن الماركة..."
                prepend-inner-icon="tabler-building-factory"
                variant="outlined"
                density="comfortable"
                @update:modelValue="loadModels"
                :custom-filter="customBrandFilter"
                :error-messages="errors.brand_id"
                clearable
              />
            </VCol>

            <!-- Model Selection -->
            <VCol cols="12" md="4">
              <VAutocomplete
                v-model="form.model_id"
                :items="models"
                :item-title="m => safeItemTitle(m)"
                item-value="id"
                label="الموديل (Model) *"
                placeholder="اختر الموديل..."
                prepend-inner-icon="tabler-car"
                variant="outlined"
                density="comfortable"
                :disabled="!form.brand_id"
                :error-messages="errors.model_id"
                clearable
              />
            </VCol>

            <!-- Year Selection -->
            <VCol cols="12" md="4">
              <VSelect
                v-model="form.year"
                :items="yearOptions"
                label="سنة الصنع (Year) *"
                prepend-inner-icon="tabler-calendar"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.year"
              />
            </VCol>

            <!-- Condition Selection -->
            <VCol cols="12" md="6">
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">حالة السيارة العامة *</div>
              <div class="d-flex gap-3">
                <div
                  class="choice-btn flex-1 py-3 px-4 rounded-xl text-center border cursor-pointer font-weight-bold transition"
                  :class="{ 'active-choice': form.condition === 'used' }"
                  @click="form.condition = 'used'"
                >
                  <VIcon icon="tabler-history" size="18" class="me-1" />
                  مستعملة (Used)
                </div>
                <div
                  class="choice-btn flex-1 py-3 px-4 rounded-xl text-center border cursor-pointer font-weight-bold transition"
                  :class="{ 'active-choice': form.condition === 'new' }"
                  @click="form.condition = 'new'"
                >
                  <VIcon icon="tabler-sparkles" size="18" class="me-1 text-warning" />
                  جديدة تماماً / زيرو (New)
                </div>
              </div>
            </VCol>

            <!-- Origin / Import -->
            <VCol cols="12" md="6">
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">مصدر السيارة والاستيراد *</div>
              <VSelect
                v-model="form.is_import"
                :items="[
                  { title: 'وكيل محلي (رسمي)', value: '0' },
                  { title: 'استيراد خارجي (موجودة بمصر)', value: '1' },
                  { title: 'متاحة للشحن والاستيراد بالطلب', value: '2' },
                ]"
                prepend-inner-icon="tabler-plane-arrival"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Titles -->
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.title_ar"
                label="عنوان الإعلان بالعربية"
                placeholder="مثال: مرسيدس C200 موديل 2024 بحالة الزيرو"
                prepend-inner-icon="tabler-letter-case"
                variant="outlined"
                density="comfortable"
                persistent-hint
                hint="سيتم توليده تلقائياً إن تركته فارغاً"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="form.title_en"
                label="English Ad Title (اختياري)"
                placeholder="e.g. Mercedes C200 2024 Mint Condition"
                prepend-inner-icon="tabler-language"
                variant="outlined"
                density="comfortable"
              />
            </VCol>
          </VRow>
        </div>

        <!-- ================= STEP 2: Technical Specs ================= -->
        <div v-show="currentStep === 2">
          <div class="d-flex align-center gap-2 mb-6 border-b pb-3">
            <VAvatar color="primary" variant="tonal" size="36">
              <VIcon icon="tabler-engine" size="20" />
            </VAvatar>
            <div>
              <h3 class="text-h6 font-weight-black mb-0">الخطوة 2: المواصفات الفنية والمحرك</h3>
              <p class="text-xs text-medium-emphasis mb-0">أدخل تفاصيل الفتيس والوقود والمحرك ولون السيارة</p>
            </div>
          </div>

          <VRow>
            <!-- Transmission Selection -->
            <VCol cols="12" md="6">
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">ناقل الحركة (Transmission) *</div>
              <div class="d-flex gap-3">
                <div
                  class="choice-btn flex-1 py-3 px-4 rounded-xl text-center border cursor-pointer font-weight-bold transition"
                  :class="{ 'active-choice': form.transmission === 'automatic' }"
                  @click="form.transmission = 'automatic'"
                >
                  <VIcon icon="tabler-automatic-gearbox" size="20" class="me-1" />
                  أوتوماتيك (Automatic)
                </div>
                <div
                  class="choice-btn flex-1 py-3 px-4 rounded-xl text-center border cursor-pointer font-weight-bold transition"
                  :class="{ 'active-choice': form.transmission === 'manual' }"
                  @click="form.transmission = 'manual'"
                >
                  <VIcon icon="tabler-manual-gearbox" size="20" class="me-1" />
                  مانيوال / يدوي (Manual)
                </div>
              </div>
            </VCol>

            <!-- Fuel Type Selection -->
            <VCol cols="12" md="6">
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">نوع الوقود (Fuel Type) *</div>
              <VSelect
                v-model="form.fuel_type"
                :items="[
                  { title: 'بنزين (Petrol / Gasoline)', value: 'petrol' },
                  { title: 'ديزل / سولار (Diesel)', value: 'diesel' },
                  { title: 'هايبرد هجين (Hybrid)', value: 'hybrid' },
                  { title: 'كهرباء بالكامل (Electric - EV)', value: 'electric' },
                  { title: 'غاز طبيعي (CNG)', value: 'cng' },
                ]"
                prepend-inner-icon="tabler-gas-station"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Mileage -->
            <VCol cols="12" md="4">
              <VTextField
                v-model="form.mileage"
                label="المسافة المقطوعة (Mileage)"
                placeholder="مثال: 45000"
                suffix="كم (km)"
                type="number"
                prepend-inner-icon="tabler-gauge"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Engine Capacity CC -->
            <VCol cols="12" md="4">
              <VSelect
                v-model="form.engine_capacity"
                :items="engineCapacityOptions"
                label="سعة المحرك (Engine CC)"
                prepend-inner-icon="tabler-engine"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Cylinders -->
            <VCol cols="12" md="4">
              <VSelect
                v-model="form.cylinders"
                :items="[3, 4, 6, 8, 10, 12]"
                label="عدد السلندرات (Cylinders)"
                prepend-inner-icon="tabler-cylinder"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Drivetrain -->
            <VCol cols="12" md="4">
              <VSelect
                v-model="form.drivetrain"
                :items="[
                  { title: 'دفع أمامي (FWD)', value: 'FWD' },
                  { title: 'دفع خلفي (RWD)', value: 'RWD' },
                  { title: 'دفع رباعي مستمر (AWD)', value: 'AWD' },
                  { title: 'دفع رباعي 4x4 (4WD)', value: '4WD' },
                ]"
                label="نظام الدفع (Drivetrain)"
                prepend-inner-icon="tabler-steering-wheel"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Acceleration & Weight (Optional) -->
            <VCol cols="6" md="4">
              <VTextField
                v-model="form.acceleration"
                label="التسارع 0-100 كم (اختياري)"
                placeholder="مثال: 7.5 ثواني"
                prepend-inner-icon="tabler-gauge"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <VCol cols="6" md="4">
              <VTextField
                v-model="form.weight"
                label="وزن السيارة (اختياري)"
                placeholder="مثال: 1450 كجم"
                prepend-inner-icon="tabler-scale"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <!-- Color Palette Picker -->
            <VCol cols="12">
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">اللون الخارجي للسيارة *</div>
              <div class="d-flex flex-wrap gap-2 align-center">
                <div
                  v-for="col in commonColors"
                  :key="col.hex"
                  class="color-chip d-flex align-center gap-2 px-3 py-1.5 rounded-pill border cursor-pointer transition"
                  :class="{ 'selected-color-chip': form.color === col.hex }"
                  @click="form.color = col.hex"
                >
                  <span
                    class="d-inline-block rounded-circle"
                    :style="{ width: '16px', height: '16px', backgroundColor: col.hex, border: '1px solid rgba(255,255,255,0.4)' }"
                  />
                  <span class="text-xs font-weight-bold">{{ col.name.split(' / ')[0] }}</span>
                </div>

                <!-- Custom Hex Input -->
                <div class="d-flex align-center gap-2 ms-auto">
                  <span class="text-xs text-medium-emphasis">أو كود مخصص:</span>
                  <input
                    type="color"
                    v-model="form.color"
                    style="width: 32px; height: 32px; border-radius: 8px; cursor: pointer; border: none;"
                  />
                </div>
              </div>
            </VCol>
          </VRow>
        </div>

        <!-- ================= STEP 3: Price & Location ================= -->
        <div v-show="currentStep === 3">
          <div class="d-flex align-center gap-2 mb-6 border-b pb-3">
            <VAvatar color="primary" variant="tonal" size="36">
              <VIcon icon="tabler-cash" size="20" />
            </VAvatar>
            <div>
              <h3 class="text-h6 font-weight-black mb-0">الخطوة 3: السعر وموقع عرض السيارة</h3>
              <p class="text-xs text-medium-emphasis mb-0">حدد السعر المطلوب بدقة ومكان تواجد السيارة للمعاينة</p>
            </div>
          </div>

          <VRow>
            <!-- Highlighted Price Input -->
            <VCol cols="12" md="6">
              <div class="price-input-box pa-4 rounded-xl border mb-2" style="background: rgba(var(--v-theme-primary), 0.04); border-color: rgba(var(--v-theme-primary), 0.3) !important;">
                <div class="text-caption font-weight-bold text-primary mb-1">السعر المطلوب للبيع (بالجنيه المصري) *</div>
                <VTextField
                  v-model="form.price"
                  placeholder="مثال: 1850000"
                  type="number"
                  suffix="EGP"
                  prepend-inner-icon="tabler-currency-pound"
                  variant="outlined"
                  density="comfortable"
                  class="font-weight-black"
                  :error-messages="errors.price"
                />
                <div v-if="form.price" class="text-sm font-weight-bold text-success mt-1">
                  المبلغ المعروض: {{ Number(form.price).toLocaleString() }} جنيه مصري
                </div>
              </div>
            </VCol>

            <!-- Location: Country, Gov, City -->
            <VCol cols="12" md="6">
              <div class="pa-4 rounded-xl border mb-2">
                <div class="text-caption font-weight-bold text-medium-emphasis mb-3">مكان المعاينة والمعرض</div>
                <VRow dense>
                  <VCol cols="12" sm="6">
                    <VSelect
                      v-model="form.governorate_id"
                      :items="governorates"
                      :item-title="g => safeItemTitle(g)"
                      item-value="id"
                      label="المحافظة *"
                      prepend-inner-icon="tabler-map"
                      variant="outlined"
                      density="comfortable"
                      @update:modelValue="loadCities"
                      clearable
                    />
                  </VCol>
                  <VCol cols="12" sm="6">
                    <VSelect
                      v-model="form.city_id"
                      :items="cities"
                      :item-title="c => safeItemTitle(c)"
                      item-value="id"
                      label="المدينة / الحي *"
                      prepend-inner-icon="tabler-map-pin"
                      variant="outlined"
                      density="comfortable"
                      :disabled="!form.governorate_id"
                      clearable
                    />
                  </VCol>
                </VRow>
              </div>
            </VCol>

            <!-- Contact Overrides (Optional) -->
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.phone_number"
                label="رقم الهاتف للمكالمات (اختياري)"
                placeholder="اتركه فارغاً لاستخدام رقم المعرض الرئيسي"
                prepend-inner-icon="tabler-phone"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="form.whatsapp_number"
                label="رقم الواتساب للتواصل المباشر (اختياري)"
                placeholder="اتركه فارغاً لاستخدام واتساب المعرض الرئيسي"
                prepend-inner-icon="tabler-brand-whatsapp"
                variant="outlined"
                density="comfortable"
              />
            </VCol>
          </VRow>
        </div>

        <!-- ================= STEP 4: Media, Features & Description ================= -->
        <div v-show="currentStep === 4">
          <div class="d-flex align-center gap-2 mb-6 border-b pb-3">
            <VAvatar color="primary" variant="tonal" size="36">
              <VIcon icon="tabler-photo" size="20" />
            </VAvatar>
            <div>
              <h3 class="text-h6 font-weight-black mb-0">الخطوة 4: صور السيارة، التجهيزات والوصف</h3>
              <p class="text-xs text-medium-emphasis mb-0">ارفع صور واضحة وحدد كماليات ومميزات السيارة لجذب المشترين</p>
            </div>
          </div>

          <!-- Drag and Drop Image Uploader Area -->
          <div class="mb-6">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="font-weight-bold text-subtitle-2">صور السيارة (Images) - حتى 20 صورة</div>
              <span class="text-caption text-medium-emphasis">اضغط على أي صورة لتحديدها كـ "الصورة الرئيسية" للإعلان</span>
            </div>

            <div
              class="drag-drop-zone pa-6 rounded-2xl border text-center cursor-pointer transition mb-4"
              :class="{ 'dragging-active': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDropFiles"
              @click="$refs.fileInputRef.click()"
            >
              <input
                ref="fileInputRef"
                type="file"
                multiple
                accept="image/*"
                class="d-none"
                @change="e => handleFilesSelect(e.target.files)"
              />
              <VAvatar color="primary" variant="tonal" size="56" class="mb-3">
                <VIcon icon="tabler-cloud-upload" size="32" />
              </VAvatar>
              <div class="font-weight-bold text-subtitle-1 mb-1">
                اسحب الصور وأفلتها هنا أو اضغط لاختيار الصور من جهازك
              </div>
              <div class="text-caption text-medium-emphasis">
                يتم ضغط وتحسين الصور تلقائياً لعرض سريع وجودة فائقة. الحد الأقصى 20 صورة.
              </div>
            </div>

            <!-- Previews Grid -->
            <div v-if="imagePreviews.length > 0" class="d-flex flex-wrap gap-3">
              <div
                v-for="(img, idx) in imagePreviews"
                :key="idx"
                class="image-preview-card relative rounded-xl overflow-hidden border transition"
                :class="{ 'main-image-card': form.main_image === idx }"
              >
                <img :src="img.url" class="preview-img" alt="preview" />

                <!-- Main badge -->
                <div v-if="form.main_image === idx" class="main-badge-pill">
                  <VIcon icon="tabler-star-filled" size="12" class="me-1" /> رئيسية
                </div>
                <div v-else class="set-main-hover-btn" @click.stop="setAsMainImage(idx)">
                  اجعلها رئيسية
                </div>

                <!-- Delete button -->
                <button
                  type="button"
                  class="delete-img-btn"
                  title="حذف الصورة"
                  @click.stop="removeImage(idx)"
                >
                  <VIcon icon="tabler-x" size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Features Manager Component -->
          <div class="mb-6">
            <FeaturesManager
              v-model="form.features"
            />
          </div>

          <!-- Description Section -->
          <div class="mb-4">
            <div class="font-weight-bold text-subtitle-2 mb-2">تفاصيل ووصف الإعلان (Description)</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextarea
                  v-model="form.description_ar"
                  rows="4"
                  label="الوصف باللغة العربية"
                  placeholder="اكتب وصفاً مفصلاً لحالة السيارة، الصيانات، الرخص والتجهيزات..."
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextarea
                  v-model="form.description_en"
                  rows="4"
                  label="English Description (اختياري)"
                  placeholder="Enter detailed English description..."
                  variant="outlined"
                />
              </VCol>
            </VRow>
          </div>
        </div>

        <!-- ================= STEP 5: Review & Publish ================= -->
        <div v-show="currentStep === 5">
          <div class="d-flex align-center gap-2 mb-6 border-b pb-3">
            <VAvatar color="success" variant="tonal" size="36">
              <VIcon icon="tabler-circle-check" size="20" />
            </VAvatar>
            <div>
              <h3 class="text-h6 font-weight-black mb-0">الخطوة 5: المعاينة النهائية والتأكيد</h3>
              <p class="text-xs text-medium-emphasis mb-0">راجع بطاقة الإعلان كما ستظهر للمشترين قبل نشرها مباشرة</p>
            </div>
          </div>

          <!-- Live Preview Card -->
          <VCard class="preview-display-card pa-6 rounded-2xl border mb-6" elevation="2">
            <VRow>
              <VCol cols="12" md="5">
                <div class="preview-photo-wrap rounded-xl overflow-hidden bg-black text-center relative" style="height: 240px;">
                  <img
                    v-if="imagePreviews.length > 0"
                    :src="imagePreviews[form.main_image || 0]?.url || imagePreviews[0]?.url"
                    class="w-100 h-100 object-cover"
                    alt="Main photo"
                  />
                  <div v-else class="d-flex fill-height align-center justify-center text-medium-emphasis">
                    <VIcon icon="tabler-photo-off" size="48" />
                  </div>
                  <div class="absolute top-2 right-2">
                    <VChip size="small" color="primary" variant="elevated" class="font-weight-bold">
                      {{ imagePreviews.length }} صور
                    </VChip>
                  </div>
                </div>
              </VCol>

              <VCol cols="12" md="7">
                <div class="d-flex align-center justify-space-between gap-2 mb-2 flex-wrap">
                  <VChip size="small" color="primary" class="font-weight-bold">
                    {{ selectedBrandName }} • {{ selectedModelName }}
                  </VChip>
                  <VChip size="small" :color="form.condition === 'new' ? 'warning' : 'secondary'" class="font-weight-bold">
                    {{ form.condition === 'new' ? 'زيرو (New)' : 'مستعملة (Used)' }}
                  </VChip>
                </div>

                <h3 class="text-h5 font-weight-black mb-2">
                  {{ form.title_ar || `${selectedBrandName} ${selectedModelName} ${form.year}` }}
                </h3>

                <div class="text-h4 font-weight-black text-primary mb-3">
                  {{ form.price ? Number(form.price).toLocaleString() : '0' }} EGP
                </div>

                <!-- Quick specs badges -->
                <div class="d-flex flex-wrap gap-2 text-xs mb-3">
                  <VChip size="small" variant="tonal" prepend-icon="tabler-calendar">موديل {{ form.year }}</VChip>
                  <VChip size="small" variant="tonal" prepend-icon="tabler-gauge">{{ form.mileage ? `${Number(form.mileage).toLocaleString()} كم` : '0 كم' }}</VChip>
                  <VChip size="small" variant="tonal" prepend-icon="tabler-automatic-gearbox">{{ form.transmission }}</VChip>
                  <VChip size="small" variant="tonal" prepend-icon="tabler-gas-station">{{ form.fuel_type }}</VChip>
                  <VChip size="small" variant="tonal" prepend-icon="tabler-map-pin">{{ selectedGovCityName }}</VChip>
                </div>

                <p v-if="form.description_ar" class="text-sm text-medium-emphasis line-clamp-2 mb-0">
                  {{ form.description_ar }}
                </p>
              </VCol>
            </VRow>
          </VCard>

          <!-- Readiness Checklist -->
          <div class="pa-4 rounded-xl border mb-6" style="background: rgba(40, 199, 111, 0.05); border-color: rgba(40, 199, 111, 0.25) !important;">
            <div class="d-flex align-center gap-2 font-weight-bold text-success mb-2">
              <VIcon icon="tabler-shield-check" size="20" />
              جاهزية الإعلان للنشر في معرضك:
            </div>
            <ul class="text-sm text-medium-emphasis ps-5 mb-0">
              <li>سيتم ربط الإعلان تلقائياً بحساب معرضك المعتمد وإضافته لأسطول سياراتك.</li>
              <li>سيتم إرسال إشعار فوري لمدير المنصة لمراجعة واعتماد الإعلان للنشر العام.</li>
              <li>يمكنك في أي وقت لاحق تعديل السعر أو المواصفات أو طباعة كود QR من صفحة إدارة السيارات.</li>
            </ul>
          </div>
        </div>

        <!-- Sticky Footer Navigation Bar -->
        <div class="wizard-footer d-flex align-center justify-space-between pt-6 border-t mt-6">
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-arrow-right"
            :disabled="currentStep === 1 || loading"
            @click="prevStep"
          >
            السابق
          </VBtn>

          <div class="text-caption text-medium-emphasis font-weight-bold">
            خطوة {{ currentStep }} من {{ steps.length }}
          </div>

          <div class="d-flex gap-2">
            <VBtn
              v-if="currentStep < steps.length"
              color="primary"
              append-icon="tabler-arrow-left"
              @click="nextStep"
            >
              التالي والمتابعة
            </VBtn>

            <VBtn
              v-else
              color="success"
              size="large"
              prepend-icon="tabler-rocket"
              :loading="loading"
              type="submit"
              class="font-weight-black shadow-glow"
            >
              تأكيد ونشر السيارة في المعرض 🎉
            </VBtn>
          </div>
        </div>

      </VForm>
    </VCard>

    <!-- Notification Toast -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top" timeout="4000">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.stepper-track {
  display: flex;
}
.step-pill {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 0.6);
  flex: 1;
  min-width: 150px;
}
.step-pill:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(var(--v-border-color), 0.3);
  font-size: 13px;
}
.active-step {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.12) !important;
}
.active-step .step-num {
  background: rgb(var(--v-theme-primary));
  color: white;
}
.completed-step .step-num {
  background: rgb(var(--v-theme-success));
  color: white;
}

.type-choice-card, .choice-btn {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 0.7);
}
.type-choice-card:hover, .choice-btn:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.05);
}
.selected-choice, .active-choice {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.1) !important;
}

.color-chip {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 0.7);
}
.selected-color-chip {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.15) !important;
}

.drag-drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.02);
}
.drag-drop-zone:hover, .dragging-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.image-preview-card {
  width: 110px;
  height: 85px;
  background: #000;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.main-image-card {
  outline: 3px solid rgb(var(--v-theme-primary));
}
.main-badge-pill {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgb(var(--v-theme-primary));
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
}
.set-main-hover-btn {
  position: absolute;
  inset-inline: 4px;
  bottom: 4px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 10px;
  text-align: center;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}
.image-preview-card:hover .set-main-hover-btn {
  opacity: 1;
}
.delete-img-btn {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.85);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.shadow-glow {
  box-shadow: 0 4px 18px rgba(var(--v-theme-success), 0.4);
}
</style>
