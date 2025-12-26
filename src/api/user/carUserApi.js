import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/cars', { params })
  },
  getById(id) {
    return api.get(`/user/cars/${id}`)
  },
  toggleFavorite(id) {
    return api.post(`/user/cars/${id}/favorite`)
  }
}
