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
}

const loadCities = async () => {
  form.value.city_id = null
  if (!form.value.country_id) return

  const res = await cityAdminApi.getAll({ 'filter[country_id]': form.value.country_id })
  cities.value = res.data.data
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
              <VSelect v-model="form.type" :items="['car','motorcycle']" label="Type" />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="form.brand_id"
                :items="brands"
                :item-title="b => b.name.en"
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
              <VSelect
                v-model="form.model_id"
                :items="models"
                :item-title="m => m.name.en"
                item-value="id"
                label="Model"
                prepend-inner-icon="tabler-car"
                variant="outlined"
                :error="!!fieldError('model_id').length"
                :error-messages="fieldError('model_id')"
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
              <VSelect
                v-model="form.city_id"
                :items="cities"
                :item-title="c => c.name.en"
                item-value="id"
                label="City"
                prepend-inner-icon="tabler-map-pin"
                variant="outlined"
                :error="!!fieldError('city_id').length"
                :error-messages="fieldError('city_id')"
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
                v-model="form.title_ar"
                label="Title Arabic"
                variant="outlined"
                :error-messages="fieldError('title_ar')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
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
                v-model="form.price"
                label="Price"
                type="number"
                :error-messages="fieldError('price')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                v-model="form.year"
                label="Year"
                :error-messages="fieldError('year')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                v-model="form.mileage"
                label="Mileage"
                :error-messages="fieldError('mileage')"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect v-model="form.transmission" :items="['manual','automatic']" label="Transmission" />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect v-model="form.fuel_type" :items="['petrol','diesel','electric','hybrid']" label="Fuel Type" />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect v-model="form.drivetrain" :items="['fwd','rwd','awd','4wd']" label="Drivetrain" />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect v-model="form.condition" :items="['new','used']" label="Condition" />
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
          />
        </section>
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Color</h3>

          <VTextField
            v-model="form.color"
            label="Color"
            type="color"
            variant="outlined"
            :error-messages="fieldError('color')"
            @input="handleColorChange"
          />
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
