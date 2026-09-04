<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import carSellerApi from '../../../api/seller/carSellerApi.js'
import brandUserApi from '../../../api/user/brandUserApi.js'
import modelUserApi from '../../../api/user/modelUserApi.js'
import carFeatureUserApi from '../../../api/user/carFeatureUserApi.js'
import countryUserApi from '../../../api/user/countryUserApi.js'
import governorateUserApi from '../../../api/user/governorateUserApi.js'
import cityUserApi from '../../../api/user/cityUserApi.js'
import FeaturesManager from '@/components/FeaturesManager.vue'
import { customBrandFilter } from '@/utils/brandTranslations.js'

const router = useRouter()

/* ================= State ================= */
const form = ref({
  brand_id: null,
  model_id: null,

  country_id: null,
  governorate_id: null,
  city_id: null,

  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',

  price: '',
  year: '',
  mileage: '',

  type: '',
  transmission: '',
  fuel_type: '',
  drivetrain: '',
  color: '',
  condition: 'used',
  is_import: '0',
  cylinders: null,
  engine_capacity: null,

  features: [],
  images: [],
  main_image: null
})

const sellers = ref([])
const brands = ref([])
const models = ref([])
const features = ref([])
const countries = ref([])
const governorates = ref([])
const cities = ref([])

const imagePreviews = ref([])

const loading = ref(false)
const errors = ref({})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

/* ================= Refs for Auto-focus ================= */
const refType = ref()
const refBrand = ref()
const refModel = ref()
const refCountry = ref()
const refGovernorate = ref()
const refCity = ref()
const refTitleAr = ref()
const refTitleEn = ref()
const refPrice = ref()
const refYear = ref()
const refMileage = ref()
const refTransmission = ref()
const refFuelType = ref()
const refDrivetrain = ref()
const refCondition = ref()

const toNumOrNull = (v, limit = 9) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  raw = raw.replace(/\D/g, '').slice(0, limit)
  let n = Number(raw)
  return Number.isNaN(n) || raw === '' ? null : n
}

const focusNext = (nextRef) => {
  if (nextRef && nextRef.focus) {
    setTimeout(() => {
      nextRef.focus()
    }, 100)
  }
}

const commonColors = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Gold', hex: '#FFD700' },
]

const engineCapacityOptions = [
  { title: '700 CC (0.7L)', value: '700' },
  { title: '800 CC (0.8L)', value: '800' },
  { title: '900 CC (0.9L)', value: '900' },
  { title: '1000 CC (1.0L)', value: '1000' },
  { title: '1100 CC (1.1L)', value: '1100' },
  { title: '1200 CC (1.2L)', value: '1200' },
  { title: '1300 CC (1.3L)', value: '1300' },
  { title: '1400 CC (1.4L)', value: '1400' },
  { title: '1500 CC (1.5L)', value: '1500' },
  { title: '1600 CC (1.6L)', value: '1600' },
  { title: '1700 CC (1.7L)', value: '1700' },
  { title: '1800 CC (1.8L)', value: '1800' },
  { title: '1900 CC (1.9L)', value: '1900' },
  { title: '2000 CC (2.0L)', value: '2000' },
  { title: '2200 CC (2.2L)', value: '2200' },
  { title: '2300 CC (2.3L)', value: '2300' },
  { title: '2400 CC (2.4L)', value: '2400' },
  { title: '2500 CC (2.5L)', value: '2500' },
  { title: '2700 CC (2.7L)', value: '2700' },
  { title: '2800 CC (2.8L)', value: '2800' },
  { title: '2900 CC (2.9L)', value: '2900' },
  { title: '3000 CC (3.0L)', value: '3000' },
  { title: '3200 CC (3.2L)', value: '3200' },
  { title: '3500 CC (3.5L)', value: '3500' },
  { title: '3600 CC (3.6L)', value: '3600' },
  { title: '3800 CC (3.8L)', value: '3800' },
  { title: '4000 CC (4.0L)', value: '4000' },
  { title: '4200 CC (4.2L)', value: '4200' },
  { title: '4400 CC (4.4L)', value: '4400' },
  { title: '4600 CC (4.6L)', value: '4600' },
  { title: '4800 CC (4.8L)', value: '4800' },
  { title: '5000 CC (5.0L)', value: '5000' },
  { title: '5200 CC (5.2L)', value: '5200' },
  { title: '5300 CC (5.3L)', value: '5300' },
  { title: '5400 CC (5.4L)', value: '5400' },
  { title: '5500 CC (5.5L)', value: '5500' },
  { title: '5600 CC (5.6L)', value: '5600' },
  { title: '5700 CC (5.7L)', value: '5700' },
  { title: '5800 CC (5.8L)', value: '5800' },
  { title: '6000 CC (6.0L)', value: '6000' },
  { title: '6200 CC (6.2L)', value: '6200' },
  { title: '6300 CC (6.3L)', value: '6300' },
  { title: '6500 CC (6.5L)', value: '6500' },
  { title: '6600 CC (6.6L)', value: '6600' },
  { title: '6700 CC (6.7L)', value: '6700' },
  { title: '7000 CC (7.0L)', value: '7000' },
  { title: '7200 CC (7.2L)', value: '7200' },
  { title: '7300 CC (7.3L)', value: '7300' },
  { title: '8000 CC (8.0L)', value: '8000' },
  { title: '8400 CC (8.4L)', value: '8400' }
]

/* ================= Truncation Watchers ================= */
watch(() => form.value.title_ar, (newVal) => {
  if (newVal && newVal.length > 150) {
    form.value.title_ar = newVal.slice(0, 150)
  }
})

watch(() => form.value.title_en, (newVal) => {
  if (newVal && newVal.length > 150) {
    form.value.title_en = newVal.slice(0, 150)
  }
})

watch(() => form.value.description_ar, (newVal) => {
  if (newVal && newVal.length > 2000) {
    form.value.description_ar = newVal.slice(0, 2000)
  }
})

