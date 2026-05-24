<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import carSellerApi from '../../../api/seller/carSellerApi.js'
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
  cylinders: null,
  engine_capacity: null,

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
const refBrand = ref()
const refModel = ref()
const refCountry = ref()
const refCity = ref()
const refTitleAr = ref()
const refTitleEn = ref()
const refPrice = ref()
const refYear = ref()
const refMileage = ref()
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

/* ================= Helpers ================= */
const fieldError = field => errors.value?.[field] || []

/* ================= Lifecycle ================= */
onMounted(async () => {
  sellers.value = (await sellerAdminApi.getAll()).data.data
  brands.value = (await brandAdminApi.getAll()).data.data
  features.value = (await featureAdminApi.getAll()).data.data
  countries.value = (await countryAdminApi.getAll()).data.data
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
  form.value.color = parseInt(hex.replace('#', ''), 16)
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
      } else if (value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    await carSellerApi.create(formData)

    snackbarMessage.value = 'Car created successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/seller/cars'), 1200)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    }

    snackbarMessage.value = 'Failed to create car'
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

        <!-- ================= Specs ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Car Specs</h3>

          <VRow dense>
            <VCol cols="12" md="4">
              <VTextField
                ref="refPrice"
                v-model="form.price"
                label="Price"
                type="number"
                :error-messages="fieldError('price')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refYear"
                v-model="form.year"
                label="Year"
                :error-messages="fieldError('year')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refMileage"
                v-model="form.mileage"
                label="Mileage"
                :error-messages="fieldError('mileage')"
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

            <VCol cols="12" md="4">
              <VSelect
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

            <VCol cols="12" md="3">
              <VSelect
                ref="refTransmission"
                v-model="form.transmission"
                :items="['manual','automatic']"
                label="Transmission"
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
                @update:modelValue="focusNext(refDrivetrain.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refDrivetrain"
                v-model="form.drivetrain"
                :items="['fwd','rwd','awd','4wd']"
                label="Drivetrain"
                @update:modelValue="focusNext(refCondition.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refCondition"
                v-model="form.condition"
                :items="['new','used']"
                label="Condition"
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
            :item-title="f => f.name.en"
            item-value="id"
            multiple
            chips
            variant="outlined"
            placeholder="Select features... / اختر الإضافات..."
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
                @click="form.main_image = img.index"
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
