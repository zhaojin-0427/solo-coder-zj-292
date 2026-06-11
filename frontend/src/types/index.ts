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