watch(() => form.value.description_en, (newVal) => {
  if (newVal && newVal.length > 2000) {
    form.value.description_en = newVal.slice(0, 2000)
  }
})

/* ================= Smart Specs Paste Parser ================= */
const pastedSpecsText = ref('')
const specsFeedbackMessage = ref('')

const handleParseSpecs = async () => {
  if (!pastedSpecsText.value.trim()) return

  const text = pastedSpecsText.value
  let matchedCount = 0
  const extractedDetails = []

  // Helper to normalize values
  const cleanVal = (v) => v.replace(/^['"\s]+|['"\s]+$/g, '').trim()

  // Defined keys and their synonyms
  const keysList = [
    { field: 'type', synonyms: ['type', 'النوع', 'نوع المركبة', 'نوع'] },
    { field: 'seller_id', synonyms: ['seller', 'المعلن', 'البائع', 'اسم المعلن', 'اسم البائع', 'تاجر'] },
    { field: 'brand_id', synonyms: ['brand', 'الماركة', 'الشركة', 'ماركة', 'شركة'] },
    { field: 'model_id', synonyms: ['model', 'الموديل', 'موديل', 'طراز'] },
    { field: 'country_id', synonyms: ['country', 'البلد', 'الدولة', 'بلد', 'دولة'] },
    { field: 'governorate_id', synonyms: ['governorate', 'المحافظة', 'محافظة', 'منطقة'] },
    { field: 'city_id', synonyms: ['city', 'المدينة', 'مدينة'] },
    { field: 'title_ar', synonyms: ['title arabic', 'title ar', 'العنوان العربي', 'الاسم العربي', 'عنوان عربي'] },
    { field: 'title_en', synonyms: ['title english', 'title en', 'العنوان الانجليزي', 'الاسم الانجليزي', 'عنوان انجليزي'] },
    { field: 'description_ar', synonyms: ['description arabic', 'description ar', 'الوصف العربي', 'الوصف', 'وصف عربي'] },
    { field: 'description_en', synonyms: ['description english', 'description en', 'الوصف الانجليزي', 'وصف انجليزي'] },
    { field: 'price', synonyms: ['price', 'price (eg)', 'السعر', 'سعر'] },
    { field: 'year', synonyms: ['year', 'السنة', 'سنة', 'سنة الصنع', 'عام'] },
    { field: 'mileage', synonyms: ['mileage', 'mileage (km)', 'الممشى', 'ممشى', 'العداد', 'عداد', 'المسافة المقطوعة'] },
    { field: 'horsepower', synonyms: ['horsepower', 'horsepower (hp)', 'hp', 'القوة الحصانية', 'قوة الحصان', 'حصان'] },
    { field: 'torque', synonyms: ['torque', 'torque (nm)', 'العزم', 'عزم الدوران', 'نيوتن', 'العزم (نيوتن)'] },
    { field: 'engine_capacity', synonyms: ['engine capacity', 'engine', 'سعة المحرك', 'المحرك', 'سعة'] },
    { field: 'cylinders', synonyms: ['cylinders', 'سلندر', 'السلندرات', 'عدد السلندرات'] },
    { field: 'transmission', synonyms: ['transmission', 'ناقل الحركة', 'الفتيس', 'ناقل'] },
    { field: 'fuel_type', synonyms: ['fuel type', 'fuel', 'نوع الوقود', 'الوقود'] },
    { field: 'drivetrain', synonyms: ['drivetrain', 'نظام الدفع', 'الدفع'] },
    { field: 'condition', synonyms: ['condition', 'الحالة', 'حالة السيارة', 'الحالة العامة', 'used'] },
    { field: 'color', synonyms: ['color', 'اللون', 'لون'] },
    { field: 'custom_color', synonyms: ['custom color', 'custom color (hex)', 'اللون المخصص', 'لون مخصص'] },
    { field: 'phone_number', synonyms: ['phone', 'phone number', 'phone number for calls', 'تليفون', 'الهاتف', 'رقم الهاتف', 'الجوال', 'موبايل', 'رقم الموبايل', 'رقم التليفون', 'رقم التليفون للمكالمات'] },
    { field: 'whatsapp_number', synonyms: ['whatsapp', 'whatsapp number', 'واتساب', 'رقم الواتساب', 'رقم الواتس'] },
    { field: 'is_best_deal', synonyms: ['featured ad', 'best deal', 'مميز', 'إعلان مميز', 'اعلان مميز'] },
    { field: 'is_global_ad', synonyms: ['homepage promotion', 'top placement', 'global ad', 'إعلان عالمي'] },
    { field: 'is_urgent', synonyms: ['urgent sale', 'urgent', 'بيع عاجل', 'عاجل'] }
  ]

  // Intelligent multi-line parser
  const lines = text.split(/\r?\n/)
  const keyValueMap = {}
  let currentField = null

  lines.forEach(line => {
    // Check if the line matches Key: Value
    const match = line.match(/^\s*(.+?)\s*[:=-]\s*(.*)$/)
    if (match) {
      const potentialKey = match[1].toLowerCase().trim()
      const value = match[2].trim()

      // Check if it matches any synonym
      let foundField = null
      for (const item of keysList) {
        if (item.synonyms.includes(potentialKey)) {
          foundField = item.field
          break
        }
      }

      if (foundField) {
        currentField = foundField
        keyValueMap[currentField] = cleanVal(value)
        return
      }
    }

    // If it's a continuation of a multi-line field
    if (currentField && line.trim() !== '') {
      if (keyValueMap[currentField] === '') {
        keyValueMap[currentField] = cleanVal(line)
      } else {
        keyValueMap[currentField] += '\n' + cleanVal(line)
      }
    }
  })

  // 1. Type
  if (keyValueMap['type'] && 'type' in form.value) {
    const val = keyValueMap['type'].toLowerCase()
    if (val.includes('car') || val.includes('سيار')) {
      form.value.type = 'car'
      matchedCount++
      extractedDetails.push('Type: Car')
    } else if (val.includes('motorcycle') || val.includes('دراج')) {
      form.value.type = 'motorcycle'
      matchedCount++
      extractedDetails.push('Type: Motorcycle')
    }
  }

  // 2. Seller
  if (keyValueMap['seller_id'] && 'seller_id' in form.value && sellers.value?.length) {
    const sVal = keyValueMap['seller_id'].toLowerCase().trim()
    const foundSeller = sellers.value.find(s => {
      const name = String(s.name ?? '').toLowerCase()
      return name.includes(sVal) || sVal.includes(name)
    })
    if (foundSeller) {
      form.value.seller_id = foundSeller.id
      matchedCount++
      extractedDetails.push(`Seller: ${foundSeller.name}`)
    }
  }

  // 3. Brand
  let brandValue = keyValueMap['brand_id']
  let matchedBrand = null
  if (brandValue && brands.value?.length) {
    const brandLower = brandValue.toLowerCase().trim()
    matchedBrand = brands.value.find(b => {
      const nameEn = String(b.name?.en ?? b.name ?? '').toLowerCase().trim()
      const nameAr = String(b.name?.ar ?? b.name ?? '').toLowerCase().trim()
      return nameEn === brandLower || nameAr === brandLower || nameEn.includes(brandLower) || nameAr.includes(brandLower) || brandLower.includes(nameEn) || brandLower.includes(nameAr)
    })
  }
  if (!matchedBrand && brands.value?.length) {
    matchedBrand = brands.value.find(b => {
      const nameEn = String(b.name?.en ?? b.name ?? '').toLowerCase().trim()
      const nameAr = String(b.name?.ar ?? b.name ?? '').toLowerCase().trim()
      if (nameEn.length <= 1 && nameAr.length <= 1) return false
      return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
    })
  }
  if (matchedBrand) {
    form.value.brand_id = matchedBrand.id
    matchedCount++
    extractedDetails.push(`Brand: ${matchedBrand.name?.en ?? matchedBrand.name}`)
    await loadModels()
  }

  // 4. Model
  let modelValue = keyValueMap['model_id']
  if (form.value.brand_id && models.value?.length) {
    let matchedModel = null
    if (modelValue) {
      const modelLower = modelValue.toLowerCase().trim()
      matchedModel = models.value.find(m => {
        const nameEn = String(m.name?.en ?? m.name ?? '').toLowerCase().trim()
        const nameAr = String(m.name?.ar ?? m.name ?? '').toLowerCase().trim()
        return nameEn === modelLower || nameAr === modelLower || modelLower.includes(nameEn) || modelLower.includes(nameAr) || nameEn.includes(modelLower) || nameAr.includes(modelLower)
      })
    }
    if (!matchedModel) {
      matchedModel = models.value.find(m => {
        const nameEn = String(m.name?.en ?? m.name ?? '').toLowerCase().trim()
        const nameAr = String(m.name?.ar ?? m.name ?? '').toLowerCase().trim()
        if (nameEn.length <= 1 && nameAr.length <= 1) return false
        return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
      })
    }
    if (matchedModel) {
      form.value.model_id = matchedModel.id
      matchedCount++
      extractedDetails.push(`Model: ${matchedModel.name?.en ?? matchedModel.name}`)
    }
  }

  // 5. Country, Governorate & City
  let countryValue = keyValueMap['country_id']
  let matchedCountry = null
  if (countryValue && countries.value?.length) {
    const cSearch = countryValue.toLowerCase().trim()
    matchedCountry = countries.value.find(c => {
      const nameEn = String(c.name?.en ?? c.name ?? '').toLowerCase().trim()
      const nameAr = String(c.name?.ar ?? c.name ?? '').toLowerCase().trim()
      return nameEn === cSearch || nameAr === cSearch || nameEn.includes(cSearch) || nameAr.includes(cSearch) || cSearch.includes(nameEn) || cSearch.includes(nameAr)
    })
  }
  if (!matchedCountry && countries.value?.length) {
    matchedCountry = countries.value.find(c => {
      const nameEn = String(c.name?.en ?? c.name ?? '').toLowerCase()
      const nameAr = String(c.name?.ar ?? c.name ?? '').toLowerCase()
      if (nameEn.length <= 1 && nameAr.length <= 1) return false
      return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
    })
  }
  if (matchedCountry) {
    form.value.country_id = matchedCountry.id
    matchedCount++
    extractedDetails.push(`Country: ${matchedCountry.name?.en ?? matchedCountry.name}`)
    await loadGovernorates()

    let govValue = keyValueMap['governorate_id']
    if (governorates.value?.length) {
      let matchedGov = null
      if (govValue) {
        const gSearch = govValue.toLowerCase().trim()
        matchedGov = governorates.value.find(g => {
          const nameEn = String(g.name?.en ?? g.name ?? '').toLowerCase().trim()
          const nameAr = String(g.name?.ar ?? g.name ?? '').toLowerCase().trim()
          return nameEn === gSearch || nameAr === gSearch || nameEn.includes(gSearch) || nameAr.includes(gSearch) || gSearch.includes(nameEn) || gSearch.includes(nameAr)
        })
      }
      if (!matchedGov) {
        matchedGov = governorates.value.find(g => {
          const nameEn = String(g.name?.en ?? g.name ?? '').toLowerCase()
          const nameAr = String(g.name?.ar ?? g.name ?? '').toLowerCase()
          if (nameEn.length <= 1 && nameAr.length <= 1) return false
          return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
        })
      }
      if (matchedGov) {
        form.value.governorate_id = matchedGov.id
        matchedCount++
        extractedDetails.push(`Governorate: ${matchedGov.name?.en ?? matchedGov.name}`)
        await loadCities()

        let cityValue = keyValueMap['city_id']
        if (cities.value?.length) {
          let matchedCity = null
          if (cityValue) {
            const cSearch = cityValue.toLowerCase().trim()
            matchedCity = cities.value.find(c => {
              const nameEn = String(c.name?.en ?? c.name ?? '').toLowerCase().trim()
              const nameAr = String(c.name?.ar ?? c.name ?? '').toLowerCase().trim()
              return nameEn === cSearch || nameAr === cSearch || nameEn.includes(cSearch) || nameAr.includes(cSearch) || cSearch.includes(nameEn) || cSearch.includes(nameAr)
            })
          }
          if (!matchedCity) {
            matchedCity = cities.value.find(c => {
              const nameEn = String(c.name?.en ?? c.name ?? '').toLowerCase()
              const nameAr = String(c.name?.ar ?? c.name ?? '').toLowerCase()
              if (nameEn.length <= 1 && nameAr.length <= 1) return false
              return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
            })
          }
          if (matchedCity) {
            form.value.city_id = matchedCity.id
            matchedCount++
            extractedDetails.push(`City: ${matchedCity.name?.en ?? matchedCity.name}`)
          }
        }
      }
    }
  }

  // 6. Title Arabic & English
  if (keyValueMap['title_ar']) {
    form.value.title_ar = keyValueMap['title_ar'].slice(0, 150)
    matchedCount++
    extractedDetails.push('Title Arabic')
  }
  if (keyValueMap['title_en']) {
    form.value.title_en = keyValueMap['title_en'].slice(0, 150)
    matchedCount++
    extractedDetails.push('Title English')
  }

  // 7. Description Arabic & English
  if (keyValueMap['description_ar']) {
    form.value.description_ar = keyValueMap['description_ar'].slice(0, 2000)
    matchedCount++
    extractedDetails.push('Description Arabic')
  }
  if (keyValueMap['description_en']) {
    form.value.description_en = keyValueMap['description_en'].slice(0, 2000)
    matchedCount++
    extractedDetails.push('Description English')
  }

  // 8. Year
  if (keyValueMap['year']) {
    const yNum = parseInt(keyValueMap['year'].replace(/\D/g, ''))
    if (yNum && yNum >= 1900 && yNum <= 2030) {
      form.value.year = yNum
      matchedCount++
      extractedDetails.push(`Year: ${yNum}`)
    }
  } else {
    const yearMatch = text.match(/\b(19[8-9]\d|20[0-2]\d)\b/)
    if (yearMatch) {
      form.value.year = Number(yearMatch[1])
      matchedCount++
      extractedDetails.push(`Year: ${yearMatch[1]}`)
    }
  }

  // 9. Price
  if (keyValueMap['price'] && keyValueMap['price'] !== '—') {
    const val = keyValueMap['price']
    const millionMatch = val.match(/(\d+(?:\.\d+)?)\s*مليون/)
    if (millionMatch) {
      form.value.price = parseFloat(millionMatch[1]) * 1000000
      matchedCount++
      extractedDetails.push(`Price: ${millionMatch[1]} Million`)
    } else {
      const thousandMatch = val.match(/(\d+(?:\.\d+)?)\s*(?:ألف|الف|k)/i)
      if (thousandMatch) {
        form.value.price = parseFloat(thousandMatch[1]) * 1000
        matchedCount++
        extractedDetails.push(`Price: ${thousandMatch[1]}k`)
      } else {
        const cleanPrice = Number(val.replace(/,/g, '').replace(/\D/g, ''))
        if (cleanPrice) {
          form.value.price = cleanPrice
          matchedCount++
          extractedDetails.push(`Price: ${cleanPrice.toLocaleString()}`)
        }
      }
    }
  }

  // 10. Mileage
  if (keyValueMap['mileage'] && keyValueMap['mileage'] !== '—') {
    const val = keyValueMap['mileage']
    const cleanMileage = Number(val.replace(/,/g, '').replace(/\D/g, ''))
    if (cleanMileage || cleanMileage === 0) {
      form.value.mileage = cleanMileage
      matchedCount++
      extractedDetails.push(`Mileage: ${cleanMileage}`)
    }
  } else if (!keyValueMap['mileage']) {
    const cleanTextNoCommas = text.replace(/,/g, '')
    const mileageMatch = cleanTextNoCommas.match(/\b(\d+)\s*(?:كم|km|كيلو|عداد)/i)
    if (mileageMatch) {
      form.value.mileage = Number(mileageMatch[1])
      matchedCount++
      extractedDetails.push(`Mileage: ${mileageMatch[1]} km`)
    }
  }

  // 11. Engine Capacity
  let engineValue = keyValueMap['engine_capacity']
  if (engineValue) {
    const literMatch = engineValue.match(/(\d+(?:\.\d+)?)\s*(?:l|لتر|liters)/i)
    if (literMatch) {
      const liters = parseFloat(literMatch[1])
      form.value.engine_capacity = String(Math.round(liters * 1000))
      matchedCount++
      extractedDetails.push(`Engine: ${form.value.engine_capacity} CC`)
    } else {
      const cleanEngine = engineValue.replace(/cc|سي سي|سي/gi, '').trim()
      form.value.engine_capacity = cleanEngine
      matchedCount++
      extractedDetails.push(`Engine: ${cleanEngine} CC`)
    }
  }

  // 12. Cylinders
  let cylindersValue = keyValueMap['cylinders']
  if (cylindersValue) {
    const code = cylindersValue.toUpperCase().trim()
    const validCylinders = ['I2','I3','I4','I5','I6','V6','V8','V10','V12','W12','W16']
    const matchedCode = validCylinders.find(c => c === code || code.includes(c) || c.includes(code))
    if (matchedCode) {
      form.value.cylinders = matchedCode
      matchedCount++
      extractedDetails.push(`Cylinders: ${matchedCode}`)
    } else {
      const num = cylindersValue.replace(/\D/g, '')
      const mapping = { '2': 'I2', '3': 'I3', '4': 'I4', '5': 'I5', '6': 'V6', '8': 'V8', '10': 'V10', '12': 'V12', '16': 'W16' }
      form.value.cylinders = mapping[num] || null
      if (form.value.cylinders) {
        matchedCount++
        extractedDetails.push(`Cylinders: ${form.value.cylinders}`)
      }
    }
  }

  // 13. Horsepower
  let hpValue = keyValueMap['horsepower']
  if (hpValue) {
    let cleanHp = toNumOrNull(hpValue, 4)
    if (cleanHp !== null && cleanHp > 3000) cleanHp = 3000
    form.value.horsepower = cleanHp === null ? '' : cleanHp
    matchedCount++
    extractedDetails.push(`Horsepower: ${form.value.horsepower}`)
  }

  // 14. Torque
  let torqueValue = keyValueMap['torque']
  if (torqueValue) {
    let cleanTorque = toNumOrNull(torqueValue, 5)
    if (cleanTorque !== null && cleanTorque > 15000) cleanTorque = 15000
    form.value.torque = cleanTorque === null ? '' : cleanTorque
    matchedCount++
    extractedDetails.push(`Torque: ${form.value.torque}`)
  }

  // 15. Transmission
  let transValue = keyValueMap['transmission']
  if (transValue) {
    const tLower = transValue.toLowerCase()
    if (tLower.includes('auto') || tLower.includes('اوتوماتيك')) {
      form.value.transmission = 'automatic'
      matchedCount++
      extractedDetails.push('Transmission: Automatic')
    } else if (tLower.includes('manual') || tLower.includes('مانيوال') || tLower.includes('يدوي')) {
      form.value.transmission = 'manual'
      matchedCount++
      extractedDetails.push('Transmission: Manual')
    }
  }

  // 16. Fuel Type
  let fuelValue = keyValueMap['fuel_type']
  if (fuelValue) {
    const fLower = fuelValue.toLowerCase()
    if (fLower.includes('petrol') || fLower.includes('بنزين') || fLower.includes('gas')) {
      form.value.fuel_type = 'petrol'
      matchedCount++
      extractedDetails.push('Fuel: Petrol')
    } else if (fLower.includes('diesel') || fLower.includes('ديزل') || fLower.includes('سولار')) {
      form.value.fuel_type = 'diesel'
      matchedCount++
      extractedDetails.push('Fuel: Diesel')
    } else if (fLower.includes('electric') || fLower.includes('كهرباء') || fLower.includes('ev')) {
      form.value.fuel_type = 'electric'
      matchedCount++
      extractedDetails.push('Fuel: Electric')
    } else if (fLower.includes('hybrid') || fLower.includes('هايبرد') || fLower.includes('هجين')) {
      form.value.fuel_type = 'hybrid'
      matchedCount++
      extractedDetails.push('Fuel: Hybrid')
    }
  }

  // 17. Condition
  let condValue = keyValueMap['condition']
  if (condValue) {
    const cLower = condValue.toLowerCase()
    if (cLower.includes('new') || cLower.includes('جديد') || cLower.includes('زيرو')) {
      form.value.condition = 'new'
      matchedCount++
      extractedDetails.push('Condition: New')
    } else if (cLower.includes('used') || cLower.includes('مستعمل') || cLower.includes('excellent') || cLower.includes('ممتاز')) {
      form.value.condition = 'used'
      matchedCount++
      extractedDetails.push('Condition: Used')
    }
  }

  // 18. Drivetrain
  let driveValue = keyValueMap['drivetrain']
  if (driveValue) {
    const dLower = driveValue.toLowerCase()
    if (dLower.includes('fwd') || dLower.includes('أمامي') || dLower.includes('امامي')) {
      form.value.drivetrain = 'fwd'
      matchedCount++
      extractedDetails.push('Drivetrain: FWD')
    } else if (dLower.includes('rwd') || dLower.includes('خلفي')) {
      form.value.drivetrain = 'rwd'
      matchedCount++
      extractedDetails.push('Drivetrain: RWD')
    } else if (dLower.includes('awd') || dLower.includes('4wd') || dLower.includes('رباعي')) {
      form.value.drivetrain = 'awd'
      matchedCount++
      extractedDetails.push('Drivetrain: AWD')
    }
  }

  // 19. Color & Custom Color
  let colorValue = keyValueMap['color']
  let customColorValue = keyValueMap['custom_color']
  let finalColor = null
  if (customColorValue && /^#[0-9A-F]{6}$/i.test(customColorValue.trim())) {
    finalColor = customColorValue.trim()
  } else if (colorValue) {
    const cSearch = colorValue.toLowerCase().trim()
    const matchedColor = commonColors.find(c => c.name.toLowerCase() === cSearch)
    if (matchedColor) {
      finalColor = matchedColor.hex
    } else if (/^#[0-9A-F]{6}$/i.test(colorValue.trim())) {
      finalColor = colorValue.trim()
    }
  }
  if (finalColor) {
    form.value.color = finalColor
    matchedCount++
    extractedDetails.push(`Color: ${finalColor}`)
  }

  // 20. Phone & WhatsApp
  if (keyValueMap['phone_number']) {
    const cleanPhone = keyValueMap['phone_number'].replace(/[^\d+]/g, '')
    if (cleanPhone && !cleanPhone.includes('X') && !cleanPhone.includes('x')) {
      form.value.phone_number = cleanPhone
      matchedCount++
      extractedDetails.push(`Phone: ${cleanPhone}`)
    }
  }
  if (keyValueMap['whatsapp_number']) {
    const cleanWa = keyValueMap['whatsapp_number'].replace(/[^\d+]/g, '')
    if (cleanWa && !cleanWa.includes('X') && !cleanWa.includes('x')) {
      form.value.whatsapp_number = cleanWa
      matchedCount++
      extractedDetails.push(`WhatsApp: ${cleanWa}`)
    }
  }

  // 21. Promotions (Featured / Homepage)
  if (keyValueMap['is_best_deal'] && 'is_best_deal' in form.value) {
    const val = keyValueMap['is_best_deal'].toUpperCase()
    form.value.is_best_deal = (val === 'ON' || val === 'YES' || val === '1' || val === 'TRUE')
    matchedCount++
    extractedDetails.push(`Featured Ad: ${form.value.is_best_deal}`)
  }
  if (keyValueMap['is_global_ad'] && 'is_global_ad' in form.value) {
    const val = keyValueMap['is_global_ad'].toUpperCase()
    form.value.is_global_ad = (val === 'ON' || val === 'YES' || val === '1' || val === 'TRUE')
    matchedCount++
    extractedDetails.push(`Homepage Promotion: ${form.value.is_global_ad}`)
  }

  // 22. Features / Options Match
  if (features.value && features.value.length) {
    const matchedFeatures = []
    features.value.forEach(f => {
      const nameEn = String(f.name?.en ?? f.name ?? '').toLowerCase().trim()
      const nameAr = String(f.name?.ar ?? f.name ?? '').toLowerCase().trim()
      if (nameEn.length > 2 && text.toLowerCase().includes(nameEn)) {
        if (!matchedFeatures.includes(f.id)) matchedFeatures.push(f.id)
      } else if (nameAr.length > 2 && text.toLowerCase().includes(nameAr)) {
        if (!matchedFeatures.includes(f.id)) matchedFeatures.push(f.id)
      }
    })
    
    if (matchedFeatures.length > 0) {
      form.value.features = matchedFeatures
      matchedCount += matchedFeatures.length
      extractedDetails.push(`Features: ${matchedFeatures.length} matched`)
    }
  }

  if (matchedCount > 0) {
    specsFeedbackMessage.value = `Successfully extracted ${matchedCount} fields: ${extractedDetails.join(', ')}`
  } else {
    specsFeedbackMessage.value = `No matching specifications found in the pasted text. Please make sure the text contains standard car specs.`
  }

  setTimeout(() => {
    specsFeedbackMessage.value = ''
  }, 8000)
}

/* ================= Helpers ================= */
const fieldError = field => errors.value?.[field] || []

/* ================= Lifecycle ================= */
onMounted(async () => {
  try {
    const [brandsRes, featuresRes, countriesRes] = await Promise.all([
      brandUserApi.getAll(),
      carFeatureUserApi.getAll(),
      countryUserApi.getAll()
    ])
    brands.value = brandsRes.data.data || []
    features.value = featuresRes.data.data || []
    countries.value = countriesRes.data.data || []
  } catch (err) {
    console.error('Failed to load initial form data:', err)
  }
})

/* ================= Loaders ================= */
const safeItemTitle = (obj) => obj?.name?.en ?? obj?.name ?? '-'

const loadModels = async () => {
  form.value.model_id = null
  if (!form.value.brand_id) return

  try {
    const res = await modelUserApi.getAll({ 'filter[brand_id]': form.value.brand_id })
    models.value = res.data.data || []
    if (models.value.length > 0) {
      focusNext(refModel.value)
    }
  } catch (err) {
    console.error('Failed to load models:', err)
  }
}

const loadGovernorates = async () => {
  form.value.governorate_id = null
  form.value.city_id = null
  governorates.value = []
  cities.value = []
  if (!form.value.country_id) return

  try {
    const res = await governorateUserApi.getAll({ 'filter[country_id]': form.value.country_id })
    governorates.value = res.data.data || []
    if (governorates.value.length > 0) {
      focusNext(refGovernorate.value)
    }
  } catch (err) {
    console.error('Failed to load governorates:', err)
  }
}

const loadCities = async () => {
  form.value.city_id = null
  cities.value = []
  if (!form.value.governorate_id) return

  try {
    const res = await cityUserApi.getAll({ 'filter[governorate_id]': form.value.governorate_id })
    cities.value = res.data.data || []
    if (cities.value.length > 0) {
      focusNext(refCity.value)
    }
  } catch (err) {
    console.error('Failed to load cities:', err)
  }
}

/* ================= Images ================= */
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
        }, 'image/jpeg', 0.85)
      }
    }
  })
}

