# Summary
Source code for HASC company, made by Lystiger

# Project Overview
This project aims to replace a legacy static website with a dynamic product catalog for HASC VN, an industrial supplier. The core functionality involves allowing administrators to upload high-specification industrial products, with a key focus on asynchronous image processing.

# Current State (Based on Documentation)
The project is currently in the **design and initial implementation phase**, with a clear architectural blueprint and detailed requirements. The foundational components are being established according to strict guidelines.

## Key Implementations (Architectural & Design)
*   **Backend:** Developed with FastAPI (Python 3.11+), utilizing PostgreSQL as the primary database, SQLAlchemy for ORM, and Alembic for migrations. JWT is planned for stateless authentication.
*   **Frontend:** Built with React (TypeScript) and Vite, focusing on a clean, functional UI.
*   **Core Feature - Asynchronous Image Processing:** Designed to handle raw, high-resolution product images. This involves resizing, WebP compression, and thumbnail generation, processed asynchronously via a custom PostgreSQL-backed task queue.
*   **Product Data Model:** Supports a polymorphic structure with core and category-specific attributes (using JSONB).

# Next Steps to Meet Business Needs
To achieve a fully functional and production-ready system for clients, the following areas require immediate focus and completion:

1.  **Complete Feature Implementation:**
    *   Finalize all API endpoints for product creation, retrieval, update, and deletion, including multipart file uploads.
    *   Ensure the full asynchronous image processing pipeline is robustly implemented, including task queuing, background processing, error handling, and updating product status from `DRAFT` to `PUBLISHED`.
    *   Develop the complete frontend user interface for product management, allowing admins to upload products, view processing status, and manage their catalog.
2.  **Thorough Testing:**
    *   Implement comprehensive unit and integration tests for all core business logic and API endpoints, as mandated by the project guidelines.
    *   Conduct end-to-end testing to ensure seamless integration between frontend, backend, and image processing.
3.  **Robustness and Error Handling:**
    *   Strengthen error handling mechanisms across the entire system, especially for file uploads, image processing, and database interactions.
    *   Ensure secure JWT implementation and proper authorization checks.
4.  **Performance Optimization:**
    *   Verify that API response times meet the non-functional requirement of <300ms for 95% of requests.
5.  **Operational Readiness:**
    *   Implement robust logging and monitoring to facilitate debugging and system health checks in a production environment.
    *   Finalize Docker configurations for stable deployment.
