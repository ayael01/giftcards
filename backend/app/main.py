import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import admin, gift_cards

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gift Cards MVP API")

frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(admin.router)
app.include_router(gift_cards.router)
