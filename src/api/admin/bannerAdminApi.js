import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/banners', { params })
  },
  create(payload) {
    return api.post('/admin/banners', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/banners/${id}`, payload)
    }
    return api.patch(`/admin/banners/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/banners/${id}`)
  },
}
