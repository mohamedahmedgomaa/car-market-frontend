<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import sellerApi from '@/api/sellerApi.js'
import cityUserApi from '@/api/user/cityUserApi.js'
import governorateUserApi from '@/api/user/governorateUserApi.js'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const errorMessage = ref('')

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const governorates = ref([])
const cities = ref([])
const filteredCities = ref([])

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

watch(() => form.value.governorate_id, (newGovId) => {
  form.value.city_id = null
  if (newGovId) {
    filteredCities.value = cities.value.filter(c => c.governorate_id === newGovId)
  } else {
    filteredCities.value = []
  }
})

onMounted(async () => {
  await fetchGovernorates()
  await fetchCities()
})

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const form = ref({
  name: '',
  email: '',
  phone: '',
  address_en: '',
  address_ar: '',

  password: '',
  password_confirmation: '',

  store_name_en: '',
  store_name_ar: '',
  store_description_en: '',
  store_description_ar: '',

  business_license: '',
  bank_account: '',
  tax_number: '',

  governorate_id: null,
  city_id: null,
  district_en: '',
  district_ar: '',
  street_en: '',
  street_ar: '',
  map_url: '',

  store_logo: null, // File
  tax_card_image: null, // File
})

// Validation rules
const required = v => !!String(v ?? '').trim() || 'Required'
const emailRule = v => /.+@.+\..+/.test(String(v ?? '')) || 'Invalid email'
const min6 = v => String(v ?? '').length >= 6 || 'Min 6 characters'

