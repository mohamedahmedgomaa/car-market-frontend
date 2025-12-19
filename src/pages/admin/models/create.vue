<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import modelAdminApi from '../../../api/admin/modelAdminApi.js'
import brandAdminApi from '../../../api/admin/brandAdminApi.js'

const router = useRouter()

const form = ref({
  name_ar: '',
  name_en: '',
  brand_id: null,
})

const brands = ref([])

const loading = ref(false)
const error = ref('')
const errors = ref({})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const fetchBrands = async () => {
  try {
    const res = await brandAdminApi.getAll()
    brands.value = res.data.data || res.data
  } catch (e) {
    console.error('Failed to load brands', e)
  }
}

onMounted(() => {
  fetchBrands()
})

const handleSubmit = async () => {
  error.value = ''
  errors.value = {}
  loading.value = true

  try {
    const formData = new FormData()

    for (const key in form.value) {
      if (form.value[key] !== null && form.value[key] !== '') {
        formData.append(key, form.value[key])
      }
    }

    await modelAdminApi.create(formData)

    snackbarMessage.value = 'Data created successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => {
      router.push('/admin/models')
    }, 1500)
  } catch (err) {
    console.error(err)

    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'An unexpected error occurred.'
    }

    snackbarMessage.value = 'Failed to create model. Please check your inputs.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center items-start min-h-screen py-12 px-4">
    <VCard class="w-full max-w-lg p-10 rounded-2xl shadow-lg">
      <!-- Title -->
      <h2
        class="text-2xl font-semibold mb-8 text-center flex items-center justify-center gap-2 mt-4"
      >
        <VIcon icon="tabler-plus" color="primary" size="24" />
        Add New Model
      </h2>

      <VForm @submit.prevent="handleSubmit" class="space-y-7 ma-5">

        <!-- Brand -->
        <div>
          <label class="block text-sm font-medium mb-2">Brand</label>
          <VSelect
            v-model="form.brand_id"
            :items="brands"
            :item-title="brand => brand.name.en"
            item-value="id"
            variant="outlined"
            density="comfortable"
            placeholder="Select brand"
            prepend-inner-icon="tabler-flag"
            :error="!!errors.brand_id"
            :error-messages="errors.brand_id"
            hide-details="auto"
            required
          />
        </div>

        <!-- Name Arabic -->
        <div>
          <label class="block text-sm font-medium mb-2">Name Arabic</label>
          <VTextField
            v-model="form.name_ar"
            variant="outlined"
            density="comfortable"
            placeholder="Enter city name arabic"
            prepend-inner-icon="tabler-map-pin"
            :error="!!errors.name_ar"
            :error-messages="errors.name_ar"
            hide-details="auto"
            required
          />
        </div>

        <!-- Name English -->
        <div>
          <label class="block text-sm font-medium mb-2">Name English</label>
          <VTextField
            v-model="form.name_en"
            variant="outlined"
            density="comfortable"
            placeholder="Enter city name english"
            prepend-inner-icon="tabler-map-pin"
            :error="!!errors.name_en"
            :error-messages="errors.name_en"
            hide-details="auto"
            required
          />
        </div>

        <!-- Global Error -->
        <div v-if="error" class="text-red-500 text-sm text-center mt-2">
          {{ error }}
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-4 pt-4">
          <VBtn variant="outlined" color="secondary" @click="router.back()">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="loading" type="submit">
            Save
          </VBtn>
        </div>
      </VForm>
    </VCard>

    <!-- Snackbar -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top"
      timeout="3000"
      class="rounded-lg"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>
