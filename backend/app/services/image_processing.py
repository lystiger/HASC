import os
import uuid
from pathlib import Path
from typing import List, Tuple
from PIL import Image

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.product import Product as DBProduct, ProductStatus


# Image processing constants
MAX_WEB_IMAGE_SIZE = (1200, 1200)
THUMBNAIL_SIZE = (300, 300)
WEBP_QUALITY = 85

# This file now primarily serves as a place for constants or future utility functions
# related to image processing that are NOT part of the asynchronous task queue logic.
# The core image processing logic has been moved to the worker.
