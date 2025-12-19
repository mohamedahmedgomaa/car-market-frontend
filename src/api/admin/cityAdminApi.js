import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/cities', { params })
  },
  getById(id) {
    return api.get(`/admin/cities/${id}`)
  },
  create(payload) {
    return api.post('/admin/cities', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/cities/${id}`, payload)
    }
    return api.patch(`/admin/cities/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/cities/${id}`)
  },
}
