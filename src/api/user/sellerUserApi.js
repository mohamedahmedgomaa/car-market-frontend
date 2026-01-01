import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/seller', { params })
  },
  getById(id) {
    return api.get(`/user/seller/${id}`)
  },
}
