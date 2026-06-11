from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class BagBase(BaseModel):
    brand: str
    model: str
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    size: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    purchase_channel: Optional[str] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = None
    current_value: Optional[float] = None
    notes: Optional[str] = None


class BagCreate(BagBase):
    pass


class BagUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    size: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    purchase_channel: Optional[str] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = None
    current_value: Optional[float] = None
    notes: Optional[str] = None


class BagResponse(BagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BagDetailResponse(BagResponse):
    purchase_proof_images: List[dict] = []
    authentication_images: List[dict] = []
    maintenance_records: List[dict] = []


class ImageUploadResponse(BaseModel):
    id: int
    image_path: str
    image_type: Optional[str] = None
    description: Optional[str] = None
    uploaded_at: datetime


class AuthenticationResultBase(BaseModel):
    overall_score: float
    result_level: str
    details: Optional[str] = None


class AuthenticationResultResponse(AuthenticationResultBase):
    id: int
    bag_id: int
    checked_at: datetime

    class Config:
        from_attributes = True


class MaintenanceRecordBase(BaseModel):
    service_date: date
    service_type: str
    service_items: Optional[str] = None
    cost: Optional[float] = 0
    service_provider: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass


class MaintenanceRecordUpdate(BaseModel):
    service_date: Optional[date] = None
    service_type: Optional[str] = None
    service_items: Optional[str] = None
    cost: Optional[float] = None
    service_provider: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceRecordResponse(MaintenanceRecordBase):
    id: int
    bag_id: int
    before_photo: Optional[str] = None
    after_photo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BrandFeatureResponse(BaseModel):
    id: int
    brand: str
    feature_type: str
    title: str
    description: Optional[str] = None
    reference_image: Optional[str] = None
    key_points: Optional[str] = None
    common_fakes: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class MarketPriceResponse(BaseModel):
    id: int
    brand: str
    model: str
    new_price: Optional[float] = None
    second_hand_price: Optional[float] = None
    retention_rate: Optional[float] = None
    price_trend: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_bags: int
    total_brands: int
    total_maintenance_cost: float
    avg_retention_rate: float
    brand_distribution: List[dict]
    maintenance_cost_by_type: List[dict]
    common_problem_parts: List[dict]
    value_retention_period: List[dict]
    total_appraisal_orders: int
    avg_report_days: float
    brand_risk_distribution: List[dict]


class AppraisalOrderCreate(BaseModel):
    bag_id: int
    expected_agency: Optional[str] = None
    is_urgent: Optional[int] = 0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_remark: Optional[str] = None
    purchase_proof_refs: Optional[str] = None
    auth_image_refs: Optional[str] = None


class AppraisalOrderUpdate(BaseModel):
    expected_agency: Optional[str] = None
    is_urgent: Optional[int] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_remark: Optional[str] = None


class AppraisalOrderStatusUpdate(BaseModel):
    status: str
    report_id: Optional[str] = None
    report_agency: Optional[str] = None
    report_conclusion: Optional[str] = None
    report_score: Optional[float] = None
    report_details: Optional[str] = None
    report_pdf_path: Optional[str] = None
    risk_flag: Optional[str] = None


class AppraisalOrderResponse(BaseModel):
    id: int
    bag_id: int
    order_no: str
    status: str
    expected_agency: Optional[str] = None
    is_urgent: int = 0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_remark: Optional[str] = None
    purchase_proof_refs: Optional[str] = None
    auth_image_refs: Optional[str] = None
    report_id: Optional[str] = None
    report_agency: Optional[str] = None
    report_conclusion: Optional[str] = None
    report_score: Optional[float] = None
    report_details: Optional[str] = None
    report_pdf_path: Optional[str] = None
    risk_flag: Optional[str] = None
    submitted_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    appraising_at: Optional[datetime] = None
    reported_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AppraisalOrderDetailResponse(AppraisalOrderResponse):
    bag_brand: Optional[str] = None
    bag_model: Optional[str] = None


class ConsignmentOrderCreate(BaseModel):
    bag_id: int
    platform: Optional[str] = None
    expected_price: Optional[float] = None
    min_price: Optional[float] = None
    commission_rate: Optional[float] = None
    listing_copy: Optional[str] = None
    accessory_completeness: Optional[str] = None
    defect_description: Optional[str] = None
    purchase_proof_refs: Optional[str] = None
    auth_image_refs: Optional[str] = None
    report_refs: Optional[str] = None


class ConsignmentOrderUpdate(BaseModel):
    platform: Optional[str] = None
    expected_price: Optional[float] = None
    min_price: Optional[float] = None
    commission_rate: Optional[float] = None
    listing_copy: Optional[str] = None
    accessory_completeness: Optional[str] = None
    defect_description: Optional[str] = None


class ConsignmentStatusUpdate(BaseModel):
    status: str


class ConsignmentTransactionUpdate(BaseModel):
    sold_price: float
    platform_commission: Optional[float] = None
    actual_amount: Optional[float] = None
    buyer_note: Optional[str] = None
    sold_date: Optional[date] = None


class ConsignmentOrderResponse(BaseModel):
    id: int
    bag_id: int
    order_no: str
    platform: Optional[str] = None
    expected_price: Optional[float] = None
    min_price: Optional[float] = None
    commission_rate: Optional[float] = None
    listing_copy: Optional[str] = None
    accessory_completeness: Optional[str] = None
    defect_description: Optional[str] = None
    purchase_proof_refs: Optional[str] = None
    auth_image_refs: Optional[str] = None
    report_refs: Optional[str] = None
    status: str
    sold_price: Optional[float] = None
    platform_commission: Optional[float] = None
    actual_amount: Optional[float] = None
    buyer_note: Optional[str] = None
    sold_date: Optional[date] = None
    listed_at: Optional[datetime] = None
    negotiating_at: Optional[datetime] = None
    sold_at: Optional[datetime] = None
    delisted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsignmentOrderDetailResponse(ConsignmentOrderResponse):
    bag_brand: Optional[str] = None
    bag_model: Optional[str] = None


class ValueMonitorBase(BaseModel):
    stop_loss_price: Optional[float] = None
    target_sell_price: Optional[float] = None
    planned_hold_months: Optional[int] = None
    follow_platforms: Optional[str] = None


class ValueMonitorCreate(ValueMonitorBase):
    bag_id: int


class ValueMonitorUpdate(ValueMonitorBase):
    is_active: Optional[int] = None


class ValueMonitorResponse(ValueMonitorBase):
    id: int
    bag_id: int
    is_active: int
    last_analyzed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ValueAnalysisResponse(BaseModel):
    bag_id: int
    bag_brand: str
    bag_model: str
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    value_change: Optional[float] = None
    value_change_percent: Optional[float] = None
    total_maintenance_cost: float
    net_profit: Optional[float] = None
    profit_rate: Optional[float] = None
    hold_days: int
    value_status: str
    status_label: str
    status_color: str
    suggestions: List[str]
    stop_loss_price: Optional[float] = None
    target_sell_price: Optional[float] = None
    planned_hold_months: Optional[int] = None
    is_stop_loss_triggered: bool
    is_target_reached: bool
    market_price_trend: Optional[str] = None
    auth_risk_level: Optional[str] = None
    consignment_sold_count: int
    avg_sell_cycle: Optional[float] = None


class ValueAlertItem(BaseModel):
    bag_id: int
    bag_brand: str
    bag_model: str
    alert_type: str
    alert_level: str
    current_value: Optional[float] = None
    threshold_value: Optional[float] = None
    message: str


class ValueStatsResponse(BaseModel):
    monitored_bags_count: int
    alert_bags_count: int
    avg_hold_return_rate: float
    suggest_sell_count: int
    brand_health: List[dict]
    value_trend_30d: List[dict]
