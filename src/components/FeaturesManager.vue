<script setup>
import { ref, computed } from 'vue'
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

// Computed properties for features
const filteredFeatures = computed(() => {
  if (!filterQuery.value) return props.featuresList
  const query = filterQuery.value.toLowerCase()
  return props.featuresList.filter(f => {
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
    // Normalize target by removing dashes or bullet characters and trimming
    const target = item.toLowerCase().replace(/[—\-–•*]/g, '').trim()
    const dictFound = predefinedFeatures.find(df => {
      return df.aliases.some(alias => target === alias || target.includes(alias) || alias.includes(target)) ||
             df.en.toLowerCase().includes(target) ||
             df.ar.includes(target)
    })

    if (dictFound) {
      // Check if this predefined feature is already in db features list
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
        // Add to missing list but pre-populated!
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
  
  // Use pre-populated name_en/name_ar if available, otherwise fallback to item.name
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
      // Emit to parent so it's added to the master features list
      emit('feature-created', newFeature)
      
      // Auto-select the newly created feature
      if (!selectedIds.value.includes(newFeature.id)) {
        selectedIds.value = [...selectedIds.value, newFeature.id]
      }

      // Remove from missing list
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

  // Trigger update
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
  return f.name?.en || f.name?.ar || f.name || ''
}
</script>

<template>
  <div class="features-manager-card">
    <VCard variant="outlined" class="pa-5 rounded-lg border-opacity-25 bg-surface">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
        <div class="d-flex align-center gap-2">
          <VIcon icon="tabler-list-check" color="primary" size="22" />
          <span class="text-subtitle-1 font-weight-bold">Features & Equipment / الخيارات والإضافات</span>
        </div>
        <div class="d-flex align-center gap-2 flex-wrap">
          <VBtn variant="text" size="small" color="primary" @click="selectAll">
            Select All / اختيار الكل
          </VBtn>
          <VBtn variant="text" size="small" color="secondary" @click="deselectAll">
            Clear / مسح التحديد
          </VBtn>
          <VBtn variant="flat" size="small" color="primary" prepend-inner-icon="tabler-plus" @click="bulkDialog = true">
            Bulk Paste / إضافة جماعية
          </VBtn>
        </div>
      </div>

      <!-- Live Search & Tags Info -->
      <VRow dense class="mb-4" align="center">
        <VCol cols="12" md="6" class="d-flex gap-2 align-center">
          <VTextField
            v-model="filterQuery"
            density="compact"
            :placeholder="isCollapsed ? 'Click arrow on right to show list / اضغط على السهم باليمين لعرض القائمة' : 'Search existing options... / ابحث في الخيارات الحالية...'"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            hide-details
            clearable
            class="flex-grow-1"
            @click="isCollapsed = false"
          />
          <VBtn
            variant="tonal"
            color="primary"
            icon
            size="small"
            @click="isCollapsed = !isCollapsed"
            :title="isCollapsed ? 'Expand / إظهار الخيارات' : 'Collapse / إخفاء الخيارات'"
            :class="{ 'animate-pulse': isCollapsed }"
          >
            <VIcon :icon="isCollapsed ? 'tabler-chevron-down' : 'tabler-chevron-up'" size="20" />
          </VBtn>
        </VCol>
        <VCol cols="12" md="6" class="d-flex align-center justify-end">
          <div class="text-caption font-weight-medium d-flex align-center gap-2">
            <div>
              Selected: <VChip color="primary" size="x-small" class="px-2">{{ selectedIds.length }}</VChip> of {{ featuresList.length }} options
            </div>
            <div v-if="isCollapsed" class="text-caption text-warning font-weight-bold animate-pulse-text">
              (اضغط السهم لعرض الإضافات ↗)
            </div>
          </div>
        </VCol>
      </VRow>

      <!-- Selection Grid -->
      <VExpandTransition>
        <div v-show="!isCollapsed" class="features-grid-container mb-4">
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
                size="18"
                class="me-2 chip-icon"
              />
              <span class="chip-text">{{ getFeatureName(f) }}</span>
            </div>
          </TransitionGroup>
          
          <div v-if="filteredFeatures.length === 0" class="text-center py-6 text-muted opacity-70">
            No matching features found.
          </div>
        </div>
      </VExpandTransition>

      <!-- YouTube Style Tag Input / Fast Paste Area -->
      <div class="quick-paste-row mt-4 pa-4 rounded bg-surface-variant-opacity border">
        <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center gap-2">
          <VIcon icon="tabler-tags" size="18" color="primary" />
          <span>YouTube Tag Style Paste / كتابة أو لصق سريع للخيارات</span>
        </div>
        <p class="text-caption text-muted mb-3">
          Paste options separated by commas (e.g. <code>Sunroof, Leather Seats, Bluetooth</code>) or write your own. If they exist, they will be selected automatically. If not, they will be added to the pending missing list below.
        </p>
        
        <VRow dense align="center">
          <VCol cols="12" sm="10">
            <VTextField
              v-model="pasteText"
              density="comfortable"
              placeholder="Paste comma-separated options here... (e.g. ABS, Airbags, GPS)"
              variant="outlined"
              hide-details
              @keydown.enter.prevent="handleBulkPaste"
            />
          </VCol>
          <VCol cols="12" sm="2">
            <VBtn block color="primary" height="48" @click="handleBulkPaste">
              Add / إضافة
            </VBtn>
          </VCol>
        </VRow>
      </div>

      <!-- Missing / Pending Creation Features -->
      <div v-if="missingFeatures.length > 0" class="missing-features-section mt-5 pa-4 rounded border-warning border border-opacity-50 bg-warning-opacity">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-alert-triangle" color="warning" />
            <span class="text-subtitle-2 font-weight-bold warning-text">
              New Options Found ({{ missingFeatures.length }}) / خيارات جديدة غير مسجلة بقاعدة البيانات
            </span>
          </div>
          <VBtn
            size="small"
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
            class="missing-item-card border pa-3 rounded mb-2 bg-surface"
          >
            <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
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

      <!-- Validation Error Messages -->
      <div v-if="errorMessages && errorMessages.length" class="text-error text-caption mt-3 px-1 font-weight-medium">
        {{ Array.isArray(errorMessages) ? errorMessages[0] : errorMessages }}
      </div>
    </VCard>

    <!-- Full Bulk Dialog for large pastes -->
    <VDialog v-model="bulkDialog" max-width="600">
      <VCard class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 d-flex align-center gap-2">
          <VIcon icon="tabler-clipboard-text" color="primary" />
          Bulk Paste Features / إضافة جماعية للخيارات
        </h3>
        <p class="text-caption text-muted mb-4">
          Paste a raw block of text (from Excel, another website, or specifications). We will automatically scan and parse all comma, newline, tab, or semicolon separated words into individual tags, matching them with existing database options, and preparing missing ones.
        </p>

        <VTextarea
          v-model="pasteText"
          rows="8"
          variant="outlined"
          placeholder="Paste features here... e.g.&#10;Power Windows, Sunroof, ABS, Bluetooth, Adaptive Cruise Control"
          class="mb-4"
        />

        <div class="d-flex justify-end gap-3">
          <VBtn variant="outlined" color="secondary" @click="bulkDialog = false">Cancel / إلغاء</VBtn>
          <VBtn color="primary" @click="() => { handleBulkPaste(); bulkDialog = false; }">
            Analyze & Import / تحليل واستيراد
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.features-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 250px;
  overflow-y: auto;
  padding: 5px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.15);
  background-color: rgba(128, 128, 128, 0.03);
}

.feature-toggle-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background-color: rgba(var(--v-theme-surface));
  cursor: pointer;
  user-select: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.feature-toggle-chip:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.4);
  transform: translateY(-1px);
}

.feature-toggle-chip.active {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.15);
}

.chip-icon {
  transition: transform 0.2s ease;
}
.feature-toggle-chip.active .chip-icon {
  transform: scale(1.1);
}

.bg-surface-variant-opacity {
  background-color: rgba(128, 128, 128, 0.05);
}

.bg-warning-opacity {
  background-color: rgba(255, 159, 67, 0.08);
}
.warning-text {
  color: #ff9f43;
}

.missing-grid {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.missing-item-card {
  transition: all 0.2s;
}
.missing-item-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(var(--v-theme-primary), 0);
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
