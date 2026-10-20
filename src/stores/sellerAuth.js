import { defineStore } from 'pinia'
import sellerApi from '@/api/sellerApi'

export const useSellerAuth = defineStore('sellerAuth', {
  state: () => ({
    seller: JSON.parse(localStorage.getItem('seller_data') || 'null'),
    user: JSON.parse(localStorage.getItem('seller_data') || 'null'),
    token: localStorage.getItem('seller_token') || null,
  }),

  actions: {
    async login(email, password) {
      const res = await sellerApi.login({ email, password })
      this.seller = res.data.data.seller || res.data.data
      this.user = this.seller
      this.token = res.data.data.token

      localStorage.setItem('seller_token', this.token)
      localStorage.setItem('seller_data', JSON.stringify(this.seller))
      localStorage.setItem('user_type', 'seller')

      window.dispatchEvent(new Event('auth:changed'))
      return res
    },

    async register(payload) {
      const res = await sellerApi.register(payload)
      this.seller = res.data.data?.seller || res.data.data?.user || res.data.data
      this.user = this.seller
      this.token = res.data.data?.token

      if (this.token) {
        localStorage.setItem('seller_token', this.token)
        localStorage.setItem('seller_data', JSON.stringify(this.seller))
        localStorage.setItem('user_type', 'seller')
      }

      window.dispatchEvent(new Event('auth:changed'))
      return res
    },

    async logout() {
      try {
        await sellerApi.logout()
      } catch (e) {
      } finally {
        this.token = null
        this.seller = null
        this.user = null
        localStorage.removeItem('seller_token')
        localStorage.removeItem('seller_data')
        if (localStorage.getItem('user_type') === 'seller') {
          localStorage.removeItem('user_type')
        }
        window.dispatchEvent(new Event('auth:changed'))
      }
    },
  },
})