const handleImagesChange = async files => {
  imagePreviews.value = []
  if (!files || !files.length) return
  
  if (files.length > 20) {
    files = files.slice(0, 20)
    form.value.images = files
    snackbarMessage.value = 'Maximum 20 images allowed. Extra images were removed.'
    snackbarColor.value = 'warning'
    snackbar.value = true
  }

  const compressedFiles = []
  for (const file of files) {
    if (file.size > 1024 * 1024 * 1.5) { // compress if > 1.5MB
      const compressed = await compressImage(file)
      compressedFiles.push(compressed)
    } else {
      compressedFiles.push(file)
    }
  }
  
  form.value.images = compressedFiles

  compressedFiles.forEach((file, index) => {
    imagePreviews.value.push({
      file,
      url: URL.createObjectURL(file),
      index
    })
  })

  if (form.value.main_image === null && compressedFiles.length) {
    form.value.main_image = 0
  }
}

const refCustomColorInput = ref(null)

const isCustomColor = computed(() => {
  if (!form.value.color) return false
  const match = commonColors.some(c => c.hex.toLowerCase() === form.value.color.toLowerCase())
  return !match && /^#[0-9A-F]{6}$/i.test(form.value.color)
})

const getContrastColor = (hex) => {
  if (!hex || hex.length < 6) return 'white'
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? 'black' : 'white'
}

