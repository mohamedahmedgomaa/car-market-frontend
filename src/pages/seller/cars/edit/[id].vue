<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import carSellerApi from '../../../../api/seller/carSellerApi.js'
import brandUserApi from '../../../../api/user/brandUserApi.js'
import modelUserApi from '../../../../api/user/modelUserApi.js'
import countryUserApi from '../../../../api/user/countryUserApi.js'
import governorateUserApi from '../../../../api/user/governorateUserApi.js'
import cityUserApi from '../../../../api/user/cityUserApi.js'
import FeaturesManager from '@/components/FeaturesManager.vue'
import Car360UploadManager from '@/components/cars/Car360UploadManager.vue'
import PageHeroHeader from '@/components/PageHeroHeader.vue'
import CarMotionLoader from '@/components/CarMotionLoader.vue'
import { customBrandFilter } from '@/utils/brandTranslations.js'
import { processCarImages } from '@/utils/imageProcessor.js'

const router = useRouter()
const route = useRoute()
const carId = route.params.id

const upload360Ref = ref(null)
const existingInteriorUrl = ref('')
const existingExteriorImages = ref([])
const existingModel3dUrl = ref('')

/* ================= Wizard Step State ================= */
const currentStep = ref(1)
const showSmartParser = ref(false)

const steps = [
  { step: 1, title: 'هوية المركبة', subtitle: 'النوع والماركة والموديل', icon: 'tabler-car' },
  { step: 2, title: 'المواصفات الفنية', subtitle: 'المحرك، الفتيس، العداد', icon: 'tabler-engine' },
  { step: 3, title: 'السعر والموقع', subtitle: 'السعر والتواصل والمكان', icon: 'tabler-cash' },
  { step: 4, title: 'الصور والمميزات', subtitle: 'صور الإعلان والوصف', icon: 'tabler-photo' },
  { step: 5, title: 'مراجعة وتحديث', subtitle: 'المعاينة النهائية والحفظ', icon: 'tabler-check' },
]

const progressPercent = computed(() => (currentStep.value / steps.length) * 100)

/* ================= Form State ================= */
const form = ref({
  seller_id: null,
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
  old_price: '',
  year: '',
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
})

const existingImages = ref([]) // [{id, url, is_main}]
const keepImages = ref([])
const newImagePreviews = ref([]) // [{file, url, index}]
const mainSelection = ref(null)

const carDetails = ref(null)
const brands = ref([])
const models = ref([])
const features = ref([])
const countries = ref([])
const governorates = ref([])
const cities = ref([])

const loading = ref(false)
const saving = ref(false)
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

/* ================= On-Demand (Lazy) Loaders ================= */
const loadingBrands = ref(false)
const loadBrandsIfNeeded = async () => {
  if (brands.value.length > 1 || loadingBrands.value) return
  loadingBrands.value = true
  try {
    const res = await brandUserApi.getAll()
    brands.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load brands:', err)
  } finally {
    loadingBrands.value = false
  }
}

const onBrandChange = async (newBrandId) => {
  form.value.model_id = null
  models.value = []
  if (newBrandId) {
    await loadModels(false)
  }
}

const loadingModels = ref(false)
const loadModelsIfNeeded = async () => {
  if (!form.value.brand_id || models.value.length > 1 || loadingModels.value) return
  loadingModels.value = true
  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': form.value.brand_id })
    models.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load models:', err)
  } finally {
    loadingModels.value = false
  }
}

const loadModels = async (keepCurrent = false) => {
  if (!form.value.brand_id) {
    models.value = []
    if (!keepCurrent) form.value.model_id = null
    return
  }

  const current = form.value.model_id
  loadingModels.value = true
  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': form.value.brand_id })
    models.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load models:', err)
  } finally {
    loadingModels.value = false
  }

  if (keepCurrent && current) {
    const exists = models.value.some(m => m.id === current)
    form.value.model_id = exists ? current : null
  } else if (!keepCurrent) {
    form.value.model_id = null
  }
}

const loadingCountries = ref(false)
const loadCountriesIfNeeded = async () => {
  if (countries.value.length > 1 || loadingCountries.value) return
  loadingCountries.value = true
  try {
    const res = await countryUserApi.getAll()
    countries.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load countries:', err)
  } finally {
    loadingCountries.value = false
  }
}

const onCountryChange = async (newCountryId) => {
  form.value.governorate_id = null
  form.value.city_id = null
  governorates.value = []
  cities.value = []
  if (newCountryId) {
    await loadGovernorates(false)
  }
}

const loadingGovs = ref(false)
const loadGovsIfNeeded = async () => {
  if (!form.value.country_id || governorates.value.length > 1 || loadingGovs.value) return
  loadingGovs.value = true
  try {
    const res = await governorateUserApi.getAll({ 'filter[country_id]': form.value.country_id })
    governorates.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load governorates:', err)
  } finally {
    loadingGovs.value = false
  }
}

const onGovChange = async (newGovId) => {
  form.value.city_id = null
  cities.value = []
  if (newGovId) {
    await loadCities(false)
  }
}

