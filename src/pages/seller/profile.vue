<script setup>
import { ref, onMounted } from 'vue'
import authSellerApi from '@/api/seller/authSellerApi.js'
import cityUserApi from '@/api/user/cityUserApi.js'
import governorateUserApi from '@/api/user/governorateUserApi.js'
import PageHeroHeader from '@/components/PageHeroHeader.vue'

const loading = ref(true)
const saving = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const governorates = ref([])
const cities = ref([])

const seller = ref({
  id: null,
  name: '',
  email: '',
  phone: '',
  store_name_ar: '',
  store_name_en: '',
  store_description_ar: '',
  store_description_en: '',
  address_ar: '',
  address_en: '',
  city_id: null,
  governorate_id: null,
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  website: '',
  store_logo: null,
  cover_image: null,
  is_verified: false,
  tier: 'none',
  bank_account: '',
  tax_number: '',
  views_count: 0,
  cars_count: 0,
})

const logoFile = ref(null)
const coverFile = ref(null)
const logoPreview = ref('')
const coverPreview = ref('')

const fetchProfile = async () => {
  loading.value = true
  try {
    const [meRes, govRes, cityRes] = await Promise.all([
      authSellerApi.getMe(),
      governorateUserApi.getAll(),
      cityUserApi.getAll(),
    ])

    governorates.value = govRes.data?.data || []
    cities.value = cityRes.data?.data || []

    const data = meRes.data?.data || {}
    seller.value = {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      store_name_ar: data.store_name?.ar || '',
      store_name_en: data.store_name?.en || '',
      store_description_ar: data.store_description?.ar || '',
      store_description_en: data.store_description?.en || '',
      address_ar: data.address?.ar || '',
      address_en: data.address?.en || '',
      city_id: data.city_id,
      governorate_id: data.governorate_id,
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      tiktok: data.tiktok || '',
      youtube: data.youtube || '',
      website: data.website || '',
      store_logo: data.store_logo,
      cover_image: data.cover_image,
      is_verified: data.is_verified,
      tier: data.tier,
      bank_account: data.bank_account || '',
      tax_number: data.tax_number || '',
      views_count: data.views_count || 0,
      cars_count: data.cars_count || 0,
    }

    logoPreview.value = data.store_logo || ''
    coverPreview.value = data.cover_image || ''
  } catch (err) {
    console.error('Failed to load profile:', err)
  } finally {
    loading.value = false
  }
}

const handleLogoChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    logoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  }
}

const handleCoverChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    coverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const fd = new FormData()

    fd.append('name', seller.value.name || '')
    fd.append('phone', seller.value.phone || '')
    fd.append('store_name_ar', seller.value.store_name_ar || '')
    fd.append('store_name_en', seller.value.store_name_en || '')
    fd.append('store_description_ar', seller.value.store_description_ar || '')
    fd.append('store_description_en', seller.value.store_description_en || '')
    fd.append('address_ar', seller.value.address_ar || '')
    fd.append('address_en', seller.value.address_en || '')

    if (seller.value.city_id) fd.append('city_id', seller.value.city_id)
    if (seller.value.governorate_id) fd.append('governorate_id', seller.value.governorate_id)

    fd.append('facebook', seller.value.facebook || '')
    fd.append('instagram', seller.value.instagram || '')
    fd.append('tiktok', seller.value.tiktok || '')
    fd.append('youtube', seller.value.youtube || '')
    fd.append('website', seller.value.website || '')

    if (logoFile.value) fd.append('store_logo', logoFile.value)
    if (coverFile.value) fd.append('cover_image', coverFile.value)

    await authSellerApi.updateProfile(fd)

    snackbarText.value = 'تم حفظ بيانات المعرض بنجاح ✅'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Save profile failed:', err)
    snackbarText.value = err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="seller-profile p-4" style="max-width: 1100px; margin: 0 auto;">
    <!-- Page Hero Header -->
    <PageHeroHeader
      title="الملف التعريفي وهوية المعرض"
      subtitle="إدارة هوية المعرض التجارية، اللوجو، الغلاف، ومعلومات الاتصال وحسابات التواصل الاجتماعي"
      icon="tabler-building-store"
      :breadcrumbs="[
        { title: 'لوحة التحكم', to: '/seller/dashboard', icon: 'tabler-smart-home' },
        { title: 'الملف التعريفي' },
      ]"
      :badge="seller.is_verified ? 'معتمد وموثق' : 'معرض مسجل'"
      :badge-color="seller.is_verified ? 'success' : 'primary'"
    >
      <template #stats>
        <div v-if="seller.cars_count" class="fleet-stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl">
          <div class="fleet-stat-icon-box bg-primary-subtle text-primary">
            <VIcon icon="tabler-car" size="20" />
          </div>
          <div>
            <div class="stat-caption">السيارات المعروضة</div>
            <div class="stat-value text-primary">
              {{ Number(seller.cars_count).toLocaleString() }}
              <span class="stat-unit">مركبة</span>
            </div>
          </div>
        </div>

        <div v-if="seller.views_count" class="fleet-stat-badge d-flex align-center gap-3 px-4 py-2 rounded-xl">
          <div class="fleet-stat-icon-box bg-success-subtle text-success">
            <VIcon icon="tabler-eye" size="20" />
          </div>
          <div>
            <div class="stat-caption">زيارات المعرض</div>
            <div class="stat-value text-success">
              {{ Number(seller.views_count).toLocaleString() }}
              <span class="stat-unit">زيارة</span>
            </div>
          </div>
        </div>
      </template>

      <template #actions>
        <VBtn
          color="primary"
          size="large"
          prepend-icon="tabler-device-floppy"
          class="save-hero-btn text-white font-weight-bold px-6 elevation-4"
          :loading="saving"
          @click="handleSave"
        >
          حفظ التعديلات
        </VBtn>
      </template>
    </PageHeroHeader>

    <div v-if="loading" class="text-center py-12">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else class="d-flex flex-column gap-6">
      <!-- Showroom Badges & Stats Bar -->
      <VCard elevation="3" class="rounded-xl overflow-hidden pa-5">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-4">
            <VAvatar size="72" rounded="lg" color="surface-variant">
              <VImg v-if="logoPreview" :src="logoPreview" cover />
              <VIcon v-else icon="tabler-building-store" size="36" />
            </VAvatar>

            <div>
              <div class="d-flex align-center gap-2">
                <h2 class="text-h5 font-weight-bold">{{ seller.store_name_ar || seller.store_name_en || seller.name }}</h2>
                <VChip v-if="seller.is_verified" color="success" size="small" variant="elevated">
                  ✓ معتمد
                </VChip>
                <VChip v-if="seller.tier && seller.tier !== 'none'" color="warning" size="small" class="text-uppercase font-weight-bold">
                  {{ seller.tier }}
                </VChip>
              </div>
              <div class="text-sm text-medium-emphasis">{{ seller.email }} • {{ seller.phone }}</div>
            </div>
          </div>

          <div class="d-flex gap-4">
            <div class="text-center px-4 py-2 bg-surface-variant rounded-lg">
              <div class="text-caption text-medium-emphasis">السيارات المعروضة</div>
              <div class="text-h6 font-weight-bold">{{ seller.cars_count }}</div>
            </div>
            <div class="text-center px-4 py-2 bg-surface-variant rounded-lg">
              <div class="text-caption text-medium-emphasis">زيارات المعرض</div>
              <div class="text-h6 font-weight-bold text-info">{{ seller.views_count }}</div>
            </div>
          </div>
        </div>
      </VCard>

      <!-- Basic Store Information -->
      <VCard elevation="3" class="rounded-xl pa-6">
        <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <VIcon icon="tabler-info-circle" color="primary" /> بيانات المعرض الأساسية
        </h3>

        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.store_name_ar"
              label="اسم المعرض (بالعربي)"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.store_name_en"
              label="Store Name (English)"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.name"
              label="اسم المسؤول / المدير"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.phone"
              label="رقم الهاتف الأساسي"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextarea
              v-model="seller.store_description_ar"
              label="نبذة عن المعرض (بالعربي)"
              rows="3"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextarea
              v-model="seller.store_description_en"
              label="Store Description (English)"
              rows="3"
              variant="outlined"
            />
          </VCol>
        </VRow>
      </VCard>

      <!-- Location & Address -->
      <VCard elevation="3" class="rounded-xl pa-6">
        <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <VIcon icon="tabler-map-pin" color="error" /> العنوان والموقع الجغرافي
        </h3>

        <VRow>
          <VCol cols="12" md="6">
            <VSelect
              v-model="seller.governorate_id"
              :items="governorates"
              item-title="name.ar"
              item-value="id"
              label="المحافظة"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VSelect
              v-model="seller.city_id"
              :items="cities.filter(c => !seller.governorate_id || c.governorate_id === seller.governorate_id)"
              item-title="name.ar"
              item-value="id"
              label="المدينة / المنطقة"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.address_ar"
              label="العنوان التفصيلي (بالعربي)"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.address_en"
              label="Detailed Address (English)"
              variant="outlined"
            />
          </VCol>
        </VRow>
      </VCard>

      <!-- Social Media & Links -->
      <VCard elevation="3" class="rounded-xl pa-6">
        <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <VIcon icon="tabler-world" color="info" /> قنوات التواصل والموقع الإلكتروني
        </h3>

        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.facebook"
              label="رابط صفحة فيسبوك (Facebook)"
              prepend-inner-icon="tabler-brand-facebook"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.instagram"
              label="رابط انستجرام (Instagram)"
              prepend-inner-icon="tabler-brand-instagram"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.tiktok"
              label="رابط تيك توك (TikTok)"
              prepend-inner-icon="tabler-brand-tiktok"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12" md="6">
            <VTextField
              v-model="seller.youtube"
              label="رابط قناة يوتيوب (YouTube)"
              prepend-inner-icon="tabler-brand-youtube"
              variant="outlined"
            />
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="seller.website"
              label="رابط الموقع الإلكتروني (Website)"
              prepend-inner-icon="tabler-link"
              variant="outlined"
            />
          </VCol>
        </VRow>
      </VCard>

      <!-- Branding / Logo & Cover Images -->
      <VCard elevation="3" class="rounded-xl pa-6">
        <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
          <VIcon icon="tabler-photo" color="success" /> اللوجو وصورة الغلاف
        </h3>

        <VRow>
          <VCol cols="12" md="6">
            <label class="text-sm font-weight-bold d-block mb-2">شعار المعرض (Logo)</label>
            <div class="d-flex align-center gap-4">
              <VAvatar size="80" rounded="lg" color="surface-variant">
                <VImg v-if="logoPreview" :src="logoPreview" cover />
                <VIcon v-else icon="tabler-photo" size="36" />
              </VAvatar>
              <input type="file" accept="image/*" @change="handleLogoChange" />
            </div>
          </VCol>

          <VCol cols="12" md="6">
            <label class="text-sm font-weight-bold d-block mb-2">صورة غلاف المعرض (Cover Banner)</label>
            <div class="d-flex flex-column gap-2">
              <div v-if="coverPreview" style="height: 100px; border-radius: 8px; overflow: hidden;">
                <VImg :src="coverPreview" height="100%" cover />
              </div>
              <input type="file" accept="image/*" @change="handleCoverChange" />
            </div>
          </VCol>
        </VRow>
      </VCard>
    </div>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top end">
      {{ snackbarText }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.fleet-stat-badge {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  min-width: 140px;
  transition: transform 0.2s, border-color 0.2s;
}

.fleet-stat-badge:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 107, 0, 0.3);
}

.fleet-stat-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-primary-subtle {
  background: rgba(255, 107, 0, 0.12);
}

.bg-success-subtle {
  background: rgba(40, 199, 111, 0.12);
}

.stat-caption {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.2;
}

.stat-unit {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.save-hero-btn {
  background: linear-gradient(135deg, #ff7a00 0%, #ff4b00 100%) !important;
  box-shadow: 0 6px 20px rgba(255, 107, 0, 0.4) !important;
  transition: all 0.25s ease;
}

.save-hero-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(255, 107, 0, 0.55) !important;
}
</style>

