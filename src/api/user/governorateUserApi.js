import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/user/governorates', { params })
  },
  getById(id) {
    return api.get(`/user/governorates/${id}`)
  },
}
