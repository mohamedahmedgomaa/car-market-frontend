<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import carFeatureAdminApi from '../api/admin/carFeatureAdminApi.js'
import carFeatureSellerApi from '../api/seller/carFeatureSellerApi.js'
import carFeatureUserApi from '../api/user/carFeatureUserApi.js'
import { predefinedFeatures } from '../utils/predefinedFeatures.js'

const { locale } = useI18n({ useScope: 'global' })

const isAdmin = computed(() => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin') && !!localStorage.getItem('admin_token')
})

const getFeatureApi = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller')) {
    return carFeatureSellerApi
  }
  return carFeatureAdminApi
}

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  featuresList: {
    type: Array,
    default: () => []
  },
  errorMessages: {
    type: [Array, String],
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'feature-created'])

// Selected feature IDs
const selectedIds = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

// UI state
const dialog = ref(false)
const loadingFeatures = ref(false)
const internalFeaturesList = ref([])
const pasteText = ref('')
const bulkDialog = ref(false)
const missingFeatures = ref([])
const isCreatingFeatures = ref(false)
const filterQuery = ref('')

const activeFeaturesList = computed(() => {
  if (props.featuresList && props.featuresList.length > 0) {
    return props.featuresList
  }
  return internalFeaturesList.value
})

const openDialog = async () => {
  dialog.value = true
  loadingFeatures.value = true
  try {
    const res = await carFeatureUserApi.getAll()
    internalFeaturesList.value = res.data?.data || []
    await resolveHighlights()
  } catch (e) {
    console.error('Failed to load features:', e)
  } finally {
    loadingFeatures.value = false
  }
}

// ================= Highlights Configuration =================
const HIGHLIGHT_DEFINITIONS = [
  { ar: 'استيراد الخارج', en: 'Imported', match: ['استيراد الخارج', 'imported', 'وارد الخارج'] },
  { ar: 'ذوي الهمم', en: 'People of Determination', match: ['ذوي الهمم', 'people of determination', 'معاقين'] },
  { ar: 'حوادث', en: 'Accident History', match: ['حوادث', 'accident history', 'حادث', 'accident'] },
  { ar: 'تاكسي (أجرة)', en: 'Taxi', match: ['تاكسي', 'taxi', 'أجرة', 'اجره'] },
  { ar: 'كسر زيرو', en: 'Like New (Mint)', match: ['كسر زيرو', 'like new', 'mint', 'زيرو'] },
  { ar: 'فابريكا بالكامل', en: 'Original Paint', match: ['فابريكا بالكامل', 'original paint', 'فابريكا', 'فبريكا'] },
  { ar: 'بدون دهان تماماً', en: 'No Paint', match: ['بدون دهان', 'بدون دهان تماماً', 'no paint', 'فابريكا بره وجوه'] },
  { ar: 'قابلة للبدل', en: 'Exchangeable', match: ['قابلة للبدل', 'exchangeable', 'بدل', 'exchange'] },
  { ar: 'تكملة أقساط', en: 'Installment Continuation', match: ['تكملة أقساط', 'tkmlet aqsat', 'تكملة اقساط', 'أقساط', 'اقساط'] },
  { ar: 'تجاري (فان، أتوبيس)', en: 'Commercial (Van/Bus)', match: ['تجاري', 'commercial', 'فان', 'اتوبيس', 'أتوبيس'] },
  { ar: 'في الضمان', en: 'Under Warranty', match: ['في الضمان', 'under warranty', 'ضمان', 'الضمان', 'warranty'] },
  { ar: 'صيانات توكيل', en: 'Dealer Maintained', match: ['صيانات توكيل', 'dealer maintained', 'صيانة توكيل', 'توكيل'] },
  { ar: 'أول مالك', en: 'First Owner', match: ['أول مالك', 'first owner', 'اول مالك'] },
  { ar: 'رخصة باسم البائع', en: 'License in Seller\'s Name', match: ['رخصة باسم البائع', 'license in seller', 'رخصة باسمي', 'رخصه باسم البائع'] },
  { ar: 'مفتاحين الوكالة', en: 'Two Factory Keys', match: ['مفتاحين الوكالة', 'two factory keys', 'مفتاحين توكيل', 'مفتاحين الفبركة'] },
  { ar: 'كتالوجات الوكالة', en: 'Agency Manuals', match: ['كتالوجات الوكالة', 'agency manuals', 'كتالوجات السيارة', 'كتالوجات الوكاله'] },
  { ar: 'مفتاح ذكي (بصمة)', en: 'Smart Key (Push Start)', match: ['مفتاح ذكي', 'smart key', 'بصمة تشغيل', 'بصمه'] },
  { ar: 'فرش جلد طبيعي', en: 'Genuine Leather Seats', match: ['فرش جلد طبيعي', 'leather seats', 'فرش جلد'] },
  { ar: 'شاحن توربيني (Turbo)', en: 'Turbocharged', match: ['شاحن توربو', 'turbo', 'توربيني', 'توربو'] },
  { ar: 'إطارات جديدة', en: 'New Tires', match: ['إطارات جديدة', 'new tires', 'كاوتش جديد', 'اطارات جديدة'] },
  { ar: 'تيل فرامل جديد', en: 'New Brake Pads', match: ['تيل فرامل جديد', 'new brake pads', 'تيل جديد'] },
  { ar: 'بطارية جديدة', en: 'New Battery', match: ['بطارية جديدة', 'new battery', 'بطاريه جديده'] },
  { ar: 'صيانة حديثة', en: 'Recent Service', match: ['صيانة حديثة', 'recent service', 'سيرفيس كامل'] },
  { ar: 'فيلم حماية', en: 'Protection Film (PPF)', match: ['فيلم حماية', 'protection film', 'ppf', 'فيلم حمايه', 'حماية'] },
  { ar: 'نانو سيراميك', en: 'Nano Ceramic', match: ['نانو سيراميك', 'nano ceramic', 'نانو'] }
]

