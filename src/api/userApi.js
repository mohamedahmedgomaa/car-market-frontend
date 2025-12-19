import api from './index'

export default {
  login(payload) {
    return api.post('/user/auth/login', payload)
  },
  logout() {
    return api.post('/user/auth/logout')
  },
}
