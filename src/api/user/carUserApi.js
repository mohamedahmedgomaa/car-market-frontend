import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/cars', { params })
  },
  getById(id) {
    return api.get(`/user/cars/${id}`)
  },
  compare(ids) {
    const param = Array.isArray(ids) ? ids.join(',') : ids
    return api.get('/user/cars/compare', { params: { ids: param } })
  },
  toggleFavorite(id) {
    return api.post(`/user/cars/${id}/favorite`)
  }
}
