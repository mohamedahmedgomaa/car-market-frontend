import api from './index'

export default {
  login(payload) {
    return api.post('/seller/auth/login', payload)
  },
  register(payload) {
    return api.post('/seller/auth/register', payload)
  },
  me() {
    return api.get('/seller/auth/me')
  },
  logout() {
    return api.post('/seller/auth/logout')
  },
}