const loadGovernorates = async (keepCurrent = false) => {
  if (!form.value.country_id) {
    governorates.value = []
    if (!keepCurrent) form.value.governorate_id = null
    return
  }

  const current = form.value.governorate_id
  loadingGovs.value = true
  try {
    const res = await governorateUserApi.getAll({ 'filter[country_id]': form.value.country_id })
    governorates.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load governorates:', err)
  } finally {
    loadingGovs.value = false
  }

  if (keepCurrent && current) {
    const exists = governorates.value.some(g => g.id === current)
    form.value.governorate_id = exists ? current : null
  } else if (!keepCurrent) {
    form.value.governorate_id = null
  }
}

const loadingCities = ref(false)
const loadCitiesIfNeeded = async () => {
  if (!form.value.governorate_id || cities.value.length > 1 || loadingCities.value) return
  loadingCities.value = true
  try {
    const res = await cityUserApi.getAll({ 'filter[governorate_id]': form.value.governorate_id })
    cities.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load cities:', err)
  } finally {
    loadingCities.value = false
  }
}

const loadCities = async (keepCurrent = false) => {
  if (!form.value.governorate_id) {
    cities.value = []
    if (!keepCurrent) form.value.city_id = null
    return
  }

  const current = form.value.city_id
  loadingCities.value = true
  try {
    const res = await cityUserApi.getAll({ 'filter[governorate_id]': form.value.governorate_id })
    cities.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to load cities:', err)
  } finally {
    loadingCities.value = false
  }

  if (keepCurrent && current) {
    const exists = cities.value.some(c => c.id === current)
    form.value.city_id = exists ? current : null
  } else if (!keepCurrent) {
    form.value.city_id = null
  }
}

