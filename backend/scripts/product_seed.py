"""Seed products and upload their images through the public API.

Creates one product per catalog image set (frontend/public/<folder>) and
uploads the images via POST /api/v1/products/, so they flow through the
normal asynchronous image-processing pipeline (resize, WebP, thumbnail)
and the products are published once processing completes.

Works against any running deployment (local docker-compose or Railway):

    python -m scripts.product_seed \
        --api-base-url https://<backend-domain> \
        --email admin@example.com --password <password>
"""

import argparse
import sys
import time
from pathlib import Path

import httpx

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_IMAGES_ROOT = REPO_ROOT / "frontend" / "public"

PRODUCT_DEFAULTS = [
    {
        "sku": "PE-FILM-LAM-001",
        "category": "PE_FILM_PRINTED_LAMINATED",
        "name_en": "Printed / laminated PE film with adhesive coating",
        "name_vi": "Màng PE in, ghép, tráng keo",
        "description_en": (
            "PE film rolls for printing, lamination and adhesive coating, "
            "supplied in jumbo rolls for bag processing and flexible packaging production."
        ),
        "description_vi": (
            "Cuộn màng PE phục vụ in ấn, ghép màng và tráng keo, "
            "cung cấp dạng cuộn lớn cho gia công túi và sản xuất bao bì mềm."
        ),
        "images": [
            "coloredPEfilm/Adhesive film roll.webp",
            "coloredPEfilm/Film rolls for bag processing.webp",
            "coloredPEfilm/Printing film roll.webp",
        ],
    },
    {
        "sku": "PE-FILM-COLOR-001",
        "category": "COLORED_PE_FILM",
        "name_en": "Colored PE film",
        "name_vi": "Màng PE màu",
        "description_en": (
            "Colored PE film blown and extruded in-house, with customizable color, "
            "width and thickness for industrial packaging applications."
        ),
        "description_vi": (
            "Màng PE màu được thổi và đùn trực tiếp tại nhà máy, tùy chỉnh màu sắc, "
            "khổ và độ dày theo yêu cầu cho bao bì công nghiệp."
        ),
        "images": [f"coloredPEfilm/ex{i}.webp" for i in range(1, 11)],
    },
    {
        "sku": "BELL-CUP-001",
        "category": "PAINT_SPRAY_EQUIPMENT",
        "name_en": "Bell cup for electrostatic paint sprayers",
        "name_vi": "Chén xoay (bell cup) cho súng phun sơn tĩnh điện",
        "description_en": (
            "Precision-machined bell cups for electrostatic rotary paint applicators, "
            "balanced for high-speed rotation and uniform atomization."
        ),
        "description_vi": (
            "Chén xoay gia công chính xác cho thiết bị phun sơn tĩnh điện, "
            "cân bằng động cho tốc độ quay cao và phun sơn đều."
        ),
        "images": ["bellcup/1.webp", "bellcup/2.webp", "bellcup/3.webp", "bellcup/4.webp"],
    },
    {
        "sku": "SPRAY-PARTS-001",
        "category": "PAINT_SPRAY_EQUIPMENT",
        "name_en": "Machined spray equipment components",
        "name_vi": "Linh kiện cơ khí cho thiết bị phun sơn",
        "description_en": (
            "Custom precision-machined stainless steel components and spare parts "
            "for paint spray systems and industrial equipment."
        ),
        "description_vi": (
            "Linh kiện inox gia công chính xác theo yêu cầu, phụ tùng thay thế "
            "cho hệ thống phun sơn và thiết bị công nghiệp."
        ),
        "images": ["technical/1.webp", "technical/2.webp", "technical/3.webp"],
    },
    {
        "sku": "PE-SHRINK-001",
        "category": "PE_SHRINK_FILM",
        "name_en": "Industrial PE shrink film & CPE packaging film",
        "name_vi": "Màng co nhiệt PE & màng CPE công nghiệp",
        "description_en": (
            "High-clarity, high-tensile industrial PE heat shrink film and CPE cast polyethylene film rolls "
            "for multi-pack bundling and pallet wrapping."
        ),
        "description_vi": (
            "Màng co nhiệt PE và cuộn màng CPE chất lượng cao, độ dẻo dai và trong suốt vượt trội, "
            "chuyên dụng cho đóng gói lốc sản phẩm và quấn pallet."
        ),
        "images": ["shrinkfilm/1.webp", "shrinkfilm/2.webp", "shrinkfilm/3.webp"],
    },
    {
        "sku": "PACK-BAG-001",
        "category": "PACKAGING_BAGS",
        "name_en": "Product packaging bags",
        "name_vi": "Túi bao gói sản phẩm",
        "description_en": (
            "Transparent PE/PP packaging bags manufactured to customer size "
            "and thickness specifications for product protection."
        ),
        "description_vi": (
            "Túi PE/PP trong suốt sản xuất theo kích thước và độ dày yêu cầu, "
            "dùng để bao gói và bảo vệ sản phẩm."
        ),
        "images": [f"bag/{i}.webp" for i in range(1, 6)],
    },
    {
        "sku": "PAPER-CHEM-001",
        "category": "PAPER_CHEMICALS",
        "name_en": "Antifoam agent for paper production",
        "name_vi": "Chất phá bọt cho sản xuất giấy",
        "description_en": (
            "Industrial antifoam agent for the paper industry, supplied in 1000 kg IBC tanks "
            "to control foaming in paper production lines."
        ),
        "description_vi": (
            "Chất phá bọt công nghiệp cho ngành giấy, cung cấp dạng bồn IBC 1000 kg, "
            "kiểm soát bọt trong dây chuyền sản xuất giấy."
        ),
        "images": ["chemical/1.webp", "chemical/2.webp", "chemical/3.webp", "chemical/4.webp"],
    },
    {
        "sku": "FILTER-001",
        "category": "FILTER_EQUIPMENT",
        "name_en": "Industrial filter cartridges",
        "name_vi": "Lõi lọc công nghiệp",
        "description_en": (
            "Industrial filter cartridges and filtration equipment for production lines, "
            "packed for safe transport and storage."
        ),
        "description_vi": (
            "Lõi lọc và thiết bị lọc công nghiệp cho dây chuyền sản xuất, "
            "đóng gói an toàn cho vận chuyển và lưu kho."
        ),
        "images": [f"filder/{i}.webp" for i in range(1, 6)],
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed products with images via the API.")
    parser.add_argument(
        "--api-base-url",
        default="http://localhost:8000",
        help="Backend base URL, e.g. https://<backend-domain> (default: http://localhost:8000)",
    )
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument(
        "--images-root",
        type=Path,
        default=DEFAULT_IMAGES_ROOT,
        help=f"Directory holding the product image folders (default: {DEFAULT_IMAGES_ROOT})",
    )
    parser.add_argument(
        "--publish-timeout",
        type=int,
        default=300,
        help="Seconds to wait for image processing to publish each product (default: 300)",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing products before seeding (useful to refresh upscaled images)",
    )
    return parser.parse_args()


def login(client: httpx.Client, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": password},
    )
    if response.status_code != 200:
        raise SystemExit(f"Login failed ({response.status_code}): {response.text}")
    return response.json()["access_token"]


def product_exists(client: httpx.Client, sku: str) -> bool:
    response = client.get("/api/v1/products", params={"sku": sku})
    response.raise_for_status()
    return len(response.json()) > 0


def create_product(client: httpx.Client, product: dict, images_root: Path) -> int:
    all_images = product["images"]
    first_batch = all_images[:8]
    extra_images = all_images[8:]

    files = []
    for relative_path in first_batch:
        image_path = images_root / relative_path
        if not image_path.is_file():
            raise SystemExit(f"Image not found: {image_path}")
        files.append(
            ("images", (image_path.name, image_path.read_bytes(), "image/webp"))
        )

    response = client.post(
        "/api/v1/products/",
        data={
            "sku": product["sku"],
            "name_en": product["name_en"],
            "name_vi": product["name_vi"],
            "description_en": product["description_en"],
            "description_vi": product["description_vi"],
            "category": product["category"],
            "specific_attributes": "{}",
        },
        files=files,
    )
    if response.status_code != 202:
        raise SystemExit(
            f"Failed to create product {product['sku']} ({response.status_code}): {response.text}"
        )
    product_id = response.json()["product_id"]

    for i in range(0, len(extra_images), 8):
        chunk = extra_images[i : i + 8]
        chunk_files = []
        for relative_path in chunk:
            image_path = images_root / relative_path
            if not image_path.is_file():
                raise SystemExit(f"Image not found: {image_path}")
            chunk_files.append(
                ("images", (image_path.name, image_path.read_bytes(), "image/webp"))
            )
        resp = client.post(f"/api/v1/products/{product_id}/images", files=chunk_files)
        if resp.status_code != 202:
            raise SystemExit(
                f"Failed to add images to product {product['sku']} ({resp.status_code}): {resp.text}"
            )

    return product_id


def wait_for_publish(client: httpx.Client, product_id: int, sku: str, timeout: int) -> str:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        response = client.get(f"/api/v1/products/{product_id}")
        response.raise_for_status()
        status = response.json()["status"]
        if status in ("PUBLISHED", "FAILED"):
            return status
        time.sleep(5)
    print(f"Timed out waiting for product {sku} (id={product_id}) to finish processing.")
    return "DRAFT"


def main() -> None:
    args = parse_args()
    with httpx.Client(base_url=args.api_base_url.rstrip("/"), timeout=120.0) as client:
        token = login(client, args.email, args.password)
        client.headers["Authorization"] = f"Bearer {token}"

        if args.replace:
            print("Cleaning up existing products before re-seeding...")
            existing_resp = client.get("/api/v1/products")
            if existing_resp.status_code == 200:
                for p in existing_resp.json():
                    del_resp = client.delete(f"/api/v1/products/{p['id']}")
                    if del_resp.status_code == 204:
                        print(f"Deleted product {p['sku']} (id={p['id']})")

        created: list[tuple[int, str]] = []
        for product in PRODUCT_DEFAULTS:
            if product_exists(client, product["sku"]):
                print(f"Skipping {product['sku']}: already exists.")
                continue
            product_id = create_product(client, product, args.images_root)
            print(f"Created {product['sku']} (id={product_id}), {len(product['images'])} images queued.")
            created.append((product_id, product["sku"]))

        failed = []
        for product_id, sku in created:
            status = wait_for_publish(client, product_id, sku, args.publish_timeout)
            print(f"{sku}: {status}")
            if status != "PUBLISHED":
                failed.append(sku)

        if failed:
            raise SystemExit(f"Products not published: {', '.join(failed)}")
        print(f"Done. {len(created)} product(s) created and published.")


if __name__ == "__main__":
    main()