const resolvedHighlights = ref([])

const resolveHighlights = async () => {
  const list = []
  const source = activeFeaturesList.value
  if (!source || !source.length) return

  for (const def of HIGHLIGHT_DEFINITIONS) {
    let dbFeature = source.find(f => {
      const en = (f.name?.en || f.name || '').toLowerCase().trim()
      const ar = (f.name?.ar || f.name || '').toLowerCase().trim()
      return def.match.some(m => {
        const cleanM = m.toLowerCase().trim()
        return en === cleanM || ar === cleanM || 
               en.startsWith(cleanM) || ar.startsWith(cleanM)
      })
    })

    if (!dbFeature && isAdmin.value) {
      try {
        const formData = new FormData()
        formData.append('name_en', def.en)
        formData.append('name_ar', def.ar)
        formData.append('is_verified', '1')
        
        const res = await getFeatureApi().create(formData)
        dbFeature = res.data?.data ?? res.data
        if (dbFeature) {
          emit('feature-created', dbFeature)
        }
      } catch (err) {
        console.error('Failed to auto-create highlight feature:', def.en, err)
      }
    }

    if (dbFeature) {
      list.push({
        definition: def,
        feature: dbFeature
      })
    }
  }
  resolvedHighlights.value = list
}

watch(activeFeaturesList, () => {
  resolveHighlights()
}, { immediate: true })

const highlightIds = computed(() => resolvedHighlights.value.map(h => h.feature.id))

const standardFeaturesList = computed(() => {
  return activeFeaturesList.value.filter(f => !highlightIds.value.includes(f.id))
})

const filteredFeatures = computed(() => {
  if (!filterQuery.value) return standardFeaturesList.value
  const query = filterQuery.value.toLowerCase()
  return standardFeaturesList.value.filter(f => {
    const enName = (f.name?.en || f.name || '').toLowerCase()
    const arName = (f.name?.ar || f.name || '').toLowerCase()
    return enName.includes(query) || arName.includes(query)
  })
})

const toggleFeature = (id) => {
  const current = [...selectedIds.value]
  const idx = current.indexOf(id)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(id)
  }
  selectedIds.value = current
}

const selectAll = () => {
  const allIds = activeFeaturesList.value.map(f => f.id)
  const combined = Array.from(new Set([...selectedIds.value, ...allIds]))
  selectedIds.value = combined
}

const deselectAll = () => {
  selectedIds.value = []
}

