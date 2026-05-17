from fastapi import APIRouter, HTTPException, status

from app.models.schemas import CommitRequest, CommitResponse
from app.services.midnight_client import midnight_client


router = APIRouter(tags=["midnight"])


@router.post("/commit", response_model=CommitResponse)
async def commit_verdict(request: CommitRequest) -> CommitResponse:
    try:
        result = await midnight_client.commit_verdict(
            image_hash=request.hash,
            score=request.score,
            model_id=request.model_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to commit verdict to Midnight.",
        ) from exc

    return CommitResponse(**result)
