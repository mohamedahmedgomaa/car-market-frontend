import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/governorates', { params })
  },
  getById(id) {
    return api.get(`/admin/governorates/${id}`)
  },
  create(payload) {
    return api.post('/admin/governorates', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/governorates/${id}`, payload)
    }
    return api.patch(`/admin/governorates/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/governorates/${id}`)
  },
}
