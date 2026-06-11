from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy import func

from database import get_db
from models import Bag, ValueMonitor, ValueHistory, MaintenanceRecord, MarketPrice, AppraisalOrder, ConsignmentOrder
from schemas import (
    ValueMonitorCreate,
    ValueMonitorUpdate,
    ValueMonitorResponse,
    ValueAnalysisResponse,
    ValueAlertItem,
)

router = APIRouter(prefix="/api/value-monitor", tags=["保值监控"])


def analyze_value(bag: Bag, monitor: Optional[ValueMonitor], db: Session) -> ValueAnalysisResponse:
    purchase_price = bag.purchase_price
    current_value = bag.current_value

    value_change = None
    value_change_percent = None
    net_profit = None
    profit_rate = None

    if purchase_price and current_value:
        value_change = current_value - purchase_price
        value_change_percent = round((value_change / purchase_price) * 100, 2)

    total_maintenance_cost = db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).filter(
        MaintenanceRecord.bag_id == bag.id
    ).scalar() or 0

    if purchase_price and current_value:
        net_profit = current_value - purchase_price - total_maintenance_cost
        profit_rate = round((net_profit / purchase_price) * 100, 2)

    hold_days = 0
    if bag.purchase_date:
        hold_days = (date.today() - bag.purchase_date).days

    market_price = db.query(MarketPrice).filter(
        MarketPrice.brand == bag.brand,
        MarketPrice.model == bag.model
    ).first()
    market_price_trend = market_price.price_trend if market_price else None

    latest_appraisal = db.query(AppraisalOrder).filter(
        AppraisalOrder.bag_id == bag.id,
        AppraisalOrder.status == "reported"
    ).order_by(AppraisalOrder.reported_at.desc()).first()
    auth_risk_level = latest_appraisal.risk_flag if latest_appraisal else None

    sold_consignments = db.query(ConsignmentOrder).filter(
        ConsignmentOrder.bag_id == bag.id,
        ConsignmentOrder.status == "sold"
    ).all()
    consignment_sold_count = len(sold_consignments)

    avg_sell_cycle = None
    if sold_consignments:
        total_days = 0
        count = 0
        for c in sold_consignments:
            if c.listed_at and c.sold_at:
                delta = c.sold_at - c.listed_at
                total_days += delta.total_seconds() / 86400
                count += 1
        if count > 0:
            avg_sell_cycle = round(total_days / count, 1)

    value_status = "stable"
    status_label = "稳定"
    status_color = "green"

    if current_value and purchase_price:
        change_pct = (current_value - purchase_price) / purchase_price * 100
        if change_pct >= 5:
            value_status = "appreciating"
            status_label = "升值中"
            status_color = "green"
        elif change_pct >= -3:
            value_status = "stable"
            status_label = "稳定"
            status_color = "blue"
        elif change_pct >= -10:
            value_status = "mild_decline"
            status_label = "轻度下滑"
            status_color = "yellow"
        else:
            value_status = "suggest_sell"
            status_label = "建议换手"
            status_color = "orange"

    if monitor and monitor.stop_loss_price and current_value and current_value <= monitor.stop_loss_price:
        value_status = "suggest_sell"
        status_label = "建议换手"
        status_color = "red"

    if monitor and monitor.target_sell_price and current_value and current_value >= monitor.target_sell_price:
        value_status = "target_reached"
        status_label = "目标达成"
        status_color = "purple"

    if auth_risk_level == "high" and value_status not in ["suggest_sell"]:
        value_status = "not_recommend_sell"
        status_label = "暂不建议出售"
        status_color = "gray"

    suggestions = []
    if value_status == "appreciating":
        suggestions.append("当前包包处于升值通道，可持续持有观察")
        if monitor and monitor.target_sell_price and current_value and current_value >= monitor.target_sell_price * 0.8:
            suggestions.append("已接近目标价位，可考虑逐步减仓或设置止盈")
    elif value_status == "stable":
        suggestions.append("价值相对稳定，可继续持有")
        if monitor and monitor.planned_hold_months and hold_days >= monitor.planned_hold_months * 30 * 0.8:
            suggestions.append("接近计划持有周期，可开始规划出手时机")
    elif value_status == "mild_decline":
        suggestions.append("价值出现轻度下滑，建议密切关注市场行情")
        suggestions.append("可考虑加强保养维护，保持包包成色")
    elif value_status == "suggest_sell":
        suggestions.append("已触发止损条件，建议及时出手止损")
        if monitor and monitor.follow_platforms:
            suggestions.append(f"建议在 {monitor.follow_platforms} 平台挂牌出售")
    elif value_status == "target_reached":
        suggestions.append("恭喜！已达成目标价位，可考虑获利了结")
        suggestions.append("如继续看好，可上调目标价并设置移动止盈")
    elif value_status == "not_recommend_sell":
        suggestions.append("鉴定风险较高，暂不建议出售，以免产生纠纷")
        suggestions.append("建议先进行专业鉴定，获取权威鉴定报告后再考虑出手")

    if total_maintenance_cost > 0 and purchase_price and total_maintenance_cost / purchase_price > 0.05:
        suggestions.append("保养成本较高，建议计算综合持有成本后再决策")

    is_stop_loss_triggered = False
    is_target_reached = False
    if monitor and monitor.stop_loss_price and current_value:
        is_stop_loss_triggered = current_value <= monitor.stop_loss_price
    if monitor and monitor.target_sell_price and current_value:
        is_target_reached = current_value >= monitor.target_sell_price

    return ValueAnalysisResponse(
        bag_id=bag.id,
        bag_brand=bag.brand,
        bag_model=bag.model,
        purchase_price=purchase_price,
        current_value=current_value,
        value_change=value_change,
        value_change_percent=value_change_percent,
        total_maintenance_cost=total_maintenance_cost,
        net_profit=net_profit,
        profit_rate=profit_rate,
        hold_days=hold_days,
        value_status=value_status,
        status_label=status_label,
        status_color=status_color,
        suggestions=suggestions,
        stop_loss_price=monitor.stop_loss_price if monitor else None,
        target_sell_price=monitor.target_sell_price if monitor else None,
        planned_hold_months=monitor.planned_hold_months if monitor else None,
        is_stop_loss_triggered=is_stop_loss_triggered,
        is_target_reached=is_target_reached,
        market_price_trend=market_price_trend,
        auth_risk_level=auth_risk_level,
        consignment_sold_count=consignment_sold_count,
        avg_sell_cycle=avg_sell_cycle,
    )


