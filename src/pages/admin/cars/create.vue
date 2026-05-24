<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import carAdminApi from '../../../api/admin/carAdminApi.js'
import sellerAdminApi from '../../../api/admin/sellerAdminApi.js'
import brandAdminApi from '../../../api/admin/brandAdminApi.js'
import modelAdminApi from '../../../api/admin/modelAdminApi.js'
import featureAdminApi from '../../../api/admin/carFeatureAdminApi.js'
import countryAdminApi from '../../../api/admin/countryAdminApi.js'
import cityAdminApi from '../../../api/admin/cityAdminApi.js'
import FeaturesManager from '@/components/FeaturesManager.vue'

const router = useRouter()

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
  color: '',
  condition: 'used',

  horsepower: '',
  torque: '',
  engine_capacity: '',
  cylinders: null,

  phone_number: '',
  whatsapp_number: '',
  is_whatsapp_same: false,

  is_best_deal: false,
  is_import: false,
  is_global_ad: false,
  ad_expiry: null,
  featured_fee: '',

  features: [],
  images: [],
  main_image: null
})

const sellers = ref([])
const brands = ref([])
const models = ref([])
const features = ref([])
const countries = ref([])
const cities = ref([])

const imagePreviews = ref([])

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

/* ================= Lifecycle ================= */
onMounted(async () => {
  loading.value = true
  try {
    const results = await Promise.allSettled([
      sellerAdminApi.getAll(),
      brandAdminApi.getAll(),
      featureAdminApi.getAll(),
      countryAdminApi.getAll()
    ])

    if (results[0].status === 'fulfilled') sellers.value = results[0].value.data.data
    if (results[1].status === 'fulfilled') brands.value = results[1].value.data.data
    if (results[2].status === 'fulfilled') features.value = results[2].value.data.data
    if (results[3].status === 'fulfilled') countries.value = results[3].value.data.data

    // Log errors for failed requests
    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        console.error(`Request ${i} failed:`, res.reason)
      }
    })
  } catch (err) {
    console.error('Initial data load failed:', err)
  } finally {
    loading.value = false
  }
})

/* ================= Loaders ================= */
const loadModels = async () => {
  form.value.model_id = null
  if (!form.value.brand_id) return

  const res = await modelAdminApi.getAll({ 'filter[brand_id]': form.value.brand_id })
  models.value = res.data.data
  if (models.value.length > 0) {
    focusNext(refModel.value)
  }
}

const loadCities = async () => {
  form.value.city_id = null
  if (!form.value.country_id) return

  const res = await cityAdminApi.getAll({ 'filter[country_id]': form.value.country_id })
  cities.value = res.data.data
  if (cities.value.length > 0) {
    focusNext(refCity.value)
  }
}

/* ================= Images ================= */
const handleImagesChange = files => {
  imagePreviews.value = []
  if (!files) return

  files.forEach((file, index) => {
    imagePreviews.value.push({
      file,
      url: URL.createObjectURL(file),
      index
    })
  })

  if (form.value.main_image === null && files.length) {
    form.value.main_image = 0
  }
}

const handleColorChange = (hex) => {
  form.value.color = hex
}

const setAsMain = (index) => {
  if (index === 0) {
    form.value.main_image = 0
    return
  }

  // 1. Move file in form.images
  const files = [...form.value.images]
  const selectedFile = files[index]
  files.splice(index, 1)
  files.unshift(selectedFile)
  form.value.images = files

  // 2. Move preview in imagePreviews
  const previews = [...imagePreviews.value]
  const selectedPreview = previews[index]
  previews.splice(index, 1)
  previews.unshift(selectedPreview)
  
  // 3. Update indexes in previews to match new positions
  imagePreviews.value = previews.map((p, i) => ({ ...p, index: i }))

  // 4. Main image is now at index 0
  form.value.main_image = 0
}

