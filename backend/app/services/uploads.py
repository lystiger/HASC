"""Upload intake hardening for product images (Phase 3).

Central place for validating, sizing, and safely staging uploaded images before
they are handed to the async image-processing worker. Every stored path is
server-controlled; no client-supplied filename, extension, or Content-Type is
ever trusted to decide what a file is or where it lands.
"""

import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import Dict, Iterable, List

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

# Canonical Pillow format name -> server-controlled file extension. Only these
# formats are accepted; the extension is derived from the *decoded* format, never
# from the client filename.
ALLOWED_IMAGE_FORMATS: Dict[str, str] = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}

_READ_CHUNK_SIZE = 1024 * 1024  # 1 MiB


async def read_upload_within_limit(upload: UploadFile) -> bytes:
    """Read an ``UploadFile`` in bounded 1 MiB chunks, aborting as soon as the
    configured per-file limit is exceeded.

    This never buffers an unbounded upload in memory: a multi-gigabyte body is
    rejected after just over the limit has been read. Raises HTTP 413 when the
    per-file size limit is exceeded.
    """
    max_bytes = settings.max_upload_size_bytes
    buffer = bytearray()
    while True:
        chunk = await upload.read(_READ_CHUNK_SIZE)
        if not chunk:
            break
        buffer.extend(chunk)
        if len(buffer) > max_bytes:
            raise HTTPException(
                status_code=413,  # Content Too Large
                detail=f"Each image must be {settings.MAX_UPLOAD_SIZE_MB} MB or smaller.",
            )
    return bytes(buffer)


def validate_image_bytes(data: bytes) -> str:
    """Validate that ``data`` is a supported, intact, within-limits image by
    decoding it with Pillow.

    Validation is independent of any client-supplied filename, extension, or
    Content-Type — the bytes themselves are the sole source of truth. Returns the
    canonical extension for the detected format. Raises HTTP 400 on any problem
    and never leaks internal Pillow exception details to the client.
    """
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty.",
        )

    # Pass 1: read only the header to learn format + dimensions WITHOUT decoding
    # the pixel data, so an oversized "decompression bomb" is rejected before any
    # large allocation happens.
    try:
        with Image.open(BytesIO(data)) as image:
            image_format = (image.format or "").upper()
            width, height = image.size
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not a valid image.",
        )

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type. Allowed types: JPEG, PNG, WEBP.",
        )

    if width <= 0 or height <= 0 or (width * height) > settings.MAX_IMAGE_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image dimensions exceed the maximum allowed size.",
        )

    # Pass 2: fully decode to prove the pixel data is intact. Catches truncated or
    # malformed files that carry a valid-looking header.
    try:
        with Image.open(BytesIO(data)) as image:
            image.load()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image appears to be corrupt or unreadable.",
        )

    return ALLOWED_IMAGE_FORMATS[image_format]


def sanitize_original_filename(filename: str | None) -> str:
    """Return a display-only, path-free version of a client filename.

    Used only for the human-readable ``original_name`` shown alongside a product
    image — never to build a filesystem path (storage names are server-generated).
    """
    if not filename:
        return "upload"
    # Drop any directory components from both POSIX and Windows separators.
    base = os.path.basename(filename.replace("\\", "/")).strip()
    return base[:255] or "upload"


def _safe_temp_path(extension: str) -> str:
    """Build a fully server-controlled temp path and assert it stays inside the
    configured temp upload directory (defence-in-depth against path traversal)."""
    temp_dir = Path(settings.TEMP_UPLOAD_DIR).resolve()
    temp_dir.mkdir(parents=True, exist_ok=True)
    filename = f"temp_original_{uuid.uuid4().hex}{extension}"
    candidate = (temp_dir / filename).resolve()
    if not candidate.is_relative_to(temp_dir):
        # Should be unreachable (filename is server-generated) but never write
        # outside the intended directory.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload path.",
        )
    return str(candidate)


def remove_files(paths: Iterable[str]) -> None:
    """Idempotently remove temp files; never raises."""
    for path in paths:
        if not path:
            continue
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
        except OSError:
            pass


async def stage_images(images: List[UploadFile]) -> List[Dict[str, str]]:
    """Validate and persist each uploaded image to a server-controlled temp file.

    Enforces the per-request count limit (400), the per-file size limit (413), and
    image validity (400). On ANY failure, every temp file already written for this
    request is removed before the error propagates, so a rejected request never
    leaves partial files behind.

    Returns a list of ``{"original_image_path", "original_filename",
    "content_type"}`` dicts to be recorded in each processing task's metadata.
    """
    if len(images) > settings.MAX_IMAGES_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Too many images. A maximum of {settings.MAX_IMAGES_PER_REQUEST} "
                "images may be uploaded per request."
            ),
        )

    staged: List[Dict[str, str]] = []
    written_paths: List[str] = []
    try:
        for image in images:
            data = await read_upload_within_limit(image)  # 413 if oversized
            extension = validate_image_bytes(data)        # 400 if invalid
            temp_path = _safe_temp_path(extension)
            with open(temp_path, "wb") as buffer:
                buffer.write(data)
            written_paths.append(temp_path)
            staged.append(
                {
                    "original_image_path": temp_path,
                    "original_filename": sanitize_original_filename(image.filename),
                    "content_type": image.content_type or "application/octet-stream",
                }
            )
        return staged
    except Exception:
        # Remove every partial file written for this request before re-raising.
        remove_files(written_paths)
        raise
