import hashlib


def sha256_image_bytes(image_bytes: bytes) -> str:
    """Return a deterministic SHA-256 hex digest for the exact uploaded bytes."""
    return hashlib.sha256(image_bytes).hexdigest()
