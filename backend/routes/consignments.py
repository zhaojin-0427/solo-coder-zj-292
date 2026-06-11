from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import uuid

from database import get_db
from models import ConsignmentOrder, Bag
from schemas import (
    ConsignmentOrderCreate, ConsignmentOrderUpdate, ConsignmentStatusUpdate,
    ConsignmentTransactionUpdate, ConsignmentOrderResponse, ConsignmentOrderDetailResponse
)

router = APIRouter(prefix="/api/consignments", tags=["寄售上架与成交复盘"])

VALID_STATUSES = ["draft", "pending_review", "listed", "negotiating", "sold", "delisted"]
STATUS_TIME_FIELDS = {
    "pending_review": None,
    "listed": "listed_at",
    "negotiating": "negotiating_at",
    "sold": "sold_at",
    "delisted": "delisted_at",
}


def generate_order_no() -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    short_uuid = uuid.uuid4().hex[:8].upper()
    return f"CSG{timestamp}{short_uuid}"


@router.get("/", response_model=List[ConsignmentOrderDetailResponse])
def get_consignment_orders(
    bag_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ConsignmentOrder).join(Bag)
    if bag_id:
        query = query.filter(ConsignmentOrder.bag_id == bag_id)
    if status:
        query = query.filter(ConsignmentOrder.status == status)
    orders = query.order_by(ConsignmentOrder.created_at.desc()).all()

    result = []
    for order in orders:
        order_dict = order.__dict__.copy()
        order_dict["bag_brand"] = order.bag.brand if order.bag else None
        order_dict["bag_model"] = order.bag.model if order.bag else None
        result.append(order_dict)
    return result


@router.get("/{order_id}", response_model=ConsignmentOrderDetailResponse)
def get_consignment_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(ConsignmentOrder).filter(ConsignmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="寄售单不存在")

    order_dict = order.__dict__.copy()
    order_dict["bag_brand"] = order.bag.brand if order.bag else None
    order_dict["bag_model"] = order.bag.model if order.bag else None
    return order_dict


@router.post("/", response_model=ConsignmentOrderResponse)
def create_consignment_order(order: ConsignmentOrderCreate, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == order.bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    db_order = ConsignmentOrder(
        bag_id=order.bag_id,
        order_no=generate_order_no(),
        platform=order.platform,
        expected_price=order.expected_price,
        min_price=order.min_price,
        commission_rate=order.commission_rate,
        listing_copy=order.listing_copy,
        accessory_completeness=order.accessory_completeness,
        defect_description=order.defect_description,
        purchase_proof_refs=order.purchase_proof_refs,
        auth_image_refs=order.auth_image_refs,
        report_refs=order.report_refs,
        status="draft",
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.put("/{order_id}", response_model=ConsignmentOrderResponse)
def update_consignment_order(
    order_id: int,
    order_update: ConsignmentOrderUpdate,
    db: Session = Depends(get_db)
):
    db_order = db.query(ConsignmentOrder).filter(ConsignmentOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="寄售单不存在")

    if db_order.status not in ["draft", "pending_review"]:
        raise HTTPException(status_code=400, detail="仅草稿或待审核状态可编辑")

    update_data = order_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.patch("/{order_id}/status", response_model=ConsignmentOrderResponse)
def update_consignment_status(
    order_id: int,
    status_update: ConsignmentStatusUpdate,
    db: Session = Depends(get_db)
):
    db_order = db.query(ConsignmentOrder).filter(ConsignmentOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="寄售单不存在")

    new_status = status_update.status
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"无效状态: {new_status}")

    valid_transitions = {
        "draft": ["pending_review", "delisted"],
        "pending_review": ["listed", "draft", "delisted"],
        "listed": ["negotiating", "delisted"],
        "negotiating": ["sold", "listed", "delisted"],
        "sold": [],
        "delisted": ["draft"],
    }

    if new_status not in valid_transitions.get(db_order.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"状态不可从「{db_order.status}」变更为「{new_status}」"
        )

    db_order.status = new_status

    time_field = STATUS_TIME_FIELDS.get(new_status)
    if time_field and getattr(db_order, time_field) is None:
        setattr(db_order, time_field, datetime.utcnow())

    db.commit()
    db.refresh(db_order)
    return db_order


@router.patch("/{order_id}/transaction", response_model=ConsignmentOrderResponse)
def update_consignment_transaction(
    order_id: int,
    transaction: ConsignmentTransactionUpdate,
    db: Session = Depends(get_db)
):
    db_order = db.query(ConsignmentOrder).filter(ConsignmentOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="寄售单不存在")

    if db_order.status != "negotiating" and db_order.status != "sold":
        raise HTTPException(status_code=400, detail="仅议价中或已成交状态可录入成交信息")

    db_order.sold_price = transaction.sold_price
    db_order.platform_commission = transaction.platform_commission
    db_order.actual_amount = transaction.actual_amount
    db_order.buyer_note = transaction.buyer_note
    db_order.sold_date = transaction.sold_date

    if db_order.status == "negotiating":
        db_order.status = "sold"
        db_order.sold_at = datetime.utcnow()

    db.commit()
    db.refresh(db_order)
    return db_order


@router.delete("/{order_id}")
def delete_consignment_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(ConsignmentOrder).filter(ConsignmentOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="寄售单不存在")

    if db_order.status not in ["draft", "delisted"]:
        raise HTTPException(status_code=400, detail="仅草稿或已下架状态可删除")

    db.delete(db_order)
    db.commit()
    return {"message": "删除成功"}
