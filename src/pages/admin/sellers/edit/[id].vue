<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import sellerAdminApi from '../../../../api/admin/sellerAdminApi.js'
import cityUserApi from '@/api/user/cityUserApi.js'
import governorateUserApi from '@/api/user/governorateUserApi.js'

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
  governorate_id: null,
  city_id: null,
  address_ar: '',
  address_en: '',
  map_url: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  youtube_url: '',
  sort_order: 0,
  tier: 'none',
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

// 👇 Toast Notification
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const governorates = ref([])
const cities = ref([])
const filteredCities = ref([])
let isInitialLoad = true

const fetchGovernorates = async () => {
  try {
    const res = await governorateUserApi.getAll({ perPage: 100 })
    const payload = res.data?.data ?? res.data ?? []
    governorates.value = Array.isArray(payload) ? payload : payload.data ?? []
  } catch (err) {
    console.error('Failed to fetch governorates:', err)
  }
}

const fetchCities = async () => {
  try {
    const res = await cityUserApi.getAll({ perPage: 1000 })
    const payload = res.data?.data ?? res.data ?? []
    cities.value = Array.isArray(payload) ? payload : payload.data ?? []
  } catch (err) {
    console.error('Failed to fetch cities:', err)
  }
}

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

watch(() => seller.value.governorate_id, (newGovId) => {
  if (!isInitialLoad) {
    seller.value.city_id = null
  }
  if (newGovId) {
    filteredCities.value = cities.value.filter(c => c.governorate_id === newGovId)
  } else {
    filteredCities.value = []
  }
})

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
    seller.value.governorate_id = data.governorate_id
    seller.value.city_id = data.city_id
    seller.value.address_ar = data.address?.ar || ''
    seller.value.address_en = data.address?.en || ''
    seller.value.map_url = data.map_url || ''
    seller.value.facebook_url = data.facebook_url || ''
    seller.value.instagram_url = data.instagram_url || ''
    seller.value.tiktok_url = data.tiktok_url || ''
    seller.value.youtube_url = data.youtube_url || ''
    seller.value.sort_order = data.sort_order || 0
    seller.value.tier = data.tier || 'none'

    if (seller.value.governorate_id) {
      filteredCities.value = cities.value.filter(c => c.governorate_id === seller.value.governorate_id)
    }
    setTimeout(() => {
      isInitialLoad = false
    }, 100)
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
    const formData = new FormData()
    for (const key in seller.value) {
      if (seller.value[key] !== null && seller.value[key] !== undefined) {
        if (key === 'is_verified') {
          formData.append(key, seller.value[key] ? '1' : '0')
        } else {
          formData.append(key, seller.value[key])
        }
      }
    }

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

