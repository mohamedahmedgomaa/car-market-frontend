import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/seller/models', { params })
  },
  getById(id) {
    return api.get(`/seller/models/${id}`)
  },
  create(payload) {
    return api.post('/seller/models', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/seller/models/${id}`, payload)
    }
    return api.patch(`/seller/models/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/seller/models/${id}`)
  },
}
