import api from './index'

export default {
  login(payload) {
    return api.post('/seller/auth/login', payload)
  },
  logout() {
    return api.post('/seller/auth/logout')
  },
}
