import api from './index'

export default {
  login(payload) {
    return api.post('/seller/auth/login', payload)
  },
  register(payload) {
    return api.post('/seller/auth/register', payload)
  },
  logout() {
    return api.post('/seller/auth/logout')
  },
}
