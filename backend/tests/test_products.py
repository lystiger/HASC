import pytest
from httpx import AsyncClient
import os
from pathlib import Path
import asyncio
import json # Added import

from app.models.product import Product as DBProduct, ProductCategory, ProductStatus
from app.core.config import settings

# Helper function to create a product for testing
async def create_test_product(async_client: AsyncClient, sku_suffix: str):
    test_image_path = Path("tests/real_image.png") # Using real_image.png for testing

    test_sku = f"TEST-SKU-{sku_suffix}"
    test_name = f"Test Product {sku_suffix}"
    test_category = ProductCategory.FILTERS.value
    test_description = f"A product created for test {sku_suffix}."
    test_specific_attributes = {"length": 10, "height": 20}

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
            
    return created_product

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

@pytest.mark.asyncio
async def test_get_product_by_id(async_client: AsyncClient, db_session):
    # Create a product to fetch
    product_data = await create_test_product(async_client, "001")
    product_id = product_data["id"]

    # Fetch the product by ID
    response = await async_client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    fetched_product = response.json()

    assert fetched_product["id"] == product_id
    assert fetched_product["sku"] == product_data["sku"]
    assert fetched_product["name"] == product_data["name"]
    assert fetched_product["category"] == product_data["category"]
    assert fetched_product["description"] == product_data["description"]
    assert fetched_product["specific_attributes"] == product_data["specific_attributes"]
    assert fetched_product["status"] == product_data["status"]
    assert len(fetched_product["images"]) == len(product_data["images"])


@pytest.mark.asyncio
async def test_update_product(async_client: AsyncClient, db_session):
    # Create a product to update
    product_data = await create_test_product(async_client, "002")
    product_id = product_data["id"]

    # Prepare update data
    updated_name = "Updated Test Product Name"
    updated_description = "This is an updated description."
    updated_specific_attributes = {"material": "plastic", "weight": 100}
    
    update_payload = {
        "name": updated_name,
        "description": updated_description,
        "specific_attributes": updated_specific_attributes,
        "status": ProductStatus.PUBLISHED.value # Update status
    }

    # Make PUT request to update the product
    response = await async_client.put(f"/api/v1/products/{product_id}", json=update_payload)
    assert response.status_code == 200
    updated_product = response.json()

    # Assert the response reflects the updates
    assert updated_product["id"] == product_id
    assert updated_product["name"] == updated_name
    assert updated_product["description"] == updated_description
    # Assert that specific_attributes are merged/updated
    expected_specific_attributes = product_data["specific_attributes"]
    expected_specific_attributes.update(updated_specific_attributes)
    assert updated_product["specific_attributes"] == expected_specific_attributes
    assert updated_product["status"] == ProductStatus.PUBLISHED.value
    
    # Verify in DB
    db_product = await db_session.get(DBProduct, product_id)
    assert db_product is not None
    assert db_product.name == updated_name
    assert db_product.description == updated_description
    assert db_product.specific_attributes == expected_specific_attributes
    assert db_product.status == ProductStatus.PUBLISHED
