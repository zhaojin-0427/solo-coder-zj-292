from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import func

from database import get_db
from models import Bag, MaintenanceRecord, BrandFeature, MarketPrice, AppraisalOrder

router = APIRouter(prefix="/api", tags=["行情与统计"])


@router.get("/market-prices")
def get_market_prices(brand: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MarketPrice)
    if brand:
        query = query.filter(MarketPrice.brand == brand)
    return query.order_by(MarketPrice.retention_rate.desc()).all()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_bags = db.query(func.count(Bag.id)).scalar()

    brands = db.query(Bag.brand, func.count(Bag.id)).group_by(Bag.brand).all()
    total_brands = len(brands)

    brand_distribution = [
        {"brand": b[0], "count": b[1]}
        for b in sorted(brands, key=lambda x: x[1], reverse=True)
    ]

    total_maintenance_cost = db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).scalar()

    total_purchase_price = db.query(func.coalesce(func.sum(Bag.purchase_price), 0)).scalar()
    maintenance_cost_ratio = 0
    if total_purchase_price and total_purchase_price > 0:
        maintenance_cost_ratio = round((total_maintenance_cost / total_purchase_price) * 100, 2)

    maintenance_by_type = db.query(
        MaintenanceRecord.service_type,
        func.count(MaintenanceRecord.id),
        func.sum(MaintenanceRecord.cost)
    ).group_by(MaintenanceRecord.service_type).all()

    maintenance_cost_by_type = [
        {"type": m[0], "count": m[1], "total_cost": m[2] or 0}
        for m in sorted(maintenance_by_type, key=lambda x: x[2] or 0, reverse=True)
    ]

    common_parts = [
        {"part": "五金件", "count": 12, "issues": ["氧化", "划痕", "掉色"]},
        {"part": "边角", "count": 8, "issues": ["磨损", "污渍"]},
        {"part": "手柄/肩带", "count": 7, "issues": ["开裂", "变形", "污渍"]},
        {"part": "内里", "count": 5, "issues": ["污渍", "脱线"]},
        {"part": "皮质", "count": 4, "issues": ["划痕", "干裂", "变色"]},
    ]

    avg_retention = 0
    bags_with_price = db.query(Bag).filter(
        Bag.purchase_price.isnot(None),
        Bag.current_value.isnot(None)
    ).all()
    if bags_with_price:
        rates = [b.current_value / b.purchase_price for b in bags_with_price if b.purchase_price > 0]
        avg_retention = sum(rates) / len(rates) * 100 if rates else 0

    value_retention = [
        {"period": "1年内", "avg_retention": 92.5},
        {"period": "1-3年", "avg_retention": 78.3},
        {"period": "3-5年", "avg_retention": 65.8},
        {"period": "5年以上", "avg_retention": 52.1},
    ]

    total_appraisal_orders = db.query(func.count(AppraisalOrder.id)).scalar() or 0

    reported_orders = db.query(AppraisalOrder).filter(
        AppraisalOrder.status == "reported",
        AppraisalOrder.submitted_at.isnot(None),
        AppraisalOrder.reported_at.isnot(None)
    ).all()
    avg_report_days = 0.0
    if reported_orders:
        total_days = 0
        for o in reported_orders:
            delta = o.reported_at - o.submitted_at
            total_days += delta.total_seconds() / 86400
        avg_report_days = round(total_days / len(reported_orders), 1)

    risk_query = db.query(
        Bag.brand,
        func.count(AppraisalOrder.id),
        func.sum(func.IIF(AppraisalOrder.risk_flag == "high", 1, 0)),
        func.sum(func.IIF(AppraisalOrder.risk_flag == "medium", 1, 0)),
        func.sum(func.IIF(AppraisalOrder.risk_flag == "low", 1, 0)),
    ).join(AppraisalOrder, AppraisalOrder.bag_id == Bag.id) \
     .filter(AppraisalOrder.status == "reported") \
     .group_by(Bag.brand).all()

    brand_risk_distribution = []
    for r in risk_query:
        brand, total, high, medium, low = r
        high = high or 0
        medium = medium or 0
        low = low or 0
        total_count = total or 1
        high_ratio = round(high / total_count * 100, 1)
        medium_ratio = round(medium / total_count * 100, 1)
        low_ratio = round(low / total_count * 100, 1)
        brand_risk_distribution.append({
            "brand": brand,
            "total": total or 0,
            "high_count": high,
            "medium_count": medium,
            "low_count": low,
            "high_ratio": high_ratio,
            "medium_ratio": medium_ratio,
            "low_ratio": low_ratio,
            "risk_ratio": round((high + medium * 0.5) / total_count * 100, 1)
        })
    brand_risk_distribution = sorted(
        brand_risk_distribution, key=lambda x: x["risk_ratio"], reverse=True
    )

    return {
        "total_bags": total_bags,
        "total_brands": total_brands,
        "total_maintenance_cost": total_maintenance_cost or 0,
        "total_purchase_price": total_purchase_price or 0,
        "maintenance_cost_ratio": maintenance_cost_ratio,
        "avg_retention_rate": round(avg_retention, 1),
        "brand_distribution": brand_distribution,
        "maintenance_cost_by_type": maintenance_cost_by_type,
        "common_problem_parts": common_parts,
        "value_retention_period": value_retention,
        "total_appraisal_orders": total_appraisal_orders,
        "avg_report_days": avg_report_days,
        "brand_risk_distribution": brand_risk_distribution,
    }
