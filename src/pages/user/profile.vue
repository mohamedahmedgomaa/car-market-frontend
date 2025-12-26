<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import userApi from '@/api/userApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({ meta: { layout: 'front', public: false } })

const router = useRouter()

const loadingProfile = ref(false)
const savingProfile = ref(false)
const profileError = ref('')
const editMode = ref(false)

const me = ref(null)
const form = ref({ name: '', phone: '' })

const ensureAuth = () => {
  const token = localStorage.getItem('user_token')
  if (!token) {
    router.push('/login')
    return false
  }
  return true
}

const normalizeMe = (res) => {
  const d = res?.data?.data ?? res?.data ?? {}
  return d.user ?? d
}

const loadMe = async () => {
  if (!ensureAuth()) return

  loadingProfile.value = true
  profileError.value = ''

  try {
    const res = await userApi.me()
    const u = normalizeMe(res)

    if (!u?.id) {
      profileError.value = 'Invalid user data'
      me.value = null
      return
    }

    me.value = u
    form.value = { name: u.name ?? '', phone: u.phone ?? '' }
  } catch (e) {
    console.error(e)
    profileError.value = 'Failed to load profile'
  } finally {
    loadingProfile.value = false
  }
}

const startEdit = () => {
  if (!me.value) return
  form.value = { name: me.value.name ?? '', phone: me.value.phone ?? '' }
  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
  if (!me.value) return
  form.value = { name: me.value.name ?? '', phone: me.value.phone ?? '' }
}

const saveProfile = async () => {
  if (!ensureAuth()) return
  if (!me.value?.id) return

  savingProfile.value = true
  profileError.value = ''

  try {
    const res = await userApi.update(me.value.id, {
      name: String(form.value.name || '').trim(),
      phone: String(form.value.phone || '').trim(),
    })

    const updated = normalizeMe(res) || {}
    me.value = { ...me.value, ...updated }
    editMode.value = false
  } catch (e) {
    console.error(e)
    profileError.value = 'Failed to save profile'
  } finally {
    savingProfile.value = false
  }
}

/**
 * ✅ مهم: نخليها null لحد ما me ييجي
 * كده CarsSection مش هيتعمله mount ولا fetch إلا مرة واحدة.
 */
const favoriteParams = computed(() => {
  if (!me.value?.id) return null
  return {
    'filter[user_id]': me.value.id,
    sort: '-created_at',
  }
})

const favoriteViewAllTo = computed(() => {
  if (!me.value?.id) return { path: '/user/cars' }
  return {
    path: '/user/cars',
    query: { 'filter[user_id]': me.value.id, sort: '-created_at' },
  }
})

const refreshAll = async () => {
  await loadMe()
}

onMounted(refreshAll)
</script>

<template>
  <section class="profile-page">
    <VContainer>
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h2 class="text-h5 mb-1">Profile</h2>
          <div class="text-body-2" style="opacity:.75">
            View & edit your account + your favorites
          </div>
        </div>

        <VBtn variant="tonal" @click="refreshAll">
          Refresh
        </VBtn>
      </div>

      <VRow align="stretch">
        <!-- Left: Profile -->
        <VCol cols="12" md="4" lg="4">
          <VCard class="pa-4 h-100" rounded="lg">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-1 font-weight-bold">My Info</div>
              <VChip v-if="me" size="small" variant="tonal">ID: {{ me.id }}</VChip>
            </div>

            <div v-if="loadingProfile" class="py-6 text-center" style="opacity:.8">
              Loading profile...
            </div>

            <div v-else>
              <div v-if="profileError" class="mb-3" style="color: rgb(var(--v-theme-error))">
                {{ profileError }}
              </div>

              <template v-if="me && !editMode">
                <div class="info-row">
                  <div class="label">Name</div>
                  <div class="value">{{ me.name || '—' }}</div>
                </div>

                <div class="info-row">
                  <div class="label">Email</div>
                  <div class="value">{{ me.email || '—' }}</div>
                </div>

                <div class="info-row">
                  <div class="label">Phone</div>
                  <div class="value">{{ me.phone || '—' }}</div>
                </div>

                <VBtn color="primary" block class="mt-4" @click="startEdit">
                  Edit
                </VBtn>
              </template>

              <template v-else-if="me && editMode">
                <VTextField v-model="form.name" label="Name" variant="outlined" density="comfortable" class="mb-3" hide-details />
                <VTextField v-model="form.phone" label="Phone" variant="outlined" density="comfortable" class="mb-3" hide-details />

                <div class="d-flex gap-2">
                  <VBtn color="primary" class="flex-1" :loading="savingProfile" @click="saveProfile">
                    Save
                  </VBtn>
                  <VBtn variant="tonal" class="flex-1" @click="cancelEdit">
                    Cancel
                  </VBtn>
                </div>
              </template>

              <template v-else>
                <div class="py-6 text-center" style="opacity:.75">No user data.</div>
              </template>
            </div>
          </VCard>
        </VCol>

        <!-- Right: Favorites -->
        <VCol cols="12" md="8" lg="8">
          <VCard class="pa-4 h-100" rounded="lg">
            <!-- ✅ كده CarsSection مش هيتعمله mount غير بعد ما me ييجي -->
            <CarsSection
              v-if="favoriteParams"
              embedded
              title="My Favorite Cars"
              subtitle="Cars you loved ❤️"
              :limit="12"
              :approvedOnly="true"
              :params="favoriteParams"
              :viewAllTo="favoriteViewAllTo"
            />

            <div v-else class="py-8 text-center" style="opacity:.7">
              Loading favorites...
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style scoped>
.profile-page { padding: 32px 0; }

.info-row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:10px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.label{ opacity:.75; font-weight:700; font-size:13px; }
.value{ font-weight:800; }

:deep(.cars-section--embedded) { padding: 0 !important; }
:deep(.cars-section__container) { padding: 0 !important; }
:deep(.cars-section__header) { margin-bottom: 12px !important; }
</style>