/* ================= Load Existing Car (Primary API) ================= */
const loadCar = async () => {
  loading.value = true
  try {
    const res = await carSellerApi.getById(carId)
    const car = res.data?.data || res.data
    carDetails.value = car

    // Pre-populate dropdown options directly from the car relation in the primary API
    // This allows instant display of brand, model, and location with ZERO extra API requests!
    if (car.brand) {
      brands.value = [car.brand]
    }
    if (car.model) {
      models.value = [car.model]
    }
    if (car.country) {
      countries.value = [car.country]
    }
    if (car.governorate) {
      governorates.value = [car.governorate]
    }
    if (car.city) {
      cities.value = [car.city]
    }

    form.value.seller_id = car.seller_id
    form.value.brand_id = car.brand_id
    form.value.model_id = car.model_id

    form.value.country_id = car.country_id
    form.value.governorate_id = car.governorate_id
    form.value.city_id = car.city_id

    form.value.title_ar = car.title?.ar || ''
    form.value.title_en = car.title?.en || ''
    form.value.description_ar = car.description?.ar || ''
    form.value.description_en = car.description?.en || ''

    form.value.price = car.price ?? ''
    form.value.old_price = car.old_price ?? ''
    form.value.year = car.year ?? ''
    form.value.mileage = car.mileage ?? ''
    form.value.type = car.type ?? 'car'
    form.value.transmission = car.transmission ?? 'automatic'
    form.value.fuel_type = car.fuel_type ?? 'petrol'
    form.value.drivetrain = car.drivetrain ?? 'FWD'
    form.value.condition = car.condition ?? 'used'
    form.value.color = car.color || '#FFFFFF'
    form.value.is_import = String(car.is_import ?? '0')
    form.value.cylinders = car.cylinders ?? 4
    form.value.engine_capacity = car.engine_capacity ? String(car.engine_capacity) : '1600'
    form.value.acceleration = car.acceleration || ''
    form.value.weight = car.weight || ''

    form.value.phone_number = car.phone_number || ''
    form.value.whatsapp_number = car.whatsapp_number || ''

    form.value.features = car.features?.map(f => f.id) || []

    existingInteriorUrl.value = car.interior_360_url || ''
    existingExteriorImages.value = Array.isArray(car.exterior_360_images) ? car.exterior_360_images : []
    existingModel3dUrl.value = car.model_3d_url || ''

    const loadedImages = (car.images || []).map(img => ({
      id: img.id,
      url: `${img.path}`,
      is_main: img.is_main === 1 || img.is_main === true,
    }))

    existingImages.value = loadedImages
    keepImages.value = existingImages.value.map(i => i.id)

    const mainOld = existingImages.value.find(i => i.is_main)
    if (mainOld) {
      mainSelection.value = { type: 'old', id: mainOld.id }
    } else if (existingImages.value.length) {
      mainSelection.value = { type: 'old', id: existingImages.value[0].id }
    }
  } catch (err) {
    console.error('Failed to load car details:', err)
    snackbarMessage.value = 'تعذر تحميل بيانات السيارة'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

/* ================= Images Management ================= */
const setMainOld = (id) => {
  mainSelection.value = { type: 'old', id }
  existingImages.value.forEach(img => (img.is_main = img.id === id))
}

const setMainNew = (index) => {
  mainSelection.value = { type: 'new', index }
  existingImages.value.forEach(img => (img.is_main = false))
}

const removeExistingImage = (id) => {
  existingImages.value = existingImages.value.filter(i => i.id !== id)
  keepImages.value = keepImages.value.filter(x => x !== id)

  if (mainSelection.value?.type === 'old' && mainSelection.value.id === id) {
    if (existingImages.value.length) {
      setMainOld(existingImages.value[0].id)
    } else if (newImagePreviews.value.length) {
      setMainNew(0)
    } else {
      mainSelection.value = null
    }
  }
}

const handleImagesChange = async (files) => {
  if (!files || !files.length) return

  const remainingSlots = 20 - existingImages.value.length
  if (remainingSlots <= 0) {
    snackbarMessage.value = 'الحد الأقصى المسموح به 20 صورة'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  const processedFiles = await processCarImages(files, remainingSlots)
  form.value.images = [...form.value.images, ...processedFiles]

  processedFiles.forEach((file) => {
    newImagePreviews.value.push({
      file,
      url: URL.createObjectURL(file),
      index: newImagePreviews.value.length,
    })
  })

  if (!mainSelection.value && newImagePreviews.value.length) {
    setMainNew(0)
  }
}

const removeNewImage = (idx) => {
  URL.revokeObjectURL(newImagePreviews.value[idx].url)
  newImagePreviews.value.splice(idx, 1)
  form.value.images.splice(idx, 1)

  newImagePreviews.value.forEach((p, i) => (p.index = i))

  if (mainSelection.value?.type === 'new' && mainSelection.value.index === idx) {
    if (existingImages.value.length) {
      setMainOld(existingImages.value[0].id)
    } else if (newImagePreviews.value.length) {
      setMainNew(0)
    } else {
      mainSelection.value = null
    }
  }
}

/* ================= Update Submit ================= */
const handleUpdate = async () => {
  saving.value = true
  errors.value = {}

  try {
    const fd = new FormData()
    fd.append('_method', 'PUT')

    Object.entries(form.value).forEach(([key, value]) => {
      if (key === 'features') {
        ;(value || []).forEach(v => fd.append('features[]', v))
        return
      }

      if (key === 'images') {
        ;(value || []).forEach(file => fd.append('images[]', file))
        return
      }

      if (typeof value === 'boolean') {
        fd.append(key, value ? '1' : '0')
        return
      }

      if (value !== null && value !== '') fd.append(key, value)
    })

    keepImages.value = existingImages.value.map(i => i.id)
    keepImages.value.forEach(id => fd.append('keep_images[]', id))

    if (mainSelection.value?.type === 'old') {
      fd.append('main_image_id', mainSelection.value.id)
    } else if (mainSelection.value?.type === 'new') {
      fd.append('main_image_new_index', mainSelection.value.index)
    }

    upload360Ref.value?.appendFormData(fd)

    await carSellerApi.update(carId, fd)

    snackbarMessage.value = 'تم تحديث بيانات السيارة بنجاح 🎉'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/seller/cars'), 1000)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    }
    snackbarMessage.value = 'تعذر تحديث السيارة، يرجى مراجعة الحقول المطلوبة'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    saving.value = false
  }
}

/* ================= Lifecycle ================= */
onMounted(async () => {
  try {
    // ONLY the primary API is called at page start!
    // All other lists (brands, models, locations, features) are lazy-loaded when interacting with their selectors
    await loadCar()
  } catch (err) {
    console.error('Initialization failed:', err)
  }
})

// Brand / Model names for preview
const selectedBrandName = computed(() => {
  const b = brands.value.find(x => x.id === form.value.brand_id)
  return b?.name?.ar || b?.name?.en || carDetails.value?.brand?.name?.ar || carDetails.value?.brand?.name?.en || ''
})

const selectedModelName = computed(() => {
  const m = models.value.find(x => x.id === form.value.model_id)
  return m?.name?.ar || m?.name?.en || carDetails.value?.model?.name?.ar || carDetails.value?.model?.name?.en || ''
})

const previewMainImage = computed(() => {
  if (mainSelection.value?.type === 'old') {
    const img = existingImages.value.find(i => i.id === mainSelection.value.id)
    return img?.url || ''
  }
  if (mainSelection.value?.type === 'new') {
    return newImagePreviews.value[mainSelection.value.index]?.url || ''
  }
  if (existingImages.value.length) return existingImages.value[0].url
  if (newImagePreviews.value.length) return newImagePreviews.value[0].url
  return ''
})
</script>

<template>
  <div class="seller-edit-car-wizard py-6 px-4 max-w-6xl mx-auto">
    <!-- ===== Page Hero Header ===== -->
    <PageHeroHeader
      :title="`تعديل بيانات السيارة #${carId}`"
      subtitle="تحديث مواصفات، أسعار، صور وحالة السيارة في أسطول المعرض"
      icon="tabler-pencil"
      :breadcrumbs="[
        { title: 'لوحة التحكم', to: '/seller/dashboard', icon: 'tabler-smart-home' },
        { title: 'أسطول السيارات', to: '/seller/cars' },
        { title: `تعديل #${carId}` },
      ]"
      :badge="carDetails?.status || 'قيد التعديل'"
      :badge-color="carDetails?.status === 'approved' ? 'success' : 'warning'"
    >
      <template #actions>
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-arrow-right"
          @click="router.push('/seller/cars')"
        >
          العودة للأسطول
        </VBtn>

        <VBtn
          color="primary"
          prepend-icon="tabler-check"
          class="font-weight-bold"
          :loading="saving"
          @click="handleUpdate"
        >
          حفظ التعديلات
        </VBtn>
      </template>
    </PageHeroHeader>

    <!-- Loading State with Driving Car Motion -->
    <div v-if="loading" class="pa-6">
      <CarMotionLoader
        mode="table"
        title="جاري فحص وجلب بيانات السيارة..."
        subtitle="التحقق من هوية المركبة والمواصفات من السيرفر"
        :height="360"
      />
    </div>

    <div v-else>
      <!-- Wizard Progress Track -->
      <VCard class="mb-6 rounded-2xl elevation-2 overflow-hidden border">
        <VProgressLinear :model-value="progressPercent" color="primary" height="6" />

        <div class="pa-4 bg-surface">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div
              v-for="s in steps"
              :key="s.step"
              class="wizard-step-node d-flex align-center gap-2 cursor-pointer pa-2 rounded-xl"
              :class="{
                'active-step': currentStep === s.step,
                'completed-step': currentStep > s.step,
              }"
              @click="currentStep = s.step"
            >
              <div class="step-num-bubble">
                <VIcon v-if="currentStep > s.step" icon="tabler-check" size="14" />
                <span v-else>{{ s.step }}</span>
              </div>
              <div class="step-text d-none d-sm-block">
                <div class="step-title font-weight-bold text-caption">{{ s.title }}</div>
                <div class="step-subtitle text-xs text-medium-emphasis">{{ s.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>
      </VCard>

      <!-- ===== Step 1: Vehicle Identity ===== -->
      <VWindow v-model="currentStep">
        <VWindowItem :value="1">
          <VCard class="pa-6 rounded-2xl border mb-6" elevation="2">
            <div class="d-flex align-center gap-2 mb-4">
              <VAvatar color="primary" variant="tonal" rounded="lg">
                <VIcon icon="tabler-car" size="24" />
              </VAvatar>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">الخطوة 1: هوية المركبة وبياناتها الأساسية</h3>
                <p class="text-caption text-medium-emphasis mb-0">حدد نوع المركبة، الماركة، الموديل، وسنة الصنع</p>
              </div>
            </div>

            <!-- Vehicle Type Selection (Cards) -->
            <div class="mb-4">
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
                    <div class="text-caption text-medium-emphasis">سكوتر، ريس، دراجة بخارية</div>
                  </div>
                </div>
              </div>
            </div>

            <VRow dense>
              <!-- Brand -->
              <VCol cols="12" md="6">
                <VAutocomplete
                  v-model="form.brand_id"
                  :items="brands"
                  :item-title="safeItemTitle"
                  item-value="id"
                  label="الماركة (Brand) *"
                  placeholder="اختر الماركة..."
                  prepend-inner-icon="tabler-building-factory"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingBrands"
                  :custom-filter="customBrandFilter"
                  :error-messages="errors.brand_id"
                  @update:menu="open => open && loadBrandsIfNeeded()"
                  @click="loadBrandsIfNeeded"
                  @update:model-value="onBrandChange"
                />
              </VCol>

              <!-- Model -->
              <VCol cols="12" md="6">
                <VAutocomplete
                  v-model="form.model_id"
                  :items="models"
                  :item-title="safeItemTitle"
                  item-value="id"
                  label="الموديل (Model) *"
                  placeholder="اختر الموديل..."
                  prepend-inner-icon="tabler-tag"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingModels"
                  :disabled="!form.brand_id"
                  :error-messages="errors.model_id"
                  @update:menu="open => open && loadModelsIfNeeded()"
                  @click="loadModelsIfNeeded"
                />
              </VCol>

              <!-- Year -->
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

              <!-- Condition -->
              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.condition"
                  :items="[
                    { title: 'جديدة تماماً (Zero / New)', value: 'new' },
                    { title: 'مستعملة بحالة ممتازة (Used)', value: 'used' },
                  ]"
                  label="حالة السيارة (Condition) *"
                  prepend-inner-icon="tabler-sparkles"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.condition"
                />
              </VCol>

              <!-- Import Status -->
              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.is_import"
                  :items="[
                    { title: 'محلية (وكيل محلي)', value: '0' },
                    { title: 'وارد الخارج (مستوردة)', value: '1' },
                    { title: 'متاحة للطلب والاستيراد', value: '2' },
                  ]"
                  label="نوع التوريد / المنشأ"
                  prepend-inner-icon="tabler-world"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <!-- Titles -->
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.title_ar"
                  label="عنوان الإعلان بالعربية *"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="tabler-language"
                  :error-messages="errors.title_ar"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.title_en"
                  label="عنوان الإعلان بالإنجليزية *"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="tabler-language"
                  :error-messages="errors.title_en"
                />
              </VCol>
            </VRow>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-end mt-6">
              <VBtn color="primary" append-icon="tabler-chevron-left" @click="currentStep = 2">
                التالي: المواصفات الفنية
              </VBtn>
            </div>
          </VCard>
        </VWindowItem>

        <!-- ===== Step 2: Technical Specs ===== -->
        <VWindowItem :value="2">
          <VCard class="pa-6 rounded-2xl border mb-6" elevation="2">
            <div class="d-flex align-center gap-2 mb-4">
              <VAvatar color="primary" variant="tonal" rounded="lg">
                <VIcon icon="tabler-engine" size="24" />
              </VAvatar>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">الخطوة 2: المواصفات الفنية والميكانيكية</h3>
                <p class="text-caption text-medium-emphasis mb-0">بيانات المحرك، ناقل الحركة، العداد واللون</p>
              </div>
            </div>

            <VRow dense>
              <!-- Transmission -->
              <VCol cols="12" class="mb-3">
                <div class="text-subtitle-2 font-weight-bold mb-2">ناقل الحركة (Transmission) *</div>
                <div class="d-flex gap-3 flex-wrap">
                  <VCard
                    v-for="t in [
                      { label: 'أوتوماتيك (Automatic)', value: 'automatic', icon: 'tabler-automatic-gearbox' },
                      { label: 'مانيوال / يدوي (Manual)', value: 'manual', icon: 'tabler-manual-gearbox' },
                    ]"
                    :key="t.value"
                    variant="outlined"
                    class="pa-3 rounded-xl cursor-pointer flex-1"
                    :class="{ 'border-primary bg-primary-subtle': form.transmission === t.value }"
                    @click="form.transmission = t.value"
                  >
                    <div class="d-flex align-center gap-2">
                      <VIcon :icon="t.icon" size="22" :color="form.transmission === t.value ? 'primary' : 'medium-emphasis'" />
                      <span class="font-weight-medium">{{ t.label }}</span>
                    </div>
                  </VCard>
                </div>
              </VCol>

              <!-- Fuel Type -->
              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.fuel_type"
                  :items="[
                    { title: 'بنزين (Petrol)', value: 'petrol' },
                    { title: 'ديزل (Diesel)', value: 'diesel' },
                    { title: 'هايبرد (Hybrid)', value: 'hybrid' },
                    { title: 'كهربائي بالكامل (Electric)', value: 'electric' },
                    { title: 'غاز طبيعي (CNG)', value: 'natural_gas' },
                  ]"
                  label="نوع الوقود *"
                  prepend-inner-icon="tabler-gas-station"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.fuel_type"
                />
              </VCol>

              <!-- Engine CC -->
              <VCol cols="12" md="4">
                <VCombobox
                  v-model="form.engine_capacity"
                  :items="engineCapacityOptions"
                  item-value="value"
                  item-title="title"
                  :return-object="false"
                  label="سعة المحرك (CC)"
                  prepend-inner-icon="tabler-gauge"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <!-- Mileage -->
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.mileage"
                  type="number"
                  label="الممشى / قراءة العداد (كم) *"
                  prepend-inner-icon="tabler-dashboard"
                  variant="outlined"
                  density="comfortable"
                  suffix="كم"
                  :error-messages="errors.mileage"
                />
              </VCol>

              <!-- Drivetrain -->
              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.drivetrain"
                  :items="[
                    { title: 'دفع أمامي (FWD)', value: 'FWD' },
                    { title: 'دفع خلفي (RWD)', value: 'RWD' },
                    { title: 'دفع رباعي مستمر (AWD)', value: 'AWD' },
                    { title: 'دفع رباعي للعربات (4WD / 4x4)', value: '4WD' },
                  ]"
                  label="نظام الدفع"
                  prepend-inner-icon="tabler-steering-wheel"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <!-- Color Palette -->
              <VCol cols="12" md="6">
                <div class="text-subtitle-2 font-weight-bold mb-2">لون السيارة</div>
                <div class="d-flex align-center gap-2 flex-wrap">
                  <div
                    v-for="c in commonColors"
                    :key="c.hex"
                    class="color-circle cursor-pointer"
                    :style="{ background: c.hex }"
                    :class="{ active: form.color === c.hex }"
                    :title="c.name"
                    @click="form.color = c.hex"
                  />
                  <input
                    type="color"
                    v-model="form.color"
                    class="custom-color-input ms-2"
                    title="اختر لون مخصص"
                  />
                  <span class="text-caption font-weight-bold">{{ form.color }}</span>
                </div>
              </VCol>
            </VRow>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-space-between mt-6">
              <VBtn variant="tonal" prepend-icon="tabler-chevron-right" @click="currentStep = 1">
                السابق
              </VBtn>
              <VBtn color="primary" append-icon="tabler-chevron-left" @click="currentStep = 3">
                التالي: السعر والموقع
              </VBtn>
            </div>
          </VCard>
        </VWindowItem>

        <!-- ===== Step 3: Price & Location ===== -->
        <VWindowItem :value="3">
          <VCard class="pa-6 rounded-2xl border mb-6" elevation="2">
            <div class="d-flex align-center gap-2 mb-4">
              <VAvatar color="primary" variant="tonal" rounded="lg">
                <VIcon icon="tabler-cash" size="24" />
              </VAvatar>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">الخطوة 3: السعر وموقع المعاينة</h3>
                <p class="text-caption text-medium-emphasis mb-0">حدد سعر البيع، السعر السابق إن وجد، والمحافظة والمدينة</p>
              </div>
            </div>

            <VRow dense>
              <!-- Price -->
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.price"
                  type="number"
                  label="سعر البيع المطلوب (EGP) *"
                  prepend-inner-icon="tabler-currency-pound"
                  variant="outlined"
                  density="comfortable"
                  suffix="EGP"
                  :error-messages="errors.price"
                />
                <div v-if="form.price" class="text-xs text-primary font-weight-bold mt-1">
                  المبلغ: {{ Number(form.price).toLocaleString() }} جنيه مصري
                </div>
              </VCol>

              <!-- Old Price (For Discount) -->
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.old_price"
                  type="number"
                  label="السعر السابق قبل التخفيض (اختياري لظهور شارة تخفيض السعر)"
                  prepend-inner-icon="tabler-tag"
                  variant="outlined"
                  density="comfortable"
                  suffix="EGP"
                />
              </VCol>

              <!-- Country -->
              <VCol cols="12" md="4">
                <VAutocomplete
                  v-model="form.country_id"
                  :items="countries"
                  :item-title="safeItemTitle"
                  item-value="id"
                  label="الدولة *"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingCountries"
                  @update:menu="open => open && loadCountriesIfNeeded()"
                  @click="loadCountriesIfNeeded"
                  @update:model-value="onCountryChange"
                />
              </VCol>

              <!-- Governorate -->
              <VCol cols="12" md="4">
                <VAutocomplete
                  v-model="form.governorate_id"
                  :items="governorates"
                  :item-title="safeItemTitle"
                  item-value="id"
                  label="المحافظة *"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingGovs"
                  :disabled="!form.country_id"
                  @update:menu="open => open && loadGovsIfNeeded()"
                  @click="loadGovsIfNeeded"
                  @update:model-value="onGovChange"
                />
              </VCol>

              <!-- City -->
              <VCol cols="12" md="4">
                <VAutocomplete
                  v-model="form.city_id"
                  :items="cities"
                  :item-title="safeItemTitle"
                  item-value="id"
                  label="المدينة / المركز *"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingCities"
                  :disabled="!form.governorate_id"
                  @update:menu="open => open && loadCitiesIfNeeded()"
                  @click="loadCitiesIfNeeded"
                />
              </VCol>

              <!-- Optional Contact Overrides -->
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.phone_number"
                  label="رقم الهاتف للتواصل (اتركه فارغاً لاستخدام رقم المعرض)"
                  prepend-inner-icon="tabler-phone"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.whatsapp_number"
                  label="رقم الواتساب (اتركه فارغاً لاستخدام رقم المعرض)"
                  prepend-inner-icon="tabler-brand-whatsapp"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            </VRow>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-space-between mt-6">
              <VBtn variant="tonal" prepend-icon="tabler-chevron-right" @click="currentStep = 2">
                السابق
              </VBtn>
              <VBtn color="primary" append-icon="tabler-chevron-left" @click="currentStep = 4">
                التالي: الصور والمميزات
              </VBtn>
            </div>
          </VCard>
        </VWindowItem>

        <!-- ===== Step 4: Media & Features ===== -->
        <VWindowItem :value="4">
          <VCard class="pa-6 rounded-2xl border mb-6" elevation="2">
            <div class="d-flex align-center gap-2 mb-4">
              <VAvatar color="primary" variant="tonal" rounded="lg">
                <VIcon icon="tabler-photo" size="24" />
              </VAvatar>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">الخطوة 4: صور السيارة والمواصفات والوصف</h3>
                <p class="text-caption text-medium-emphasis mb-0">إدارة الصور الحالية، رفع صور إضافية، وتحديد التجهيزات</p>
              </div>
            </div>

            <!-- Photos Management -->
            <div class="mb-6">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold text-subtitle-2">صور السيارة (الحد الأقصى 20 صورة)</div>
                <div class="text-xs text-medium-emphasis">
                  {{ existingImages.length + newImagePreviews.length }} / 20 صورة
                </div>
              </div>

              <!-- Upload Zone -->
              <div class="upload-dropzone pa-6 rounded-2xl text-center mb-4 cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  class="d-none"
                  ref="fileInputRef"
                  @change="handleImagesChange($event.target.files)"
                />
                <VIcon icon="tabler-cloud-upload" size="40" color="primary" class="mb-2" />
                <div class="font-weight-bold">اسحب الصور وأفلتها هنا أو انقر للاختيار</div>
                <div class="text-xs text-medium-emphasis mt-1">PNG, JPG, WEBP حتى 10MB لكل صورة</div>
                <VBtn
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="mt-3 font-weight-bold"
                  @click="$refs.fileInputRef.click()"
                >
                  اختيار صور إضافية من جهازك
                </VBtn>
              </div>

              <!-- Images Previews Grid -->
              <div v-if="existingImages.length || newImagePreviews.length" class="images-preview-grid">
                <!-- Existing Images -->
                <div
                  v-for="img in existingImages"
                  :key="'old-' + img.id"
                  class="preview-image-card rounded-xl overflow-hidden position-relative"
                  :class="{ 'is-main': mainSelection?.type === 'old' && mainSelection?.id === img.id }"
                >
                  <img :src="img.url" class="preview-img" />
                  <div class="preview-overlay d-flex align-center justify-space-between pa-2">
                    <VBtn
                      size="x-small"
                      :color="mainSelection?.type === 'old' && mainSelection?.id === img.id ? 'success' : 'default'"
                      variant="flat"
                      @click="setMainOld(img.id)"
                    >
                      {{ mainSelection?.type === 'old' && mainSelection?.id === img.id ? 'الصورة الرئيسية ⭐' : 'تعيين رئيسية' }}
                    </VBtn>
                    <VBtn
                      icon="tabler-trash"
                      size="x-small"
                      color="error"
                      variant="flat"
                      @click="removeExistingImage(img.id)"
                    />
                  </div>
                </div>

                <!-- New Uploaded Images -->
                <div
                  v-for="p in newImagePreviews"
                  :key="'new-' + p.index"
                  class="preview-image-card rounded-xl overflow-hidden position-relative"
                  :class="{ 'is-main': mainSelection?.type === 'new' && mainSelection?.index === p.index }"
                >
                  <img :src="p.url" class="preview-img" />
                  <div class="preview-overlay d-flex align-center justify-space-between pa-2">
                    <VBtn
                      size="x-small"
                      :color="mainSelection?.type === 'new' && mainSelection?.index === p.index ? 'success' : 'default'"
                      variant="flat"
                      @click="setMainNew(p.index)"
                    >
                      {{ mainSelection?.type === 'new' && mainSelection?.index === p.index ? 'الصورة الرئيسية ⭐' : 'تعيين رئيسية' }}
                    </VBtn>
                    <VBtn
                      icon="tabler-trash"
                      size="x-small"
                      color="error"
                      variant="flat"
                      @click="removeNewImage(p.index)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 🌟 360° Interactive Experience Upload Manager -->
            <Car360UploadManager
              ref="upload360Ref"
              :initial-interior-url="existingInteriorUrl"
              :initial-exterior-images="existingExteriorImages"
              :initial-model-3d-url="existingModel3dUrl"
            />

            <!-- Features Manager (Modal Popup Component) -->
            <div class="mb-6">
              <FeaturesManager
                v-model="form.features"
                :error-messages="errors.features"
              />
            </div>

            <!-- Description Textareas -->
            <VRow dense>
              <VCol cols="12" md="6">
                <VTextarea
                  v-model="form.description_ar"
                  label="الوصف التفصيلي للسيارة (بالعربية)"
                  rows="4"
                  variant="outlined"
                  placeholder="اكتب مواصفات السيارة، حالة الفحص، الصيانة، وإمكانية المعاينة..."
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextarea
                  v-model="form.description_en"
                  label="الوصف التفصيلي (بالإنجليزية)"
                  rows="4"
                  variant="outlined"
                  placeholder="Detailed car condition, inspection details, service history..."
                />
              </VCol>
            </VRow>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-space-between mt-6">
              <VBtn variant="tonal" prepend-icon="tabler-chevron-right" @click="currentStep = 3">
                السابق
              </VBtn>
              <VBtn color="primary" append-icon="tabler-chevron-left" @click="currentStep = 5">
                التالي: المراجعة والتحديث
              </VBtn>
            </div>
          </VCard>
        </VWindowItem>

        <!-- ===== Step 5: Live Review & Publish ===== -->
        <VWindowItem :value="5">
          <VCard class="pa-6 rounded-2xl border mb-6" elevation="2">
            <div class="d-flex align-center gap-2 mb-4">
              <VAvatar color="success" variant="tonal" rounded="lg">
                <VIcon icon="tabler-check" size="24" />
              </VAvatar>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">الخطوة 5: المعاينة النهائية والتحديث</h3>
                <p class="text-caption text-medium-emphasis mb-0">راجع شكل بطاقة السيارة ومواصفاتها قبل حفظ التعديلات</p>
              </div>
            </div>

            <VRow>
              <!-- Live Buyer Preview Card -->
              <VCol cols="12" md="5">
                <div class="text-subtitle-2 font-weight-bold mb-2">معاينة بطاقة الإعلان للمشترين:</div>
                <VCard class="rounded-2xl border overflow-hidden buyer-preview-card" elevation="4">
                  <!-- Main Image -->
                  <div class="preview-hero-img position-relative">
                    <img
                      :src="previewMainImage || '/placeholder-car.png'"
                      class="w-100 h-100 object-cover"
                    />
                    <VChip size="small" color="primary" class="position-absolute top-2 right-2 font-weight-bold">
                      {{ form.condition === 'new' ? 'زيرو / جديدة' : 'مستعملة' }}
                    </VChip>
                  </div>

                  <div class="pa-4">
                    <div class="text-xs text-medium-emphasis">
                      {{ selectedBrandName }} • {{ selectedModelName }} • {{ form.year }}
                    </div>
                    <div class="text-h6 font-weight-bold mt-1 mb-2 text-truncate">
                      {{ form.title_ar || 'عنوان السيارة بالعربية' }}
                    </div>

                    <div class="d-flex align-center justify-space-between border-t pt-3 mt-2">
                      <div>
                        <div class="text-caption text-medium-emphasis">السعر</div>
                        <div class="text-h5 font-weight-black text-primary">
                          {{ Number(form.price || 0).toLocaleString() }} <span class="text-caption">EGP</span>
                        </div>
                      </div>
                      <div class="text-end text-caption text-medium-emphasis">
                        <div>{{ Number(form.mileage || 0).toLocaleString() }} كم</div>
                        <div>{{ form.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال' }}</div>
                      </div>
                    </div>
                  </div>
                </VCard>
              </VCol>

              <!-- Specs Summary & Save Button -->
              <VCol cols="12" md="7">
                <div class="text-subtitle-2 font-weight-bold mb-2">ملخص بيانات التعديل:</div>
                <VList density="compact" class="rounded-xl border pa-2 mb-4">
                  <VListItem>
                    <template #prepend><VIcon icon="tabler-car" color="primary" class="me-2" /></template>
                    <VListItemTitle>المركبة</VListItemTitle>
                    <template #append><b>{{ selectedBrandName }} {{ selectedModelName }} ({{ form.year }})</b></template>
                  </VListItem>

                  <VListItem>
                    <template #prepend><VIcon icon="tabler-currency-pound" color="success" class="me-2" /></template>
                    <VListItemTitle>السعر</VListItemTitle>
                    <template #append><b class="text-primary">{{ Number(form.price || 0).toLocaleString() }} EGP</b></template>
                  </VListItem>

                  <VListItem>
                    <template #prepend><VIcon icon="tabler-sparkles" color="warning" class="me-2" /></template>
                    <VListItemTitle>المميزات المحددة</VListItemTitle>
                    <template #append><b>{{ form.features.length }} مواصفة</b></template>
                  </VListItem>

                  <VListItem>
                    <template #prepend><VIcon icon="tabler-photo" color="info" class="me-2" /></template>
                    <VListItemTitle>إجمالي الصور</VListItemTitle>
                    <template #append><b>{{ existingImages.length + newImagePreviews.length }} صورة</b></template>
                  </VListItem>
                </VList>

                <!-- Save Action Button -->
                <VBtn
                  color="primary"
                  size="x-large"
                  block
                  prepend-icon="tabler-device-floppy"
                  class="save-car-hero-btn text-white font-weight-bold elevation-4 py-4"
                  :loading="saving"
                  @click="handleUpdate"
                >
                  حفظ وتحديث بيانات السيارة الآن 💾
                </VBtn>
              </VCol>
            </VRow>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-start mt-6">
              <VBtn variant="tonal" prepend-icon="tabler-chevron-right" @click="currentStep = 4">
                السابق
              </VBtn>
            </div>
          </VCard>
        </VWindowItem>
      </VWindow>
    </div>

    <!-- Snackbar Notification -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top center">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.wizard-step-node {
  transition: all 0.2s ease;
  user-select: none;
}

.wizard-step-node:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.step-num-bubble {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.active-step .step-num-bubble {
  background: rgb(var(--v-theme-primary));
  color: white;
  box-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
}

.completed-step .step-num-bubble {
  background: #28c76f;
  color: white;
}

.upload-dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.02);
  transition: all 0.2s;
}

.upload-dropzone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.images-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.preview-image-card {
  height: 120px;
  border: 2px solid transparent;
}

.preview-image-card.is-main {
  border-color: #28c76f;
  box-shadow: 0 0 10px rgba(40, 199, 111, 0.4);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
}

.color-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.2);
  transition: transform 0.15s;
}

.color-circle.active {
  transform: scale(1.2);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 8px rgba(255, 107, 0, 0.5);
}

.custom-color-input {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
}

.buyer-preview-card .preview-hero-img {
  height: 200px;
  background: #111;
}

.type-choice-card {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 0.7);
  transition: all 0.2s ease;
}

.type-choice-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.05);
}

.selected-choice {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.1) !important;
}

.save-car-hero-btn {
  background: linear-gradient(135deg, #ff7a00 0%, #ff4b00 100%) !important;
  box-shadow: 0 6px 20px rgba(255, 107, 0, 0.4) !important;
}
</style>