@router.get("/bag/{bag_id}", response_model=Optional[ValueMonitorResponse])
def get_monitor_by_bag(bag_id: int, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")
    monitor = db.query(ValueMonitor).filter(ValueMonitor.bag_id == bag_id).first()
    return monitor


@router.post("/", response_model=ValueMonitorResponse)
def create_monitor(monitor: ValueMonitorCreate, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == monitor.bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    existing = db.query(ValueMonitor).filter(ValueMonitor.bag_id == monitor.bag_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="该包包已开启保值监控")

    db_monitor = ValueMonitor(**monitor.dict())
    db.add(db_monitor)
    db.commit()
    db.refresh(db_monitor)
    return db_monitor


@router.put("/{monitor_id}", response_model=ValueMonitorResponse)
def update_monitor(monitor_id: int, monitor: ValueMonitorUpdate, db: Session = Depends(get_db)):
    db_monitor = db.query(ValueMonitor).filter(ValueMonitor.id == monitor_id).first()
    if not db_monitor:
        raise HTTPException(status_code=404, detail="监控记录不存在")

    update_data = monitor.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_monitor, key, value)

    db.commit()
    db.refresh(db_monitor)
    return db_monitor


@router.delete("/{monitor_id}")
def delete_monitor(monitor_id: int, db: Session = Depends(get_db)):
    db_monitor = db.query(ValueMonitor).filter(ValueMonitor.id == monitor_id).first()
    if not db_monitor:
        raise HTTPException(status_code=404, detail="监控记录不存在")

    db.delete(db_monitor)
    db.commit()
    return {"message": "删除成功"}


@router.patch("/{monitor_id}/toggle")
def toggle_monitor(monitor_id: int, db: Session = Depends(get_db)):
    db_monitor = db.query(ValueMonitor).filter(ValueMonitor.id == monitor_id).first()
    if not db_monitor:
        raise HTTPException(status_code=404, detail="监控记录不存在")

    db_monitor.is_active = 0 if db_monitor.is_active == 1 else 1
    db.commit()
    return {"message": "操作成功", "is_active": db_monitor.is_active}


@router.get("/analysis/{bag_id}", response_model=ValueAnalysisResponse)
def get_bag_analysis(bag_id: int, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    monitor = db.query(ValueMonitor).filter(ValueMonitor.bag_id == bag_id).first()
    return analyze_value(bag, monitor, db)


@router.get("/alerts", response_model=List[ValueAlertItem])
def get_batch_alerts(db: Session = Depends(get_db)):
    active_monitors = db.query(ValueMonitor).filter(ValueMonitor.is_active == 1).all()
    alerts = []

    for monitor in active_monitors:
        bag = monitor.bag
        if not bag:
            continue

        analysis = analyze_value(bag, monitor, db)

        if analysis.is_stop_loss_triggered:
            alerts.append(ValueAlertItem(
                bag_id=bag.id,
                bag_brand=bag.brand,
                bag_model=bag.model,
                alert_type="stop_loss",
                alert_level="high",
                current_value=analysis.current_value,
                threshold_value=monitor.stop_loss_price,
                message=f"已跌破止损价 ¥{monitor.stop_loss_price:,.0f}，建议及时出手"
            ))

        if analysis.is_target_reached:
            alerts.append(ValueAlertItem(
                bag_id=bag.id,
                bag_brand=bag.brand,
                bag_model=bag.model,
                alert_type="target_reached",
                alert_level="success",
                current_value=analysis.current_value,
                threshold_value=monitor.target_sell_price,
                message=f"已达成目标价 ¥{monitor.target_sell_price:,.0f}，可考虑获利了结"
            ))

        if analysis.value_status == "mild_decline":
            alerts.append(ValueAlertItem(
                bag_id=bag.id,
                bag_brand=bag.brand,
                bag_model=bag.model,
                alert_type="mild_decline",
                alert_level="medium",
                current_value=analysis.current_value,
                threshold_value=None,
                message=f"价值轻度下滑 {analysis.value_change_percent:.1f}%，建议关注"
            ))

        if analysis.auth_risk_level == "high":
            alerts.append(ValueAlertItem(
                bag_id=bag.id,
                bag_brand=bag.brand,
                bag_model=bag.model,
                alert_type="auth_risk",
                alert_level="high",
                current_value=None,
                threshold_value=None,
                message="鉴定风险较高，出售前建议获取专业鉴定报告"
            ))

    return alerts


@router.get("/list", response_model=List[dict])
def get_monitor_list(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ValueMonitor)
    if status == "active":
        query = query.filter(ValueMonitor.is_active == 1)
    elif status == "inactive":
        query = query.filter(ValueMonitor.is_active == 0)

    monitors = query.order_by(ValueMonitor.created_at.desc()).all()
    result = []

    for monitor in monitors:
        bag = monitor.bag
        if not bag:
            continue

        analysis = analyze_value(bag, monitor, db)
        result.append({
            "id": monitor.id,
            "bag_id": bag.id,
            "bag_brand": bag.brand,
            "bag_model": bag.model,
            "is_active": monitor.is_active,
            "stop_loss_price": monitor.stop_loss_price,
            "target_sell_price": monitor.target_sell_price,
            "current_value": analysis.current_value,
            "value_change_percent": analysis.value_change_percent,
            "value_status": analysis.value_status,
            "status_label": analysis.status_label,
            "status_color": analysis.status_color,
            "created_at": monitor.created_at,
        })

    return result


@router.get("/history/{bag_id}", response_model=List[dict])
def get_value_history(bag_id: int, days: int = 30, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    histories = db.query(ValueHistory).filter(
        ValueHistory.bag_id == bag_id
    ).order_by(ValueHistory.record_date.desc()).limit(days).all()

    result = [
        {
            "id": h.id,
            "record_date": h.record_date,
            "estimated_value": h.estimated_value,
            "value_change": h.value_change,
            "change_percent": h.change_percent,
            "source": h.source,
        }
        for h in reversed(histories)
    ]

    if not result and bag.current_value:
        result.append({
            "id": 0,
            "record_date": date.today(),
            "estimated_value": bag.current_value,
            "value_change": 0,
            "change_percent": 0,
            "source": "manual",
        })

    return result
