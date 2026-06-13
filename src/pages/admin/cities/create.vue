<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

import cityAdminApi from '../../../api/admin/cityAdminApi.js'
import countryAdminApi from '../../../api/admin/countryAdminApi.js'
import governorateAdminApi from '../../../api/admin/governorateAdminApi.js'

const router = useRouter()

const form = ref({
  name_ar: '',
  name_en: '',
  country_id: 1, // Pre-set to Egypt
  governorate_id: null,
})

const activeTab = ref('single')
const pasteText = ref('')
const parsedCities = ref([])

const countries = ref([])
const governorates = ref([])

const filteredGovernorates = computed(() => {
  if (!form.value.country_id) return []
  return governorates.value.filter(g => g.country_id === form.value.country_id)
})

const loading = ref(false)
const error = ref('')
const errors = ref({})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const fetchCountries = async () => {
  try {
    const res = await countryAdminApi.getAll()
    countries.value = res.data.data || res.data
  } catch (e) {
    console.error('Failed to load countries', e)
  }
}

const fetchGovernorates = async () => {
  try {
    const res = await governorateAdminApi.getAll({ perPage: 1000 })
    governorates.value = res.data.data || res.data
  } catch (e) {
    console.error('Failed to load governorates', e)
  }
}

watch(() => form.value.country_id, () => {
  form.value.governorate_id = null
})

// When top-level governorate is changed, update any parsed city that doesn't have a governorate yet
watch(() => form.value.governorate_id, (newGovId) => {
  if (newGovId) {
    parsedCities.value.forEach(c => {
      if (!c.governorate_id) {
        c.governorate_id = newGovId
      }
    })
  }
})

const findGovernorateByName = (name) => {
  if (!name) return null
  const cleanName = name.toLowerCase().trim()

  // Try exact match first
  let match = governorates.value.find(g => {
    const en = (g.name?.en || g.name || '').toLowerCase().trim()
    const ar = (g.name?.ar || g.name || '').toLowerCase().trim()
    return en === cleanName || ar === cleanName
  })

  if (match) return match

  // Try partial match next
  return governorates.value.find(g => {
    const en = (g.name?.en || g.name || '').toLowerCase().trim()
    const ar = (g.name?.ar || g.name || '').toLowerCase().trim()
    return en.includes(cleanName) || ar.includes(cleanName) ||
           cleanName.includes(en) || cleanName.includes(ar)
  })
}

const isHeader = (line) => {
  const l = line.toLowerCase()
  // Check if line contains header keywords or is just markdown table lines (no alphanumeric characters)
  return l.includes('city') || l.includes('governorate') || l.includes('المدينة') || l.includes('المحافظة') ||
         !/[a-zA-Z\u0600-\u06FF0-9]/.test(line)
}

const parseBulkText = () => {
  if (!pasteText.value.trim()) return

  // Split by line if multiple lines exist, otherwise by commas/semicolons
  let items = []
  if (pasteText.value.includes('\n')) {
    items = pasteText.value.split('\n')
  } else if (pasteText.value.includes(',') || pasteText.value.includes(';')) {
    items = pasteText.value.split(/[,;]+/)
  } else {
    items = [pasteText.value]
  }

  const tempCities = []

  items.map(item => item.trim()).filter(item => item.length > 0).forEach(line => {
    // Skip header line
    if (isHeader(line)) return

    // Split line by separators: tab, hyphen, slash, bar
    const parts = line.split(/[\t\-\/|]+/).map(p => p.trim()).filter(p => p.length > 0)

    let nameAr = ''
    let nameEn = ''
    let detectedGov = null
    let remainingParts = []

    // 1. Scan parts to find a governorate
    parts.forEach(part => {
      const gov = findGovernorateByName(part)
      if (gov) {
        if (!detectedGov) {
          detectedGov = gov
        }
        // Do not add it to remainingParts since it's a governorate
      } else {
        remainingParts.push(part)
      }
    })

    // 2. Classify remaining parts
    if (remainingParts.length >= 2) {
      const isPart1Arabic = /[\u0600-\u06FF]/.test(remainingParts[0])
      const isPart2Arabic = /[\u0600-\u06FF]/.test(remainingParts[1])

      if (isPart1Arabic && !isPart2Arabic) {
        nameAr = remainingParts[0]
        nameEn = remainingParts[1]
      } else if (!isPart1Arabic && isPart2Arabic) {
        nameEn = remainingParts[0]
        nameAr = remainingParts[1]
      } else {
        nameAr = remainingParts[0]
        nameEn = remainingParts[1]
      }
    } else if (remainingParts.length === 1) {
      const item = remainingParts[0]
      const isArabic = /[\u0600-\u06FF]/.test(item)
      if (isArabic) {
        nameAr = item
        nameEn = ''
      } else {
        nameEn = item
        nameAr = ''
      }
    }

    if (nameAr || nameEn) {
      tempCities.push({
        // If one is missing, fall back to the other
        name_ar: nameAr || nameEn,
        name_en: nameEn || nameAr,
        governorate_id: detectedGov ? detectedGov.id : (form.value.governorate_id || null)
      })
    }
  })

  parsedCities.value = [...parsedCities.value, ...tempCities]
  pasteText.value = ''
}

