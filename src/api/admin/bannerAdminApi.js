import api from '../index.js'

export default {
  getAll(params) {
    return api.get('/admin/banners', { params })
  },
  create(payload, config = {}) {
    return api.post('/admin/banners', payload, {
      timeout: 600000,
      ...config,
    })
  },
  update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PATCH')
      return api.post(`/admin/banners/${id}`, payload)
    }
    const fd = new FormData()
    fd.append('_method', 'PATCH')
    for (const key in payload) {
      if (payload[key] !== undefined && payload[key] !== null) {
        fd.append(key, payload[key])
      }
    }
    return api.post(`/admin/banners/${id}`, fd)
  },
  delete(id) {
    return api.delete(`/admin/banners/${id}`)
  },
}
