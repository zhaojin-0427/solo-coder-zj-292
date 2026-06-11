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

export const appraisalAPI = {
  getOrders: (params?: { bag_id?: number; status?: string }) =>
    api.get('/appraisals', { params }),
  getOrder: (id: number) => api.get(`/appraisals/${id}`),
  createOrder: (data: {
    bag_id: number
    expected_agency?: string
    is_urgent?: number
    contact_name?: string
    contact_phone?: string
    contact_remark?: string
    purchase_proof_refs?: string
    auth_image_refs?: string
  }) => api.post('/appraisals', data),
  updateOrder: (id: number, data: {
    expected_agency?: string
    is_urgent?: number
    contact_name?: string
    contact_phone?: string
    contact_remark?: string
  }) => api.put(`/appraisals/${id}`, data),
  updateStatus: (id: number, data: {
    status: string
    report_id?: string
    report_agency?: string
    report_conclusion?: string
    report_score?: number
    report_details?: string
    report_pdf_path?: string
    risk_flag?: string
  }) => api.patch(`/appraisals/${id}/status`, data),
  deleteOrder: (id: number) => api.delete(`/appraisals/${id}`),
}

export const consignmentAPI = {
  getOrders: (params?: { bag_id?: number; status?: string }) =>
    api.get('/consignments', { params }),
  getOrder: (id: number) => api.get(`/consignments/${id}`),
  createOrder: (data: {
    bag_id: number
    platform?: string
    expected_price?: number
    min_price?: number
    commission_rate?: number
    listing_copy?: string
    accessory_completeness?: string
    defect_description?: string
    purchase_proof_refs?: string
    auth_image_refs?: string
    report_refs?: string
  }) => api.post('/consignments', data),
  updateOrder: (id: number, data: {
    platform?: string
    expected_price?: number
    min_price?: number
    commission_rate?: number
    listing_copy?: string
    accessory_completeness?: string
    defect_description?: string
  }) => api.put(`/consignments/${id}`, data),
  updateStatus: (id: number, data: { status: string }) =>
    api.patch(`/consignments/${id}/status`, data),
  updateTransaction: (id: number, data: {
    sold_price: number
    platform_commission?: number
    actual_amount?: number
    buyer_note?: string
    sold_date?: string
  }) => api.patch(`/consignments/${id}/transaction`, data),
  deleteOrder: (id: number) => api.delete(`/consignments/${id}`),
}

export const valueMonitorAPI = {
  getMonitorByBag: (bagId: number) => api.get(`/value-monitor/bag/${bagId}`),
  createMonitor: (data: {
    bag_id: number
    stop_loss_price?: number
    target_sell_price?: number
    planned_hold_months?: number
    follow_platforms?: string
  }) => api.post('/value-monitor', data),
  updateMonitor: (id: number, data: {
    stop_loss_price?: number
    target_sell_price?: number
    planned_hold_months?: number
    follow_platforms?: string
    is_active?: number
  }) => api.put(`/value-monitor/${id}`, data),
  deleteMonitor: (id: number) => api.delete(`/value-monitor/${id}`),
  toggleMonitor: (id: number) => api.patch(`/value-monitor/${id}/toggle`),
  getAnalysis: (bagId: number) => api.get(`/value-monitor/analysis/${bagId}`),
  getAlerts: () => api.get('/value-monitor/alerts'),
  getMonitorList: (status?: string) => api.get('/value-monitor/list', { params: { status } }),
  getValueHistory: (bagId: number, days?: number) =>
    api.get(`/value-monitor/history/${bagId}`, { params: { days } }),
}

export default api
