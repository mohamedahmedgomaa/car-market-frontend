<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import carAdminApi from '../../../../api/admin/carAdminApi.js'
import sellerAdminApi from '../../../../api/admin/sellerAdminApi.js'
import brandAdminApi from '../../../../api/admin/brandAdminApi.js'
import modelAdminApi from '../../../../api/admin/modelAdminApi.js'
import featureAdminApi from '../../../../api/admin/carFeatureAdminApi.js'
import countryAdminApi from '../../../../api/admin/countryAdminApi.js'
import cityAdminApi from '../../../../api/admin/cityAdminApi.js'

const router = useRouter()
const route = useRoute()
const carId = route.params.id

const BASE_URL = 'http://localhost:8000'

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

  transmission: '',
  fuel_type: '',
  drivetrain: '',
  color: '#000000',
  condition: 'used',

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
  form.value.transmission = car.transmission ?? ''
  form.value.fuel_type = car.fuel_type ?? ''
  form.value.drivetrain = car.drivetrain ?? ''
  form.value.condition = car.condition ?? 'used'

  // Color (عندك بيرجع string #xxxxxx)
  form.value.color = car.color || '#000000'

  // Features (خزّن ids مؤقتًا لحد ما features list تخلص)
  pendingFeatureIds.value = car.features?.map(f => f.id) || []
  normalizeFeaturesSelection()

  // Existing images
  existingImages.value = (car.images || []).map(img => ({
    id: img.id,
    url: `${BASE_URL}/storage/${img.path}`,
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
    snackbarMessage.value = 'Failed to update car'
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
            <VCol cols="12">
              <VSelect
                v-model="form.seller_id"
                :items="sellers"
                item-title="name"
                item-value="id"
                label="Seller"
                prepend-inner-icon="tabler-user"
                variant="outlined"
                :error="!!fieldError('seller_id').length"
                :error-messages="fieldError('seller_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
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
              <VTextField v-model="form.price" label="Price" type="number" :error-messages="fieldError('price')" />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField v-model="form.year" label="Year" :error-messages="fieldError('year')" />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField v-model="form.mileage" label="Mileage" :error-messages="fieldError('mileage')" />
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
            :item-title="f => safeItemTitle(f)"
            item-value="id"
            multiple
            chips
            variant="outlined"
            :error-messages="fieldError('features')"
          />
        </section>

        <!-- ================= Color ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Color</h3>

          <VTextField
            v-model="form.color"
            label="Color"
            type="color"
            variant="outlined"
            :error-messages="fieldError('color')"
            @update:modelValue="handleColorChange"
          />
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
