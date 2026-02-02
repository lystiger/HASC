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
    test_image_path = Path(__file__).parent / "real_image.png"

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
    payload = response.json()

    assert response.status_code == 202
    assert "product_id" in payload
    assert isinstance(payload["product_id"], int)
    assert "task_ids" in payload
    assert isinstance(payload["task_ids"], list)
    assert len(payload["task_ids"]) > 0
            
    return payload

async def get_product(async_client: AsyncClient, product_id: int):
    response = await async_client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    return response.json()

async def wait_for_product(async_client: AsyncClient, product_id: int, timeout=3, poll_interval=0.1):
    start_time = asyncio.get_event_loop().time()
    while True:
        product = await get_product(async_client, product_id)
        if product["status"] == ProductStatus.PUBLISHED.value:
            return product
        # If the product status indicates a non-draft state (e.g., in processing, or if a FAILED state is eventually added),
        # we might want to check for it here. For now, assuming only PUBLISHED is a successful terminal state.
        if asyncio.get_event_loop().time() - start_time > timeout:
            raise TimeoutError(f"Product {product_id} processing timed out after {timeout} seconds. Current status: {product['status']}")
        await asyncio.sleep(poll_interval)


@pytest.mark.asyncio
async def test_create_product(async_client: AsyncClient, db_session):
    test_image_path = Path(__file__).parent / "real_image.png"
    
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

    product_id = created_product["product_id"]
    task_ids = created_product["task_ids"]

    assert isinstance(product_id, int)
    assert isinstance(task_ids, list)
    assert len(task_ids) == 1 # Assuming one image for this test

    # Fetch product from DB to verify initial state
    db_product = await db_session.get(DBProduct, product_id)
    assert db_product is not None
    assert db_product.sku == test_sku
    assert db_product.name == test_name
    assert db_product.status == ProductStatus.DRAFT # Should be DRAFT initially
    assert db_product.images == [] # Should be empty initially

    # This part of the test now needs to be re-evaluated as it depends on image processing
    # For now, we will comment out assertions that expect processed state or full product details
    # These will be covered by the workflow tests using wait_for_product
    """
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
    """

@pytest.mark.asyncio
async def test_get_product_by_id(async_client: AsyncClient, db_session):
    # Create a product to fetch
    create_resp = await create_test_product(async_client, "001")
    product_id = create_resp["product_id"]

    product_data = await wait_for_product(async_client, product_id)

    assert product_data["id"] == product_id
    assert product_data["sku"] == "TEST-SKU-001"
    assert "images" in product_data
    assert len(product_data["images"]) > 0
    # Clean up generated files (assuming processing creates files)
    os.remove(Path(product_data["images"][0]["web_url"]))
    os.remove(Path(product_data["images"][0]["thumb_url"]))
    # The original_image_path is not directly available in product_data,
    # but it was stored in the task metadata. For simplicity in test cleanup,
    # we might need to fetch the task or make an assumption about its naming.
    # For now, we assume the worker cleans up the original temp file.


@pytest.mark.asyncio
async def test_update_product(async_client: AsyncClient, db_session):
    # Create a product to update
    create_resp = await create_test_product(async_client, "002")
    product_id = create_resp["product_id"]

    product = await wait_for_product(async_client, product_id)

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
    expected_specific_attributes = product["specific_attributes"]
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

    # Clean up generated files (assuming processing creates files)
    os.remove(Path(updated_product["images"][0]["web_url"]))
    os.remove(Path(updated_product["images"][0]["thumb_url"]))