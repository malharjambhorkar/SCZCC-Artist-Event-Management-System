import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('caz_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('caz_token')
    localStorage.removeItem('caz_user')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api

export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  changePassword: (d) => api.post('/auth/change-password', d),
}

export const artistAPI = {
  list: (p) => api.get('/artists', { params: p }),
  get: (id) => api.get(`/artists/${id}`),
  create: (d) => api.post('/artists', d),
  update: (id, d) => api.put(`/artists/${id}`, d),
  delete: (id) => api.delete(`/artists/${id}`),
  toggle: (id) => api.patch(`/artists/${id}/toggle-status`),
  stats: () => api.get('/artists/stats'),
  exportExcel: () => api.get('/artists/export/excel', { responseType: 'blob' }),
}

export const eventAPI = {
  list: (p) => api.get('/events', { params: p }),
  get: (id) => api.get(`/events/${id}`),
  forArtist: (id) => api.get(`/events/artist/${id}`),
  create: (d) => api.post('/events', d),
  update: (id, d) => api.put(`/events/${id}`, d),
  delete: (id) => api.delete(`/events/${id}`),
  stats: () => api.get('/events/stats'),
  exportExcel: () => api.get('/events/export/excel', { responseType: 'blob' }),
}

export const venueAPI = {
  list: (p) => api.get('/venues', { params: p }),
  create: (d) => api.post('/venues', d),
  update: (id, d) => api.put(`/venues/${id}`, d),
  delete: (id) => api.delete(`/venues/${id}`),
  stats: () => api.get('/venues/stats'),
  exportExcel: () => api.get('/venues/export/excel', { responseType: 'blob' }),
}

export const expenseAPI = {
  list: (p) => api.get('/expenses', { params: p }),
  summary: (fy) => api.get('/expenses/summary', { params: { fy } }),
  create: (d) => api.post('/expenses', d),
  update: (id, d) => api.put(`/expenses/${id}`, d),
  exportExcel: (fy) => api.get('/expenses/export/excel', { params: { fy }, responseType: 'blob' }),
}

export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  annual: (fy) => api.get('/reports/annual', { params: { fy } }),
}

// Helper: trigger file download from blob response
export const downloadBlob = (response, filename) => {
  const url = URL.createObjectURL(new Blob([response.data]))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
