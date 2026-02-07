# Admin Category Manager Design

## Goal
Provide an in-app, spreadsheet-like manager for product categories so admins can view, add, edit, and delete categories without direct DB access. This lives under the Admin area and is linked from the analytics/Umami card.

## Scope (MVP)
- List categories from the API.
- Create a category.
- Edit category names.
- Delete category if not in use (respect API 409).
- Display validation and API errors.
- Support EN/VN UI via i18n.

## Placement
- Admin page: add a secondary action under the “Open Umami Dashboard” button that navigates to `/admin/categories`.
- Route: `/admin/categories`.
- Component: new page (e.g., `frontend/src/pages/AdminCategoriesPage.tsx`).

## Data Model (DB Approach)
Use DB fields for language-specific names.
Recommended columns:
- `code` (stable identifier, uppercase, unique)
- `name_en` (English display name)
- `name_vi` (Vietnamese display name)

The API should return both names, and the frontend should pick based on `i18n.resolvedLanguage`.

## API Endpoints (expected)
- `GET /api/v1/categories` -> list all categories
- `POST /api/v1/categories` -> create category
- `PUT /api/v1/categories/{id}` -> update category
- `DELETE /api/v1/categories/{id}` -> delete category

## UI Layout (MVP)
- Header: "Category Manager" + short subtitle.
- Table view:
  - Columns: Code, English Name, Vietnamese Name, Updated At, Actions.
  - Each row: inline edit for `name_en` and `name_vi`, save/cancel.
  - Delete button with confirmation.
- Create row at top or modal:
  - Inputs: Code, English Name, Vietnamese Name.
  - Create button.
- Empty state and loading state.

## Validation
- `code` required, uppercase, no spaces (use `A-Z`, numbers, underscore).
- `name_en` required, `name_vi` required.
- Prevent duplicate `code`.
- Show API error messages inline.

## i18n Keys (add to locale files)
- `admin.categories.title`
- `admin.categories.subtitle`
- `admin.categories.create_title`
- `admin.categories.code`
- `admin.categories.name_en`
- `admin.categories.name_vi`
- `admin.categories.updated_at`
- `admin.categories.actions`
- `admin.categories.save`
- `admin.categories.cancel`
- `admin.categories.delete`
- `admin.categories.create`
- `admin.categories.empty`
- `admin.categories.loading`
- `admin.categories.error_load`
- `admin.categories.error_save`
- `admin.categories.error_delete`
- `admin.categories.delete_confirm`

## Non-Goals (for MVP)
- Audit logs.
- Bulk import/export.
- Role-based permissions UI.
- Search/filter (can be added later).

