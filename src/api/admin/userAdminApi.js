import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/users', { params })
  },
  getById(id) {
    return api.get(`/admin/users/${id}`)
  },
  create(payload) {
    return api.post('/admin/users', payload)
  },
  update(id, payload) {
    return api.patch(`/admin/users/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/users/${id}`)
  },
}