const handleRegister = async () => {
  errorMessage.value = ''

  // Vuetify validate
  const ok = await formRef.value?.validate?.()
  if (ok?.valid === false) return

  // Password confirmation check
  if (form.value.password !== form.value.password_confirmation) {
    errorMessage.value = 'Password confirmation does not match'
    return
  }

  loading.value = true

  try {
    const fd = new FormData()

    // Required fields
    fd.append('name', form.value.name)
    fd.append('email', form.value.email)
    fd.append('password', form.value.password)
    fd.append('password_confirmation', form.value.password_confirmation)
    fd.append('store_name_en', form.value.store_name_en)
    fd.append('store_name_ar', form.value.store_name_ar)

    // Nullable / added fields
    if (form.value.phone) fd.append('phone', form.value.phone)
    if (form.value.address_en) fd.append('address_en', form.value.address_en)
    if (form.value.address_ar) fd.append('address_ar', form.value.address_ar)
    if (form.value.store_description_en) fd.append('store_description_en', form.value.store_description_en)
    if (form.value.store_description_ar) fd.append('store_description_ar', form.value.store_description_ar)
    if (form.value.business_license) fd.append('business_license', form.value.business_license)
    if (form.value.bank_account) fd.append('bank_account', form.value.bank_account)
    if (form.value.tax_number) fd.append('tax_number', form.value.tax_number)
    if (form.value.governorate_id) fd.append('governorate_id', form.value.governorate_id)
    if (form.value.city_id) fd.append('city_id', form.value.city_id)
    if (form.value.district_en) fd.append('district_en', form.value.district_en)
    if (form.value.district_ar) fd.append('district_ar', form.value.district_ar)
    if (form.value.street_en) fd.append('street_en', form.value.street_en)
    if (form.value.street_ar) fd.append('street_ar', form.value.street_ar)
    if (form.value.map_url) fd.append('map_url', form.value.map_url)

    // Image/File uploads
    if (form.value.store_logo instanceof File) {
      fd.append('store_logo', form.value.store_logo)
    } else if (Array.isArray(form.value.store_logo) && form.value.store_logo[0] instanceof File) {
      fd.append('store_logo', form.value.store_logo[0])
    }

    if (form.value.tax_card_image instanceof File) {
      fd.append('tax_card_image', form.value.tax_card_image)
    } else if (Array.isArray(form.value.tax_card_image) && form.value.tax_card_image[0] instanceof File) {
      fd.append('tax_card_image', form.value.tax_card_image[0])
    }

    const response = await sellerApi.register(fd)
    const data = response?.data?.data ?? response?.data

    const token = data?.token
    const seller = data?.seller ?? data?.user ?? data

    if (!token) throw new Error('Invalid response from server')

    localStorage.setItem('seller_token', token)
    localStorage.setItem('seller_data', JSON.stringify(seller))

    router.push('/seller/dashboard')
  } catch (err) {
    console.error('Seller register error:', err)

    if (err?.response?.data) {
      errorMessage.value =
        err.response.data.message ||
        err.response.data.error ||
        (err.response.data.errors ? Object.values(err.response.data.errors).flat().join(', ') : JSON.stringify(err.response.data))
    } else {
      errorMessage.value = err?.message || 'Register failed'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex flex-column align-center justify-center pa-6">
    <!-- App Logo -->
    <RouterLink
      to="/"
      class="auth-logo mb-6 d-flex align-center gap-x-3 text-decoration-none"
    >
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title text-white text-h4 font-weight-bold">{{ themeConfig.app.title }}</h1>
    </RouterLink>

    <VCard class="auth-card" elevation="24">
      <VCardText class="pa-10">
        <!-- Title -->
        <h2 class="text-h4 font-weight-bold mb-2 text-center text-white">
          Create Seller Account 🏪
        </h2>
        <p class="text-center text-disabled mb-8">Register to start selling cars on the platform</p>

        <!-- Form -->
        <VForm ref="formRef" @submit.prevent="handleRegister">
          <VRow>
            <!-- SECTION 1: Personal & Account Info -->
            <VCol cols="12">
              <h3 class="section-title mb-4 d-flex align-center gap-x-2 text-primary">
                <VIcon icon="tabler-user" size="20" />
                Account Information
              </h3>
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Full Name</label>
              <VTextField
                v-model="form.name"
                placeholder="Ex: John Doe"
                variant="outlined"
                density="comfortable"
                :rules="[required]"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Email Address</label>
              <VTextField
                v-model="form.email"
                placeholder="seller@example.com"
                variant="outlined"
                density="comfortable"
                type="email"
                required
                :rules="[required, emailRule]"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Phone Number</label>
              <VTextField
                v-model="form.phone"
                placeholder="05xxxxxxxx"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Bank Account / IBAN</label>
              <VTextField
                v-model="form.bank_account"
                placeholder="IBAN / Account details"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <!-- SECTION 2: Showroom Info -->
            <VCol cols="12" class="mt-4">
              <h3 class="section-title mb-4 d-flex align-center gap-x-2 text-primary">
                <VIcon icon="tabler-building-store" size="20" />
                Showroom Details
              </h3>
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Store Name (English)</label>
              <VTextField
                v-model="form.store_name_en"
                placeholder="Ex: Golden Motors"
                variant="outlined"
                density="comfortable"
                :rules="[required]"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">اسم المعرض (عربي)</label>
              <VTextField
                v-model="form.store_name_ar"
                placeholder="مثال: معرض الذهبية للسيارات"
                variant="outlined"
                density="comfortable"
                :rules="[required]"
                class="premium-input"
                dir="rtl"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Governorate / المحافظة</label>
              <VAutocomplete
                v-model="form.governorate_id"
                :items="governorates"
                item-value="id"
                :item-title="g => t(g.name)"
                placeholder="Select Governorate / اختر المحافظة"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VAutocomplete>
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">City / المدينة</label>
              <VAutocomplete
                v-model="form.city_id"
                :items="filteredCities"
                item-value="id"
                :item-title="c => t(c.name)"
                placeholder="Select City / اختر المدينة"
                variant="outlined"
                density="comfortable"
                class="premium-input"
                :disabled="!form.governorate_id"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props" :title="t(item.raw.name)" />
                </template>
                <template #selection="{ item }">
                  {{ t(item.raw.name) }}
                </template>
              </VAutocomplete>
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Location Link / رابط اللوكيشن</label>
              <VTextField
                v-model="form.map_url"
                placeholder="Ex: https://maps.google.com/..."
                variant="outlined"
                density="comfortable"
                append-inner-icon="tabler-map-pin"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">City/Area (English)</label>
              <VTextField
                v-model="form.district_en"
                placeholder="Ex: Heliopolis"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">المدينة/المنطقة (عربي)</label>
              <VTextField
                v-model="form.district_ar"
                placeholder="مثال: مصر الجديدة"
                variant="outlined"
                density="comfortable"
                class="premium-input"
                dir="rtl"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Street Name (English)</label>
              <VTextField
                v-model="form.street_en"
                placeholder="Ex: El-Thawra St."
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">اسم الشارع (عربي)</label>
              <VTextField
                v-model="form.street_ar"
                placeholder="مثال: شارع الثورة"
                variant="outlined"
                density="comfortable"
                class="premium-input"
                dir="rtl"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Detailed Address (English)</label>
              <VTextField
                v-model="form.address_en"
                placeholder="Detailed showroom address"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">العنوان بالتفصيل (عربي)</label>
              <VTextField
                v-model="form.address_ar"
                placeholder="عنوان المعرض بالتفصيل"
                variant="outlined"
                density="comfortable"
                class="premium-input"
                dir="rtl"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Store Description (English)</label>
              <VTextarea
                v-model="form.store_description_en"
                placeholder="Write a brief description..."
                variant="outlined"
                density="comfortable"
                rows="3"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">وصف المعرض (عربي)</label>
              <VTextarea
                v-model="form.store_description_ar"
                placeholder="اكتب وصفاً مختصراً للمعرض..."
                variant="outlined"
                density="comfortable"
                rows="3"
                class="premium-input"
                dir="rtl"
              />
            </VCol>

            <!-- SECTION 3: Uploads & Verification -->
            <VCol cols="12" class="mt-4">
              <h3 class="section-title mb-4 d-flex align-center gap-x-2 text-primary">
                <VIcon icon="tabler-shield-check" size="20" />
                Legal & Verification Details
              </h3>
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Tax Number (الرقم الضريبي)</label>
              <VTextField
                v-model="form.tax_number"
                placeholder="Tax Identification Number"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Business License (السجل التجاري)</label>
              <VTextField
                v-model="form.business_license"
                placeholder="License or Registration number"
                variant="outlined"
                density="comfortable"
                class="premium-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Store Logo</label>
              <VFileInput
                v-model="form.store_logo"
                accept="image/*"
                placeholder="Upload logo image"
                variant="outlined"
                density="comfortable"
                class="premium-input"
                prepend-icon=""
                append-inner-icon="tabler-photo"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Tax Card Image (صورة الرقم الضريبي)</label>
              <VFileInput
                v-model="form.tax_card_image"
                accept="image/*"
                placeholder="Upload tax card image"
                variant="outlined"
                density="comfortable"
                class="premium-input"
                prepend-icon=""
                append-inner-icon="tabler-file-analytics"
              />
            </VCol>

            <!-- SECTION 4: Security -->
            <VCol cols="12" class="mt-4">
              <h3 class="section-title mb-4 d-flex align-center gap-x-2 text-primary">
                <VIcon icon="tabler-lock" size="20" />
                Security
              </h3>
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Password</label>
              <VTextField
                v-model="form.password"
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••"
                variant="outlined"
                density="comfortable"
                :rules="[required, min6]"
                class="premium-input"
                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="input-label">Confirm Password</label>
              <VTextField
                v-model="form.password_confirmation"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••"
                variant="outlined"
                density="comfortable"
                :rules="[required]"
                class="premium-input"
                :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
              />
            </VCol>

            <!-- Errors & Actions -->
            <VCol cols="12" class="mt-6">
              <div v-if="errorMessage" class="text-error mb-4 text-center text-body-2 font-weight-bold">{{ errorMessage }}</div>
              <VBtn
                block
                color="primary"
                height="56"
                type="submit"
                :loading="loading"
                class="auth-submit-btn"
              >
                Register as Showroom
              </VBtn>
            </VCol>

            <VCol cols="12" class="text-center mt-4 text-body-1 text-disabled">
              <span>Already have a showroom account?</span>
              <RouterLink class="text-primary ms-2 font-weight-bold hover-white" to="/seller/login">Sign in</RouterLink>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.auth-wrapper {
  min-height: 100vh;
  background-color: #0f111a;
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.12) 0%, transparent 80%);
}

.auth-card {
  width: 100%;
  max-width: 900px;
  background-color: #1c1f2e !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #fff;
}

.premium-input :deep(.v-field) {
  border-radius: 14px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &.v-field--focused {
    border-color: rgba(var(--v-theme-primary), 0.8);
  }
}

.auth-submit-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 18px !important;
  text-transform: none !important;
  box-shadow: 0 10px 30px -10px rgba(var(--v-theme-primary), 0.6) !important;
}

.hover-white:hover {
  color: #fff !important;
}

.auth-title {
  letter-spacing: 1px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
}
</style>

