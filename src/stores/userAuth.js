import { defineStore } from 'pinia'
import userApi from '@/api/userApi'

export const useUserAuth = defineStore('userAuth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('user_token') || null,
  }),

  actions: {
    async login(email, password) {
      const res = await userApi.login({ email, password })
      this.user = res.data.data.user
      this.token = res.data.data.token

      localStorage.setItem('user_token', this.token)
      localStorage.setItem('user_data', JSON.stringify(this.user))
    },

    async logout() {
      try {
        await userApi.logout()
      } catch (e) {
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_data')
      }
    },
  },
})
