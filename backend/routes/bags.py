from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from datetime import date

from database import get_db
from models import Bag, PurchaseProofImage, AuthenticationImage
from schemas import BagCreate, BagUpdate, BagResponse, BagDetailResponse, ImageUploadResponse

router = APIRouter(prefix="/api/bags", tags=["包包档案"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "purchase"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "auth"), exist_ok=True)


@router.get("/", response_model=List[BagResponse])
def get_bags(brand: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Bag)
    if brand:
        query = query.filter(Bag.brand == brand)
    return query.order_by(Bag.created_at.desc()).all()


@router.get("/{bag_id}", response_model=BagDetailResponse)
def get_bag(bag_id: int, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    result = {
        **bag.__dict__,
        "purchase_proof_images": [
            {"id": img.id, "image_path": img.image_path, "description": img.description}
            for img in bag.purchase_proof_images
        ],
        "authentication_images": [
            {"id": img.id, "image_type": img.image_type, "image_path": img.image_path, "description": img.description}
            for img in bag.authentication_images
        ],
        "maintenance_records": [
            {"id": rec.id, "service_date": rec.service_date, "service_type": rec.service_type, "cost": rec.cost}
            for rec in bag.maintenance_records
        ]
    }
    return result


@router.post("/", response_model=BagResponse)
def create_bag(bag: BagCreate, db: Session = Depends(get_db)):
    db_bag = Bag(**bag.dict())
    db.add(db_bag)
    db.commit()
    db.refresh(db_bag)
    return db_bag


@router.put("/{bag_id}", response_model=BagResponse)
def update_bag(bag_id: int, bag: BagUpdate, db: Session = Depends(get_db)):
    db_bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not db_bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    update_data = bag.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_bag, key, value)

    db.commit()
    db.refresh(db_bag)
    return db_bag


@router.delete("/{bag_id}")
def delete_bag(bag_id: int, db: Session = Depends(get_db)):
    db_bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not db_bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    db.delete(db_bag)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{bag_id}/purchase-proofs", response_model=ImageUploadResponse)
async def upload_purchase_proof(
    bag_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, "purchase", file_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    db_image = PurchaseProofImage(
        bag_id=bag_id,
        image_path=f"/uploads/purchase/{file_name}",
        description=description
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return db_image


@router.post("/{bag_id}/auth-images", response_model=ImageUploadResponse)
async def upload_auth_image(
    bag_id: int,
    image_type: str = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, "auth", file_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    db_image = AuthenticationImage(
        bag_id=bag_id,
        image_type=image_type,
        image_path=f"/uploads/auth/{file_name}",
        description=description
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return db_image


@router.delete("/auth-images/{image_id}")
def delete_auth_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(AuthenticationImage).filter(AuthenticationImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")

    full_path = os.path.join(os.path.dirname(__file__), image.image_path.lstrip("/"))
    if os.path.exists(full_path):
        os.remove(full_path)

    db.delete(image)
    db.commit()
    return {"message": "删除成功"}