const triggerCustomColorPicker = () => {
  if (refCustomColorInput.value) {
    refCustomColorInput.value.click()
  }
}

const handleColorInput = (evt) => {
  let val = evt.target.value.trim()
  if (val && !val.startsWith('#') && /^[0-9A-F]{3,6}$/i.test(val)) {
    form.value.color = '#' + val
  } else {
    form.value.color = val
  }
}

/* ================= Submit ================= */
const handleSubmit = async () => {
  loading.value = true
  errors.value = {}

  try {
    const formData = new FormData()

    Object.entries(form.value).forEach(([key, value]) => {
      if (key === 'is_import') {
        formData.append('is_import', String(value ?? '0'))
      } else if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images[]', file))
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, v))
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0')
      } else if (value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    await carSellerApi.create(formData)

    snackbarMessage.value = 'Car created successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/seller/cars'), 1200)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    }

    snackbarMessage.value = 'Failed to create car'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center py-10 px-4">
    <VCard class="w-full max-w-6xl pa-8 rounded-xl">

      <!-- Title -->
      <div class="text-center mb-10">
        <VIcon icon="tabler-car" size="28" color="primary" />
        <h2 class="text-h5 font-weight-medium mt-2">
          Add New Car
        </h2>
      </div>

      <VForm @submit.prevent="handleSubmit">

        <!-- Smart Specifications Paste Parser -->
        <VCard variant="outlined" color="primary" class="mb-8 pa-5 rounded-xl relative overflow-hidden" style="background: rgba(var(--v-theme-primary), 0.04); border-width: 1.5px;">
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-wand" color="primary" size="24" class="animate-pulse" />
              <h3 class="text-subtitle-1 font-weight-bold text-primary mb-0">
                Smart Auto-Fill from Text / تعبئة المواصفات ذكياً من نص خارجي
              </h3>
            </div>
            <span class="text-caption opacity-80 font-weight-medium">
              Copy specs text from any website or file, paste it here, and let the system parse & auto-fill the form!
            </span>
          </div>
          
          <VRow dense>
            <VCol cols="12">
              <VTextarea
                v-model="pastedSpecsText"
                rows="3"
                placeholder="انسخ النص الذي يحتوي على ماركة وموديل وسنة وسعر ومواصفات المحرك والصقه هنا لتعبئة الحقول فوراً وبضغطة واحدة..."
                variant="outlined"
                hide-details
                append-inner-icon="tabler-clipboard-text"
              />
            </VCol>
            <VCol cols="12" class="d-flex justify-end gap-2 mt-2">
              <VBtn
                size="small"
                variant="tonal"
                color="secondary"
                @click="pastedSpecsText = ''"
                :disabled="!pastedSpecsText"
              >
                Clear / مسح
              </VBtn>
              <VBtn
                size="small"
                color="primary"
                @click="handleParseSpecs"
                :disabled="!pastedSpecsText"
                prepend-icon="tabler-sparkles"
              >
                Auto-Fill Form / استخراج وتعبئة تلقائية
              </VBtn>
            </VCol>
          </VRow>

          <!-- Extraction Feedback -->
          <Transition name="fade">
            <div v-if="specsFeedbackMessage" class="mt-3 px-4 py-2.5 rounded bg-success-lighten-5 text-success text-sm d-flex align-center gap-2" style="background-color: rgba(40, 199, 111, 0.1); border: 1px solid rgba(40, 199, 111, 0.2);">
              <VIcon icon="tabler-circle-check" size="18" />
              <span class="font-weight-medium">{{ specsFeedbackMessage }}</span>
            </div>
          </Transition>
        </VCard>

        <!-- ================= Basic Info ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Basic Information</h3>

          <VRow dense>
            <VCol cols="12" md="12">
              <VSelect
                ref="refType"
                v-model="form.type"
                :items="['car','motorcycle']"
                label="Type"
                @update:modelValue="focusNext(refBrand.value)"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refBrand"
                v-model="form.brand_id"
                :items="brands"
                :item-title="b => safeItemTitle(b)"
                item-value="id"
                label="Brand"
                prepend-inner-icon="tabler-building-factory"
                variant="outlined"
                @update:modelValue="loadModels"
                :custom-filter="customBrandFilter"
                :error="!!fieldError('brand_id').length"
                :error-messages="fieldError('brand_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refModel"
                v-model="form.model_id"
                :items="models"
                :item-title="m => safeItemTitle(m)"
                item-value="id"
                label="Model"
                prepend-inner-icon="tabler-car"
                variant="outlined"
                :error="!!fieldError('model_id').length"
                :error-messages="fieldError('model_id')"
                @update:modelValue="focusNext(refCountry.value)"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Location ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Location</h3>

          <VRow dense>
            <VCol cols="12" md="4">
              <VAutocomplete
                ref="refCountry"
                v-model="form.country_id"
                :items="countries"
                :item-title="c => safeItemTitle(c)"
                item-value="id"
                label="Country"
                prepend-inner-icon="tabler-world"
                variant="outlined"
                @update:modelValue="loadGovernorates"
                :error="!!fieldError('country_id').length"
                :error-messages="fieldError('country_id')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VAutocomplete
                ref="refGovernorate"
                v-model="form.governorate_id"
                :items="governorates"
                :item-title="g => safeItemTitle(g)"
                item-value="id"
                label="Governorate"
                prepend-inner-icon="tabler-map"
                variant="outlined"
                @update:modelValue="loadCities"
                :error="!!fieldError('governorate_id').length"
                :error-messages="fieldError('governorate_id')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VAutocomplete
                ref="refCity"
                v-model="form.city_id"
                :items="cities"
                :item-title="c => safeItemTitle(c)"
                item-value="id"
                label="City"
                prepend-inner-icon="tabler-map-pin"
                variant="outlined"
                :error="!!fieldError('city_id').length"
                :error-messages="fieldError('city_id')"
                @update:modelValue="focusNext(refTitleAr.value)"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Titles ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Titles</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VTextField
                ref="refTitleAr"
                v-model="form.title_ar"
                label="Title Arabic"
                variant="outlined"
                maxlength="150"
                counter="150"
                :error-messages="fieldError('title_ar')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                ref="refTitleEn"
                v-model="form.title_en"
                label="Title English"
                variant="outlined"
                maxlength="150"
                counter="150"
                :error-messages="fieldError('title_en')"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Description ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Description</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="form.description_ar"
                label="Description Arabic"
                rows="4"
                variant="outlined"
                maxlength="2000"
                counter="2000"
                :error-messages="fieldError('description_ar')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextarea
                v-model="form.description_en"
                label="Description English"
                rows="4"
                variant="outlined"
                maxlength="2000"
                counter="2000"
                :error-messages="fieldError('description_en')"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Specs ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Car Specs</h3>

          <VRow dense>
            <VCol cols="12" md="4">
              <VTextField
                ref="refPrice"
                v-model="form.price"
                label="Price"
                type="number"
                :error-messages="fieldError('price')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refYear"
                v-model="form.year"
                label="Year"
                :error-messages="fieldError('year')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refMileage"
                v-model="form.mileage"
                label="Mileage"
                :error-messages="fieldError('mileage')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VSelect
                v-model="form.cylinders"
                :items="['I2','I3','I4','I5','I6','V6','V8','V10','V12','W12','W16']"
                label="Cylinders"
                prepend-inner-icon="tabler-engine-off"
                variant="outlined"
                :error-messages="fieldError('cylinders')"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VCombobox
                v-model="form.engine_capacity"
                :items="engineCapacityOptions"
                item-title="title"
                item-value="value"
                :return-object="false"
                label="Engine Capacity / السعة اللترية"
                prepend-inner-icon="tabler-piston"
                variant="outlined"
                :error-messages="fieldError('engine_capacity')"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refTransmission"
                v-model="form.transmission"
                :items="['manual','automatic']"
                label="Transmission"
                @update:modelValue="focusNext(refFuelType.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refFuelType"
                v-model="form.fuel_type"
                :items="[
                  { title: 'Petrol', value: 'petrol' },
                  { title: 'Diesel', value: 'diesel' },
                  { title: 'Electric', value: 'electric' },
                  { title: 'Hybrid', value: 'hybrid' },
                  { title: 'Mild Hybrid', value: 'mild_hybrid' },
                  { title: 'REEV (Plug-in)', value: 'reev' }
                ]"
                label="Fuel Type"
                @update:modelValue="focusNext(refDrivetrain.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refDrivetrain"
                v-model="form.drivetrain"
                :items="['fwd','rwd','awd','4wd']"
                label="Drivetrain"
                @update:modelValue="focusNext(refCondition.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refCondition"
                v-model="form.condition"
                :items="['new','used']"
                label="Condition"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                v-model="form.is_import"
                :items="[
                  { title: 'Local (وكيل)', value: '0' },
                  { title: 'Imported (استيراد الخارج)', value: '1' },
                  { title: 'For Import (متاحة للاستيراد)', value: '2' }
                ]"
                label="Source"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Features ================= -->
        <section class="mb-10">
          <FeaturesManager
            v-model="form.features"
            :features-list="features"
            :error-messages="fieldError('features')"
            @feature-created="f => features.push(f)"
          />
        </section>
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Color / لون السيارة</h3>

          <div class="d-flex flex-wrap gap-3 mb-4 align-center">
            <!-- Predefined Colors -->
            <div
              v-for="c in commonColors"
              :key="c.hex"
              class="cursor-pointer rounded-circle border d-flex align-center justify-center transition-all"
              :style="{ backgroundColor: c.hex, width: '40px', height: '40px', border: form.color === c.hex ? '3px solid #FF9F43' : '1px solid #ddd', transform: form.color === c.hex ? 'scale(1.1)' : 'none' }"
              :title="c.name"
              @click="form.color = c.hex"
            >
              <VIcon v-if="form.color === c.hex" icon="tabler-check" :color="c.hex === '#FFFFFF' ? 'black' : 'white'" size="20" />
            </div>

            <!-- Custom Color Circle Picker -->
            <div
              class="cursor-pointer rounded-circle border d-flex align-center justify-center transition-all position-relative overflow-hidden"
              :style="{ 
                background: isCustomColor ? form.color || '#fff' : 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)', 
                width: '40px', 
                height: '40px', 
                border: isCustomColor ? '3px solid #FF9F43' : '1px solid #ddd',
                transform: isCustomColor ? 'scale(1.1)' : 'none'
              }"
              title="Choose Custom Color / اختر لوناً مخصصاً"
            >
              <!-- Invisible native color input covering the entire circle -->
              <input
                type="color"
                v-model="form.color"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2;"
              />
              <VIcon v-if="isCustomColor" icon="tabler-check" :color="getContrastColor(form.color)" size="20" style="position: relative; z-index: 1; pointer-events: none;" />
              <VIcon v-else icon="tabler-color-picker" color="white" size="20" style="position: relative; z-index: 1; pointer-events: none;" />
            </div>
          </div>

          <VRow align="center">
            <VCol cols="12" md="4">
              <VTextField
                :model-value="form.color"
                @input="handleColorInput"
                label="Custom Color (Hex) / كود لون مخصص"
                variant="outlined"
                prepend-inner-icon="tabler-palette"
                placeholder="e.g. #FF00FF"
                :error-messages="fieldError('color')"
              />
            </VCol>
          </VRow>
        </section>

        <!-- ================= Images ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Images</h3>

          <VFileInput
            v-model="form.images"
            multiple
            accept="image/*"
            label="Upload Images"
            variant="outlined"
            @update:modelValue="handleImagesChange"
            :error-messages="fieldError('images')"
          />

          <VRow v-if="imagePreviews.length" class="mt-4">
            <VCol
              v-for="img in imagePreviews"
              :key="img.index"
              cols="12"
              sm="6"
              md="3"
            >
              <VCard
                class="cursor-pointer"
                :class="{ 'border-primary border-2': form.main_image === img.index }"
                @click="form.main_image = img.index"
              >
                <VImg :src="img.url" aspect-ratio="1" cover />

                <div
                  v-if="form.main_image === img.index"
                  class="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded"
                >
                  Main
                </div>
              </VCard>
            </VCol>
          </VRow>
        </section>

        <!-- ================= Actions ================= -->
        <div class="d-flex justify-end gap-4">
          <VBtn variant="outlined" @click="router.back()">Cancel</VBtn>
          <VBtn color="primary" type="submit" :loading="loading">Save Car</VBtn>
        </div>
      </VForm>
    </VCard>

    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>
