import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/seller/cars', { params })
  },
  getById(id) {
    return api.get(`/seller/cars/${id}`)
  },
  create(payload) {
    return api.post('/seller/cars', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/seller/cars/${id}`, payload)
    }
    return api.patch(`/seller/cars/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/seller/cars/${id}`)
  },
  updateStatus(id, payload) {
    return api.patch(`/seller/cars/${id}/status`, payload)
  }
}
