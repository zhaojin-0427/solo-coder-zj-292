import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const bagAPI = {
  getBags: (brand?: string) => api.get('/bags', { params: { brand } }),
  getBag: (id: number) => api.get(`/bags/${id}`),
  createBag: (data: any) => api.post('/bags', data),
  updateBag: (id: number, data: any) => api.put(`/bags/${id}`, data),
  deleteBag: (id: number) => api.delete(`/bags/${id}`),
  uploadPurchaseProof: (bagId: number, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    return api.post(`/bags/${bagId}/purchase-proofs`, formData)
  },
  uploadAuthImage: (bagId: number, imageType: string, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('image_type', imageType)
    formData.append('file', file)
    if (description) formData.append('description', description)
    return api.post(`/bags/${bagId}/auth-images`, formData)
  },
  deleteAuthImage: (id: number) => api.delete(`/bags/auth-images/${id}`),
}

export const authAPI = {
  getFeatures: (brand?: string, featureType?: string) =>
    api.get('/authentication/features', { params: { brand, feature_type: featureType } }),
  getBrands: () => api.get('/authentication/brands'),
  getFeatureTypes: () => api.get('/authentication/feature-types'),
  analyzeBag: (bagId: number) => api.post(`/authentication/analyze/${bagId}`),
  getResults: (bagId: number) => api.get(`/authentication/results/${bagId}`),
}

export const maintenanceAPI = {
  getRecords: (bagId: number) => api.get(`/maintenance/${bagId}`),
  getRecord: (id: number) => api.get(`/maintenance/record/${id}`),
  createRecord: (bagId: number, data: any) => api.post(`/maintenance/${bagId}`, data),
  updateRecord: (id: number, data: any) => api.put(`/maintenance/record/${id}`, data),
  deleteRecord: (id: number) => api.delete(`/maintenance/record/${id}`),
  uploadPhoto: (recordId: number, photoType: 'before' | 'after', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/maintenance/record/${recordId}/photo/${photoType}`, formData)
  },
}

export const statsAPI = {
  getStats: () => api.get('/stats'),
  getMarketPrices: (brand?: string) => api.get('/market-prices', { params: { brand } }),
}

export default api
