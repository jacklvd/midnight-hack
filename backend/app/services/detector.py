from functools import lru_cache
from typing import Any

from transformers import pipeline

from app.config import get_settings
from app.utils.image_processing import image_from_bytes


class DetectionError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_detector_pipeline() -> Any:
    settings = get_settings()
    return pipeline(
        "image-classification",
        model=settings.detector_model_id,
        device=settings.detector_device,
    )


def analyze_image(image_bytes: bytes) -> dict[str, str | float]:
    classifier = get_detector_pipeline()
    image = image_from_bytes(image_bytes)

    try:
        output = classifier(image)
    except Exception as exc:
        raise DetectionError("Deepfake detection failed") from exc

    if not output:
        raise DetectionError("Deepfake detection returned no predictions")

    predictions = output[0] if isinstance(output[0], list) else output
    top_prediction = max(predictions, key=lambda item: float(item.get("score", 0.0)))

    label = str(top_prediction.get("label", "")).strip()
    score = float(top_prediction.get("score", 0.0))
    if not label:
        raise DetectionError("Deepfake detection returned an empty label")

    return {
        "label": label,
        "confidence": max(0.0, min(score, 1.0)),
    }