// Bulk paste support
const handleBulkPaste = () => {
  if (!pasteText.value.trim()) return

  const items = pasteText.value
    .split(/[,;\n\t]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)

  const newlySelected = [...selectedIds.value]
  const tempMissing = []

  items.forEach(item => {
    const found = activeFeaturesList.value.find(f => {
      const en = (f.name?.en || f.name || '').toLowerCase()
      const ar = (f.name?.ar || f.name || '').toLowerCase()
      const target = item.toLowerCase()
      return en === target || ar === target
    })

    if (found) {
      if (!newlySelected.includes(found.id)) {
        newlySelected.push(found.id)
      }
      return
    }

    const target = item.toLowerCase().replace(/[—\-–•*]/g, '').trim()
    const dictFound = predefinedFeatures.find(df => {
      return df.aliases.some(alias => target === alias || target.includes(alias) || alias.includes(target)) ||
             df.en.toLowerCase().includes(target) ||
             df.ar.includes(target)
    })

    if (dictFound) {
      const alreadyInDb = activeFeaturesList.value.find(f => {
        const en = (f.name?.en || f.name || '').toLowerCase()
        const ar = (f.name?.ar || f.name || '').toLowerCase()
        return en === dictFound.en.toLowerCase() || ar === dictFound.ar.toLowerCase()
      })

      if (alreadyInDb) {
        if (!newlySelected.includes(alreadyInDb.id)) {
          newlySelected.push(alreadyInDb.id)
        }
      } else {
        const isAlreadyMissing = tempMissing.some(m => m.name_en === dictFound.en)
        if (!isAlreadyMissing) {
          tempMissing.push({
            name: `${dictFound.en} — ${dictFound.ar}`,
            name_en: dictFound.en,
            name_ar: dictFound.ar,
            error: ''
          })
        }
      }
    }
  })

  selectedIds.value = newlySelected
  missingFeatures.value = [...missingFeatures.value, ...tempMissing]
  pasteText.value = ''
  bulkDialog.value = false
}

const getFeatureName = (f) => {
  if (!f) return ''
  const currentLocale = locale.value || 'ar'
  if (typeof f.name === 'string') {
    try {
      const parsed = JSON.parse(f.name)
      return parsed[currentLocale] || parsed.ar || parsed.en || f.name
    } catch (e) {
      return f.name
    }
  }
  return f.name?.[currentLocale] || f.name?.ar || f.name?.en || f.name || ''
}

// Preview list for the trigger card
const previewSelectedFeatures = computed(() => {
  if (!selectedIds.value.length) return []
  return selectedIds.value.map(id => {
    const f = activeFeaturesList.value.find(item => item.id === id)
    return {
      id,
      name: f ? getFeatureName(f) : `ميزة #${id}`
    }
  })
})
</script>

