import api from '../index.js'

export default {
  getMe() {
    return api.get('/seller/auth/me')
  },
  updateProfile(payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'POST')
      return api.post('/seller/auth/profile', payload)
    }
    return api.post('/seller/auth/profile', payload)
  },
}

