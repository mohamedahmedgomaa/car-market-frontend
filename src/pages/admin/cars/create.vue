<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import carAdminApi from '../../../api/admin/carAdminApi.js'
import sellerAdminApi from '../../../api/admin/sellerAdminApi.js'
import brandAdminApi from '../../../api/admin/brandAdminApi.js'
import modelAdminApi from '../../../api/admin/modelAdminApi.js'
import featureAdminApi from '../../../api/admin/carFeatureAdminApi.js'
import countryAdminApi from '../../../api/admin/countryAdminApi.js'
import cityAdminApi from '../../../api/admin/cityAdminApi.js'
import FeaturesManager from '@/components/FeaturesManager.vue'

const router = useRouter()

/* ================= State ================= */
const form = ref({
  seller_id: null,
  brand_id: null,
  model_id: null,

  country_id: null,
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

  horsepower: '',
  torque: '',
  engine_capacity: '',
  cylinders: null,

  phone_number: '',
  whatsapp_number: '',
  is_whatsapp_same: false,

  is_best_deal: false,
  is_import: false,
  is_global_ad: false,
  ad_expiry: null,
  featured_fee: '',

  features: [],
  images: [],
  main_image: null
})

const sellers = ref([])
const brands = ref([])
const models = ref([])
const features = ref([])
const countries = ref([])
const cities = ref([])

const imagePreviews = ref([])

const loading = ref(false)
const errors = ref({})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

/* ================= Refs for Auto-focus ================= */
const refType = ref()
const refSeller = ref()
const refBrand = ref()
const refModel = ref()
const refCountry = ref()
const refCity = ref()
const refTitleAr = ref()
const refTitleEn = ref()
const refPrice = ref()
const refYear = ref()
const refMileage = ref()
const refHorsepower = ref()
const refTorque = ref()
const refEngineCapacity = ref()
const refTransmission = ref()
const refFuelType = ref()
const refDrivetrain = ref()
const refCondition = ref()

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

/* ================= Numeric Helpers ================= */
const isNumberKey = (evt) => {
  const charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode < 1632 || charCode > 1641)) {
    evt.preventDefault()
  }
}

const formatWithCommas = (v) => {
  if (!v && v !== 0) return ''
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const toNumOrNull = (v, limit = 9) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  raw = raw.replace(/\D/g, '').slice(0, limit)
  let n = Number(raw)
  return Number.isNaN(n) || raw === '' ? null : n
}

const toDecimalOrNull = (v, limit = 9) => {
  if (v === '' || v === undefined || v === null) return null
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  let raw = String(v).replace(/[٠-٩]/g, d => arabicDigits.indexOf(d))
  // Allow digits and one dot
  raw = raw.replace(/[^0-9.]/g, '')
  // Keep only the first dot
  const parts = raw.split('.')
  if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('')
  raw = raw.slice(0, limit)
  return raw === '' ? null : raw
}

const displayPrice = computed({
  get: () => formatWithCommas(form.value.price),
  set: (v) => { form.value.price = toNumOrNull(v) }
})

const displayMileage = computed({
  get: () => formatWithCommas(form.value.mileage),
  set: (v) => { form.value.mileage = toNumOrNull(v, 6) }
})

const displayYear = computed({
  get: () => form.value.year,
  set: (v) => { form.value.year = toNumOrNull(v, 4) }
})

const displayHorsepower = computed({
  get: () => form.value.horsepower,
  set: (v) => {
    let num = toNumOrNull(v, 4)
    if (num !== null && num > 3000) num = 3000
    form.value.horsepower = num === null ? '' : num
  }
})

const displayTorque = computed({
  get: () => form.value.torque,
  set: (v) => {
    let num = toNumOrNull(v, 5)
    if (num !== null && num > 15000) num = 15000
    form.value.torque = num === null ? '' : num
  }
})

