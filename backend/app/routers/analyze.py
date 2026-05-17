from fastapi import APIRouter, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
from app.models.schemas import AnalysisResponse
from app.services.detector import DetectionError, analyze_image
from app.services.hasher import sha256_image_bytes
from app.utils.image_processing import read_image_upload


router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_upload(file: UploadFile = File(...)) -> AnalysisResponse:
    settings = get_settings()
    image_bytes = await read_image_upload(file, settings.max_upload_size_bytes)
    image_hash = sha256_image_bytes(image_bytes)

    try:
        detection = await run_in_threadpool(analyze_image, image_bytes)
    except DetectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image analysis is temporarily unavailable.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        ) from exc

    return AnalysisResponse(
        hash=image_hash,
        label=str(detection["label"]),
        confidence=float(detection["confidence"]),
        model_id=settings.detector_model_id,
    )
