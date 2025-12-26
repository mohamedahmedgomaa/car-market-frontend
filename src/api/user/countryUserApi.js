import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/countries', { params })
  },
  getById(id) {
    return api.get(`/user/countries/${id}`)
  },
}
