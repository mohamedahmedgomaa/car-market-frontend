<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import carAdminApi from '../../../../api/admin/carAdminApi.js'
import sellerAdminApi from '../../../../api/admin/sellerAdminApi.js'
import brandAdminApi from '../../../../api/admin/brandAdminApi.js'
import modelAdminApi from '../../../../api/admin/modelAdminApi.js'
import featureAdminApi from '../../../../api/admin/carFeatureAdminApi.js'
import countryAdminApi from '../../../../api/admin/countryAdminApi.js'
import cityAdminApi from '../../../../api/admin/cityAdminApi.js'
import FeaturesManager from '@/components/FeaturesManager.vue'

const router = useRouter()
const route = useRoute()
const carId = route.params.id

const BASE_URL = import.meta.env.VITE_BASE_URL

/* ================= State ================= */
const form = ref({
  seller_id: null,
  brand_id: null,
  model_id: null,

  country_id: null,
  city_id: null,

  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',

  price: '',
  year: '',
  mileage: '',

  type: '',
  transmission: '',
  fuel_type: '',
  drivetrain: '',
  color: '#000000',
  condition: 'used',

  horsepower: '',
  torque: '',
  engine_capacity: '',
  cylinders: null,

  phone_number: '',
  whatsapp_number: '',
  is_whatsapp_same: false,

  is_global_ad: false,
  ad_expiry: null,
  featured_fee: '',

  features: [],

  // صور جديدة فقط (Files)
  images: [],
})

// ✅ صور قديمة من السيرفر
const existingImages = ref([]) // [{id, url, is_main}]
const keepImages = ref([])     // ids اللي هنحافظ عليهم

// ✅ صور جديدة للـ preview
const newImagePreviews = ref([]) // [{file, url, index}]

/**
 * main image ممكن تبقى:
 * - old: { type: 'old', id: number }
 * - new: { type: 'new', index: number }
 */
const mainSelection = ref(null)

const sellers = ref([])
const brands = ref([])
const models = ref([])
const features = ref([])
const countries = ref([])
const cities = ref([])

const loading = ref(false)
const errors = ref({})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

/* ================= Refs for Auto-focus ================= */
const refType = ref()
const refSeller = ref()
const refBrand = ref()
const refModel = ref()
const refCountry = ref()
const refCity = ref()
const refTitleAr = ref()
const refTitleEn = ref()
const refPrice = ref()
const refYear = ref()
const refMileage = ref()
const refHorsepower = ref()
const refTorque = ref()
const refEngineCapacity = ref()
const refTransmission = ref()
const refFuelType = ref()
const refDrivetrain = ref()
const refCondition = ref()

const focusNext = (nextRef) => {
  if (nextRef && nextRef.focus) {
    setTimeout(() => {
      nextRef.focus()
    }, 100)
  }
}

const commonColors = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Gold', hex: '#FFD700' },
]

/* ================= Numeric Helpers ================= */
const isNumberKey = (evt) => {
  const charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode < 1632 || charCode > 1641)) {
    evt.preventDefault()
  }
}

const formatWithCommas = (v) => {
  if (!v && v !== 0) return ''
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const toNumOrNull = (v, limit = 9) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  raw = raw.replace(/\D/g, '').slice(0, limit)
  let n = Number(raw)
  return Number.isNaN(n) || raw === '' ? null : n
}

const toDecimalOrNull = (v, limit = 9) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  // Allow digits and one dot
  raw = raw.replace(/[^0-9.]/g, '')
  // Keep only the first dot
  const parts = raw.split('.')
  if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('')
  raw = raw.slice(0, limit)
  return raw === '' ? null : raw
}

const displayPrice = computed({
  get: () => formatWithCommas(form.value.price),
  set: (v) => { form.value.price = toNumOrNull(v) }
})

const displayMileage = computed({
  get: () => formatWithCommas(form.value.mileage),
  set: (v) => { form.value.mileage = toNumOrNull(v, 6) }
})

const displayYear = computed({
  get: () => form.value.year,
  set: (v) => { form.value.year = toNumOrNull(v, 4) }
})

const displayHorsepower = computed({
  get: () => form.value.horsepower,
  set: (v) => { form.value.horsepower = toNumOrNull(v, 4) }
})

const displayTorque = computed({
  get: () => form.value.torque,
  set: (v) => { form.value.torque = toNumOrNull(v, 5) }
})

