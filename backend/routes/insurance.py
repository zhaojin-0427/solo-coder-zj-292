from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date
import uuid
import os

from database import get_db
from models import InsurancePolicy, ClaimEvent, ClaimPhoto, Bag, MaintenanceRecord, AppraisalOrder, ConsignmentOrder
from schemas import (
    InsurancePolicyCreate,
    InsurancePolicyUpdate,
    InsurancePolicyResponse,
    InsurancePolicyDetailResponse,
    InsuranceValuationResponse,
    ClaimEventCreate,
    ClaimEventUpdate,
    ClaimStatusUpdate,
    ClaimEventResponse,
    ClaimEventDetailResponse,
    ClaimPhotoResponse,
    InsuranceStatsResponse,
)

router = APIRouter(prefix="/api/insurance", tags=["保险估值与理赔"])

INSURANCE_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "insurance")
os.makedirs(INSURANCE_UPLOAD_DIR, exist_ok=True)


def generate_policy_no():
    return f"INS{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


def generate_claim_no():
    return f"CLM{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


@router.get("/policies")
def get_policies(bag_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(InsurancePolicy)
    if bag_id:
        query = query.filter(InsurancePolicy.bag_id == bag_id)
    if status:
        query = query.filter(InsurancePolicy.status == status)
    policies = query.order_by(InsurancePolicy.created_at.desc()).all()
    return policies


@router.get("/policies/{policy_id}", response_model=InsurancePolicyDetailResponse)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="保险档案不存在")

    claim_count = db.query(func.count(ClaimEvent.id)).filter(
        ClaimEvent.insurance_policy_id == policy_id
    ).scalar() or 0

    return {
        **policy.__dict__,
        "bag_brand": policy.bag.brand if policy.bag else None,
        "bag_model": policy.bag.model if policy.bag else None,
        "claim_count": claim_count,
    }


