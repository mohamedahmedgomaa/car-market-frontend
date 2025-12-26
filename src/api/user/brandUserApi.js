import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/brands', { params })
  },
  getById(id) {
    return api.get(`/user/brands/${id}`)
  },
}
