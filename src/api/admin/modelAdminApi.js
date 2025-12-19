import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/models', { params })
  },
  getById(id) {
    return api.get(`/admin/models/${id}`)
  },
  create(payload) {
    return api.post('/admin/models', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/models/${id}`, payload)
    }
    return api.patch(`/admin/models/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/models/${id}`)
  },
}
