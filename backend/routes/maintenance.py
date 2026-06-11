from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from database import get_db
from models import MaintenanceRecord, Bag
from schemas import MaintenanceRecordCreate, MaintenanceRecordUpdate, MaintenanceRecordResponse

router = APIRouter(prefix="/api/maintenance", tags=["保养记录"])

UPLOAD_DIR = "uploads/maintenance"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/{bag_id}", response_model=List[MaintenanceRecordResponse])
def get_maintenance_records(bag_id: int, db: Session = Depends(get_db)):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    return db.query(MaintenanceRecord).filter(
        MaintenanceRecord.bag_id == bag_id
    ).order_by(MaintenanceRecord.service_date.desc()).all()


@router.get("/record/{record_id}", response_model=MaintenanceRecordResponse)
def get_maintenance_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.post("/{bag_id}", response_model=MaintenanceRecordResponse)
def create_maintenance_record(
    bag_id: int,
    record: MaintenanceRecordCreate,
    db: Session = Depends(get_db)
):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()
    if not bag:
        raise HTTPException(status_code=404, detail="包包不存在")

    db_record = MaintenanceRecord(bag_id=bag_id, **record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/record/{record_id}", response_model=MaintenanceRecordResponse)
def update_maintenance_record(
    record_id: int,
    record: MaintenanceRecordUpdate,
    db: Session = Depends(get_db)
):
    db_record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="记录不存在")

    update_data = record.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_record, key, value)

    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete("/record/{record_id}")
def delete_maintenance_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    if record.before_photo:
        full_path = os.path.join(os.path.dirname(__file__), "..", record.before_photo.lstrip("/"))
        if os.path.exists(full_path):
            os.remove(full_path)
    if record.after_photo:
        full_path = os.path.join(os.path.dirname(__file__), "..", record.after_photo.lstrip("/"))
        if os.path.exists(full_path):
            os.remove(full_path)

    db.delete(record)
    db.commit()
    return {"message": "删除成功"}


@router.post("/record/{record_id}/photo/{photo_type}")
async def upload_maintenance_photo(
    record_id: int,
    photo_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    if photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="photo_type 只能是 before 或 after")

    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    photo_path = f"/uploads/maintenance/{file_name}"
    if photo_type == "before":
        record.before_photo = photo_path
    else:
        record.after_photo = photo_path

    db.commit()
    db.refresh(record)
    return {"photo_path": photo_path, "photo_type": photo_type}
