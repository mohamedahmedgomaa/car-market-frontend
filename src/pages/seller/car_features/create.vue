<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import carFeatureSellerApi from '../../../api/seller/carFeatureSellerApi.js'

const router = useRouter()

const form = ref({
  name_ar: '',
  name_en: '',
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

// ✅ Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// ✅ Handle Submit
const handleSubmit = async () => {
  error.value = ''
  errors.value = {}

  loading.value = true
  try {
    const formData = new FormData()
    for (const key in form.value) {
      if (form.value[key] !== null) {
        // ✅ Force is_verified to be true/false
        if (key === 'is_verified') {
          formData.append(key, form.value[key] ? '1' : '0') // Laravel يفهم 1 و 0 كـ Boolean
        } else {
          formData.append(key, form.value[key])
        }
      }
    }

    await carFeatureSellerApi.create(formData)

    snackbarMessage.value = 'Data created successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => {
      router.push('/seller/car_features')
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

    snackbarMessage.value = 'Failed to create. Please check your inputs.'
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
      <h2 class="text-2xl font-semibold mb-8 text-center flex items-center justify-center gap-2 mt-4">
        <VIcon icon="tabler-plus" color="primary" size="24" />
        Add New Car Feature
      </h2>

      <VForm @submit.prevent="handleSubmit" class="space-y-7 ma-5">

        <!-- Name Arabic -->
        <div>
          <label class="block text-sm font-medium mb-2">Name Arabic</label>
          <VTextField
            v-model="form.name_ar"
            variant="outlined"
            density="comfortable"
            placeholder="Enter name arabic"
            prepend-inner-icon="tabler-building-store"
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
            placeholder="Enter name english"
            prepend-inner-icon="tabler-building-store"
            :error="!!errors.name_en"
            :error-messages="errors.name_en"
            hide-details="auto"
            required
          />
        </div>

        <!-- Error -->
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
