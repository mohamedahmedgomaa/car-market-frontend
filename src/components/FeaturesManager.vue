<script setup>
import { ref, computed, watch } from 'vue'
import carFeatureAdminApi from '../api/admin/carFeatureAdminApi.js'
import { predefinedFeatures } from '../utils/predefinedFeatures.js'

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
const pasteText = ref('')
const bulkDialog = ref(false)
const missingFeatures = ref([]) // Features pasted but not in the database
const isCreatingFeatures = ref(false)
const filterQuery = ref('')
const isCollapsed = ref(true)

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
  for (const def of HIGHLIGHT_DEFINITIONS) {
    // Strict match logic to prevent incorrect matches
    let dbFeature = props.featuresList.find(f => {
      const en = (f.name?.en || f.name || '').toLowerCase().trim()
      const ar = (f.name?.ar || f.name || '').toLowerCase().trim()
      return def.match.some(m => {
        const cleanM = m.toLowerCase().trim()
        return en === cleanM || ar === cleanM || 
               en.startsWith(cleanM) || ar.startsWith(cleanM)
      })
    })

    if (!dbFeature) {
      try {
        const formData = new FormData()
        formData.append('name_en', def.en)
        formData.append('name_ar', def.ar)
        formData.append('is_verified', '1')
        
        const res = await carFeatureAdminApi.create(formData)
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

watch(() => props.featuresList, (newList) => {
  if (newList && newList.length > 0) {
    resolveHighlights()
  }
}, { immediate: true })

const highlightIds = computed(() => resolvedHighlights.value.map(h => h.feature.id))

const standardFeaturesList = computed(() => {
  return props.featuresList.filter(f => !highlightIds.value.includes(f.id))
})

// Computed properties for features
const filteredFeatures = computed(() => {
  if (!filterQuery.value) return standardFeaturesList.value
  const query = filterQuery.value.toLowerCase()
  return standardFeaturesList.value.filter(f => {
    const enName = (f.name?.en || f.name || '').toLowerCase()
    const arName = (f.name?.ar || f.name || '').toLowerCase()
    return enName.includes(query) || arName.includes(query)
  })
})

// Toggle a single feature selection
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

// Select All / Deselect All
const selectAll = () => {
  selectedIds.value = props.featuresList.map(f => f.id)
}

const deselectAll = () => {
  selectedIds.value = []
}

// Parse pasted text (comma, newline, or tab separated)
const handleBulkPaste = () => {
  if (!pasteText.value.trim()) return

  // Split by comma, semicolon, newline, or tab
  const items = pasteText.value
    .split(/[,;\n\t]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)

  const newlySelected = [...selectedIds.value]
  const tempMissing = []

  items.forEach(item => {
    // 1. Search case-insensitively in existing loaded features list
    const found = props.featuresList.find(f => {
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

    // 2. Search in predefinedFeatures dictionary
    const target = item.toLowerCase().replace(/[—\-–•*]/g, '').trim()
    const dictFound = predefinedFeatures.find(df => {
      return df.aliases.some(alias => target === alias || target.includes(alias) || alias.includes(target)) ||
             df.en.toLowerCase().includes(target) ||
             df.ar.includes(target)
    })

    if (dictFound) {
      const alreadyInDb = props.featuresList.find(f => {
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
        const isAlreadyInDbMissing = missingFeatures.value.some(m => m.name_en === dictFound.en)
        if (!isAlreadyMissing && !isAlreadyInDbMissing) {
          tempMissing.push({
            name: `${dictFound.en} — ${dictFound.ar}`,
            name_en: dictFound.en,
            name_ar: dictFound.ar,
            error: ''
          })
        }
      }
    } else {
      // 3. Fallback: completely new unknown feature
      const isAlreadyMissing = tempMissing.some(m => m.name.toLowerCase() === item.toLowerCase())
      const isAlreadyInDbMissing = missingFeatures.value.some(m => m.name.toLowerCase() === item.toLowerCase())
      if (!isAlreadyMissing && !isAlreadyInDbMissing) {
        const isArabic = /[\u0600-\u06FF]/.test(item)
        tempMissing.push({
          name: item,
          name_en: isArabic ? '' : item,
          name_ar: isArabic ? item : '',
          error: ''
        })
      }
    }
  })

  selectedIds.value = newlySelected
  missingFeatures.value = [...missingFeatures.value, ...tempMissing]
  pasteText.value = ''
}

// Create a single missing feature in DB and auto-select it
const createMissingFeature = async (index) => {
  const item = missingFeatures.value[index]
  
  const en = (item.name_en || item.name || '').trim()
  const ar = (item.name_ar || item.name || '').trim()

  if (!en && !ar) {
    item.error = 'Name is required'
    return
  }

  try {
    item.error = ''
    const formData = new FormData()
    formData.append('name_en', en)
    formData.append('name_ar', ar)
    formData.append('is_verified', '1')

    const res = await carFeatureAdminApi.create(formData)
    const newFeature = res.data?.data ?? res.data

    if (newFeature && newFeature.id) {
      emit('feature-created', newFeature)
      
      if (!selectedIds.value.includes(newFeature.id)) {
        selectedIds.value = [...selectedIds.value, newFeature.id]
      }

      missingFeatures.value.splice(index, 1)
    }
  } catch (err) {
    console.error(err)
    item.error = err.response?.data?.message || 'Failed to create feature'
  }
}

// Create all missing features bulk
const createAllMissingFeatures = async () => {
  if (missingFeatures.value.length === 0) return
  isCreatingFeatures.value = true

  const items = [...missingFeatures.value]
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    const en = (item.name_en || item.name || '').trim()
    const ar = (item.name_ar || item.name || '').trim()
    if (!en && !ar) continue

    try {
      const formData = new FormData()
      formData.append('name_en', en)
      formData.append('name_ar', ar)
      formData.append('is_verified', '1')

      const res = await carFeatureAdminApi.create(formData)
      const newFeature = res.data?.data ?? res.data

      if (newFeature && newFeature.id) {
        emit('feature-created', newFeature)
        if (!selectedIds.value.includes(newFeature.id)) {
          selectedIds.value.push(newFeature.id)
        }
        missingFeatures.value.splice(i, 1)
      }
    } catch (err) {
      console.error(`Failed to create feature: ${item.name}`, err)
      item.error = 'Failed to create'
    }
  }

  selectedIds.value = [...selectedIds.value]
  isCreatingFeatures.value = false
}

// Remove from missing list
const removeMissing = (index) => {
  missingFeatures.value.splice(index, 1)
}

// Helper to translate names
const getFeatureName = (f) => {
  if (!f) return ''
  if (typeof f.name === 'string') return f.name
  return f.name?.ar || f.name?.en || f.name || ''
}
</script>

<template>
  <div class="features-manager-card">
    <VCard variant="outlined" class="pa-4 rounded-lg border-opacity-25 bg-surface">
      
      <!-- ================= Section 1: الخصائص الإضافية (Highlights / Additional Specs) ================= -->
      <div class="mb-6">
        <div class="d-flex align-center gap-2 mb-3">
          <VIcon icon="tabler-square-check" color="primary" size="20" />
          <span class="text-subtitle-1 font-weight-bold">خصائص إضافية / Additional Specs</span>
        </div>
        
        <div class="highlights-checkbox-grid">
          <div
            v-for="h in resolvedHighlights"
            :key="h.feature.id"
            class="highlight-checkbox-card"
            :class="{ 'active': selectedIds.includes(h.feature.id) }"
            @click="toggleFeature(h.feature.id)"
          >
            <!-- Custom Premium Checkbox - Smaller size -->
            <div class="checkbox-box">
              <VIcon v-if="selectedIds.includes(h.feature.id)" icon="tabler-check" size="11" color="white" />
            </div>
            <span class="highlight-label">{{ getFeatureName(h.feature) }}</span>
          </div>
        </div>
      </div>

      <VDivider class="my-4" opacity="0.1" />

      <!-- ================= Section 2: تجهيزات وميزات السيارة (Standard Features & Equipment) ================= -->
      <div>
        <!-- Header -->
        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-list-check" color="primary" size="18" />
            <span class="text-caption font-weight-bold">تجهيزات وميزات السيارة / Standard Features</span>
          </div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <VBtn variant="text" size="x-small" color="primary" @click="selectAll">
              Select All / اختيار الكل
            </VBtn>
            <VBtn variant="text" size="x-small" color="secondary" @click="deselectAll">
              Clear / مسح التحديد
            </VBtn>
            <VBtn variant="flat" size="x-small" color="primary" prepend-inner-icon="tabler-plus" @click="bulkDialog = true">
              Bulk Paste / إضافة جماعية
            </VBtn>
          </div>
        </div>

        <!-- Live Search & Tags Info -->
        <VRow dense class="mb-3" align="center">
          <VCol cols="12" md="6" class="d-flex gap-2 align-center">
            <VTextField
              v-model="filterQuery"
              density="compact"
              :placeholder="isCollapsed ? 'Click arrow on right to show list / اضغط على السهم باليمين لعرض القائمة' : 'Search existing options... / ابحث في الخيارات الحالية...'"
              prepend-inner-icon="tabler-search"
              variant="outlined"
              hide-details
              clearable
              class="flex-grow-1 text-caption"
              @click="isCollapsed = false"
            />
            <VBtn
              variant="tonal"
              color="primary"
              icon
              size="x-small"
              @click="isCollapsed = !isCollapsed"
              :title="isCollapsed ? 'Expand / إظهار الخيارات' : 'Collapse / إخفاء الخيارات'"
              :class="{ 'animate-pulse': isCollapsed }"
            >
              <VIcon :icon="isCollapsed ? 'tabler-chevron-down' : 'tabler-chevron-up'" size="16" />
            </VBtn>
          </VCol>
          <VCol cols="12" md="6" class="d-flex align-center justify-end">
            <div class="text-caption font-weight-medium d-flex align-center gap-2">
              <div>
                Selected: <VChip color="primary" size="x-small" class="px-2">{{ selectedIds.filter(id => !highlightIds.includes(id)).length }}</VChip> of {{ standardFeaturesList.length }} options
              </div>
              <div v-if="isCollapsed" class="text-caption text-warning font-weight-bold animate-pulse-text">
                (اضغط السهم لعرض الإضافات ↗)
              </div>
            </div>
          </VCol>
        </VRow>

        <!-- Selection Grid -->
        <VExpandTransition>
          <div v-show="!isCollapsed" class="features-grid-container mb-3">
            <TransitionGroup name="list" tag="div" class="features-chips-grid">
              <div
                v-for="f in filteredFeatures"
                :key="f.id"
                class="feature-toggle-chip"
                :class="{ 'active': selectedIds.includes(f.id) }"
                @click="toggleFeature(f.id)"
              >
                <VIcon
                  :icon="selectedIds.includes(f.id) ? 'tabler-circle-check-filled' : 'tabler-circle'"
                  size="16"
                  class="me-2 chip-icon"
                />
                <span class="chip-text">{{ getFeatureName(f) }}</span>
              </div>
            </TransitionGroup>
            
            <div v-if="filteredFeatures.length === 0" class="text-center py-4 text-muted opacity-70 text-caption">
              No matching features found.
            </div>
          </div>
        </VExpandTransition>

        <!-- YouTube Style Tag Input / Fast Paste Area -->
        <div class="quick-paste-row mt-3 pa-3 rounded bg-surface-variant-opacity border">
          <div class="text-caption font-weight-bold mb-1 d-flex align-center gap-2">
            <VIcon icon="tabler-tags" size="16" color="primary" />
            <span>YouTube Tag Style Paste / كتابة أو لصق سريع للخيارات</span>
          </div>
          <p class="text-caption text-muted mb-2">
            Paste options separated by commas (e.g. <code>Sunroof, Leather Seats, Bluetooth</code>) or write your own. If they exist, they will be selected automatically.
          </p>
          
          <VRow dense align="center">
            <VCol cols="12" sm="10">
              <VTextField
                v-model="pasteText"
                density="compact"
                placeholder="Paste comma-separated options here... (e.g. ABS, Airbags, GPS)"
                variant="outlined"
                hide-details
                class="text-caption"
                @keydown.enter.prevent="handleBulkPaste"
              />
            </VCol>
            <VCol cols="12" sm="2">
              <VBtn block color="primary" height="38" size="small" @click="handleBulkPaste">
                Add / إضافة
              </VBtn>
            </VCol>
          </VRow>
        </div>

        <!-- Missing / Pending Creation Features -->
        <div v-if="missingFeatures.length > 0" class="missing-features-section mt-3 pa-3 rounded border-warning border border-opacity-50 bg-warning-opacity">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-alert-triangle" color="warning" size="18" />
              <span class="text-caption font-weight-bold warning-text">
                New Options Found ({{ missingFeatures.length }}) / خيارات جديدة غير مسجلة
              </span>
            </div>
            <VBtn
              size="x-small"
              color="warning"
              :loading="isCreatingFeatures"
              @click="createAllMissingFeatures"
            >
              Create All & Select / إضافة الكل وتحديدهم
            </VBtn>
          </div>

          <div class="missing-grid">
            <div
              v-for="(item, idx) in missingFeatures"
              :key="idx"
              class="missing-item-card border pa-2 rounded mb-1 bg-surface"
            >
              <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-1">
                <span class="font-weight-bold text-caption text-primary">Tag: "{{ item.name }}"</span>
                <div class="d-flex align-center gap-1">
                  <VBtn size="x-small" color="primary" variant="tonal" @click="createMissingFeature(idx)">
                    Create & Select / حفظ
                  </VBtn>
                  <VBtn size="x-small" icon="tabler-x" variant="text" color="error" @click="removeMissing(idx)" />
                </div>
              </div>
              
              <VRow dense>
                <VCol cols="12">
                  <VTextField
                    v-model="item.name"
                    label="Feature Name / اسم الإضافة"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="text-caption"
                  />
                </VCol>
              </VRow>
              
              <div v-if="item.error" class="text-caption text-error mt-1">{{ item.error }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Validation Error Messages -->
      <div v-if="errorMessages && errorMessages.length" class="text-error text-caption mt-2 px-1 font-weight-medium">
        {{ Array.isArray(errorMessages) ? errorMessages[0] : errorMessages }}
      </div>
    </VCard>

    <!-- Full Bulk Dialog for large pastes -->
    <VDialog v-model="bulkDialog" max-width="600">
      <VCard class="pa-5 rounded-xl">
        <h3 class="text-subtitle-1 font-weight-bold mb-2 d-flex align-center gap-2">
          <VIcon icon="tabler-clipboard-text" color="primary" />
          Bulk Paste Features / إضافة جماعية للخيارات
        </h3>
        <p class="text-caption text-muted mb-3">
          Paste a raw block of text (from Excel, another website, or specifications). We will automatically scan and parse all comma, newline, tab, or semicolon separated words into individual tags.
        </p>

        <VTextarea
          v-model="pasteText"
          rows="6"
          variant="outlined"
          placeholder="Paste features here... e.g.&#10;Power Windows, Sunroof, ABS, Bluetooth, Adaptive Cruise Control"
          class="mb-3 text-caption"
        />

        <div class="d-flex justify-end gap-3">
          <VBtn variant="outlined" color="secondary" size="small" @click="bulkDialog = false">Cancel / إلغاء</VBtn>
          <VBtn color="primary" size="small" @click="() => { handleBulkPaste(); bulkDialog = false; }">
            Analyze & Import / تحليل واستيراد
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
/* ================= Section 1: Highlights CSS (Ultra Compact & Clean) ================= */
.highlights-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  padding: 12px;
  background: rgba(var(--v-theme-primary), 0.015);
  border: 1px solid rgba(var(--v-theme-primary), 0.06);
  border-radius: 12px;
}

.highlight-checkbox-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface), 0.3);
  border: 1.5px solid rgba(128, 128, 128, 0.1);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01);
}

.highlight-checkbox-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.02);
  transform: translateY(-1px);
}

