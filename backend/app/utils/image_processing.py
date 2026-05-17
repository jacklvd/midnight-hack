from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
}
UPLOAD_READ_CHUNK_SIZE = 1024 * 1024
MAX_IMAGE_DIMENSION_PIXELS = 4_000
MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION_PIXELS * MAX_IMAGE_DIMENSION_PIXELS


def _format_bytes_as_mb(size_bytes: int) -> str:
    size_mb = size_bytes / (1024 * 1024)
    precision = 2 if size_mb >= 1 else 6
    formatted_size = f"{size_mb:.{precision}f}".rstrip("0").rstrip(".") or "0"
    return f"{formatted_size}MB"


async def read_image_upload(file: UploadFile, max_size_bytes: int) -> bytes:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Upload a valid image file.",
        )

    image_bytes = await _read_upload_with_size_limit(file, max_size_bytes)
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    await run_in_threadpool(validate_image_bytes, image_bytes)
    return image_bytes


async def _read_upload_with_size_limit(
    file: UploadFile,
    max_size_bytes: int,
) -> bytes:
    chunks: list[bytes] = []
    total_bytes = 0

    while True:
        bytes_remaining = max_size_bytes + 1 - total_bytes
        chunk = await file.read(min(UPLOAD_READ_CHUNK_SIZE, bytes_remaining))
        if not chunk:
            break

        total_bytes += len(chunk)
        if total_bytes > max_size_bytes:
            _raise_upload_too_large(max_size_bytes)

        chunks.append(chunk)

    return b"".join(chunks)


def _raise_upload_too_large(max_size_bytes: int) -> None:
    raise HTTPException(
        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        detail=(
            "Uploaded image exceeds the "
            f"{_format_bytes_as_mb(max_size_bytes)} size limit."
        ),
    )


def validate_image_bytes(image_bytes: bytes) -> None:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            _validate_image_dimensions(image)
            image.verify()
    except Image.DecompressionBombError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is too large to process safely.",
        ) from exc
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        ) from exc


def image_from_bytes(image_bytes: bytes) -> Image.Image:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            _validate_image_dimensions(image)
            return image.convert("RGB")
    except Image.DecompressionBombError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is too large to process safely.",
        ) from exc
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Invalid image bytes") from exc


def _validate_image_dimensions(image: Image.Image) -> None:
    width, height = image.size
    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        )

    if (
        width > MAX_IMAGE_DIMENSION_PIXELS
        or height > MAX_IMAGE_DIMENSION_PIXELS
        or width * height > MAX_IMAGE_PIXELS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Uploaded image dimensions exceed the "
                f"{MAX_IMAGE_DIMENSION_PIXELS}x{MAX_IMAGE_DIMENSION_PIXELS} "
                "pixel limit."
            ),
        )
