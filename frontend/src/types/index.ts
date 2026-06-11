export interface Bag {
  id: number
  brand: string
  model: string
  style?: string
  color?: string
  material?: string
  size?: string
  purchase_date?: string
  purchase_price?: number
  purchase_channel?: string
  serial_number?: string
  condition?: string
  current_value?: number
  notes?: string
  created_at: string
}

export interface BagDetail extends Bag {
  purchase_proof_images: BagImage[]
  authentication_images: AuthImage[]
  maintenance_records: MaintenanceRecord[]
}

export interface BagImage {
  id: number
  image_path: string
  description?: string
}

export interface AuthImage extends BagImage {
  image_type: string
}

export interface MaintenanceRecord {
  id: number
  bag_id: number
  service_date: string
  service_type: string
  service_items?: string
  cost?: number
  service_provider?: string
  before_photo?: string
  after_photo?: string
  notes?: string
  created_at: string
}

export interface BrandFeature {
  id: number
  brand: string
  feature_type: string
  title: string
  description?: string
  reference_image?: string
  key_points?: string
  common_fakes?: string
  sort_order: number
}

export interface MarketPrice {
  id: number
  brand: string
  model: string
  new_price?: number
  second_hand_price?: number
  retention_rate?: number
  price_trend?: string
  updated_at: string
}

export interface StatsData {
  total_bags: number
  total_brands: number
  total_maintenance_cost: number
  total_purchase_price: number
  maintenance_cost_ratio: number
  avg_retention_rate: number
  brand_distribution: { brand: string; count: number }[]
  maintenance_cost_by_type: { type: string; count: number; total_cost: number }[]
  common_problem_parts: { part: string; count: number; issues: string[] }[]
  value_retention_period: { period: string; avg_retention: number }[]
}

export interface AuthResult {
  score: number
  level: string
  details: { type: string; status: string; note: string }[]
  suggestion: string
}

export type AppraisalStatus = 'pending_submit' | 'pending_accept' | 'appraising' | 'reported' | 'cancelled'

export interface AppraisalOrder {
  id: number
  bag_id: number
  order_no: string
  status: AppraisalStatus
  expected_agency?: string
  is_urgent: number
  contact_name?: string
  contact_phone?: string
  contact_remark?: string
  purchase_proof_refs?: string
  auth_image_refs?: string
  report_id?: string
  report_agency?: string
  report_conclusion?: string
  report_score?: number
  report_details?: string
  report_pdf_path?: string
  risk_flag?: 'low' | 'medium' | 'high'
  submitted_at?: string
  accepted_at?: string
  appraising_at?: string
  reported_at?: string
  cancelled_at?: string
  created_at: string
}

export interface AppraisalOrderDetail extends AppraisalOrder {
  bag_brand?: string
  bag_model?: string
}

export interface BrandRiskData {
  brand: string
  total: number
  high_count: number
  medium_count: number
  low_count: number
  high_ratio: number
  medium_ratio: number
  low_ratio: number
  risk_ratio: number
}

export interface StatsData {
  total_bags: number
  total_brands: number
  total_maintenance_cost: number
  total_purchase_price: number
  maintenance_cost_ratio: number
  avg_retention_rate: number
  brand_distribution: { brand: string; count: number }[]
  maintenance_cost_by_type: { type: string; count: number; total_cost: number }[]
  common_problem_parts: { part: string; count: number; issues: string[] }[]
  value_retention_period: { period: string; avg_retention: number }[]
  total_appraisal_orders: number
  avg_report_days: number
  brand_risk_distribution: BrandRiskData[]
}
