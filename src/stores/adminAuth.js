import { defineStore } from 'pinia'
import adminApi from '@/api/adminApi'

export const useAdminAuth = defineStore('adminAuth', {
  state: () => ({
    admin: JSON.parse(localStorage.getItem('admin_data') || 'null'),
    token: localStorage.getItem('admin_token') || null,
  }),

  actions: {
    async login(email, password) {
      const res = await adminApi.login({ email, password })
      this.admin = res.data.data.admin
      this.token = res.data.data.token

      localStorage.setItem('admin_token', this.token)
      localStorage.setItem('admin_data', JSON.stringify(this.admin))
      return res
    },

    async fetchMe() {
      if (!this.token || this.token.startsWith('mock_')) {
        await this.logout()
        return null
      }

      try {
        const res = await adminApi.me()
        this.admin = res.data.data
        localStorage.setItem('admin_data', JSON.stringify(this.admin))
        return this.admin
      } catch (err) {
        if (err.response?.status === 401) {
          await this.logout()
        }
        return null
      }
    },

    async logout() {
      try {
        await adminApi.logout()
      } catch (e) {
      } finally {
        this.token = null
        this.admin = null
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_data')
      }
    },
  },
})
