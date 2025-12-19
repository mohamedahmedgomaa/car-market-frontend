<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carFeatureSellerApi from '../../../../api/seller/carFeatureSellerApi.js'

const route = useRoute()
const router = useRouter()

const brand = ref({
  name_ar: '',
  name_en: '',
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

// 👇 Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// ✅ Fetch brand data
const fetchSeller = async () => {
  loading.value = true
  try {
    const res = await carFeatureSellerApi.getById(route.params.id)
    const data = res.data.data

    // Map data to form fields
    brand.value.name_ar = data.name?.ar || ''
    brand.value.name_en = data.name?.en || ''
  } catch (err) {
    console.error(err)
    snackbarMessage.value = 'Failed to load brand data.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

// ✅ Handle file change
const handleLogoChange = (event) => {
  brand.value.logo = event.target.files[0] || null
}

// ✅ Handle submit
const handleSubmit = async () => {
  error.value = ''
  errors.value = {}
  loading.value = true
  try {
    // إذا فيه ملفات أو محتوى يحتاج FormData
    const formData = new FormData()
    for (const key in brand.value) {
      if (brand.value[key] !== null) {
        // تحويل Boolean لـ 0/1 لتجنب مشاكل Laravel
        if (key === 'is_verified') {
          formData.append(key, brand.value[key] ? '1' : '0')
        } else {
          formData.append(key, brand.value[key])
        }
      }
    }

    // ✅ استخدم PATCH مع FormData
    await carFeatureSellerApi.update(route.params.id, formData)

    snackbarMessage.value = 'Data updated successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => {
      router.push('/seller/car_features')
    }, 1500)
  } catch (err) {
    console.error(err)

    if (err.response && err.response.status === 422) {
      errors.value = err.response.data.errors || {}
    } else if (err.response && err.response.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'An unexpected error occurred.'
    }

    snackbarMessage.value = 'Failed to update data. Please check your inputs.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchSeller)
</script>

<template>
  <div class="flex justify-center items-start min-h-screen py-12 px-4">
    <VCard class="w-full max-w-lg p-10 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-semibold mb-8 text-center flex items-center justify-center gap-2 mt-4">
        <VIcon icon="tabler-edit" color="primary" size="24" />
        Edit Car Features
      </h2>

      <VForm @submit.prevent="handleSubmit" class="space-y-7 ma-5">

        <!--  Name Arabic -->
        <div>
          <label class="block text-sm font-medium mb-2">Name Arabic</label>
          <VTextField
            v-model="brand.name_ar"
            variant="outlined"
            density="comfortable"
            placeholder="Enter store name arabic"
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
            v-model="brand.name_en"
            variant="outlined"
            density="comfortable"
            placeholder="Enter store name english"
            prepend-inner-icon="tabler-building-store"
            :error="!!errors.name_en"
            :error-messages="errors.name_en"
            hide-details="auto"
            required
          />
        </div>

        <!-- General Error -->
        <div v-if="error" class="text-red-500 text-sm text-center mt-2">
          {{ error }}
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-4 pt-4">
          <VBtn variant="outlined" color="secondary" @click="router.back()">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="loading" type="submit">
            Update Seller
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
