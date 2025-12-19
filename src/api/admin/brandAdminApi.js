import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/brands', { params })
  },
  getById(id) {
    return api.get(`/admin/brands/${id}`)
  },
  create(payload) {
    return api.post('/admin/brands', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/brands/${id}`, payload)
    }
    return api.patch(`/admin/brands/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/brands/${id}`)
  },
}
