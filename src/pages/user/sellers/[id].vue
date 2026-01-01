<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import sellerUserApi from '@/api/user/sellerUserApi.js'
import CarsSection from '@/views/front-pages/landing-page/cars-section.vue'

definePage({ meta: { layout: 'front', public: true } })

const route = useRoute()
const sellerId = computed(() => route.params.id)

const loading = ref(false)
const error = ref('')
const seller = ref(null)

const t = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.en || val.ar || ''
}

const normalizeOne = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? null

const fetchSeller = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await sellerUserApi.getById(sellerId.value)
    seller.value = normalizeOne(res.data)
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load seller'
  } finally {
    loading.value = false
  }
}

onMounted(fetchSeller)
</script>

<template>
  <VContainer class="py-8">
    <div v-if="loading">Loading seller...</div>
    <div v-else-if="error" class="text-error">{{ error }}</div>

    <div v-else-if="seller" class="seller-head">
      <div class="seller-info">
        <VAvatar size="64" class="me-4">
          <img v-if="seller.store_logo" :src="seller.store_logo" alt="Seller" />
          <span v-else>{{ (seller.name || 'S')[0] }}</span>
        </VAvatar>

        <div>
          <h1 class="seller-name">{{ seller.name }}</h1>
          <div class="seller-meta">
            <span v-if="seller.city?.name">📍 {{ t(seller.city?.name) }}</span>
            <span v-if="seller.cars_count !== undefined">• 🚗 {{ seller.cars_count }} listings</span>
          </div>
          <p v-if="seller.bio" class="seller-bio">{{ seller.bio }}</p>
        </div>
      </div>

      <div class="seller-actions">
        <VBtn
          v-if="seller.phone"
          variant="tonal"
          :href="`tel:${seller.phone}`"
        >
          Call
        </VBtn>

        <VBtn
          v-if="seller.phone"
          variant="tonal"
          :href="`https://wa.me/${String(seller.phone).replace('+','')}`"
          target="_blank"
        >
          WhatsApp
        </VBtn>
      </div>
    </div>

    <VDivider class="my-6" />

    <!-- Cars of this seller -->
    <CarsSection
      v-if="seller"
      :title="`Listings by ${seller.name}`"
      subtitle="Browse all approved listings from this seller"
      :limit="20"
      :params="{
        sort: '-created_at',
        'filter[status]': 'approved',
        'filter[seller_id]': seller.id,
      }"
      :viewAllTo="{
        path: '/user/cars',
        query: {
          sort: '-created_at',
          'filter[status]': 'approved',
          'filter[seller_id]': seller.id,
        }
      }"
    />
  </VContainer>
</template>

<style scoped>
.seller-head{
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
}
.seller-info{
  display:flex; align-items:flex-start; gap:14px;
}
.seller-name{ margin:0; font-size:28px; }
.seller-meta{ opacity:.8; margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; }
.seller-bio{ margin:10px 0 0; opacity:.85; max-width:700px; }
.seller-actions{ display:flex; gap:10px; flex-wrap:wrap; }
</style>
