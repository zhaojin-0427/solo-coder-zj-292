from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base
from routes import bags, authentication, maintenance, stats, appraisals, consignments, value_monitor, insurance

Base.metadata.create_all(bind=engine)

app = FastAPI(title="奢鉴 - 二手奢侈品包包真伪自鉴与养护记录平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(bags.router)
app.include_router(authentication.router)
app.include_router(maintenance.router)
app.include_router(stats.router)
app.include_router(appraisals.router)
app.include_router(consignments.router)
app.include_router(value_monitor.router)
app.include_router(insurance.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "奢鉴平台服务运行中"}
