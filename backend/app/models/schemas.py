from datetime import datetime

from pydantic import BaseModel, Field


SHA256_PATTERN = r"^[a-fA-F0-9]{64}$"


class AnalysisResponse(BaseModel):
    hash: str = Field(..., pattern=SHA256_PATTERN)
    label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_id: str


class CommitRequest(BaseModel):
    hash: str = Field(..., pattern=SHA256_PATTERN)
    score: float = Field(..., ge=0.0, le=1.0)
    model_id: str
    label: str | None = None


class CommitResponse(BaseModel):
    hash: str = Field(..., pattern=SHA256_PATTERN)
    score: float = Field(..., ge=0.0, le=1.0)
    model_id: str
    status: str
    tx_id: str
    committed_at: datetime


class VerifyResponse(BaseModel):
    hash: str = Field(..., pattern=SHA256_PATTERN)
    exists: bool
    status: str
    score: float | None = Field(default=None, ge=0.0, le=1.0)
    model_id: str | None = None
    tx_id: str | None = None
    committed_at: datetime | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