const removeParsedCity = (index) => {
  parsedCities.value.splice(index, 1)
}

const clearParsedCities = () => {
  parsedCities.value = []
}

const handleSubmit = async () => {
  error.value = ''
  errors.value = {}

  // If user pasted text and hit save directly, auto-parse it first
  if (activeTab.value === 'bulk' && pasteText.value.trim() && parsedCities.value.length === 0) {
    parseBulkText()
  }

  loading.value = true

  try {
    if (activeTab.value === 'single') {
      if (!form.value.governorate_id) {
        errors.value.governorate_id = 'Governorate is required'
        loading.value = false
        return
      }
      if (!form.value.name_ar) {
        errors.value.name_ar = 'Arabic name is required'
        loading.value = false
        return
      }
      if (!form.value.name_en) {
        errors.value.name_en = 'English name is required'
        loading.value = false
        return
      }

      const formData = new FormData()
      formData.append('country_id', form.value.country_id)
      formData.append('governorate_id', form.value.governorate_id)
      formData.append('name_ar', form.value.name_ar)
      formData.append('name_en', form.value.name_en)

      await cityAdminApi.create(formData)
    } else {
      // Clean and prepare the cities list
      const preparedCities = parsedCities.value
        .map(c => {
          const ar = (c.name_ar || '').trim()
          const en = (c.name_en || '').trim()
          return {
            name_ar: ar || en,
            name_en: en || ar,
            governorate_id: c.governorate_id || form.value.governorate_id
          }
        })
        .filter(c => c.name_ar && c.name_en && c.governorate_id)

      if (preparedCities.length === 0) {
        error.value = 'Please add at least one valid city with a selected governorate.'
        loading.value = false
        return
      }

      // Call single creation API sequentially for each prepared city
      for (const city of preparedCities) {
        const formData = new FormData()
        formData.append('country_id', form.value.country_id)
        formData.append('governorate_id', city.governorate_id)
        formData.append('name_ar', city.name_ar)
        formData.append('name_en', city.name_en)

        await cityAdminApi.create(formData)
      }
    }

    snackbarMessage.value = 'Data created successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => {
      router.push('/admin/cities')
    }, 1500)
  } catch (err) {
    console.error(err)

    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      if (err.response.data.message) {
        error.value = err.response.data.message
      }
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

onMounted(() => {
  fetchCountries()
  fetchGovernorates()
})
</script>

<template>
  <div class="flex justify-center items-start min-h-screen py-12 px-4">
    <VCard 
      class="w-full p-10 rounded-2xl shadow-lg transition-all duration-300"
      :class="activeTab === 'bulk' && parsedCities.length > 0 ? 'max-w-3xl' : 'max-w-lg'"
    >
      <!-- Title -->
      <h2
        class="text-2xl font-semibold mb-8 text-center flex items-center justify-center gap-2 mt-4"
      >
        <VIcon icon="tabler-plus" color="primary" size="24" />
        Add New City
      </h2>

      <VForm @submit.prevent="handleSubmit" class="space-y-7 ma-5">

        <!-- Country (Fixed & Disabled to Egypt) -->
        <div>
          <label class="block text-sm font-medium mb-2">Country</label>
          <VSelect
            v-model="form.country_id"
            :items="countries"
            :item-title="country => country.name?.en || country.name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            placeholder="Select country"
            prepend-inner-icon="tabler-flag"
            hide-details="auto"
            disabled
          />
        </div>

        <!-- Governorate -->
        <div>
          <label class="block text-sm font-medium mb-2">Governorate</label>
          <VSelect
            v-model="form.governorate_id"
            :items="filteredGovernorates"
            :item-title="gov => gov.name?.en || gov.name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            placeholder="Select governorate"
            prepend-inner-icon="tabler-map"
            :error="!!errors.governorate_id"
            :error-messages="errors.governorate_id"
            hide-details="auto"
            :disabled="!form.country_id"
            :required="activeTab === 'single'"
          />
        </div>

        <!-- Mode Tabs Selection -->
        <VTabs v-model="activeTab" class="mb-4" color="primary" align-tabs="center" grow>
          <VTab value="single">Single City</VTab>
          <VTab value="bulk">Bulk Paste</VTab>
        </VTabs>

        <!-- Single City Mode -->
        <div v-if="activeTab === 'single'" class="space-y-5">
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
            />
          </div>
        </div>

        <!-- Bulk Paste Mode -->
        <div v-if="activeTab === 'bulk'" class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2">Bulk Paste Cities</label>
            <p class="text-xs opacity-70 mb-2">
              Paste a raw list of cities. Format: <code>City_EN \t City_AR \t Gov_EN \t Gov_AR</code> or simply <code>City - Gov</code>.
            </p>
            <VTextarea
              v-model="pasteText"
              rows="6"
              variant="outlined"
              placeholder="E.g.&#10;Shebin El Kom	شبين الكوم	Monufia	المنوفية&#10;Tanta	طنطا	Gharbia	الغربية"
              hide-details="auto"
              class="mb-3"
            />
            <VBtn 
              block 
              color="primary" 
              variant="tonal" 
              size="small" 
              @click="parseBulkText" 
              :disabled="!pasteText.trim()"
            >
              <VIcon icon="tabler-tags" class="me-1" />
              Analyze & Add to List
            </VBtn>
          </div>

          <!-- Parsed Cities List -->
          <div v-if="parsedCities.length > 0" class="mt-4">
            <div class="flex align-center justify-between mb-2">
              <span class="text-sm font-medium">Cities to add ({{ parsedCities.length }})</span>
              <VBtn variant="text" color="error" size="x-small" @click="clearParsedCities">
                Clear All
              </VBtn>
            </div>

            <!-- List container -->
            <div class="max-h-80 overflow-y-auto space-y-3 p-2 border rounded-lg bg-surface-variant-opacity">
              <div
                v-for="(city, idx) in parsedCities"
                :key="idx"
                class="flex items-center gap-3 p-3 border rounded-lg bg-surface relative flex-wrap sm:flex-nowrap"
              >
                <!-- Governorate selection for this city -->
                <div style="min-width: 140px;" class="flex-grow">
                  <VSelect
                    v-model="city.governorate_id"
                    :items="filteredGovernorates"
                    :item-title="gov => gov.name?.en || gov.name"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    placeholder="Select gov"
                    hide-details
                    class="text-xs"
                  />
                </div>

                <!-- English Name Input -->
                <div class="flex-grow">
                  <VTextField
                    v-model="city.name_en"
                    placeholder="English name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="text-xs"
                  />
                </div>
                
                <!-- Arabic Name Input -->
                <div class="flex-grow">
                  <VTextField
                    v-model="city.name_ar"
                    placeholder="Arabic name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="text-xs"
                  />
                </div>

                <!-- Delete button -->
                <VBtn
                  icon="tabler-trash"
                  variant="text"
                  color="error"
                  size="x-small"
                  class="flex-shrink-0"
                  @click="removeParsedCity(idx)"
                />
              </div>
            </div>
          </div>
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

<style scoped>
.bg-surface-variant-opacity {
  background-color: rgba(128, 128, 128, 0.04);
}
</style>
