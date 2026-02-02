# Revised Project Migration Plan

This document outlines the steps to build and launch a new dynamic product catalog system for your company, inspired by the functionality of `https://hascvn.com.vn/`, given that you do not own the source code or data of the reference website.

---

### Phase 1: New System Completion & Hardening (Build Your System)

This phase focuses on completing and robustly implementing the features of your new product catalog system.

1.  **Complete Core Product API:**
    *   **Implement Filtering:** Enhance the `GET /products` endpoint to support filtering by various criteria (e.g., category, status, SKU, name) as identified in `Product_API_Status.md`.
    *   **Robust Error Handling:** Ensure all product API operations (create, get, update, delete) have comprehensive error handling and validation for edge cases.

2.  **Implement Dynamic Category Management (Decision Required):**
    *   **Evaluate Need:** Decide if the current static `ProductCategory` enum (as noted in `Category_API_Status.md`) is sufficient for your company's product categories. If your categories are expected to change or grow, a dynamic Category API will be necessary.
    *   **If Dynamic API Needed:** Implement dedicated API endpoints (CRUD operations) for managing categories, storing them in the database, and updating the `Product` model to reference these dynamic categories.

3.  **Harden Asynchronous Image Pipeline:**
    *   **Performance Verification:** Conduct thorough testing to confirm that the image processing pipeline meets the "~2 seconds" performance target specified in `Business_Requirements.md`.
    *   **Robust Error Handling & Retries:** Implement comprehensive error handling, logging, and retry mechanisms within `process_images_async` to gracefully manage corrupted images, processing failures, or storage issues. This is crucial for a "comfortable" frontend experience, as highlighted in `Async_Image_Pipeline_Status.md`.

4.  **Implement Robust Auth & Role Management:**
    *   **Protect Management Endpoints:** Implement authentication (`Depends(get_current_user)`) for all product management endpoints (`POST /products`, `PUT /products/{product_id}`, `DELETE /products/{product_id}`).
    *   **Role-Based Authorization:** Implement role-based access control (RBAC) to restrict access to management endpoints (e.g., only `ADMIN` users can create, update, or delete products). This will involve:
        *   Modifying `create_access_token` in `app/core/security.py` to include the user's `role` in the JWT payload.
        *   Creating a new FastAPI dependency (e.g., `get_current_admin_user`) that checks the user's role from the JWT.
    *   **Public vs. Protected Details:** Decide if `GET /products/{product_id}` should be publicly accessible or require authentication, and implement protection accordingly.
    *   **Admin User Creation:** Implement a secure way to create initial admin users.

5.  **Frontend Development:**
    *   **Admin Product Management UI:** Develop the complete user interface for administrators to upload new products, view their status (DRAFT, PUBLISHED), edit details, and manage existing products.
    *   **Public Product Catalog UI:** Develop the public-facing frontend for browsing the product catalog, including category filtering and displaying product details with processed images and thumbnails.
    *   **Asynchronous Feedback:** Implement UI elements to provide feedback during asynchronous image uploads and status changes.

6.  **Comprehensive Testing:**
    *   **Unit & Integration Tests:** Ensure all new and existing backend features have comprehensive unit and integration tests, as mandated by `Guidelines.md`.
    *   **End-to-End Testing:** Conduct full end-to-end tests covering user flows from frontend interaction through backend processing and database updates.
    *   **Security Audits:** Perform thorough security testing, especially for authentication, authorization, and data handling.
    *   **Performance & Load Testing:** Verify the system's performance under expected load conditions.

---

### Phase 2: Data Acquisition for Your New System

Since you do not have access to the source code or data of the reference website (`https://hascvn.com.vn/`), you will need to acquire and input your company's own product data.

1.  **Content Strategy & Data Collection:**
    *   Work with your company to define the exact product catalog structure, categories, and content for *your* products.
    *   Gather all necessary product details (SKUs, names, descriptions, specific attributes) and high-quality images for your company's offerings.
2.  **Manual Data Entry:**
    *   Utilize the newly developed admin UI to manually input all your company's product data into the new system. This includes uploading product images, which will then go through your asynchronous image pipeline.
3.  **Bulk Import (Optional, if volume is high):**
    *   If you have a very large number of products, you might consider developing a one-time bulk import script that reads your product data from a structured source (e.g., CSV, Excel) and uses your new system's API to create products. This would still require manual image acquisition and potentially mapping.
    *   **Note on Web Scraping:** While technically possible to scrape data from `https://hascvn.com.vn/`, this carries significant legal and ethical risks (violating terms of service, copyright). It is generally **not recommended** unless explicitly approved by legal counsel and the website owner. Focus on your own company's data.

---

### Phase 3: Deployment & Launch

This phase involves deploying your new system and making it live with your company's data.

1.  **Infrastructure Setup:**
    *   Provision and configure the production environment (servers, PostgreSQL database, file storage for uploads) according to the project's Docker-based infrastructure requirements.
2.  **Deployment:**
    *   Deploy your new FastAPI backend and React frontend applications to the production environment.
3.  **DNS Update:**
    *   Once thoroughly tested in production, update your company's domain DNS records to point to the new system's frontend.
4.  **Monitoring & Logging:**
    *   Set up robust monitoring, alerting, and centralized logging for both the backend and frontend to quickly identify and address any issues post-launch.