const displayEngineCapacity = computed({
  get: () => form.value.engine_capacity,
  set: (v) => { form.value.engine_capacity = toDecimalOrNull(v, 5) } // 5 to allow e.g. 1.600 or 1.6L
})

/* ================= Helpers ================= */
const fieldError = field => errors.value?.[field] || []

const safeItemTitle = (obj) => obj?.name?.en ?? obj?.name ?? '-'

/* ================= Loaders ================= */
const loadModels = async (keepCurrent = false) => {
  if (!form.value.brand_id) {
    models.value = []
    if (!keepCurrent) form.value.model_id = null
    return
  }

  const current = form.value.model_id
  const res = await modelAdminApi.getAll({ 'filter[brand_id]': form.value.brand_id })
  models.value = res.data.data || []

  // ✅ لو بنحمّل للـ edit: سيب القيمة القديمة لو موجودة في الليست
  if (keepCurrent && current) {
    const exists = models.value.some(m => m.id === current)
    form.value.model_id = exists ? current : null
  } else {
    form.value.model_id = null
    if (models.value.length > 0) {
      focusNext(refModel.value)
    }
  }
}

const loadCities = async (keepCurrent = false) => {
  if (!form.value.country_id) {
    cities.value = []
    if (!keepCurrent) form.value.city_id = null
    return
  }

  const current = form.value.city_id
  const res = await cityAdminApi.getAll({ 'filter[country_id]': form.value.country_id })
  cities.value = res.data.data || []

  if (keepCurrent && current) {
    const exists = cities.value.some(c => c.id === current)
    form.value.city_id = exists ? current : null
  } else {
    form.value.city_id = null
    if (cities.value.length > 0) {
      focusNext(refCity.value)
    }
  }
}

/* ================= Features Fix ================= */
// أحيانًا car بيتحمّل قبل features list، فنخزن IDs ونظبطها لما features تجهز
const pendingFeatureIds = ref([])

const normalizeFeaturesSelection = () => {
  // لو features list لسه فاضية، استنى
  if (!features.value.length) return

  // source ids: يا من car يا من form
  const ids = pendingFeatureIds.value.length ? pendingFeatureIds.value : form.value.features
  const validIds = ids.filter(id => features.value.some(f => f.id === id))

  form.value.features = validIds
  pendingFeatureIds.value = []
}

/* ================= Images ================= */
const setMainOld = (id) => {
  const index = existingImages.value.findIndex(i => i.id === id)
  if (index === -1) return

  // Move to front of existingImages
  const selected = existingImages.value[index]
  existingImages.value.splice(index, 1)
  existingImages.value.unshift(selected)

  mainSelection.value = { type: 'old', id }
  existingImages.value.forEach(img => (img.is_main = img.id === id))
}

const setMainNew = (index) => {
  if (index === 0 && mainSelection.value?.type === 'new') {
    mainSelection.value = { type: 'new', index: 0 }
    return
  }

  // 1. Move file in form.images
  const files = [...form.value.images]
  const selectedFile = files[index]
  files.splice(index, 1)
  files.unshift(selectedFile)
  form.value.images = files

  // 2. Move preview in newImagePreviews
  const previews = [...newImagePreviews.value]
  const selectedPreview = previews[index]
  previews.splice(index, 1)
  previews.unshift(selectedPreview)
  
  // 3. Update indexes
  newImagePreviews.value = previews.map((p, i) => ({ ...p, index: i }))

  mainSelection.value = { type: 'new', index: 0 }
  existingImages.value.forEach(img => (img.is_main = false))
}