<template>
  <div class="features-manager-widget">
    <!-- ===== Normal Standard Card on Page (Not Circular) ===== -->
    <div class="features-summary-card pa-5 rounded-lg border">
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <!-- Title & Status -->
        <div class="d-flex align-center gap-3">
          <div class="features-icon-badge d-flex align-center justify-center">
            <VIcon icon="tabler-sparkles" size="26" color="primary" />
          </div>
          <div>
            <div class="d-flex align-center gap-2 flex-wrap mb-1">
              <span class="text-h6 font-weight-bold text-high-emphasis">
                المواصفات والكماليات (Car Features & Specs)
              </span>
              <VChip
                :color="selectedIds.length ? 'success' : 'warning'"
                size="small"
                variant="flat"
                class="font-weight-bold px-2.5"
              >
                {{ selectedIds.length ? `✓ تم تحديد ${selectedIds.length} ميزة` : '⚠️ لم يتم التحديد بعد' }}
              </VChip>
            </div>
            <p class="text-sm text-medium-emphasis mb-0">
              حدد أنظمة الأمان والراحة والكماليات المتاحة في هذه السيارة لجذب المشترين وتسهيل ظهور الإعلان في نتائج البحث.
            </p>
          </div>
        </div>

        <!-- Action Button -->
        <VBtn
          color="primary"
          size="large"
          prepend-icon="tabler-adjustments-horizontal"
          class="features-open-btn font-weight-bold px-6 elevation-2"
          @click="openDialog"
        >
          {{ selectedIds.length ? `تعديل المميزات (${selectedIds.length} ميزة)` : '+ اختيار مواصفات وتجهيزات السيارة' }}
        </VBtn>
      </div>

      <!-- Selected Chips Strip -->
      <div v-if="selectedIds.length > 0" class="mt-4 pt-3 border-t">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-xs font-weight-bold text-high-emphasis">
            المواصفات المختارة حالياً: <span class="text-primary font-weight-black">({{ selectedIds.length }} مواصفة)</span>
          </div>
          <VBtn variant="text" size="x-small" color="secondary" @click="deselectAll">
            مسح الكل
          </VBtn>
        </div>

        <div v-if="activeFeaturesList.length > 0" class="d-flex flex-wrap gap-1.5 align-center">
          <VChip
            v-for="item in previewSelectedFeatures.slice(0, 12)"
            :key="item.id"
            size="small"
            color="primary"
            variant="tonal"
            closable
            class="font-weight-medium"
            @click:close="toggleFeature(item.id)"
          >
            {{ item.name }}
          </VChip>

          <VChip
            v-if="selectedIds.length > 12"
            size="small"
            color="secondary"
            variant="flat"
            class="cursor-pointer font-weight-bold"
            @click="openDialog"
          >
            + {{ selectedIds.length - 12 }} ميزة أخرى (عرض الكل)...
          </VChip>
        </div>

        <!-- Fallback count display before modal has been opened -->
        <div v-else class="d-flex align-center gap-2 text-xs text-medium-emphasis">
          <VChip size="small" color="primary" variant="tonal" class="font-weight-bold">
            {{ selectedIds.length }} مواصفة محفوظة
          </VChip>
          <span>(انقر على الزر أعلاه لتحميل أسمائها وقائمتها الكاملة)</span>
        </div>
      </div>

      <!-- Empty State Clear Instructions -->
      <div v-else class="mt-3 pt-3 border-t d-flex align-center gap-2 text-xs text-medium-emphasis">
        <VIcon icon="tabler-info-circle" size="18" color="warning" />
        <span>انقر على زر <b>«اختيار مواصفات وتجهيزات السيارة»</b> لفتح النافذة المنبثقة الشاملة وتحديد التجهيزات بضغطة زر.</span>
      </div>
    </div>

    <!-- ===== Full Features Selection Dialog (Modal) ===== -->
    <VDialog v-model="dialog" max-width="950" scrollable>
      <VCard class="rounded-2xl overflow-hidden features-dialog-card">
        <!-- Dialog Header -->
        <VCardTitle class="d-flex align-center justify-space-between pa-4 bg-surface border-b">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-sparkles" color="primary" size="22" />
            <span class="font-weight-black text-h6">تحديد مواصفات ومميزات السيارة</span>
            <VChip color="primary" size="small" variant="flat" class="font-weight-bold ms-2">
              {{ selectedIds.length }} محددة
            </VChip>
          </div>
          <VBtn icon="tabler-x" variant="text" size="small" @click="dialog = false" />
        </VCardTitle>

        <!-- Dialog Body -->
        <VCardText class="pa-5" style="max-height: 70vh;">
          <!-- Loading State -->
          <div v-if="loadingFeatures" class="text-center py-10">
            <VProgressCircular indeterminate color="primary" size="48" />
            <div class="mt-3 text-sm text-medium-emphasis">جاري تحميل قائمة المواصفات والمميزات...</div>
          </div>

          <div v-else>
            <!-- Toolbar: Search & Action buttons -->
            <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
              <VTextField
                v-model="filterQuery"
                density="compact"
                placeholder="ابحث في المواصفات والمميزات (Search features)..."
                prepend-inner-icon="tabler-search"
                variant="outlined"
                hide-details
                clearable
                style="min-width: 260px; max-width: 380px;"
              />

              <div class="d-flex align-center gap-2 flex-wrap">
                <VBtn variant="tonal" size="small" color="primary" prepend-icon="tabler-check-all" @click="selectAll">
                  تحديد الكل
                </VBtn>
                <VBtn variant="tonal" size="small" color="secondary" prepend-icon="tabler-x" @click="deselectAll">
                  إلغاء التحديد
                </VBtn>
                <VBtn variant="flat" size="small" color="primary" prepend-icon="tabler-clipboard-text" @click="bulkDialog = true">
                  لصق نصوص (Bulk)
                </VBtn>
              </div>
            </div>

            <!-- Section 1: Additional Equipment & Highlights -->
            <div v-if="resolvedHighlights.length" class="mb-5">
              <div class="text-subtitle-2 font-weight-bold text-high-emphasis mb-2 d-flex align-center gap-1.5">
                <VIcon icon="tabler-star" color="warning" size="18" />
                <span>المواصفات والتجهيزات البارزة (Equipment Highlights)</span>
              </div>

              <div class="highlights-grid">
                <div
                  v-for="h in resolvedHighlights"
                  :key="h.feature.id"
                  class="highlight-card"
                  :class="{ 'active': selectedIds.includes(h.feature.id) }"
                  @click="toggleFeature(h.feature.id)"
                >
                  <div class="highlight-check">
                    <VIcon v-if="selectedIds.includes(h.feature.id)" icon="tabler-check" size="13" color="white" />
                  </div>
                  <span class="highlight-title">{{ getFeatureName(h.feature) }}</span>
                </div>
              </div>
            </div>

            <VDivider class="my-4" />

            <!-- Section 2: Standard Features -->
            <div>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-subtitle-2 font-weight-bold text-high-emphasis d-flex align-center gap-1.5">
                  <VIcon icon="tabler-list-check" color="primary" size="18" />
                  <span>كافة المميزات والمواصفات القياسية (Standard Features)</span>
                </div>
                <div class="text-xs text-medium-emphasis">
                  {{ filteredFeatures.length }} ميزة متاحة
                </div>
              </div>

              <div class="standard-features-grid">
                <div
                  v-for="f in filteredFeatures"
                  :key="f.id"
                  class="feature-chip-card"
                  :class="{ 'active': selectedIds.includes(f.id) }"
                  @click="toggleFeature(f.id)"
                >
                  <VIcon
                    :icon="selectedIds.includes(f.id) ? 'tabler-circle-check-filled' : 'tabler-circle'"
                    size="16"
                    :color="selectedIds.includes(f.id) ? 'primary' : 'medium-emphasis'"
                    class="me-1.5"
                  />
                  <span>{{ getFeatureName(f) }}</span>
                </div>
              </div>
            </div>
          </div>
        </VCardText>

        <!-- Dialog Footer -->
        <VCardActions class="pa-4 bg-surface border-t d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="text-sm font-weight-medium">
            تم تحديد <b class="text-primary">{{ selectedIds.length }}</b> ميزة من أصل {{ activeFeaturesList.length }}
          </div>
          <div class="d-flex align-center gap-2">
            <VBtn variant="tonal" color="secondary" @click="dialog = false">إلغاء</VBtn>
            <VBtn color="primary" class="font-weight-bold px-6" prepend-icon="tabler-check" @click="dialog = false">
              تأكيد وحفظ
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Paste Modal -->
    <VDialog v-model="bulkDialog" max-width="500">
      <VCard class="pa-4 rounded-xl">
        <VCardTitle class="text-h6 font-weight-bold">لصق قائمة مميزات سريعة</VCardTitle>
        <VCardText>
          <p class="text-caption text-medium-emphasis mb-2">
            انسخ المميزات من أي موقع أو ملف والصقها هنا مفصولة بفواصل أو أسطر جديدة:
          </p>
          <VTextarea
            v-model="pasteText"
            placeholder="فتحة سقف، حساسات خلفية، كاميرا 360، مقاعد جلد، شاشة ملاحة..."
            rows="5"
            variant="outlined"
          />
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="tonal" @click="bulkDialog = false">إلغاء</VBtn>
          <VBtn color="primary" @click="handleBulkPaste">استخراج وتحديد</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.features-summary-card {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(255, 107, 0, 0.25) !important;
  border-radius: 10px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: border-color 0.2s ease;
}

.features-summary-card:hover {
  border-color: rgba(255, 107, 0, 0.45) !important;
}

.features-icon-badge {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: rgba(255, 107, 0, 0.14);
  border: 1px solid rgba(255, 107, 0, 0.25);
  flex-shrink: 0;
}

.features-open-btn {
  background: linear-gradient(135deg, #ff7a00 0%, #ff5200 100%) !important;
  box-shadow: 0 4px 15px rgba(255, 107, 0, 0.35) !important;
  letter-spacing: normal;
  border-radius: 8px !important;
}

.features-open-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 107, 0, 0.5) !important;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.highlight-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.highlight-card:hover {
  border-color: rgba(255, 107, 0, 0.4);
  background: rgba(255, 107, 0, 0.05);
}

.highlight-card.active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(255, 107, 0, 0.12);
}

.highlight-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.highlight-card.active .highlight-check {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.highlight-title {
  font-size: 0.8rem;
  font-weight: 600;
}

.standard-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 6px;
}

.feature-chip-card {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.feature-chip-card:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.feature-chip-card.active {
  background: rgba(255, 107, 0, 0.1);
  border-color: rgba(255, 107, 0, 0.35);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
