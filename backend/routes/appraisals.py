from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from database import get_db
from models import AppraisalOrder, Bag
from schemas import (
    AppraisalOrderCreate, AppraisalOrderUpdate, AppraisalOrderStatusUpdate,
    AppraisalOrderResponse, AppraisalOrderDetailResponse
)

router = APIRouter(prefix="/api/appraisals", tags=["专业鉴定委托"])

VALID_STATUSES = ["pending_submit", "pending_accept", "appraising", "reported", "cancelled"]
STATUS_TIME_FIELDS = {
    "pending_submit": None,
    "pending_accept": "submitted_at",
    "appraising": "accepted_at",
    "reported": "reported_at",
    "cancelled": "cancelled_at",
}


def generate_order_no() -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    short_uuid = uuid.uuid4().hex[:8].upper()
    return f"APP{timestamp}{short_uuid}"


@router.get("/", response_model=List[AppraisalOrderDetailResponse])
def get_appraisal_orders(
    bag_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AppraisalOrder).join(Bag)
    if bag_id:
        query = query.filter(AppraisalOrder.bag_id == bag_id)
    if status:
        query = query.filter(AppraisalOrder.status == status)
    orders = query.order_by(AppraisalOrder.created_at.desc()).all()

    result = []
    for order in orders:
        order_dict = order.__dict__.copy()
        order_dict["bag_brand"] = order.bag.brand if order.bag else None
        order_dict["bag_model"] = order.bag.model if order.bag else None
        result.append(order_dict)
    return result


@router.get("/{order_id}", response_model=AppraisalOrderDetailResponse)
def get_appraisal_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(AppraisalOrder).filter(AppraisalOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="委托单不存在")

    order_dict = order.__dict__.copy()
    order_dict["bag_brand"] = order.bag.brand if order.bag else None
    order_dict["bag_model"] = order.bag.model if order.bag else None
    return order_dict


@router.post("/", response_model=AppraisalOrderResponse)
def create_appraisal_order(order: AppraisalOrderCreate, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == order.bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    db_order = AppraisalOrder(
        bag_id=order.bag_id,
        order_no=generate_order_no(),
        status="pending_submit",
        expected_agency=order.expected_agency,
        is_urgent=order.is_urgent or 0,
        contact_name=order.contact_name,
        contact_phone=order.contact_phone,
        contact_remark=order.contact_remark,
        purchase_proof_refs=order.purchase_proof_refs,
        auth_image_refs=order.auth_image_refs,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.put("/{order_id}", response_model=AppraisalOrderResponse)
def update_appraisal_order(
    order_id: int,
    order_update: AppraisalOrderUpdate,
    db: Session = Depends(get_db)
):
    db_order = db.query(AppraisalOrder).filter(AppraisalOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="委托单不存在")

    if db_order.status != "pending_submit":
        raise HTTPException(status_code=400, detail="仅待提交状态可编辑")

    update_data = order_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.patch("/{order_id}/status", response_model=AppraisalOrderResponse)
def update_appraisal_status(
    order_id: int,
    status_update: AppraisalOrderStatusUpdate,
    db: Session = Depends(get_db)
):
    db_order = db.query(AppraisalOrder).filter(AppraisalOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="委托单不存在")

    new_status = status_update.status
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"无效状态: {new_status}")

    current_idx = VALID_STATUSES.index(db_order.status)
    new_idx = VALID_STATUSES.index(new_status)

    if new_status == "cancelled":
        if db_order.status not in ["pending_submit", "pending_accept"]:
            raise HTTPException(status_code=400, detail="当前状态无法取消")
    elif new_idx < current_idx:
        raise HTTPException(status_code=400, detail="状态不可回退")

    db_order.status = new_status

    time_field = STATUS_TIME_FIELDS.get(new_status)
    if time_field and getattr(db_order, time_field) is None:
        setattr(db_order, time_field, datetime.utcnow())

    update_fields = [
        "report_id", "report_agency", "report_conclusion",
        "report_score", "report_details", "report_pdf_path", "risk_flag"
    ]
    for field in update_fields:
        value = getattr(status_update, field, None)
        if value is not None:
            setattr(db_order, field, value)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.delete("/{order_id}")
def delete_appraisal_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(AppraisalOrder).filter(AppraisalOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="委托单不存在")

    if db_order.status not in ["pending_submit", "cancelled"]:
        raise HTTPException(status_code=400, detail="仅待提交或已取消状态可删除")

    db.delete(db_order)
    db.commit()
    return {"message": "删除成功"}