onMounted(async () => {
  await fetchGovernorates()
  await fetchCities()
  await fetchSeller()
})
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

        <!-- Governorate / المحافظة -->
        <div>
          <label class="block text-sm font-medium mb-2">Governorate / المحافظة</label>
          <VAutocomplete
            v-model="seller.governorate_id"
            :items="governorates"
            item-value="id"
            :item-title="g => t(g.name)"
            placeholder="Select Governorate / اختر المحافظة"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :error="!!errors.governorate_id"
            :error-messages="errors.governorate_id"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props" :title="t(item.raw.name)" />
            </template>
            <template #selection="{ item }">
              {{ t(item.raw.name) }}
            </template>
          </VAutocomplete>
        </div>

        <!-- City / المدينة -->
        <div>
          <label class="block text-sm font-medium mb-2">City / المدينة</label>
          <VAutocomplete
            v-model="seller.city_id"
            :items="filteredCities"
            item-value="id"
            :item-title="c => t(c.name)"
            placeholder="Select City / اختر المدينة"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="!seller.governorate_id"
            :error="!!errors.city_id"
            :error-messages="errors.city_id"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props" :title="t(item.raw.name)" />
            </template>
            <template #selection="{ item }">
              {{ t(item.raw.name) }}
            </template>
          </VAutocomplete>
        </div>

        <!-- Location Link / رابط اللوكيشن -->
        <div>
          <label class="block text-sm font-medium mb-2">Location Link / رابط اللوكيشن</label>
          <VTextField
            v-model="seller.map_url"
            variant="outlined"
            density="comfortable"
            placeholder="Ex: https://maps.google.com/..."
            prepend-inner-icon="tabler-map-pin"
            hide-details="auto"
            :error="!!errors.map_url"
            :error-messages="errors.map_url"
          />
        </div>

        <!-- Social Media Links (Optional) -->
        <div>
          <label class="block text-sm font-medium mb-2">Facebook Link (Optional)</label>
          <VTextField
            v-model="seller.facebook_url"
            variant="outlined"
            density="comfortable"
            placeholder="Ex: https://facebook.com/..."
            prepend-inner-icon="tabler-brand-facebook"
            hide-details="auto"
            :error="!!errors.facebook_url"
            :error-messages="errors.facebook_url"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Instagram Link (Optional)</label>
          <VTextField
            v-model="seller.instagram_url"
            variant="outlined"
            density="comfortable"
            placeholder="Ex: https://instagram.com/..."
            prepend-inner-icon="tabler-brand-instagram"
            hide-details="auto"
            :error="!!errors.instagram_url"
            :error-messages="errors.instagram_url"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">TikTok Link (Optional)</label>
          <VTextField
            v-model="seller.tiktok_url"
            variant="outlined"
            density="comfortable"
            placeholder="Ex: https://tiktok.com/@..."
            prepend-inner-icon="tabler-brand-tiktok"
            hide-details="auto"
            :error="!!errors.tiktok_url"
            :error-messages="errors.tiktok_url"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">YouTube Link (Optional)</label>
          <VTextField
            v-model="seller.youtube_url"
            variant="outlined"
            density="comfortable"
            placeholder="Ex: https://youtube.com/..."
            prepend-inner-icon="tabler-brand-youtube"
            hide-details="auto"
            :error="!!errors.youtube_url"
            :error-messages="errors.youtube_url"
          />
        </div>



        <!-- Detailed Address (English) -->
        <div>
          <label class="block text-sm font-medium mb-2">Detailed Address (English)</label>
          <VTextField
            v-model="seller.address_en"
            variant="outlined"
            density="comfortable"
            placeholder="Detailed showroom address in English"
            prepend-inner-icon="tabler-map"
            hide-details="auto"
            :error="!!errors.address_en"
            :error-messages="errors.address_en"
          />
        </div>

        <!-- العنوان بالتفصيل (عربي) -->
        <div>
          <label class="block text-sm font-medium mb-2">العنوان بالتفصيل (عربي)</label>
          <VTextField
            v-model="seller.address_ar"
            variant="outlined"
            density="comfortable"
            placeholder="عنوان المعرض بالتفصيل بالعربي"
            prepend-inner-icon="tabler-map"
            hide-details="auto"
            dir="rtl"
            :error="!!errors.address_ar"
            :error-messages="errors.address_ar"
          />
        </div>

        <!-- Sort Order / ترتيب الظهور -->
        <div>
          <label class="block text-sm font-medium mb-2">Sort Order / ترتيب الظهور (الأكبر يظهر أولاً)</label>
          <VTextField
            v-model="seller.sort_order"
            type="number"
            variant="outlined"
            density="comfortable"
            placeholder="Ex: 0, 10, 100"
            prepend-inner-icon="tabler-arrows-sort"
            hide-details="auto"
            :error="!!errors.sort_order"
            :error-messages="errors.sort_order"
          />
        </div>

        <!-- Showroom Tier / الباقة -->
        <div>
          <label class="block text-sm font-medium mb-2">Showroom Tier / الباقة</label>
          <VSelect
            v-model="seller.tier"
            :items="[
              { title: 'Normal / عادي', value: 'none' },
              { title: 'Silver Partner / شريك سيلفر', value: 'silver' },
              { title: 'Gold Partner / شريك جولد', value: 'gold' },
              { title: 'Elite Partner / شريك النخبة', value: 'platinum' }
            ]"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            prepend-inner-icon="tabler-medal"
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
