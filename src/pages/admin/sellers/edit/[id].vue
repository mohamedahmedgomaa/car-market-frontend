<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import sellerAdminApi from '../../../../api/admin/sellerAdminApi.js'

const route = useRoute()
const router = useRouter()

const seller = ref({
  name: '',
  email: '',
  phone: '',
  store_name_ar: '',
  store_description_ar: '',
  store_name_en: '',
  store_description_en: '',
  bank_account: '',
  is_verified: false,
  store_logo: null,
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

// 👇 Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// ✅ Fetch seller data
const fetchSeller = async () => {
  loading.value = true
  try {
    const res = await sellerAdminApi.getById(route.params.id)
    const data = res.data.data

    // Map data to form fields
    seller.value.name = data.name
    seller.value.email = data.email
    seller.value.phone = data.phone
    seller.value.store_name_ar = data.store_name?.ar || ''
    seller.value.store_name_en = data.store_name?.en || ''
    seller.value.store_description_ar = data.store_description?.ar || ''
    seller.value.store_description_en = data.store_description?.en || ''
    seller.value.bank_account = data.bank_account
    seller.value.is_verified = !!data.is_verified
    seller.value.store_logo = null
  } catch (err) {
    console.error(err)
    snackbarMessage.value = 'Failed to load seller data.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

// ✅ Handle file change
const handleLogoChange = (event) => {
  seller.value.store_logo = event.target.files[0] || null
}

// ✅ Handle submit
const handleSubmit = async () => {
  error.value = ''
  errors.value = {}
  loading.value = true
  try {
    // إذا فيه ملفات أو محتوى يحتاج FormData
    const formData = new FormData()
    for (const key in seller.value) {
      if (seller.value[key] !== null) {
        // تحويل Boolean لـ 0/1 لتجنب مشاكل Laravel
        if (key === 'is_verified') {
          formData.append(key, seller.value[key] ? '1' : '0')
        } else {
          formData.append(key, seller.value[key])
        }
      }
    }

    // ✅ استخدم PATCH مع FormData
    await sellerAdminApi.update(route.params.id, formData)

    snackbarMessage.value = 'Seller updated successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => {
      router.push('/admin/sellers')
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

    snackbarMessage.value = 'Failed to update seller. Please check your inputs.'
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
        Edit Seller
      </h2>

      <VForm @submit.prevent="handleSubmit" class="space-y-7 ma-5">
        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium mb-2">Full Name</label>
          <VTextField
            v-model="seller.name"
            variant="outlined"
            density="comfortable"
            placeholder="Enter full name"
            prepend-inner-icon="tabler-user"
            :error="!!errors.name"
            :error-messages="errors.name"
            hide-details="auto"
            class="rounded-md"
            required
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium mb-2">Email Address</label>
          <VTextField
            v-model="seller.email"
            type="email"
            variant="outlined"
            density="comfortable"
            placeholder="example@email.com"
            prepend-inner-icon="tabler-mail"
            :error="!!errors.email"
            :error-messages="errors.email"
            hide-details="auto"
            class="rounded-md"
            required
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium mb-2">Phone Number</label>
          <VTextField
            v-model="seller.phone"
            variant="outlined"
            density="comfortable"
            placeholder="Enter phone number"
            prepend-inner-icon="tabler-phone"
            :error="!!errors.phone"
            :error-messages="errors.phone"
            hide-details="auto"
            class="rounded-md"
          />
        </div>

        <!-- Store Name Arabic -->
        <div>
          <label class="block text-sm font-medium mb-2">Store Name Arabic</label>
          <VTextField
            v-model="seller.store_name_ar"
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
            v-model="seller.store_name_en"
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
            v-model="seller.store_description_ar"
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
            v-model="seller.store_description_en"
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
            v-model="seller.bank_account"
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
          <VSwitch v-model="seller.is_verified" color="success" inset />
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