const removeExistingImage = (id) => {
  existingImages.value = existingImages.value.filter(i => i.id !== id)
  keepImages.value = keepImages.value.filter(x => x !== id)

  // لو كانت main صورة قديمة واتمسحت -> اختار أول صورة متاحة
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

const handleImagesChange = (files) => {
  // Vuetify بيرجع Array<File>
  form.value.images = files || []

  // نظّف previews القديمة للـ new
  newImagePreviews.value.forEach(p => URL.revokeObjectURL(p.url))
  newImagePreviews.value = []

  if (!form.value.images.length) return

  form.value.images.forEach((file, index) => {
    newImagePreviews.value.push({
      file,
      url: URL.createObjectURL(file),
      index,
    })
  })

  // لو مفيش main لسه واخترت صور جديدة ومفيش صور قديمة
  if (!mainSelection.value && newImagePreviews.value.length && !existingImages.value.length) {
    setMainNew(0)
  }
}

const handleColorChange = (hex) => {
  form.value.color = hex
}

/* ================= Load Car ================= */
const loadCar = async () => {
  const res = await carAdminApi.getById(carId)
  const car = res.data.data

  // ✅ set base ids first
  form.value.seller_id = car.seller_id
  form.value.brand_id = car.brand_id
  form.value.model_id = car.model_id

  form.value.country_id = car.country_id
  form.value.city_id = car.city_id

  // ✅ load dependent lists WITHOUT wiping selected values
  await Promise.all([
    loadModels(true),
    loadCities(true),
  ])

  // Titles / Descriptions
  form.value.title_ar = car.title?.ar || ''
  form.value.title_en = car.title?.en || ''
  form.value.description_ar = car.description?.ar || ''
  form.value.description_en = car.description?.en || ''

  // Specs
  form.value.price = car.price ?? ''
  form.value.year = car.year ?? ''
  form.value.mileage = car.mileage ?? ''
  form.value.type = car.type ?? ''
  form.value.transmission = car.transmission ?? ''
  form.value.fuel_type = car.fuel_type ?? ''
  form.value.drivetrain = car.drivetrain ?? ''
  form.value.condition = car.condition ?? 'used'

  form.value.horsepower = car.horsepower ?? ''
  form.value.torque = car.torque ?? ''
  form.value.engine_capacity = car.engine_capacity ?? ''
  form.value.cylinders = car.cylinders ?? null

  form.value.phone_number = car.phone_number ?? ''
  form.value.whatsapp_number = car.whatsapp_number ?? ''
  form.value.is_whatsapp_same = car.phone_number && car.phone_number === car.whatsapp_number

  form.value.is_best_deal = !!car.is_best_deal
  form.value.is_import = !!car.is_import
  form.value.is_featured = !!car.is_featured
  form.value.show_on_home = !!car.show_on_home
  form.value.is_global_ad = !!car.is_global_ad
  form.value.ad_expiry = car.ad_expiry ? car.ad_expiry.split('T')[0] : null
  form.value.featured_fee = car.featured_fee ?? ''

  // Color (عندك بيرجع string #xxxxxx)
  form.value.color = car.color || '#000000'

  // Features (خزّن ids مؤقتًا لحد ما features list تخلص)
  pendingFeatureIds.value = car.features?.map(f => f.id) || []
  normalizeFeaturesSelection()

  // Existing images
  existingImages.value = (car.images || []).map(img => ({
    id: img.id,
    url: `${img.path}`,
    is_main: img.is_main === 1 || img.is_main === true,
  }))

  keepImages.value = existingImages.value.map(i => i.id)

  // main selection from server
  const mainOld = existingImages.value.find(i => i.is_main)
  if (mainOld) {
    mainSelection.value = { type: 'old', id: mainOld.id }
  } else if (existingImages.value.length) {
    setMainOld(existingImages.value[0].id)
  } else {
    mainSelection.value = null
  }
}

/* ================= Lifecycle ================= */
onMounted(async () => {
  loading.value = true
  try {
    const [sellersRes, brandsRes, featuresRes, countriesRes] = await Promise.all([
      sellerAdminApi.getAll(),
      brandAdminApi.getAll(),
      featureAdminApi.getAll(),
      countryAdminApi.getAll(),
    ])

    sellers.value = sellersRes.data.data || []
    brands.value = brandsRes.data.data || []
    features.value = featuresRes.data.data || []
    countries.value = countriesRes.data.data || []

    // بعد ما features جهزت
    normalizeFeaturesSelection()

    await loadCar()
  } finally {
    loading.value = false
  }
})

/* ================= Submit ================= */
const handleSubmit = async () => {
  loading.value = true
  errors.value = {}

  try {
    const fd = new FormData()
    fd.append('_method', 'PUT')

    // basic fields
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

    // keep old images
    keepImages.value.forEach(id => fd.append('keep_images[]', id))

    // main selection
    if (mainSelection.value?.type === 'old') {
      fd.append('main_image_id', mainSelection.value.id)
    } else if (mainSelection.value?.type === 'new') {
      fd.append('main_image_new_index', mainSelection.value.index)
    }

    await carAdminApi.update(carId, fd)

    snackbarMessage.value = 'Car updated successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/admin/cars'), 1200)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    }
    snackbarMessage.value = err.response?.data?.message || 'Failed to update car'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center py-10 px-4">
    <VCard class="w-full max-w-6xl pa-8 rounded-xl">

      <!-- Title -->
      <div class="text-center mb-10">
        <VIcon icon="tabler-car" size="28" color="primary" />
        <h2 class="text-h5 font-weight-medium mt-2">
          Edit Car
        </h2>
      </div>

      <VForm @submit.prevent="handleSubmit">

        <!-- ================= Basic Info ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Basic Information</h3>

          <VRow dense>
            <VCol cols="12" md="12">
              <VSelect
                ref="refType"
                v-model="form.type"
                :items="['car','motorcycle']"
                label="Type"
                :error-messages="fieldError('type')"
                @update:modelValue="focusNext(refSeller.value)"
              />
            </VCol>

            <VCol cols="12">
              <VSelect
                ref="refSeller"
                v-model="form.seller_id"
                :items="sellers"
                item-title="name"
                item-value="id"
                label="Seller"
                prepend-inner-icon="tabler-user"
                variant="outlined"
                :error="!!fieldError('seller_id').length"
                :error-messages="fieldError('seller_id')"
                @update:modelValue="focusNext(refBrand.value)"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                ref="refBrand"
                v-model="form.brand_id"
                :items="brands"
                :item-title="b => safeItemTitle(b)"
                item-value="id"
                label="Brand"
                prepend-inner-icon="tabler-building-factory"
                variant="outlined"
                @update:modelValue="() => loadModels(false)"
                :error="!!fieldError('brand_id').length"
                :error-messages="fieldError('brand_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                ref="refModel"
                v-model="form.model_id"
                :items="models"
                :item-title="m => safeItemTitle(m)"
                item-value="id"
                label="Model"
                prepend-inner-icon="tabler-car"
                variant="outlined"
                :disabled="!form.brand_id || !models.length"
                :error="!!fieldError('model_id').length"
                :error-messages="fieldError('model_id')"
                @update:modelValue="focusNext(refCountry.value)"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Location ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Location</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VSelect
                ref="refCountry"
                v-model="form.country_id"
                :items="countries"
                :item-title="c => safeItemTitle(c)"
                item-value="id"
                label="Country"
                prepend-inner-icon="tabler-world"
                variant="outlined"
                @update:modelValue="() => loadCities(false)"
                :error="!!fieldError('country_id').length"
                :error-messages="fieldError('country_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                ref="refCity"
                v-model="form.city_id"
                :items="cities"
                :item-title="c => safeItemTitle(c)"
                item-value="id"
                label="City"
                prepend-inner-icon="tabler-map-pin"
                variant="outlined"
                :disabled="!form.country_id || !cities.length"
                :error="!!fieldError('city_id').length"
                :error-messages="fieldError('city_id')"
                @update:modelValue="focusNext(refTitleAr.value)"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Titles ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Titles</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VTextField
                ref="refTitleAr"
                v-model="form.title_ar"
                label="Title Arabic"
                variant="outlined"
                :error-messages="fieldError('title_ar')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                ref="refTitleEn"
                v-model="form.title_en"
                label="Title English"
                variant="outlined"
                :error-messages="fieldError('title_en')"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Description ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Description</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="form.description_ar"
                label="Description Arabic"
                rows="4"
                variant="outlined"
                :error-messages="fieldError('description_ar')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextarea
                v-model="form.description_en"
                label="Description English"
                rows="4"
                variant="outlined"
                :error-messages="fieldError('description_en')"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Specs & Technical ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Specifications & Technical Details</h3>

          <VRow dense>
            <VCol cols="12" md="4">
              <VTextField
                ref="refPrice"
                v-model="displayPrice"
                label="Price (EG)"
                prepend-inner-icon="tabler-currency-pound"
                :error-messages="fieldError('price')"
                @keypress="isNumberKey"
                maxlength="11"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refYear"
                v-model="displayYear"
                label="Year"
                prepend-inner-icon="tabler-calendar"
                :error-messages="fieldError('year')"
                @keypress="isNumberKey"
                maxlength="4"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refMileage"
                v-model="displayMileage"
                label="Mileage (km)"
                prepend-inner-icon="tabler-road"
                :error-messages="fieldError('mileage')"
                @keypress="isNumberKey"
                maxlength="7"
              />
            </VCol>

            <!-- Technical Specs -->
            <VCol cols="12" md="4">
              <VTextField
                ref="refHorsepower"
                v-model="displayHorsepower"
                label="Horsepower (HP)"
                prepend-inner-icon="tabler-engine"
                :error-messages="fieldError('horsepower')"
                @keypress="isNumberKey"
                maxlength="4"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refTorque"
                v-model="displayTorque"
                label="Torque (Nm)"
                prepend-inner-icon="tabler-settings-automation"
                :error-messages="fieldError('torque')"
                @keypress="isNumberKey"
                maxlength="5"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refEngineCapacity"
                v-model="displayEngineCapacity"
                label="Engine Capacity (CC / Liters)"
                prepend-inner-icon="tabler-piston"
                :error-messages="fieldError('engine_capacity')"
                maxlength="5"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VSelect
                v-model="form.cylinders"
                :items="['I2','I3','I4','I5','I6','V6','V8','V10','V12','W12','W16']"
                label="Cylinders"
                prepend-inner-icon="tabler-engine-off"
                variant="outlined"
                :error-messages="fieldError('cylinders')"
              />
            </VCol>

            <!-- Mechanical Options -->
            <VCol cols="12" md="3">
              <VSelect
                ref="refTransmission"
                v-model="form.transmission"
                :items="[
                  { title: 'Automatic', value: 'automatic' },
                  { title: 'Manual', value: 'manual' }
                ]"
                label="Transmission"
                prepend-inner-icon="tabler-manual-gearbox"
                @update:modelValue="focusNext(refFuelType.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refFuelType"
                v-model="form.fuel_type"
                :items="[
                  { title: 'Petrol', value: 'petrol' },
                  { title: 'Diesel', value: 'diesel' },
                  { title: 'Electric', value: 'electric' },
                  { title: 'Hybrid', value: 'hybrid' },
                  { title: 'Mild Hybrid', value: 'mild_hybrid' },
                  { title: 'REEV (Plug-in)', value: 'reev' }
                ]"
                label="Fuel Type"
                prepend-inner-icon="tabler-gas-station"
                @update:modelValue="focusNext(refDrivetrain.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refDrivetrain"
                v-model="form.drivetrain"
                :items="[
                  { title: 'FWD (Front Wheel)', value: 'fwd' },
                  { title: 'RWD (Rear Wheel)', value: 'rwd' },
                  { title: 'AWD (All Wheel)', value: 'awd' },
                  { title: '4WD (4x4)', value: '4wd' }
                ]"
                label="Drivetrain"
                prepend-inner-icon="tabler-binary-tree"
                @update:modelValue="focusNext(refCondition.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refCondition"
                v-model="form.condition"
                :items="[
                  { title: 'New', value: 'new' },
                  { title: 'Used', value: 'used' }
                ]"
                label="Condition"
                prepend-inner-icon="tabler-refresh"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Features ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Features</h3>

          <VSelect
            v-model="form.features"
            :items="features"
            :item-title="f => safeItemTitle(f)"
            item-value="id"
            multiple
            chips
            variant="outlined"
            placeholder="Select features... / اختر الإضافات..."
            :error-messages="fieldError('features')"
            class="mb-4"
          />

          <FeaturesManager
            v-model="form.features"
            :features-list="features"
            @feature-created="f => features.push(f)"
          />
        </section>

        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Color</h3>

          <div class="d-flex flex-wrap gap-3 mb-4">
            <div
              v-for="c in commonColors"
              :key="c.hex"
              class="cursor-pointer rounded-circle border d-flex align-center justify-center"
              :style="{ backgroundColor: c.hex, width: '40px', height: '40px', border: form.color === c.hex ? '3px solid #FF9F43' : '1px solid #ddd' }"
              :title="c.name"
              @click="form.color = c.hex"
            >
              <VIcon v-if="form.color === c.hex" icon="tabler-check" :color="c.hex === '#FFFFFF' ? 'black' : 'white'" size="20" />
            </div>
          </div>

          <VRow align="center">
            <VCol cols="12" md="4">
              <VTextField
                v-model="form.color"
                label="Custom Color (Hex)"
                variant="outlined"
                prepend-inner-icon="tabler-palette"
                :error-messages="fieldError('color')"
              >
                <template #append-inner>
                  <input
                    type="color"
                    v-model="form.color"
                    style="width: 30px; height: 30px; border: none; cursor: pointer; background: none;"
                  >
                </template>
              </VTextField>
            </VCol>
          </VRow>
        </section>

        <!-- ================= Contact Information ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Contact Information</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.phone_number"
                label="Phone Number for Calls"
                prepend-inner-icon="tabler-phone"
                :error-messages="fieldError('phone_number')"
                maxlength="20"
                @input="() => { if(form.is_whatsapp_same) form.whatsapp_number = form.phone_number }"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="form.whatsapp_number"
                label="WhatsApp Number"
                prepend-inner-icon="tabler-brand-whatsapp"
                :error-messages="fieldError('whatsapp_number')"
                maxlength="20"
                :disabled="form.is_whatsapp_same"
              />
            </VCol>

            <VCol cols="12">
              <VCheckbox
                v-model="form.is_whatsapp_same"
                label="WhatsApp number is the same as call number"
                hide-details
                @change="() => { if(form.is_whatsapp_same) form.whatsapp_number = form.phone_number }"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Ad Placement & Promotion ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
            <VIcon icon="tabler-bolt" class="me-2" color="primary" />
            Promotion & Visibility
          </h3>

          <VCard class="pa-6 border-primary bg-surface-variant-opacity">
            <VRow>
              <VCol cols="12" md="6">
                <VSwitch v-model="form.show_on_home" label="Show on Homepage Hero" color="primary" inset />
                <VSwitch v-model="form.is_featured" label="Mark as Featured" color="warning" inset />
                <VSwitch v-model="form.is_best_deal" label="Best Deal Badge" color="error" inset />
                <VSwitch v-model="form.is_import" label="Import Cars Section" color="info" inset />
                <VSwitch v-model="form.is_global_ad" label="Global Ad (All Pages)" color="secondary" inset />
              </VCol>

              <VCol cols="12" md="6" v-if="form.is_featured || form.is_global_ad">
                <VTextField
                  v-model="form.ad_expiry"
                  label="Ad Expiry Date"
                  type="date"
                  prepend-inner-icon="tabler-calendar-off"
                  class="mb-4"
                />
              </VCol>
            </VRow>
          </VCard>
        </section>

        <!-- ================= Images ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Images</h3>

          <!-- Old Images -->
          <div v-if="existingImages.length" class="mb-4">
            <div class="text-sm opacity-80 mb-2">Existing Images</div>

            <VRow>
              <VCol v-for="img in existingImages" :key="img.id" cols="auto">
                <VCard
                  class="cursor-pointer"
                  :class="{ 'border-primary border-2': mainSelection?.type === 'old' && mainSelection?.id === img.id }"
                  @click="setMainOld(img.id)"
                  style="width:100px;height:100px;position:relative;overflow:hidden;"
                >
                  <VImg :src="img.url" cover style="width:100px;height:100px;" />

                  <div
                    v-if="mainSelection?.type === 'old' && mainSelection?.id === img.id"
                    style="position:absolute;top:6px;right:6px;z-index:10;"
                    class="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded"
                  >
                    Main
                  </div>

                  <VBtn
                    icon
                    color="error"
                    size="x-small"
                    variant="flat"
                    style="position:absolute;bottom:6px;right:6px;z-index:10;"
                    @click.stop="removeExistingImage(img.id)"
                  >
                    <VIcon icon="tabler-trash" size="16" />
                  </VBtn>
                </VCard>
              </VCol>
            </VRow>
          </div>

          <!-- Upload New -->
          <VFileInput
            v-model="form.images"
            multiple
            accept="image/*"
            label="Upload New Images"
            variant="outlined"
            @update:modelValue="handleImagesChange"
            :error-messages="fieldError('images')"
          />

          <!-- New Previews -->
          <VRow v-if="newImagePreviews.length" class="mt-4">
            <VCol
              v-for="img in newImagePreviews"
              :key="img.index"
              cols="auto"
            >
              <VCard
                class="cursor-pointer position-relative"
                :class="{ 'border-primary border-2': mainSelection?.type === 'new' && mainSelection?.index === img.index }"
                @click="setMainNew(img.index)"
                style="width: 100px; height: 100px;"
              >
                <VImg
                  :src="img.url"
                  cover
                  style="width: 100px; height: 100px;"
                />

                <div
                  v-if="mainSelection?.type === 'new' && mainSelection?.index === img.index"
                  class="absolute top-1 right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded"
                >
                  Main
                </div>
              </VCard>
            </VCol>
          </VRow>
        </section>

        <!-- ================= Actions ================= -->
        <div class="d-flex justify-end gap-4">
          <VBtn variant="outlined" @click="router.back()">Cancel</VBtn>
          <VBtn color="primary" type="submit" :loading="loading">Save Car</VBtn>
        </div>
      </VForm>
    </VCard>

    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>
