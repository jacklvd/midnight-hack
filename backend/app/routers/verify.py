from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.models.schemas import SHA256_PATTERN, VerifyResponse
from app.services.midnight_client import midnight_client


router = APIRouter(tags=["midnight"])


@router.get("/verify/{image_hash}", response_model=VerifyResponse)
async def verify_verdict(
    image_hash: Annotated[str, Path(..., pattern=SHA256_PATTERN)],
) -> VerifyResponse:
    try:
        result = await midnight_client.get_verdict(image_hash)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to verify verdict with Midnight.",
        ) from exc

    return VerifyResponse(**result)
