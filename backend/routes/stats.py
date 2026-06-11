from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import func

from database import get_db
from models import Bag, MaintenanceRecord, BrandFeature, MarketPrice

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

    return {
        "total_bags": total_bags,
        "total_brands": total_brands,
        "total_maintenance_cost": total_maintenance_cost or 0,
        "avg_retention_rate": round(avg_retention, 1),
        "brand_distribution": brand_distribution,
        "maintenance_cost_by_type": maintenance_cost_by_type,
        "common_problem_parts": common_parts,
        "value_retention_period": value_retention,
    }
