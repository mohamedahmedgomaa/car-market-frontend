import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/countries', { params })
  },
  getById(id) {
    return api.get(`/admin/countries/${id}`)
  },
  create(payload) {
    return api.post('/admin/countries', payload)
  },
  update(id, payload) {
    return api.patch(`/admin/countries/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/countries/${id}`)
  },
}