const displayEngineCapacity = computed({
  get: () => form.value.engine_capacity,
  set: (v) => {
    let num = toNumOrNull(v, 4)
    form.value.engine_capacity = num === null ? '' : num
  }
})

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

  // First: try line-by-line key-value parsing
  const lines = text.split(/\r?\n/)
  const keyValueMap = {}
  
  lines.forEach(line => {
    const parts = line.match(/^\s*(.+?)\s*[:=-]\s*(.+?)\s*$/)
    if (parts && parts.length >= 3) {
      const k = parts[1].toLowerCase().trim()
      const v = cleanVal(parts[2])
      keyValueMap[k] = v
    }
  })

  // 1. Brand & Model Match
  let brandValue = keyValueMap['brand'] || keyValueMap['الماركة'] || keyValueMap['الشركة'] || keyValueMap['ماركة']
  if (!brandValue) {
    // If not found in keys, search globally in text
    const matchedBrand = brands.value.find(b => {
      const nameEn = String(b.name?.en ?? b.name ?? '').toLowerCase()
      const nameAr = String(b.name?.ar ?? b.name ?? '').toLowerCase()
      return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
    })
    if (matchedBrand) {
      form.value.brand_id = matchedBrand.id
      matchedCount++
      extractedDetails.push(`Brand: ${matchedBrand.name?.en ?? matchedBrand.name}`)
      await loadModels()
    }
  } else {
    const brandLower = brandValue.toLowerCase()
    const matchedBrand = brands.value.find(b => {
      const nameEn = String(b.name?.en ?? b.name ?? '').toLowerCase()
      const nameAr = String(b.name?.ar ?? b.name ?? '').toLowerCase()
      return nameEn === brandLower || nameAr === brandLower || nameEn.includes(brandLower) || nameAr.includes(brandLower)
    })
    if (matchedBrand) {
      form.value.brand_id = matchedBrand.id
      matchedCount++
      extractedDetails.push(`Brand: ${matchedBrand.name?.en ?? matchedBrand.name}`)
      await loadModels()
    }
  }

  // Model Match
  let modelValue = keyValueMap['model'] || keyValueMap['الموديل'] || keyValueMap['موديل'] || keyValueMap['طراز']
  if (form.value.brand_id && models.value.length) {
    if (modelValue) {
      const modelLower = modelValue.toLowerCase()
      const matchedModel = models.value.find(m => {
        const nameEn = String(m.name?.en ?? m.name ?? '').toLowerCase()
        const nameAr = String(m.name?.ar ?? m.name ?? '').toLowerCase()
        return nameEn === modelLower || nameAr === modelLower || nameEn.includes(modelLower) || nameAr.includes(modelLower)
      })
      if (matchedModel) {
        form.value.model_id = matchedModel.id
        matchedCount++
        extractedDetails.push(`Model: ${matchedModel.name?.en ?? matchedModel.name}`)
      }
    } else {
      // Global search for model
      const matchedModel = models.value.find(m => {
        const nameEn = String(m.name?.en ?? m.name ?? '').toLowerCase()
        const nameAr = String(m.name?.ar ?? m.name ?? '').toLowerCase()
        if (nameEn.length <= 1 && nameAr.length <= 1) return false
        return (nameEn && text.toLowerCase().includes(nameEn)) || (nameAr && text.toLowerCase().includes(nameAr))
      })
      if (matchedModel) {
        form.value.model_id = matchedModel.id
        matchedCount++
        extractedDetails.push(`Model: ${matchedModel.name?.en ?? matchedModel.name}`)
      }
    }
  }

  // 2. Year
  let yearValue = keyValueMap['year'] || keyValueMap['السنة'] || keyValueMap['سنة'] || keyValueMap['سنة الصنع'] || keyValueMap['عام']
  if (yearValue) {
    const yNum = parseInt(yearValue.replace(/\D/g, ''))
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

  // 3. Price
  let priceValue = keyValueMap['price'] || keyValueMap['السعر'] || keyValueMap['سعر']
  if (priceValue) {
    const millionMatch = priceValue.match(/(\d+(?:\.\d+)?)\s*مليون/)
    if (millionMatch) {
      form.value.price = parseFloat(millionMatch[1]) * 1000000
      matchedCount++
      extractedDetails.push(`Price: ${millionMatch[1]} Million`)
    } else {
      const thousandMatch = priceValue.match(/(\d+(?:\.\d+)?)\s*(?:ألف|الف|k)/i)
      if (thousandMatch) {
        form.value.price = parseFloat(thousandMatch[1]) * 1000
        matchedCount++
        extractedDetails.push(`Price: ${thousandMatch[1]}k`)
      } else {
        const cleanPrice = Number(priceValue.replace(/,/g, '').replace(/\D/g, ''))
        if (cleanPrice) {
          form.value.price = cleanPrice
          matchedCount++
          extractedDetails.push(`Price: ${cleanPrice.toLocaleString()}`)
        }
      }
    }
  } else {
    const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*مليون/)
    if (millionMatch) {
      form.value.price = parseFloat(millionMatch[1]) * 1000000
      matchedCount++
      extractedDetails.push(`Price: ${millionMatch[1]} Million`)
    } else {
      const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ألف|الف|k)/i)
      if (thousandMatch) {
        form.value.price = parseFloat(thousandMatch[1]) * 1000
        matchedCount++
        extractedDetails.push(`Price: ${thousandMatch[1]}k`)
      } else {
        const cleanText = text.replace(/,/g, '')
        const prices = cleanText.match(/\b(5[0-9]\d{3}|[6-9]\d{4}|\d{6,8})\b/g)
        if (prices && prices.length) {
          form.value.price = Number(prices[0])
          matchedCount++
          extractedDetails.push(`Price: ${prices[0]}`)
        }
      }
    }
  }

  // 4. Mileage
  let mileageValue = keyValueMap['mileage'] || keyValueMap['الممشى'] || keyValueMap['ممشى'] || keyValueMap['العداد'] || keyValueMap['عداد']
  if (mileageValue) {
    const cleanMileage = Number(mileageValue.replace(/,/g, '').replace(/\D/g, ''))
    if (cleanMileage || cleanMileage === 0) {
      form.value.mileage = cleanMileage
      matchedCount++
      extractedDetails.push(`Mileage: ${cleanMileage}`)
    }
  } else {
    const cleanTextNoCommas = text.replace(/,/g, '')
    const mileageMatch = cleanTextNoCommas.match(/\b(\d+)\s*(?:كم|km|كيلو|عداد)/i)
    if (mileageMatch) {
      form.value.mileage = Number(mileageMatch[1])
      matchedCount++
      extractedDetails.push(`Mileage: ${mileageMatch[1]} km`)
    }
  }

  // 5. Engine Capacity
  let engineValue = keyValueMap['engine capacity'] || keyValueMap['engine'] || keyValueMap['سعة المحرك'] || keyValueMap['المحرك'] || keyValueMap['سعة']
  if (engineValue) {
    const cleanEngine = engineValue.replace(/cc|سي سي|سي|لتر|l/gi, '').trim()
    form.value.engine_capacity = cleanEngine
    matchedCount++
    extractedDetails.push(`Engine: ${cleanEngine}`)
  } else {
    const ccMatch = text.match(/\b(\d{3,4})\s*(?:cc|سي|سعة|محرك)/i)
    const literMatch = text.match(/\b(\d\.\d)\s*(?:l|لتر|liters)/i)
    if (ccMatch) {
      form.value.engine_capacity = ccMatch[1]
      matchedCount++
      extractedDetails.push(`Engine: ${ccMatch[1]} CC`)
    } else if (literMatch) {
      const liters = parseFloat(literMatch[1])
      form.value.engine_capacity = String(liters * 1000)
      matchedCount++
      extractedDetails.push(`Engine: ${liters * 1000} CC`)
    }
  }

  // 6. Cylinders
  let cylindersValue = keyValueMap['cylinders'] || keyValueMap['سلندر'] || keyValueMap['السلندرات'] || keyValueMap['عدد السلندرات']
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
  } else {
    const cylMatch = text.match(/\b(2|3|4|5|6|8|10|12|16)\s*(?:سلندر|cylinder|cyl)/i)
    const vMatch = text.match(/\b([viw]\d{1,2})\b/i)
    if (cylMatch) {
      const num = cylMatch[1]
      const mapping = { '2': 'I2', '3': 'I3', '4': 'I4', '5': 'I5', '6': 'V6', '8': 'V8', '10': 'V10', '12': 'V12', '16': 'W16' }
      form.value.cylinders = mapping[num] || null
      if (form.value.cylinders) {
        matchedCount++
        extractedDetails.push(`Cylinders: ${form.value.cylinders}`)
      }
    } else if (vMatch) {
      const code = vMatch[1].toUpperCase()
      const validCylinders = ['I2','I3','I4','I5','I6','V6','V8','V10','V12','W12','W16']
      if (validCylinders.includes(code)) {
        form.value.cylinders = code
        matchedCount++
        extractedDetails.push(`Cylinders: ${code}`)
      }
    }
  }

  // 7. Horsepower
  let hpValue = keyValueMap['horsepower'] || keyValueMap['القوة الحصانية'] || keyValueMap['قوة الحصان'] || keyValueMap['حصان']
  if (hpValue) {
    let cleanHp = toNumOrNull(hpValue, 4)
    if (cleanHp !== null && cleanHp > 3000) cleanHp = 3000
    form.value.horsepower = cleanHp === null ? '' : cleanHp
    matchedCount++
    extractedDetails.push(`Horsepower: ${form.value.horsepower}`)
  } else {
    const hpMatch = text.match(/\b(\d+)\s*(?:hp|حصان|قوة|horsepower)/i)
    if (hpMatch) {
      let cleanHp = toNumOrNull(hpMatch[1], 4)
      if (cleanHp !== null && cleanHp > 3000) cleanHp = 3000
      form.value.horsepower = cleanHp === null ? '' : cleanHp
      matchedCount++
      extractedDetails.push(`Horsepower: ${form.value.horsepower} HP`)
    }
  }

  // 8. Torque
  let torqueValue = keyValueMap['torque'] || keyValueMap['العزم'] || keyValueMap['عزم الدوران'] || keyValueMap['نيوتن']
  if (torqueValue) {
    let cleanTorque = toNumOrNull(torqueValue, 5)
    if (cleanTorque !== null && cleanTorque > 15000) cleanTorque = 15000
    form.value.torque = cleanTorque === null ? '' : cleanTorque
    matchedCount++
    extractedDetails.push(`Torque: ${form.value.torque}`)
  } else {
    const torqueMatch = text.match(/\b(\d+)\s*(?:nm|نيوتن|عزم|torque)/i)
    if (torqueMatch) {
      let cleanTorque = toNumOrNull(torqueMatch[1], 5)
      if (cleanTorque !== null && cleanTorque > 15000) cleanTorque = 15000
      form.value.torque = cleanTorque === null ? '' : cleanTorque
      matchedCount++
      extractedDetails.push(`Torque: ${form.value.torque} Nm`)
    }
  }

  // 9. Transmission
  let transValue = keyValueMap['transmission'] || keyValueMap['ناقل الحركة'] || keyValueMap['الفتيس'] || keyValueMap['ناقل']
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
  } else {
    if (/اوتوماتيك|auto/i.test(text)) {
      form.value.transmission = 'automatic'
      matchedCount++
      extractedDetails.push('Transmission: Automatic')
    } else if (/مانيوال|يدوي|manual/i.test(text)) {
      form.value.transmission = 'manual'
      matchedCount++
      extractedDetails.push('Transmission: Manual')
    }
  }

  // 10. Fuel Type
  let fuelValue = keyValueMap['fuel type'] || keyValueMap['fuel'] || keyValueMap['نوع الوقود'] || keyValueMap['الوقود']
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
  } else {
    if (/بنزين|petrol|gas/i.test(text)) {
      form.value.fuel_type = 'petrol'
      matchedCount++
      extractedDetails.push('Fuel: Petrol')
    } else if (/ديزل|سولار|diesel/i.test(text)) {
      form.value.fuel_type = 'diesel'
      matchedCount++
      extractedDetails.push('Fuel: Diesel')
    } else if (/كهرباء|electric|ev/i.test(text)) {
      form.value.fuel_type = 'electric'
      matchedCount++
      extractedDetails.push('Fuel: Electric')
    } else if (/هايبرد|هجين|hybrid/i.test(text)) {
      form.value.fuel_type = 'hybrid'
      matchedCount++
      extractedDetails.push('Fuel: Hybrid')
    }
  }

  // 11. Condition
  let condValue = keyValueMap['condition'] || keyValueMap['الحالة'] || keyValueMap['حالة السيارة']
  if (condValue) {
    const cLower = condValue.toLowerCase()
    if (cLower.includes('new') || cLower.includes('جديد') || cLower.includes('زيرو')) {
      form.value.condition = 'new'
      matchedCount++
      extractedDetails.push('Condition: New')
    } else if (cLower.includes('used') || cLower.includes('مستعمل')) {
      form.value.condition = 'used'
      matchedCount++
      extractedDetails.push('Condition: Used')
    }
  } else {
    if (/جديد|زيرو|new/i.test(text)) {
      form.value.condition = 'new'
      matchedCount++
      extractedDetails.push('Condition: New')
    } else if (/مستعمل|used/i.test(text)) {
      form.value.condition = 'used'
      matchedCount++
      extractedDetails.push('Condition: Used')
    }
  }

  // 12. Drivetrain
  let driveValue = keyValueMap['drivetrain'] || keyValueMap['نظام الدفع'] || keyValueMap['الدفع']
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
  } else {
    if (/جر أمامي|أمامي|fwd/i.test(text)) {
      form.value.drivetrain = 'fwd'
      matchedCount++
      extractedDetails.push('Drivetrain: FWD')
    } else if (/دفع خلفي|خلفي|rwd/i.test(text)) {
      form.value.drivetrain = 'rwd'
      matchedCount++
      extractedDetails.push('Drivetrain: RWD')
    } else if (/دفع رباعي|رباعي|awd|4wd/i.test(text)) {
      form.value.drivetrain = 'awd'
      matchedCount++
      extractedDetails.push('Drivetrain: AWD/4WD')
    }
  }

  // 13. Color
  let colorValue = keyValueMap['color'] || keyValueMap['اللون'] || keyValueMap['لون']
  if (colorValue) {
    const matchedColor = commonColors.find(c => c.name.toLowerCase() === colorValue.toLowerCase())
    if (matchedColor) {
      form.value.color = matchedColor.hex
      matchedCount++
      extractedDetails.push(`Color: ${matchedColor.name}`)
    } else if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
      form.value.color = colorValue
      matchedCount++
      extractedDetails.push(`Color: ${colorValue}`)
    }
  }

  // 14. Title Arabic
  let titleArValue = keyValueMap['title arabic'] || keyValueMap['title ar'] || keyValueMap['العنوان العربي'] || keyValueMap['الاسم العربي']
  if (titleArValue) {
    form.value.title_ar = titleArValue.slice(0, 150)
    matchedCount++
    extractedDetails.push('Title Arabic Matched')
  }

  // 15. Title English
  let titleEnValue = keyValueMap['title english'] || keyValueMap['title en'] || keyValueMap['العنوان الانجليزي'] || keyValueMap['الاسم الانجليزي']
  if (titleEnValue) {
    form.value.title_en = titleEnValue.slice(0, 150)
    matchedCount++
    extractedDetails.push('Title English Matched')
  }

  // 16. Description Arabic
  let descArValue = keyValueMap['description arabic'] || keyValueMap['description ar'] || keyValueMap['الوصف العربي']
  if (descArValue) {
    form.value.description_ar = descArValue.slice(0, 2000)
    matchedCount++
    extractedDetails.push('Description Arabic Matched')
  }

  // 17. Description English
  let descEnValue = keyValueMap['description english'] || keyValueMap['description en'] || keyValueMap['الوصف الانجليزي']
  if (descEnValue) {
    form.value.description_en = descEnValue.slice(0, 2000)
    matchedCount++
    extractedDetails.push('Description English Matched')
  }

  // 18. Country & City Match
  let countryValue = keyValueMap['country'] || keyValueMap['البلد'] || keyValueMap['الدولة'] || keyValueMap['بلد'] || keyValueMap['دولة']
  let cityValue = keyValueMap['city'] || keyValueMap['المدينة'] || keyValueMap['مدينة'] || keyValueMap['المحافظة']

  let matchedCountry = null
  if (countryValue) {
    matchedCountry = countries.value.find(c => {
      const nameEn = String(c.name?.en ?? c.name ?? '').toLowerCase()
      const nameAr = String(c.name?.ar ?? c.name ?? '').toLowerCase()
      const search = countryValue.toLowerCase().trim()
      return nameEn === search || nameAr === search || nameEn.includes(search) || nameAr.includes(search)
    })
  } else {
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
    
    await loadCities()
    if (cities.value.length) {
      let matchedCity = null
      if (cityValue) {
        const search = cityValue.toLowerCase().trim()
        matchedCity = cities.value.find(c => {
          const nameEn = String(c.name?.en ?? c.name ?? '').toLowerCase()
          const nameAr = String(c.name?.ar ?? c.name ?? '').toLowerCase()
          return nameEn === search || nameAr === search || nameEn.includes(search) || nameAr.includes(search)
        })
      } else {
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

  // 19. Phone Number
  let phoneValue = keyValueMap['phone'] || keyValueMap['phone number'] || keyValueMap['تليفون'] || keyValueMap['الهاتف'] || keyValueMap['رقم الهاتف'] || keyValueMap['الجوال'] || keyValueMap['موبايل'] || keyValueMap['رقم الموبايل'] || keyValueMap['رقم التليفون']
  if (phoneValue) {
    const cleanPhone = phoneValue.replace(/[^\d+]/g, '')
    form.value.phone_number = cleanPhone
    matchedCount++
    extractedDetails.push(`Phone: ${cleanPhone}`)
  } else {
    const phoneMatch = text.match(/\b(01[0-25]\d{8}|002\d{10}|\+20\d{10})\b/)
    if (phoneMatch) {
      form.value.phone_number = phoneMatch[1]
      matchedCount++
      extractedDetails.push(`Phone: ${phoneMatch[1]}`)
    }
  }

  // 20. WhatsApp Number
  let whatsappValue = keyValueMap['whatsapp'] || keyValueMap['whatsapp number'] || keyValueMap['واتساب'] || keyValueMap['رقم الواتساب']
  if (whatsappValue) {
    const cleanWa = whatsappValue.replace(/[^\d+]/g, '')
    form.value.whatsapp_number = cleanWa
    matchedCount++
    extractedDetails.push(`WhatsApp: ${cleanWa}`)
  } else {
    const waMatch = text.match(/\b(01[0-25]\d{8}|002\d{10}|\+20\d{10})\b/g)
    if (waMatch && waMatch.length > 0) {
      const num = waMatch[waMatch.length - 1]
      form.value.whatsapp_number = num
      matchedCount++
      extractedDetails.push(`WhatsApp: ${num}`)
    }
  }

  // 21. Features / Options Match
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
  loading.value = true
  try {
    const results = await Promise.allSettled([
      sellerAdminApi.getAll(),
      brandAdminApi.getAll(),
      featureAdminApi.getAll(),
      countryAdminApi.getAll()
    ])

    if (results[0].status === 'fulfilled') sellers.value = results[0].value.data.data
    if (results[1].status === 'fulfilled') brands.value = results[1].value.data.data
    if (results[2].status === 'fulfilled') features.value = results[2].value.data.data
    if (results[3].status === 'fulfilled') countries.value = results[3].value.data.data

    // Log errors for failed requests
    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        console.error(`Request ${i} failed:`, res.reason)
      }
    })
  } catch (err) {
    console.error('Initial data load failed:', err)
  } finally {
    loading.value = false
  }
})

