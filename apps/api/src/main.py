from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.presentation.routes import router

app = FastAPI(
    title="TechJobs Radar API",
    version="0.1.0",
    description="Normalized technology jobs and market statistics.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(router)
