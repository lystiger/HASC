import pytest
from httpx import AsyncClient
import os
from pathlib import Path
import asyncio
import json # Added import

from app.models.product import Product as DBProduct, ProductCategory, ProductStatus
from app.core.config import settings

@pytest.mark.asyncio
async def test_create_product(async_client: AsyncClient, db_session):
    test_image_path = Path("tests/real_image.png") # Use real_image.png from tests directory
    
    test_sku = "TEST-SKU-005"
    test_name = "Test Product from Test"
    test_category = ProductCategory.PACKAGING.value
    test_description = "A product created from a test."
    test_specific_attributes = {"thickness": 100, "width": 500}

    form_data = {
        "sku": test_sku,
        "name": test_name,
        "category": test_category,
        "description": test_description,
        "specific_attributes": json.dumps(test_specific_attributes)
    }

    files = {'images': (test_image_path.name, test_image_path.read_bytes(), 'image/png')}

    response = await async_client.post(
        "/api/v1/products/",
        data=form_data,
        files=files
    )

    assert response.status_code == 202
    created_product = response.json()

    assert created_product["sku"] == test_sku
    assert created_product["name"] == test_name
    assert created_product["category"] == test_category
    assert created_product["description"] == test_description
    assert created_product["specific_attributes"] == test_specific_attributes
    assert created_product["status"] == ProductStatus.PUBLISHED.value
    assert len(created_product["images"]) == 1
    assert created_product["images"][0]["original_name"] == test_image_path.name
    
    # Verify that the image files are created on disk
    web_image_path = Path(created_product["images"][0]["web_url"])
    thumb_image_path = Path(created_product["images"][0]["thumb_url"])
    
    assert web_image_path.exists()
    assert thumb_image_path.exists()

    # Clean up the created image files
    os.remove(web_image_path)
    os.remove(thumb_image_path)
    # The real_image.png is provided by user, so not deleting here.
    
    # Verify product in DB
    db_product = await db_session.get(DBProduct, created_product["id"])
    assert db_product is not None
    assert db_product.sku == test_sku
    assert db_product.name == test_name
    assert db_product.status == ProductStatus.PUBLISHED
