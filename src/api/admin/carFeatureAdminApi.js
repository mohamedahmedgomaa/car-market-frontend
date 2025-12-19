import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/car_features', { params })
  },
  getById(id) {
    return api.get(`/admin/car_features/${id}`)
  },
  create(payload) {
    return api.post('/admin/car_features', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/car_features/${id}`, payload)
    }
    return api.patch(`/admin/car_features/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/car_features/${id}`)
  },
}