.highlight-checkbox-card.active {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.06) !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.08);
}

.checkbox-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: transparent;
  flex-shrink: 0;
}

.highlight-checkbox-card.active .checkbox-box {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary));
}

.highlight-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.95);
  line-height: 1.2;
}

/* ================= Section 2: Standard Features CSS ================= */
.features-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 5px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.12);
  background-color: rgba(128, 128, 128, 0.02);
}

.feature-toggle-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 20px;
  border: 1px solid rgba(128, 128, 128, 0.15);
  background-color: rgba(var(--v-theme-surface));
  cursor: pointer;
  user-select: none;
  font-size: 0.78rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.feature-toggle-chip:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.feature-toggle-chip.active {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600;
}

.chip-icon {
  transition: transform 0.15s ease;
}
.feature-toggle-chip.active .chip-icon {
  transform: scale(1.05);
}

.bg-surface-variant-opacity {
  background-color: rgba(128, 128, 128, 0.03);
}

.bg-warning-opacity {
  background-color: rgba(255, 159, 67, 0.05);
}
.warning-text {
  color: #ff9f43;
}

.missing-grid {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.missing-item-card {
  transition: all 0.15s;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* Custom Pulse Animations */
.animate-pulse {
  animation: pulse-border 2s infinite;
}

.animate-pulse-text {
  animation: pulse-opacity 2s infinite;
}

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.3);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(var(--v-theme-primary), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
  }
}

@keyframes pulse-opacity {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
