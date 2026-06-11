from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import BrandFeature, Bag, AuthenticationImage, AuthenticationResult

router = APIRouter(prefix="/api/authentication", tags=["鉴定指引"])


@router.get("/features")
def get_brand_features(brand: Optional[str] = None, feature_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(BrandFeature)
    if brand:
        query = query.filter(BrandFeature.brand == brand)
    if feature_type:
        query = query.filter(BrandFeature.feature_type == feature_type)
    return query.order_by(BrandFeature.sort_order).all()


@router.get("/features/{feature_id}")
def get_feature_detail(feature_id: int, db: Session = Depends(get_db)):
    feature = db.query(BrandFeature).filter(BrandFeature.id == feature_id).first()
    if not feature:
        raise HTTPException(status_code=404, detail="特征不存在")
    return feature


@router.get("/brands")
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(BrandFeature.brand).distinct().all()
    return [b[0] for b in brands]


@router.get("/feature-types")
def get_feature_types(db: Session = Depends(get_db)):
    types = db.query(BrandFeature.feature_type).distinct().all()
    return [t[0] for t in types]


@router.post("/analyze/{bag_id}")
def analyze_bag(bag_id: int, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    auth_images = db.query(AuthenticationImage).filter(AuthenticationImage.bag_id == bag_id).all()
    image_types = set(img.image_type for img in auth_images)

    required_types = ["五金刻字", "内标走线", "防尘袋烫金"]
    uploaded_count = len(image_types)
    completeness = uploaded_count / len(required_types) if required_types else 0

    base_score = 60 + completeness * 20

    details = []
    for req_type in required_types:
        if req_type in image_types:
            details.append({
                "type": req_type,
                "status": "已上传",
                "note": "请根据鉴定指引仔细比对特征"
            })
        else:
            details.append({
                "type": req_type,
                "status": "待补充",
                "note": f"请上传{req_type}照片以获得更准确的鉴定结果"
            })

    if bag.purchase_price and bag.purchase_price < 3000:
        base_score -= 10
        details.append({"type": "价格风险", "status": "注意", "note": "购入价格偏低，请警惕仿品风险"})

    if bag.purchase_channel and "代购" in bag.purchase_channel:
        base_score -= 5
        details.append({"type": "渠道风险", "status": "注意", "note": "代购渠道请务必核实购买凭证"})

    result_level = "高可信度" if base_score >= 80 else "中等可信度" if base_score >= 60 else "低可信度"

    auth_result = AuthenticationResult(
        bag_id=bag_id,
        overall_score=round(base_score, 1),
        result_level=result_level,
        details=str(details)
    )
    db.add(auth_result)
    db.commit()
    db.refresh(auth_result)

    return {
        "score": round(base_score, 1),
        "level": result_level,
        "details": details,
        "suggestion": "本结果仅供参考，建议联系专业鉴定机构进行实物鉴定"
    }


@router.get("/results/{bag_id}")
def get_authentication_results(bag_id: int, db: Session = Depends(get_db)):
    results = db.query(AuthenticationResult).filter(
        AuthenticationResult.bag_id == bag_id
    ).order_by(AuthenticationResult.checked_at.desc()).all()
    return results