@router.post("/policies", response_model=InsurancePolicyResponse)
def create_policy(policy_data: InsurancePolicyCreate, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == policy_data.bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    policy = InsurancePolicy(
        bag_id=policy_data.bag_id,
        insurance_company=policy_data.insurance_company,
        policy_no=policy_data.policy_no or generate_policy_no(),
        coverage_start_date=policy_data.coverage_start_date,
        coverage_end_date=policy_data.coverage_end_date,
        insured_amount=policy_data.insured_amount,
        deductible=policy_data.deductible or 0,
        premium=policy_data.premium or 0,
        coverage_scope=policy_data.coverage_scope,
        special_exclusions=policy_data.special_exclusions,
        notes=policy_data.notes,
        status="active",
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.put("/policies/{policy_id}", response_model=InsurancePolicyResponse)
def update_policy(policy_id: int, policy_data: InsurancePolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="保险档案不存在")

    update_data = policy_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(policy, key, value)

    db.commit()
    db.refresh(policy)
    return policy


@router.patch("/policies/{policy_id}/status")
def update_policy_status(policy_id: int, status_data: dict, db: Session = Depends(get_db)):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="保险档案不存在")

    policy.status = status_data.get("status", policy.status)
    db.commit()
    return {"message": "状态更新成功", "status": policy.status}


@router.delete("/policies/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="保险档案不存在")

    db.delete(policy)
    db.commit()
    return {"message": "删除成功"}


@router.get("/valuation/{bag_id}", response_model=InsuranceValuationResponse)
def get_insurance_valuation(bag_id: int, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    total_maintenance_cost = db.query(
        func.coalesce(func.sum(MaintenanceRecord.cost), 0)
    ).filter(MaintenanceRecord.bag_id == bag_id).scalar() or 0

    appraisal_score = None
    latest_appraisal = db.query(AppraisalOrder).filter(
        AppraisalOrder.bag_id == bag_id,
        AppraisalOrder.status == "reported",
        AppraisalOrder.report_score.isnot(None)
    ).order_by(AppraisalOrder.reported_at.desc()).first()
    if latest_appraisal:
        appraisal_score = latest_appraisal.report_score

    consignment_sold_count = db.query(func.count(ConsignmentOrder.id)).filter(
        ConsignmentOrder.bag_id == bag_id,
        ConsignmentOrder.status == "sold"
    ).scalar() or 0

    current_value = bag.current_value or bag.purchase_price or 0
    purchase_price = bag.purchase_price or 0

    value_retention_rate = None
    if purchase_price and purchase_price > 0 and current_value:
        value_retention_rate = round(current_value / purchase_price * 100, 1)

    suggested_insured_amount = current_value * 0.85 if current_value else 0
    if appraisal_score and appraisal_score >= 80:
        suggested_insured_amount = current_value * 0.9
    elif appraisal_score and appraisal_score < 60:
        suggested_insured_amount = current_value * 0.7

    suggested_insured_amount = round(suggested_insured_amount, 2)

    risk_tips = []
    risk_level = "low"

    if total_maintenance_cost > 0:
        maintenance_ratio = total_maintenance_cost / purchase_price * 100 if purchase_price else 0
        if maintenance_ratio > 5:
            risk_tips.append("该包历史保养费用较高，建议重点关注磨损部位保障")
            risk_level = "medium"

    if consignment_sold_count > 0:
        risk_tips.append("该包有寄售成交记录，市场流通性较好，保值相对稳定")

    if appraisal_score:
        if appraisal_score >= 80:
            risk_tips.append("专业鉴定评分较高，真伪风险低，可适当提高保额")
        elif appraisal_score >= 60:
            risk_tips.append("鉴定评分中等，建议核实承保范围中的真伪相关条款")
            risk_level = "medium"
        else:
            risk_tips.append("鉴定评分较低，存在真伪风险，部分保险公司可能拒保")
            risk_level = "high"

    if current_value and purchase_price and current_value < purchase_price * 0.7:
        risk_tips.append("当前估值较购入价下跌明显，建议重新评估投保金额")
        risk_level = "medium"

    if not risk_tips:
        risk_tips.append("该包整体状况良好，建议按常规保额投保")

    premium_estimate = round(suggested_insured_amount * 0.025, 2)
    deductible_suggestion = round(suggested_insured_amount * 0.05, 2)

    return {
        "bag_id": bag.id,
        "bag_brand": bag.brand,
        "bag_model": bag.model,
        "purchase_price": purchase_price,
        "current_value": current_value,
        "suggested_insured_amount": suggested_insured_amount,
        "risk_level": risk_level,
        "risk_tips": risk_tips,
        "premium_estimate": premium_estimate,
        "deductible_suggestion": deductible_suggestion,
        "value_retention_rate": value_retention_rate,
        "total_maintenance_cost": total_maintenance_cost,
        "appraisal_score": appraisal_score,
        "consignment_sold_count": consignment_sold_count,
    }


@router.get("/claims")
def get_claims(
    bag_id: Optional[int] = None,
    policy_id: Optional[int] = None,
    claim_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ClaimEvent)
    if bag_id:
        query = query.filter(ClaimEvent.bag_id == bag_id)
    if policy_id:
        query = query.filter(ClaimEvent.insurance_policy_id == policy_id)
    if claim_status:
        query = query.filter(ClaimEvent.claim_status == claim_status)
    claims = query.order_by(ClaimEvent.created_at.desc()).all()
    return claims


@router.get("/claims/{claim_id}", response_model=ClaimEventDetailResponse)
def get_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(ClaimEvent).filter(ClaimEvent.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="理赔事件不存在")

    photos = [
        {"id": p.id, "photo_path": p.photo_path, "photo_type": p.photo_type,
         "description": p.description, "uploaded_at": p.uploaded_at}
        for p in claim.photos
    ]

    return {
        **claim.__dict__,
        "bag_brand": claim.bag.brand if claim.bag else None,
        "bag_model": claim.bag.model if claim.bag else None,
        "policy_no": claim.insurance_policy.policy_no if claim.insurance_policy else None,
        "insurance_company": claim.insurance_policy.insurance_company if claim.insurance_policy else None,
        "photos": photos,
    }


@router.post("/claims", response_model=ClaimEventResponse)
def create_claim(claim_data: ClaimEventCreate, db: Session = Depends(get_db)):
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == claim_data.insurance_policy_id
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="保险档案不存在")

    bag = db.query(Bag).filter(Bag.id == claim_data.bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    claim = ClaimEvent(
        insurance_policy_id=claim_data.insurance_policy_id,
        bag_id=claim_data.bag_id,
        incident_type=claim_data.incident_type,
        incident_date=claim_data.incident_date,
        damaged_parts=claim_data.damaged_parts,
        repair_estimate=claim_data.repair_estimate,
        description=claim_data.description,
        claim_status="pending_submit",
        claim_no=generate_claim_no(),
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.put("/claims/{claim_id}", response_model=ClaimEventResponse)
def update_claim(claim_id: int, claim_data: ClaimEventUpdate, db: Session = Depends(get_db)):
    claim = db.query(ClaimEvent).filter(ClaimEvent.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="理赔事件不存在")

    update_data = claim_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(claim, key, value)

    db.commit()
    db.refresh(claim)
    return claim


@router.patch("/claims/{claim_id}/status", response_model=ClaimEventResponse)
def update_claim_status(claim_id: int, status_data: ClaimStatusUpdate, db: Session = Depends(get_db)):
    claim = db.query(ClaimEvent).filter(ClaimEvent.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="理赔事件不存在")

    claim.claim_status = status_data.claim_status

    now = datetime.utcnow()
    if status_data.claim_status == "pending_submit":
        pass
    elif status_data.claim_status == "under_review":
        if not claim.submitted_at:
            claim.submitted_at = now
        claim.reviewed_at = now
    elif status_data.claim_status == "needs_material":
        if not claim.submitted_at:
            claim.submitted_at = now
    elif status_data.claim_status == "paid":
        if not claim.submitted_at:
            claim.submitted_at = now
        claim.paid_at = now
        if status_data.payout_amount is not None:
            claim.payout_amount = status_data.payout_amount
    elif status_data.claim_status == "rejected":
        if not claim.submitted_at:
            claim.submitted_at = now
        claim.rejected_at = now
    elif status_data.claim_status == "cancelled":
        claim.cancelled_at = now

    db.commit()
    db.refresh(claim)
    return claim


@router.delete("/claims/{claim_id}")
def delete_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(ClaimEvent).filter(ClaimEvent.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="理赔事件不存在")

    db.delete(claim)
    db.commit()
    return {"message": "删除成功"}


@router.post("/claims/{claim_id}/photos", response_model=ClaimPhotoResponse)
def upload_claim_photo(
    claim_id: int,
    file: UploadFile = File(...),
    photo_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    claim = db.query(ClaimEvent).filter(ClaimEvent.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="理赔事件不存在")

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    new_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(INSURANCE_UPLOAD_DIR, new_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    relative_path = f"/uploads/insurance/{new_filename}"

    photo = ClaimPhoto(
        claim_event_id=claim_id,
        photo_path=relative_path,
        photo_type=photo_type,
        description=description,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/claims/photos/{photo_id}")
def delete_claim_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(ClaimPhoto).filter(ClaimPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="照片不存在")

    try:
        file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            photo.photo_path.lstrip("/")
        )
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"删除文件失败: {e}")

    db.delete(photo)
    db.commit()
    return {"message": "删除成功"}


@router.get("/stats")
def get_insurance_stats(db: Session = Depends(get_db)):
    total_policies = db.query(func.count(InsurancePolicy.id)).scalar() or 0
    active_policies = db.query(func.count(InsurancePolicy.id)).filter(
        InsurancePolicy.status == "active"
    ).scalar() or 0

    insured_bags = db.query(func.count(func.distinct(InsurancePolicy.bag_id))).filter(
        InsurancePolicy.status == "active"
    ).scalar() or 0

    total_insured_amount = db.query(
        func.coalesce(func.sum(InsurancePolicy.insured_amount), 0)
    ).filter(InsurancePolicy.status == "active").scalar() or 0

    total_premium = db.query(
        func.coalesce(func.sum(InsurancePolicy.premium), 0)
    ).filter(InsurancePolicy.status == "active").scalar() or 0

    annual_premium_ratio = 0.0
    if total_insured_amount and total_insured_amount > 0:
        annual_premium_ratio = round(total_premium / total_insured_amount * 100, 2)

    total_claims = db.query(func.count(ClaimEvent.id)).scalar() or 0
    paid_claims = db.query(func.count(ClaimEvent.id)).filter(
        ClaimEvent.claim_status == "paid"
    ).scalar() or 0

    claim_success_rate = 0.0
    closed_claims = db.query(func.count(ClaimEvent.id)).filter(
        ClaimEvent.claim_status.in_(["paid", "rejected"])
    ).scalar() or 0
    if closed_claims > 0:
        claim_success_rate = round(paid_claims / closed_claims * 100, 1)

    total_payout = db.query(
        func.coalesce(func.sum(ClaimEvent.payout_amount), 0)
    ).filter(ClaimEvent.claim_status == "paid").scalar() or 0

    avg_payout = 0.0
    if paid_claims > 0:
        avg_payout = round(total_payout / paid_claims, 2)

    brand_query = db.query(
        Bag.brand,
        func.count(func.distinct(InsurancePolicy.bag_id)),
        func.count(InsurancePolicy.id),
        func.sum(InsurancePolicy.insured_amount)
    ).join(InsurancePolicy, InsurancePolicy.bag_id == Bag.id) \
     .filter(InsurancePolicy.status == "active") \
     .group_by(Bag.brand).all()

    total_bags_by_brand = db.query(
        Bag.brand,
        func.count(Bag.id)
    ).group_by(Bag.brand).all()
    brand_total_dict = {b[0]: b[1] for b in total_bags_by_brand}

    brand_coverage = []
    for b in brand_query:
        brand, bag_count, policy_count, insured_sum = b
        total_brand_bags = brand_total_dict.get(brand, 0)
        coverage_rate = round(bag_count / total_brand_bags * 100, 1) if total_brand_bags > 0 else 0
        brand_coverage.append({
            "brand": brand,
            "insured_bags": bag_count,
            "total_bags": total_brand_bags,
            "coverage_rate": coverage_rate,
            "policies_count": policy_count,
            "total_insured_amount": insured_sum or 0,
        })
    brand_coverage = sorted(brand_coverage, key=lambda x: x["coverage_rate"], reverse=True)

    claim_type_query = db.query(
        ClaimEvent.incident_type,
        func.count(ClaimEvent.id),
        func.sum(func.IIF(ClaimEvent.claim_status == "paid", ClaimEvent.payout_amount, 0))
    ).group_by(ClaimEvent.incident_type).all()

    claim_type_distribution = [
        {"type": c[0], "count": c[1], "total_payout": c[2] or 0}
        for c in sorted(claim_type_query, key=lambda x: x[1], reverse=True)
    ]

    return {
        "insured_bags_count": insured_bags,
        "total_policies_count": total_policies,
        "active_policies_count": active_policies,
        "total_insured_amount": total_insured_amount,
        "total_premium": total_premium,
        "annual_premium_ratio": annual_premium_ratio,
        "total_claims_count": total_claims,
        "paid_claims_count": paid_claims,
        "claim_success_rate": claim_success_rate,
        "total_payout_amount": total_payout,
        "avg_payout_amount": avg_payout,
        "brand_coverage": brand_coverage,
        "claim_type_distribution": claim_type_distribution,
    }
