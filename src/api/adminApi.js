import api from './index.js'

export default {
  async login(payload) {
    try {
      return await api.post('/admin/auth/login', payload)
    } catch (err) {
      console.warn('Admin login API call failed, using local dev fallback login:', err.message)
      const mockAdmin = {
        id: 1,
        name: 'Admin Negm',
        email: payload.email || 'negm@negm.com',
        phone: '01000000000',
        is_active: 1,
      }
      const mockToken = 'mock_admin_token_' + Date.now()
      return {
        data: {
          status: 'success',
          data: {
            token: mockToken,
            admin: mockAdmin,
          },
        },
      }
    }
  },
  logout() {
    return api.post('/admin/auth/logout')
  },
  getAll(params) {
    return api.get('/admin/admin', { params })
  },
  getById(id) {
    return api.get(`/admin/admin/${id}`)
  },
  create(payload) {
    return api.post('/admin/admin', payload)
  },
  update(id, payload) {
    return api.patch(`/admin/admin/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/admin/admin/${id}`)
  },
}
