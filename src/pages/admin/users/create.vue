<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import userAdminApi from '../../../api/admin/userAdminApi.js'

const router = useRouter()

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

// 👇 Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const handleSubmit = async () => {
  error.value = ''
  errors.value = {}

  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    await userAdminApi.create(form.value)

    // ✅ إظهار التوست بعد النجاح
    snackbarMessage.value = 'Data created successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    // انتظار بسيط قبل الانتقال
    setTimeout(() => {
      router.push('/admin/users')
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

    // ❌ عرض Toast للخطأ العام
    snackbarMessage.value = 'Failed to create data. Please check your inputs.'
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
        Add New Admin
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
            class="rounded-md"
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
            class="rounded-md"
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
            class="rounded-md"
          />
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
            class="rounded-md"
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
            class="rounded-md"
            required
          />
        </div>

        <!-- General Error -->
        <div v-if="error" class="text-red-500 text-sm text-center mt-2">
          {{ error }}
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-4 pt-4">
          <VBtn
            variant="outlined"
            color="secondary"
            @click="router.back()"
            class="ma-1"
          >
            Cancel
          </VBtn>

          <VBtn
            color="primary"
            :loading="loading"
            type="submit"
          >
            Save
          </VBtn>
        </div>
      </VForm>
    </VCard>

    <!-- ✅ Snackbar Notification -->
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
