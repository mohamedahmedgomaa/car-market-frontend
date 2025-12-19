<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import sellerAdminApi from '../../../api/admin/sellerAdminApi.js'

const router = useRouter()

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  store_name_ar: '',
  store_description_ar: '',
  store_name_en: '',
  store_description_en: '',
  bank_account: '',
  is_verified: false,
  store_logo: null, // مضاف للرفع
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

// ✅ Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// ✅ Handle File Change
const handleLogoChange = (event) => {
  form.value.store_logo = event.target.files[0] || null
}

// ✅ Handle Submit
const handleSubmit = async () => {
  error.value = ''
  errors.value = {}

  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Passwords do not match'
    return
  }

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

    await sellerAdminApi.create(formData)

    snackbarMessage.value = 'Seller created successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => {
      router.push('/admin/sellers')
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

    snackbarMessage.value = 'Failed to create seller. Please check your inputs.'
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
        Add New Seller
      </h2>

      <VForm @submit.prevent="handleSubmit" class="space-y-7 ma-5">
        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium mb-2">Full Name</label>
          <VTextField
            v-model="form.name"
            variant="outlined"
            density="comfortable"
            placeholder="Enter full name"
            prepend-inner-icon="tabler-user"
            :error="!!errors.name"
            :error-messages="errors.name"
            hide-details="auto"
            required
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium mb-2">Email Address</label>
          <VTextField
            v-model="form.email"
            type="email"
            variant="outlined"
            density="comfortable"
            placeholder="example@email.com"
            prepend-inner-icon="tabler-mail"
            :error="!!errors.email"
            :error-messages="errors.email"
            hide-details="auto"
            required
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium mb-2">Phone Number</label>
          <VTextField
            v-model="form.phone"
            variant="outlined"
            density="comfortable"
            placeholder="Enter phone number"
            prepend-inner-icon="tabler-phone"
            :error="!!errors.phone"
            :error-messages="errors.phone"
            hide-details="auto"
          />
        </div>

        <!-- Store Name Arabic -->
        <div>
          <label class="block text-sm font-medium mb-2">Store Name Arabic</label>
          <VTextField
            v-model="form.store_name_ar"
            variant="outlined"
            density="comfortable"
            placeholder="Enter store name arabic"
            prepend-inner-icon="tabler-building-store"
            :error="!!errors.store_name_ar"
            :error-messages="errors.store_name_ar"
            hide-details="auto"
            required
          />
        </div>

        <!-- Store Name English -->
        <div>
          <label class="block text-sm font-medium mb-2">Store Name English</label>
          <VTextField
            v-model="form.store_name_en"
            variant="outlined"
            density="comfortable"
            placeholder="Enter store name english"
            prepend-inner-icon="tabler-building-store"
            :error="!!errors.store_name_en"
            :error-messages="errors.store_name_en"
            hide-details="auto"
            required
          />
        </div>

        <!-- Store Description Arabic -->
        <div>
          <label class="block text-sm font-medium mb-2">Store Description Arabic</label>
          <VTextarea
            v-model="form.store_description_ar"
            variant="outlined"
            density="comfortable"
            placeholder="Enter short description arabic"
            :error="!!errors.store_description_ar"
            :error-messages="errors.store_description_ar"
            hide-details="auto"
          />
        </div>

        <!-- Store Description English -->
        <div>
          <label class="block text-sm font-medium mb-2">Store Description English</label>
          <VTextarea
            v-model="form.store_description_en"
            variant="outlined"
            density="comfortable"
            placeholder="Enter short description english"
            :error="!!errors.store_description_en"
            :error-messages="errors.store_description_en"
            hide-details="auto"
          />
        </div>

        <!-- Store Logo -->
        <div>
          <label class="block text-sm font-medium mb-2">Store Logo</label>
          <input type="file" @change="handleLogoChange" accept="image/*" />
        </div>

        <!-- Bank Account -->
        <div>
          <label class="block text-sm font-medium mb-2">Bank Account</label>
          <VTextField
            v-model="form.bank_account"
            variant="outlined"
            density="comfortable"
            placeholder="Enter bank account number"
            prepend-inner-icon="tabler-credit-card"
            :error="!!errors.bank_account"
            :error-messages="errors.bank_account"
            hide-details="auto"
          />
        </div>

        <!-- Verified -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Verified Seller?</label>
          <VSwitch v-model="form.is_verified" color="success" inset />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <VTextField
            v-model="form.password"
            type="password"
            variant="outlined"
            density="comfortable"
            placeholder="Enter password"
            prepend-inner-icon="tabler-lock"
            :error="!!errors.password"
            :error-messages="errors.password"
            hide-details="auto"
            required
          />
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="block text-sm font-medium mb-2">Confirm Password</label>
          <VTextField
            v-model="form.password_confirmation"
            type="password"
            variant="outlined"
            density="comfortable"
            placeholder="Re-enter password"
            prepend-inner-icon="tabler-lock-check"
            :error="!!errors.password_confirmation"
            :error-messages="errors.password_confirmation"
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
            Save Seller
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
