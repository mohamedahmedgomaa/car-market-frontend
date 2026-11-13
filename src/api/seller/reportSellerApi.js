import api from '../index.js'

export default {
  getOverview() {
    return api.get('/seller/reports/overview')
  },
  getPerformanceChart(params = {}) {
    return api.get('/seller/reports/performance-chart', { params })
  },
  getCarsRanking(params = {}) {
    return api.get('/seller/reports/cars-ranking', { params })
  },
  getPriceHistory(params = {}) {
    return api.get('/seller/reports/price-history', { params })
  },
  exportCsvUrl() {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    return `${base}/seller/reports/export`
  },
  downloadCsv() {
    return api.get('/seller/reports/export', { responseType: 'blob' })
  },
}

