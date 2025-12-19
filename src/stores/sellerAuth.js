import { defineStore } from 'pinia'
import sellerApi from '@/api/sellerApi'

export const useSellerAuth = defineStore('sellerAuth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('seller_token') || null,
  }),

  actions: {
    async login(email, password) {
      const res = await sellerApi.login({ email, password })
      this.seller = res.data.data.seller
      this.token = res.data.data.token

      localStorage.setItem('seller_token', this.token)
      localStorage.setItem('seller_data', JSON.stringify(this.seller))
    },

    async logout() {
      try {
        await sellerApi.logout()
      } catch (e) {
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('seller_token')
        localStorage.removeItem('seller_data')
      }
    },
  },
})
