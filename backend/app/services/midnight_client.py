import asyncio
import hashlib
import logging
from datetime import UTC, datetime


logger = logging.getLogger(__name__)


class MidnightClient:
    def __init__(self) -> None:
        self._verdicts: dict[str, dict[str, object]] = {}

    async def commit_verdict(self, image_hash: str, score: float, model_id: str) -> dict[str, object]:
        logger.info(
            "Mock Midnight commit requested",
            extra={"hash": image_hash, "score": score, "model_id": model_id},
        )
        await asyncio.sleep(0)

        tx_id = self._mock_tx_id(image_hash, score, model_id)
        committed_at = datetime.now(UTC)
        verdict = {
            "hash": image_hash,
            "score": score,
            "model_id": model_id,
            "status": "committed",
            "tx_id": tx_id,
            "committed_at": committed_at,
        }
        self._verdicts[image_hash.lower()] = verdict
        return verdict

    async def get_verdict(self, image_hash: str) -> dict[str, object]:
        logger.info("Mock Midnight lookup requested", extra={"hash": image_hash})
        await asyncio.sleep(0)

        verdict = self._verdicts.get(image_hash.lower())
        if verdict is None:
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
            "hash": verdict["hash"],
            "exists": True,
            "status": verdict["status"],
            "score": verdict["score"],
            "model_id": verdict["model_id"],
            "tx_id": verdict["tx_id"],
            "committed_at": verdict["committed_at"],
        }

    @staticmethod
    def _mock_tx_id(image_hash: str, score: float, model_id: str) -> str:
        payload = f"{image_hash}:{score:.8f}:{model_id}".encode("utf-8")
        return f"mock_midnight_{hashlib.sha256(payload).hexdigest()[:32]}"


midnight_client = MidnightClient()
