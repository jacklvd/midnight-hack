from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models.schemas import HealthResponse
from app.routers import analyze, commit, midnight_info, verify


settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix=settings.api_prefix)
app.include_router(commit.router, prefix=settings.api_prefix)
app.include_router(verify.router, prefix=settings.api_prefix)
app.include_router(midnight_info.router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name)
