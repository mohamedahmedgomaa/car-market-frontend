import api from '../index.js'

export default {
  getAll(params = {}) {
    return api.get('/seller/notifications', { params })
  },
  getById(id) {
    return api.get(`/seller/notifications/${id}`)
  },
  markAsRead(id) {
    return api.patch(`/seller/notifications/${id}/read`)
  },
  markAllAsRead() {
    return api.patch('/seller/notifications/read-all')
  },
}

