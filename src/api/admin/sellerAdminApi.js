import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/seller', { params })
  },
  getById(id) {
    return api.get(`/admin/seller/${id}`)
  },
  create(payload) {
    return api.post('/admin/seller', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/seller/${id}`, payload)
    }
    return api.patch(`/admin/seller/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/seller/${id}`)
  },
}
