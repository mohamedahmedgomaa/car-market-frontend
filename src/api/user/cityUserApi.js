import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/cities', { params })
  },
  getById(id) {
    return api.get(`/user/cities/${id}`)
  },

}
