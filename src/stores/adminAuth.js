import { defineStore } from 'pinia'
import adminApi from '@/api/adminApi'

export const useAdminAuth = defineStore('adminAuth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('admin_token') || null,
  }),

  actions: {
    async login(email, password) {
      const res = await adminApi.login({ email, password })
      this.admin = res.data.data.admin
      this.token = res.data.data.token

      localStorage.setItem('admin_token', this.token)
      localStorage.setItem('admin_data', JSON.stringify(this.admin))
    },

    async logout() {
      try {
        await adminApi.logout()
      } catch (e) {
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_data')
      }
    },
  },
})
