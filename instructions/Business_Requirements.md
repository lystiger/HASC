# Business Requirements: Phase 1 - Product Catalog Management

## 1. Domain Context
**Company:** HASC VN (hascvn.com.vn)
**Business:** Industrial supplier of packaging films, paint shop filters, and paper industry chemicals.
**Goal:** Replace the legacy static site with a dynamic catalog that allows Admins to upload high-spec industrial products.

## 2. Functional Requirements

### 2.1 Product Data Structure
The system must support a polymorphic product model to handle diverse industrial categories.

**Core Attributes (All Products):**
- `sku`: String (Unique, e.g., "PE-FILM-001").
- `name`: String (e.g., "Màng PE Tự Hủy").
- `category`: Enum (`PACKAGING`, `FILTERS`, `CHEMICALS`, `EQUIPMENT`).
- `description`: HTML/Markdown text.
- `images`: List of image URLs (Original + Thumbnail).

**Category-Specific Attributes (JSONB / Flexible Schema):**
- *Packaging:* Thickness (microns), Width (mm), Length (m).
- *Filters:* Material (Fiberglass/Paper), Efficiency (%).
- *Chemicals:* CAS Number, Volume (Liters), Safety Sheet (PDF Link).

### 2.2 Async Image Processing (The "Core Challenge")
Industrial product photos are often raw, high-res photos taken in warehouses.
- **Input:** Admin uploads 1-5 raw images (up to 10MB each).
- **Process:** The system must asynchronously:
  1. Resize to Web standards (1200x1200px max).
  2. Compress to WebP format.
  3. Generate a 300x300px thumbnail.
- **Output:** The API must return control immediately (Non-blocking).

### 2.3 User Interaction Flow
1.  **Admin Upload:** POST /api/products with JSON data + Multipart Files.
2.  **Ack:** System returns `202 Accepted` with a `task_id`.
3.  **Background:** PostgreSQL Queue processes the images.
4.  **Completion:** Product status updates from `DRAFT` to `PUBLISHED` once images are ready.

## 3. Constraints
-   **Tech Stack:** FastAPI (Backend), React/Vite (Frontend), PostgreSQL (DB).
-   **Queue:** **PostgreSQL-based Task Queue** (No Redis/RabbitMQ allowed).
-   **Storage:** Local filesystem (Docker Volume) for MVP.

## 4. Acceptance Criteria
-   The database schema properly separates Common Attributes vs. Specific Attributes (JSONB is acceptable for specifics).
-   Uploading a 5MB image returns a response in <200ms.
-   The processed image appears in the static folder after ~2 seconds.