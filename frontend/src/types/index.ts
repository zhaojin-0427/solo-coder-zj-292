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

export type ConsignmentStatus = 'draft' | 'pending_review' | 'listed' | 'negotiating' | 'sold' | 'delisted'

export interface ConsignmentOrder {
  id: number
  bag_id: number
  order_no: string
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
  status: ConsignmentStatus
  sold_price?: number
  platform_commission?: number
  actual_amount?: number
  buyer_note?: string
  sold_date?: string
  listed_at?: string
  negotiating_at?: string
  sold_at?: string
  delisted_at?: string
  created_at: string
}

export interface ConsignmentOrderDetail extends ConsignmentOrder {
  bag_brand?: string
  bag_model?: string
}

export interface ValueMonitor {
  id: number
  bag_id: number
  is_active: number
  stop_loss_price?: number
  target_sell_price?: number
  planned_hold_months?: number
  follow_platforms?: string
  last_analyzed_at?: string
  created_at: string
  updated_at: string
}

export type ValueStatus = 'appreciating' | 'stable' | 'mild_decline' | 'suggest_sell' | 'target_reached' | 'not_recommend_sell'

export interface ValueAnalysis {
  bag_id: number
  bag_brand: string
  bag_model: string
  purchase_price?: number
  current_value?: number
  value_change?: number
  value_change_percent?: number
  total_maintenance_cost: number
  net_profit?: number
  profit_rate?: number
  hold_days: number
  value_status: ValueStatus
  status_label: string
  status_color: string
  suggestions: string[]
  stop_loss_price?: number
  target_sell_price?: number
  planned_hold_months?: number
  is_stop_loss_triggered: boolean
  is_target_reached: boolean
  market_price_trend?: string
  auth_risk_level?: string
  consignment_sold_count: number
  avg_sell_cycle?: number
}

export interface ValueAlertItem {
  bag_id: number
  bag_brand: string
  bag_model: string
  alert_type: string
  alert_level: string
  current_value?: number
  threshold_value?: number
  message: string
}

export interface ValueMonitorListItem {
  id: number
  bag_id: number
  bag_brand: string
  bag_model: string
  is_active: number
  stop_loss_price?: number
  target_sell_price?: number
  current_value?: number
  value_change_percent?: number
  value_status: ValueStatus
  status_label: string
  status_color: string
  created_at: string
}

export interface ValueHistoryItem {
  id: number
  record_date: string
  estimated_value: number
  value_change?: number
  change_percent?: number
  source?: string
}

export interface BrandHealthData {
  brand: string
  total: number
  healthy: number
  warning: number
  danger: number
  avg_change: number
  health_score: number
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
  total_consignments: number
  consignment_sell_rate: number
  avg_sell_cycle: number
  avg_price_reduction: number
  platform_revenue_distribution: { platform: string; amount: number }[]
  monitored_bags_count: number
  alert_bags_count: number
  avg_hold_return_rate: number
  suggest_sell_count: number
  brand_health: BrandHealthData[]
  value_trend_30d: { date: string; total_value: number; count: number }[]
  insured_bags_count: number
  total_policies_count: number
  active_policies_count: number
  total_insured_amount: number
  total_premium: number
  annual_premium_ratio: number
  total_claims_count: number
  paid_claims_count: number
  claim_success_rate: number
  total_payout_amount: number
  avg_payout_amount: number
  brand_coverage: BrandCoverageData[]
  claim_type_distribution: { type: string; count: number; total_payout: number }[]
}

export type InsurancePolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending'

export interface InsurancePolicy {
  id: number
  bag_id: number
  policy_no: string
  insurance_company: string
  coverage_start_date: string
  coverage_end_date: string
  insured_amount: number
  deductible: number
  premium: number
  coverage_scope?: string
  special_exclusions?: string
  status: InsurancePolicyStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface InsurancePolicyDetail extends InsurancePolicy {
  bag_brand?: string
  bag_model?: string
  claim_count?: number
}

export interface InsuranceValuation {
  bag_id: number
  bag_brand: string
  bag_model: string
  purchase_price?: number
  current_value?: number
  suggested_insured_amount: number
  risk_level: 'low' | 'medium' | 'high'
  risk_tips: string[]
  premium_estimate?: number
  deductible_suggestion?: number
  value_retention_rate?: number
  total_maintenance_cost?: number
  appraisal_score?: number
  consignment_sold_count: number
}

export type ClaimStatus = 'pending_submit' | 'under_review' | 'needs_material' | 'paid' | 'rejected' | 'cancelled'

export interface ClaimEvent {
  id: number
  insurance_policy_id: number
  bag_id: number
  incident_type: string
  incident_date: string
  damaged_parts?: string
  repair_estimate?: number
  claim_status: ClaimStatus
  payout_amount?: number
  claim_no?: string
  description?: string
  submitted_at?: string
  reviewed_at?: string
  paid_at?: string
  rejected_at?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
}

export interface ClaimEventDetail extends ClaimEvent {
  bag_brand?: string
  bag_model?: string
  policy_no?: string
  insurance_company?: string
  photos: ClaimPhoto[]
}

export interface ClaimPhoto {
  id: number
  claim_event_id: number
  photo_path: string
  photo_type?: string
  description?: string
  uploaded_at: string
}

export interface BrandCoverageData {
  brand: string
  insured_bags: number
  total_bags: number
  coverage_rate: number
  policies_count: number
  total_insured_amount: number
}
