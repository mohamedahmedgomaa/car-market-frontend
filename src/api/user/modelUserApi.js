import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/models', { params })
  },
  getById(id) {
    return api.get(`/user/models/${id}`)
  },
}
