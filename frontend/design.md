fe_des.md - Frontend Architecture & Technical Design

1. Project Context
Target Site: HASC VN (Industrial Supplier)
Goal: Dynamic product catalog with high-res image processing feedback.
Vibe: Technical, high-trust, data-driven.

2. Technical Stack
Framework: React 18+ (Vite)
Language: TypeScript (Strict Mode)
Styling: Tailwind CSS (Utility-first for speed and consistency)
Data Fetching: TanStack Query (v5) – Essential for the polling logic.
Icons: Lucide-react (Clean, stroke-based industrial icons)
Approved by owner.

3. System Architecture & Component Map
3.1 Layout Anatomy
Public Catalog: High-density grid with technical filters.
Admin Dashboard: Split-view for "Upload" and "Queue Status."
Task Monitor: A persistent "Processing" drawer that shows the status of background image jobs.

4. UI Design Specifications
4.1 Global Styles
Element: Containers
Specification: Max-width 1440px with 24px padding.
Element: Grid
Specification: 12-column layout; Cards span 3-4 columns.
Element: Borders
Specification: 1px solid #E2E8F0 (Slate-200); avoid heavy shadows.
Element: Typography
Specification: Body: Inter; Data/SKUs: JetBrains Mono.

4.2 Polymorphic Spec Rendering
Since we use a JSONB backend, the frontend must dynamically render "Spec Chips" based on the product category.
TypeScript
// Example Spec Strategy
const SpecRenderer = ({ category, data }) => {
  const configs = {
    PACKAGING: () => <Text>{data.thickness}mic | {data.width}mm</Text>,
    FILTERS: () => <Text>{data.material} - {data.efficiency}%</Text>,
    CHEMICALS: () => <Link href={data.msds_url}>Safety Sheet (PDF)</Link>,
    EQUIPMENT: () => <Text>{data.model} | {data.power}kW</Text>,
  };
  return configs[category]();
};

4.3 Product Status States
Backend status values: DRAFT, PUBLISHED, ARCHIVED, FAILED.
UI mapping:
- DRAFT: Gray/skeleton state, hidden from public catalog.
- PUBLISHED: Full-color product card, visible to public.
- ARCHIVED: Hidden from public, visible in admin with muted styling.
- FAILED: Show warning badge + retry guidance in admin.

4.4 Visibility Rules
Public Catalog:
- Show only PUBLISHED products.
Admin Dashboard:
- Show all products with status badges.
- Allow edits only for ADMIN users.

5. Core Workflow: The "Async Feedback" Loop
To meet the < 200ms ACK requirement, the frontend implementation must follow this state machine:
IDLE: User selects 1-5 images (10MB each).
SUBMIT: POST /api/v1/products via FormData.
ACKNOWLEDGED: Backend returns product_id and task_ids. UI immediately hides the modal and shows a "Processing..." toast.
POLLING: useQuery fetches /api/v1/products/{product_id} every 2 seconds.
COMPLETE: Once status is PUBLISHED, the Product Card transitions from a Skeleton/Gray state to its Published/Full-color state.

6. Implementation Milestones
Phase 1.1: Foundations
Set up Tailwind theme with HASC VN "Industrial Slate" and "Safety Orange" colors.
Configure Axios/Fetch interceptors for 202-status handling.

Phase 1.2: Catalog & Detail
Implement ProductCard with lazy-loading for WebP images.
Build the category filter sidebar.

Phase 1.3: Admin & Async
Build the ProductUploadForm.
Implement the Task Monitoring notification system.

Phase 1.4: Corporate Pages & Localization
Add Contact page (address, phone, email, hours) and footer info.
Add Policy pages: Privacy Policy, Terms of Service, Shipping/Returns (if applicable).
Add EN/VN language switch with locale files and persisted preference.

Localization Implementation Notes
- Use react-i18next with two locale files: en.json and vi.json.
- Default language from browser; persist choice in localStorage.
- Admin area can remain EN-only for MVP.
