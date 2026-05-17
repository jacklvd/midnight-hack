import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.config import get_settings


logger = logging.getLogger(__name__)
router = APIRouter(tags=["midnight"])


class MidnightInfo(BaseModel):
    status: str
    mode: str
    contract_address: str
    sidecar_url: str


@router.get("/midnight/info", response_model=MidnightInfo)
async def midnight_info() -> MidnightInfo:
    settings = get_settings()
    base_url = settings.midnight_sidecar_url.rstrip("/")

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=2.0)) as client:
            response = await client.get(f"{base_url}/health")
    except httpx.HTTPError as exc:
        logger.exception("Sidecar /health unreachable")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach the Midnight sidecar.",
        ) from exc

    if not response.is_success:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text or "Sidecar returned an error.",
        )

    body = response.json()
    return MidnightInfo(
        status=body.get("status", "unknown"),
        mode=body.get("mode", "unknown"),
        contract_address=body.get("contract_address", ""),
        sidecar_url=base_url,
    )
