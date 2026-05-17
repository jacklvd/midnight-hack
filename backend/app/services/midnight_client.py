import logging
from datetime import datetime
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import get_settings


logger = logging.getLogger(__name__)


class MidnightSidecarError(HTTPException):
    """Raised when the Midnight sidecar returns a non-2xx response."""


def _parse_iso_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class MidnightClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.midnight_sidecar_url.rstrip("/")
        self._timeout = httpx.Timeout(30.0, connect=5.0)

    async def commit_verdict(
        self,
        image_hash: str,
        score: float,
        model_id: str,
    ) -> dict[str, Any]:
        logger.info(
            "Sidecar commit requested",
            extra={"hash": image_hash, "score": score, "model_id": model_id},
        )

        payload = {"hash": image_hash, "score": score, "model_id": model_id}
        body = await self._post_json("/commit", payload)

        return {
            "hash": image_hash,
            "score": score,
            "model_id": model_id,
            "status": body["status"],
            "tx_id": body["tx_id"],
            "committed_at": _parse_iso_timestamp(body["committed_at"]),
        }

    async def get_verdict(self, image_hash: str) -> dict[str, Any]:
        logger.info("Sidecar lookup requested", extra={"hash": image_hash})

        body = await self._get_json(f"/verify/{image_hash}")

        if not body.get("exists"):
            return {
                "hash": image_hash,
                "exists": False,
                "status": "not_found",
                "score": None,
                "model_id": None,
                "tx_id": None,
                "committed_at": None,
            }

        return {
            "hash": body["hash"],
            "exists": True,
            "status": "committed",
            "score": body["score"],
            "model_id": body["model_id"],
            "tx_id": body["tx_id"],
            "committed_at": _parse_iso_timestamp(body["committed_at"]),
        }

    async def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(
                base_url=self._base_url, timeout=self._timeout
            ) as client:
                response = await client.post(path, json=payload)
        except httpx.HTTPError as exc:
            logger.exception("Sidecar request failed")
            raise MidnightSidecarError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to reach the Midnight sidecar.",
            ) from exc

        return self._unwrap(response)

    async def _get_json(self, path: str) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(
                base_url=self._base_url, timeout=self._timeout
            ) as client:
                response = await client.get(path)
        except httpx.HTTPError as exc:
            logger.exception("Sidecar request failed")
            raise MidnightSidecarError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to reach the Midnight sidecar.",
            ) from exc

        return self._unwrap(response)

    @staticmethod
    def _unwrap(response: httpx.Response) -> dict[str, Any]:
        if response.is_success:
            return response.json()

        detail: str
        try:
            detail = response.json().get("detail") or response.text
        except ValueError:
            detail = response.text or "Sidecar returned an error."

        raise MidnightSidecarError(status_code=response.status_code, detail=detail)


midnight_client = MidnightClient()
