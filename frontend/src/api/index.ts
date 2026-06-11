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

export const insuranceAPI = {
  getPolicies: (params?: { bag_id?: number; status?: string }) =>
    api.get('/insurance/policies', { params }),
  getPolicy: (id: number) => api.get(`/insurance/policies/${id}`),
  createPolicy: (data: {
    bag_id: number
    insurance_company: string
    policy_no: string
    coverage_start_date: string
    coverage_end_date: string
    insured_amount: number
    deductible?: number
    premium?: number
    coverage_scope?: string
    special_exclusions?: string
    notes?: string
  }) => api.post('/insurance/policies', data),
  updatePolicy: (id: number, data: {
    insurance_company?: string
    policy_no?: string
    coverage_start_date?: string
    coverage_end_date?: string
    insured_amount?: number
    deductible?: number
    premium?: number
    coverage_scope?: string
    special_exclusions?: string
    status?: string
    notes?: string
  }) => api.put(`/insurance/policies/${id}`, data),
  updatePolicyStatus: (id: number, status: string) =>
    api.patch(`/insurance/policies/${id}/status`, { status }),
  deletePolicy: (id: number) => api.delete(`/insurance/policies/${id}`),
  getValuation: (bagId: number) => api.get(`/insurance/valuation/${bagId}`),

  getClaims: (params?: { bag_id?: number; policy_id?: number; claim_status?: string }) =>
    api.get('/insurance/claims', { params }),
  getClaim: (id: number) => api.get(`/insurance/claims/${id}`),
  createClaim: (data: {
    insurance_policy_id: number
    bag_id: number
    incident_type: string
    incident_date: string
    damaged_parts?: string
    repair_estimate?: number
    description?: string
  }) => api.post('/insurance/claims', data),
  updateClaim: (id: number, data: {
    incident_type?: string
    incident_date?: string
    damaged_parts?: string
    repair_estimate?: number
    description?: string
    claim_no?: string
  }) => api.put(`/insurance/claims/${id}`, data),
  updateClaimStatus: (id: number, data: { claim_status: string; payout_amount?: number }) =>
    api.patch(`/insurance/claims/${id}/status`, data),
  deleteClaim: (id: number) => api.delete(`/insurance/claims/${id}`),
  uploadClaimPhoto: (claimId: number, file: File, photoType?: string, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (photoType) formData.append('photo_type', photoType)
    if (description) formData.append('description', description)
    return api.post(`/insurance/claims/${claimId}/photos`, formData)
  },
  deleteClaimPhoto: (photoId: number) =>
    api.delete(`/insurance/claims/photos/${photoId}`),
  getInsuranceStats: () => api.get('/insurance/stats'),
}

export default api
