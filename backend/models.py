from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Bag(Base):
    __tablename__ = "bags"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False)
    model = Column(String(200), nullable=False)
    style = Column(String(100))
    color = Column(String(50))
    material = Column(String(100))
    size = Column(String(50))
    purchase_date = Column(Date)
    purchase_price = Column(Float)
    purchase_channel = Column(String(200))
    serial_number = Column(String(100))
    condition = Column(String(50))
    current_value = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    purchase_proof_images = relationship("PurchaseProofImage", back_populates="bag", cascade="all, delete-orphan")
    authentication_images = relationship("AuthenticationImage", back_populates="bag", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="bag", cascade="all, delete-orphan")
    authentication_results = relationship("AuthenticationResult", back_populates="bag", cascade="all, delete-orphan")


class PurchaseProofImage(Base):
    __tablename__ = "purchase_proof_images"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    description = Column(String(200))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag", back_populates="purchase_proof_images")


class AuthenticationImage(Base):
    __tablename__ = "authentication_images"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    image_type = Column(String(50), nullable=False)
    image_path = Column(String(500), nullable=False)
    description = Column(String(200))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag", back_populates="authentication_images")


class AuthenticationResult(Base):
    __tablename__ = "authentication_results"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    overall_score = Column(Float)
    result_level = Column(String(20))
    details = Column(Text)
    checked_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag", back_populates="authentication_results")


class AppraisalOrder(Base):
    __tablename__ = "appraisal_orders"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    order_no = Column(String(50), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default="pending_submit")
    expected_agency = Column(String(200))
    is_urgent = Column(Integer, default=0)
    contact_name = Column(String(100))
    contact_phone = Column(String(50))
    contact_remark = Column(Text)
    purchase_proof_refs = Column(Text)
    auth_image_refs = Column(Text)
    report_id = Column(String(100))
    report_agency = Column(String(200))
    report_conclusion = Column(String(50))
    report_score = Column(Float)
    report_details = Column(Text)
    report_pdf_path = Column(String(500))
    risk_flag = Column(String(20))
    submitted_at = Column(DateTime)
    accepted_at = Column(DateTime)
    appraising_at = Column(DateTime)
    reported_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    service_date = Column(Date, nullable=False)
    service_type = Column(String(100), nullable=False)
    service_items = Column(Text)
    cost = Column(Float, default=0)
    service_provider = Column(String(200))
    before_photo = Column(String(500))
    after_photo = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag", back_populates="maintenance_records")


class BrandFeature(Base):
    __tablename__ = "brand_features"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False)
    feature_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    reference_image = Column(String(500))
    key_points = Column(Text)
    common_fakes = Column(Text)
    sort_order = Column(Integer, default=0)


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False)
    model = Column(String(200), nullable=False)
    new_price = Column(Float)
    second_hand_price = Column(Float)
    retention_rate = Column(Float)
    price_trend = Column(String(20))
    updated_at = Column(DateTime, default=datetime.utcnow)


class ConsignmentOrder(Base):
    __tablename__ = "consignment_orders"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    order_no = Column(String(50), unique=True, nullable=False)
    platform = Column(String(100))
    expected_price = Column(Float)
    min_price = Column(Float)
    commission_rate = Column(Float)
    listing_copy = Column(Text)
    accessory_completeness = Column(String(200))
    defect_description = Column(Text)
    purchase_proof_refs = Column(Text)
    auth_image_refs = Column(Text)
    report_refs = Column(Text)
    status = Column(String(20), nullable=False, default="draft")
    sold_price = Column(Float)
    platform_commission = Column(Float)
    actual_amount = Column(Float)
    buyer_note = Column(Text)
    sold_date = Column(Date)
    listed_at = Column(DateTime)
    negotiating_at = Column(DateTime)
    sold_at = Column(DateTime)
    delisted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag")


class ValueMonitor(Base):
    __tablename__ = "value_monitors"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    is_active = Column(Integer, default=1)
    stop_loss_price = Column(Float)
    target_sell_price = Column(Float)
    planned_hold_months = Column(Integer)
    follow_platforms = Column(String(500))
    last_analyzed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bag = relationship("Bag")


class ValueHistory(Base):
    __tablename__ = "value_histories"

    id = Column(Integer, primary_key=True, index=True)
    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    record_date = Column(Date, nullable=False)
    estimated_value = Column(Float, nullable=False)
    value_change = Column(Float)
    change_percent = Column(Float)
    source = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    bag = relationship("Bag")
