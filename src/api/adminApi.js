import api from './index.js'

export default {
  login(payload) {
    return api.post('/admin/auth/login', payload)
  },
  logout() {
    return api.post('/admin/auth/logout')
  },
  getAll(params) {
    return api.get('/admin/admin', { params })
  },
  getById(id) {
    return api.get(`/admin/admin/${id}`)
  },
  create(payload) {
    return api.post('/admin/admin', payload)
  },
  update(id, payload) {
    return api.patch(`/admin/admin/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/admin/${id}`)
  },
}
