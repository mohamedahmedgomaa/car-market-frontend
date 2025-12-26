import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/car_features', { params })
  },
  getById(id) {
    return api.get(`/user/car_features/${id}`)
  },
}
