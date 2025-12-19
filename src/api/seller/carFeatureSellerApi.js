import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/seller/car_features', { params })
  },
  getById(id) {
    return api.get(`/seller/car_features/${id}`)
  },
  create(payload) {
    return api.post('/seller/car_features', payload)
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/seller/car_features/${id}`, payload)
    }
    return api.patch(`/seller/car_features/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/seller/car_features/${id}`)
  },
}