/* ================= Submit ================= */
const handleSubmit = async () => {
  loading.value = true
  errors.value = {}

  try {
    const formData = new FormData()

    Object.entries(form.value).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images[]', file))
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, v))
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0')
      } else if (value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    await carAdminApi.create(formData)

    snackbarMessage.value = 'Car created successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/admin/cars'), 1200)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    }

    snackbarMessage.value = err.response?.data?.message || 'Failed to create car'
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
          Add New Car
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
                @update:modelValue="focusNext(refSeller.value)"
              />
            </VCol>

            <VCol cols="12">
              <VAutocomplete
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
              <VAutocomplete
                ref="refBrand"
                v-model="form.brand_id"
                :items="brands"
                :item-title="b => b.name?.en ?? b.name ?? '-'"
                item-value="id"
                label="Brand"
                prepend-inner-icon="tabler-building-factory"
                variant="outlined"
                @update:modelValue="loadModels"
                :error="!!fieldError('brand_id').length"
                :error-messages="fieldError('brand_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refModel"
                v-model="form.model_id"
                :items="models"
                :item-title="m => m.name?.en ?? m.name ?? '-'"
                item-value="id"
                label="Model"
                prepend-inner-icon="tabler-car"
                variant="outlined"
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
              <VAutocomplete
                ref="refCountry"
                v-model="form.country_id"
                :items="countries"
                :item-title="c => c.name.en"
                item-value="id"
                label="Country"
                prepend-inner-icon="tabler-world"
                variant="outlined"
                @update:modelValue="loadCities"
                :error="!!fieldError('country_id').length"
                :error-messages="fieldError('country_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refCity"
                v-model="form.city_id"
                :items="cities"
                :item-title="c => c.name.en"
                item-value="id"
                label="City"
                prepend-inner-icon="tabler-map-pin"
                variant="outlined"
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
              <VSelect
                ref="refEngineCapacity"
                v-model="form.engine_capacity"
                :items="[
                  { title: '1000 CC (1.0L)', value: '1000' },
                  { title: '1200 CC (1.2L)', value: '1200' },
                  { title: '1300 CC (1.3L)', value: '1300' },
                  { title: '1400 CC (1.4L)', value: '1400' },
                  { title: '1500 CC (1.5L)', value: '1500' },
                  { title: '1600 CC (1.6L)', value: '1600' },
                  { title: '1800 CC (1.8L)', value: '1800' },
                  { title: '2000 CC (2.0L)', value: '2000' },
                  { title: '2400 CC (2.4L)', value: '2400' },
                  { title: '2500 CC (2.5L)', value: '2500' },
                  { title: '2800 CC (2.8L)', value: '2800' },
                  { title: '3000 CC (3.0L)', value: '3000' },
                  { title: '3500 CC (3.5L)', value: '3500' },
                  { title: '3800 CC (3.8L)', value: '3800' },
                  { title: '4000 CC (4.0L)', value: '4000' },
                  { title: '4400 CC (4.4L)', value: '4400' },
                  { title: '4800 CC (4.8L)', value: '4800' },
                  { title: '5000 CC (5.0L)', value: '5000' },
                  { title: '5500 CC (5.5L)', value: '5500' },
                  { title: '5700 CC (5.7L)', value: '5700' },
                  { title: '6000 CC (6.0L)', value: '6000' },
                  { title: '6200 CC (6.2L)', value: '6200' },
                  { title: '6500 CC (6.5L)', value: '6500' },
                  { title: '8000 CC (8.0L)', value: '8000' }
                ]"
                label="Engine Capacity"
                prepend-inner-icon="tabler-piston"
                variant="outlined"
                :error-messages="fieldError('engine_capacity')"
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
          <FeaturesManager
            v-model="form.features"
            :features-list="features"
            :error-messages="fieldError('features')"
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

        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
            <VIcon icon="tabler-bolt" class="me-2" color="primary" />
            Ad Placement & Promotion
          </h3>

          <VCard variant="outlined" class="pa-6 rounded-lg bg-surface-variant-opacity">
            <VRow>
              <VCol cols="12" md="6">
                <div class="text-subtitle-2 font-weight-bold mb-3">Visibility Toggles</div>
                <VSwitch v-model="form.show_on_home" label="Show on Homepage Hero" color="primary" inset />
                <VSwitch v-model="form.is_featured" label="Mark as Featured" color="warning" inset />
                <VSwitch v-model="form.is_best_deal" label="Best Deal Badge" color="error" inset />
                <VSwitch v-model="form.is_import" label="Import Cars Section" color="info" inset />
                <VSwitch v-model="form.is_global_ad" label="Global Ad (All Pages)" color="secondary" inset />
              </VCol>

              <VCol cols="12" v-if="form.is_featured || form.is_global_ad">
                <div class="text-subtitle-2 font-weight-bold mb-3">Ad Details</div>
                <VTextField
                  v-model="form.ad_expiry"
                  label="Ad Expiry Date"
                  type="date"
                  prepend-inner-icon="tabler-calendar-off"
                  variant="outlined"
                  class="mb-4"
                />
              </VCol>
            </VRow>
          </VCard>
        </section>

        <!-- ================= Images ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Images</h3>

          <VFileInput
            v-model="form.images"
            multiple
            accept="image/*"
            label="Upload Images"
            variant="outlined"
            @update:modelValue="handleImagesChange"
            :error-messages="fieldError('images')"
          />

          <VRow v-if="imagePreviews.length" class="mt-4">
            <VCol
              v-for="img in imagePreviews"
              :key="img.index"
              cols="12"
              sm="6"
              md="3"
            >
              <VCard
                class="cursor-pointer"
                :class="{ 'border-primary border-2': form.main_image === img.index }"
                @click="setAsMain(img.index)"
              >
                <VImg :src="img.url" aspect-ratio="1" cover />

                <div
                  v-if="form.main_image === img.index"
                  class="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded"
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
