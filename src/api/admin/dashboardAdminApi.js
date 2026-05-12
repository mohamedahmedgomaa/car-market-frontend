import api from '../index.js'

export default {
  getStats() {
    return api.get('/admin/dashboard')
  }
}
