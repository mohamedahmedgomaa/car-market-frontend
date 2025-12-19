import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/cars', { params })
  },
  getById(id) {
    return api.get(`/admin/cars/${id}`)
  },
  create(payload) {
    return api.post('/admin/cars', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/cars/${id}`, payload)
    }
    return api.patch(`/admin/cars/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/cars/${id}`)
  },
  updateStatus(id, payload) {
    return api.patch(`/admin/cars/${id}/status`, payload)
  }
}
