import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/seller/brands', { params })
  },
  getById(id) {
    return api.get(`/seller/brands/${id}`)
  },
  create(payload) {
    return api.post('/seller/brands', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/seller/brands/${id}`, payload)
    }
    return api.patch(`/seller/brands/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/seller/brands/${id}`)
  },
}
