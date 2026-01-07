<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import sellerUserApi from '@/api/user/sellerUserApi.js'

const router = useRouter()

const props = defineProps({
  title: { type: String, default: 'Top Sellers' },
  subtitle: { type: String, default: 'Sellers with the most listings' },
  limit: { type: Number, default: 10 },
  params: { type: Object, default: () => ({}) },
  showViewAll: { type: Boolean, default: false },
})

const loading = ref(false)
const error = ref('')
const sellers = ref([])

const normalizeList = (payload) => {
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  if (Array.isArray(payload)) return payload
  return []
}

const fetchSellers = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await sellerUserApi.getAll({
      perPage: props.limit,
      sort: '-cars_count',
      ...props.params,
    })
    sellers.value = normalizeList(res.data)
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load sellers'
  } finally {
    loading.value = false
  }
}

onMounted(fetchSellers)

const openSeller = (id) => router.push(`/user/sellers/${id}`)

const display = computed(() => sellers.value || [])
</script>

<template>
  <section class="sellers-section">
    <VContainer>
      <div class="head">
        <div>
          <h2 class="title">{{ title }}</h2>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div v-if="loading" class="state">Loading sellers...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="display.length === 0" class="state">No sellers found.</div>

      <div v-else class="grid">
        <button
          v-for="s in display"
          :key="s.id"
          class="seller-card"
          type="button"
          @click="openSeller(s.id)"
        >
          <div class="row">
            <VAvatar size="44">
              <img v-if="s.store_logo" :src="s.store_logo" alt="Seller" />
              <span v-else>{{ (s.name || 'S')[0] }}</span>
            </VAvatar>

            <div class="info">
              <div class="name">{{ s.name }}</div>
              <div class="meta">
                <span v-if="s.city?.name">{{ typeof s.city.name === 'string' ? s.city.name : (s.city.name?.en || s.city.name?.ar || '') }}</span>
                <span v-if="s.cars_count !== undefined">• {{ s.cars_count }} listings</span>
              </div>
            </div>
          </div>

          <div class="pill">View profile</div>
        </button>
      </div>
    </VContainer>
  </section>
</template>

<style scoped>
.sellers-section{ padding: 28px 0 8px; }
.head{ display:flex; justify-content:space-between; align-items:end; gap:16px; margin-bottom:14px; }
.title{ margin:0; font-size:24px; }
.subtitle{ margin:6px 0 0; opacity:.75; }
.state{ padding:14px 0; opacity:.8; }
.state.error{ opacity:1; }
.grid{ display:grid; gap:14px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (max-width:1200px){ .grid{ grid-template-columns:repeat(3, 1fr);} }
@media (max-width:900px){ .grid{ grid-template-columns:repeat(2, 1fr);} }
@media (max-width:560px){ .grid{ grid-template-columns:1fr;} }

.seller-card{
  text-align:left;
  border:0;
  background: rgba(255,255,255,.04);
  border-radius:14px;
  padding:14px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  transition: transform .15s ease;
}
.seller-card:hover{ transform: translateY(-2px); }
.row{ display:flex; align-items:center; gap:12px; }
.info .name{ font-weight:700; }
.info .meta{ opacity:.75; font-size:13px; margin-top:4px; }
.pill{
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  background: rgba(255,255,255,.08);
  white-space:nowrap;
}
</style>
