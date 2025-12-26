import api from './index'

export default {
  login(payload) {
    return api.post('/user/auth/login', payload)
  },
  logout() {
    return api.post('/user/auth/logout')
  },
  me() {
    return api.post('/user/auth/me')
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/user/users/${id}`, payload)
    }
    return api.patch(`/user/users/${id}`, payload)
  },
}