/* ================= Loaders ================= */
const loadModels = async () => {
  form.value.model_id = null
  if (!form.value.brand_id) return

  const res = await modelAdminApi.getAll({ 'filter[brand_id]': form.value.brand_id })
  models.value = res.data.data
  if (models.value.length > 0) {
    focusNext(refModel.value)
  }
}

const loadCities = async () => {
  form.value.city_id = null
  if (!form.value.country_id) return

  const res = await cityAdminApi.getAll({ 'filter[country_id]': form.value.country_id })
  cities.value = res.data.data
  if (cities.value.length > 0) {
    focusNext(refCity.value)
  }
}

/* ================= Images ================= */
const handleImagesChange = files => {
  imagePreviews.value = []
  if (!files) return

  files.forEach((file, index) => {
    imagePreviews.value.push({
      file,
      url: URL.createObjectURL(file),
      index
    })
  })

  if (form.value.main_image === null && files.length) {
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

const setAsMain = (index) => {
  if (index === 0) {
    form.value.main_image = 0
    return
  }

  // 1. Move file in form.images
  const files = [...form.value.images]
  const selectedFile = files[index]
  files.splice(index, 1)
  files.unshift(selectedFile)
  form.value.images = files

  // 2. Move preview in imagePreviews
  const previews = [...imagePreviews.value]
  const selectedPreview = previews[index]
  previews.splice(index, 1)
  previews.unshift(selectedPreview)
  
  // 3. Update indexes in previews to match new positions
  imagePreviews.value = previews.map((p, i) => ({ ...p, index: i }))

  // 4. Main image is now at index 0
  form.value.main_image = 0
}

/* ================= Submit ================= */
const handleSubmit = async () => {
  loading.value = true
  errors.value = {}

  try {
    const formData = new FormData()

    Object.entries(form.value).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images[]', file))
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, v))
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0')
      } else if (value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    await carAdminApi.create(formData)

    snackbarMessage.value = 'Car created successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    setTimeout(() => router.push('/admin/cars'), 1200)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    }

    snackbarMessage.value = err.response?.data?.message || 'Failed to create car'
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
                @update:modelValue="focusNext(refSeller.value)"
              />
            </VCol>

            <VCol cols="12">
              <VAutocomplete
                ref="refSeller"
                v-model="form.seller_id"
                :items="sellers"
                item-title="name"
                item-value="id"
                label="Seller"
                prepend-inner-icon="tabler-user"
                variant="outlined"
                :error="!!fieldError('seller_id').length"
                :error-messages="fieldError('seller_id')"
                @update:modelValue="focusNext(refBrand.value)"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refBrand"
                v-model="form.brand_id"
                :items="brands"
                :item-title="b => b.name?.en ?? b.name ?? '-'"
                item-value="id"
                label="Brand"
                prepend-inner-icon="tabler-building-factory"
                variant="outlined"
                @update:modelValue="loadModels"
                :error="!!fieldError('brand_id').length"
                :error-messages="fieldError('brand_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refModel"
                v-model="form.model_id"
                :items="models"
                :item-title="m => m.name?.en ?? m.name ?? '-'"
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
            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refCountry"
                v-model="form.country_id"
                :items="countries"
                :item-title="c => c.name.en"
                item-value="id"
                label="Country"
                prepend-inner-icon="tabler-world"
                variant="outlined"
                @update:modelValue="loadCities"
                :error="!!fieldError('country_id').length"
                :error-messages="fieldError('country_id')"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VAutocomplete
                ref="refCity"
                v-model="form.city_id"
                :items="cities"
                :item-title="c => c.name.en"
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

        <!-- ================= Specs & Technical ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Specifications & Technical Details</h3>

          <VRow dense>
            <VCol cols="12" md="4">
              <VTextField
                ref="refPrice"
                v-model="displayPrice"
                label="Price (EG)"
                prepend-inner-icon="tabler-currency-pound"
                :error-messages="fieldError('price')"
                @keypress="isNumberKey"
                maxlength="11"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refYear"
                v-model="displayYear"
                label="Year"
                prepend-inner-icon="tabler-calendar"
                :error-messages="fieldError('year')"
                @keypress="isNumberKey"
                maxlength="4"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refMileage"
                v-model="displayMileage"
                label="Mileage (km)"
                prepend-inner-icon="tabler-road"
                :error-messages="fieldError('mileage')"
                @keypress="isNumberKey"
                maxlength="7"
              />
            </VCol>

            <!-- Technical Specs -->
            <VCol cols="12" md="4">
              <VTextField
                ref="refHorsepower"
                v-model="displayHorsepower"
                label="Horsepower (HP)"
                prepend-inner-icon="tabler-engine"
                :error-messages="fieldError('horsepower')"
                @keypress="isNumberKey"
                maxlength="4"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VTextField
                ref="refTorque"
                v-model="displayTorque"
                label="Torque (Nm)"
                prepend-inner-icon="tabler-settings-automation"
                :error-messages="fieldError('torque')"
                @keypress="isNumberKey"
                maxlength="5"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VCombobox
                ref="refEngineCapacity"
                v-model="displayEngineCapacity"
                :items="engineCapacityOptions"
                item-title="title"
                item-value="value"
                :return-object="false"
                label="Engine Capacity / السعة اللترية"
                prepend-inner-icon="tabler-piston"
                variant="outlined"
                maxlength="4"
                :error-messages="fieldError('engine_capacity')"
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

            <!-- Mechanical Options -->
            <VCol cols="12" md="3">
              <VSelect
                ref="refTransmission"
                v-model="form.transmission"
                :items="[
                  { title: 'Automatic', value: 'automatic' },
                  { title: 'Manual', value: 'manual' }
                ]"
                label="Transmission"
                prepend-inner-icon="tabler-manual-gearbox"
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
                prepend-inner-icon="tabler-gas-station"
                @update:modelValue="focusNext(refDrivetrain.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refDrivetrain"
                v-model="form.drivetrain"
                :items="[
                  { title: 'FWD (Front Wheel)', value: 'fwd' },
                  { title: 'RWD (Rear Wheel)', value: 'rwd' },
                  { title: 'AWD (All Wheel)', value: 'awd' },
                  { title: '4WD (4x4)', value: '4wd' }
                ]"
                label="Drivetrain"
                prepend-inner-icon="tabler-binary-tree"
                @update:modelValue="focusNext(refCondition.value)"
              />
            </VCol>

            <VCol cols="12" md="3">
              <VSelect
                ref="refCondition"
                v-model="form.condition"
                :items="[
                  { title: 'New', value: 'new' },
                  { title: 'Used', value: 'used' }
                ]"
                label="Condition"
                prepend-inner-icon="tabler-refresh"
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

        <!-- ================= Contact Information ================= -->
        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">Contact Information</h3>

          <VRow dense>
            <VCol cols="12" md="6">
              <VTextField
                v-model="form.phone_number"
                label="Phone Number for Calls"
                prepend-inner-icon="tabler-phone"
                :error-messages="fieldError('phone_number')"
                maxlength="20"
                @input="() => { if(form.is_whatsapp_same) form.whatsapp_number = form.phone_number }"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="form.whatsapp_number"
                label="WhatsApp Number"
                prepend-inner-icon="tabler-brand-whatsapp"
                :error-messages="fieldError('whatsapp_number')"
                maxlength="20"
                :disabled="form.is_whatsapp_same"
              />
            </VCol>

            <VCol cols="12">
              <VCheckbox
                v-model="form.is_whatsapp_same"
                label="WhatsApp number is the same as call number"
                hide-details
                @change="() => { if(form.is_whatsapp_same) form.whatsapp_number = form.phone_number }"
              />
            </VCol>
          </VRow>
        </section>

        <section class="mb-10">
          <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
            <VIcon icon="tabler-bolt" class="me-2" color="primary" />
            Ad Placement & Promotion
          </h3>

          <VCard variant="outlined" class="pa-6 rounded-lg bg-surface-variant-opacity">
            <VRow>
              <VCol cols="12" md="6">
                <div class="text-subtitle-2 font-weight-bold mb-3">Visibility Toggles</div>
                <VSwitch v-model="form.show_on_home" label="Show on Homepage Hero" color="primary" inset />
                <VSwitch v-model="form.is_featured" label="Mark as Featured" color="warning" inset />
                <VSwitch v-model="form.is_best_deal" label="Best Deal Badge" color="error" inset />
                <VSwitch v-model="form.is_import" label="Import Cars Section" color="info" inset />
                <VSwitch v-model="form.is_global_ad" label="Global Ad (All Pages)" color="secondary" inset />
              </VCol>

              <VCol cols="12" v-if="form.is_featured || form.is_global_ad">
                <div class="text-subtitle-2 font-weight-bold mb-3">Ad Details</div>
                <VTextField
                  v-model="form.ad_expiry"
                  label="Ad Expiry Date"
                  type="date"
                  prepend-inner-icon="tabler-calendar-off"
                  variant="outlined"
                  class="mb-4"
                />
              </VCol>
            </VRow>
          </VCard>
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
                @click="setAsMain(img.index)"
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
