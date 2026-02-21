# Railway Frontend Services

Create two separate Railway services from this repository.

## Service 1: `hasc-frontend-public`
- Root Directory: `.`
- Builder: `Dockerfile`
- Dockerfile Path: `Dockerfile.railway.frontend-public`
- Build Variables:
  - `VITE_UMAMI_ENABLED`
  - `VITE_UMAMI_SCRIPT_URL`
  - `VITE_UMAMI_WEBSITE_ID` (public website ID)
  - `VITE_UMAMI_DASHBOARD_URL`
  - `VITE_API_BASE_URL` (your backend public URL, e.g. `https://<backend-domain>`)

## Service 2: `hasc-frontend-admin`
- Root Directory: `.`
- Builder: `Dockerfile`
- Dockerfile Path: `Dockerfile.railway.frontend-admin`
- Build Variables:
  - `VITE_UMAMI_ENABLED`
  - `VITE_UMAMI_SCRIPT_URL`
  - `VITE_UMAMI_WEBSITE_ID` (admin website ID)
  - `VITE_UMAMI_DASHBOARD_URL`
  - `VITE_API_BASE_URL` (your backend public URL, e.g. `https://<backend-domain>`)

## Notes
- `VITE_*` values are compiled at build time. Redeploy the service after changing them.
- Keep backend as a separate Railway service (already configured via `railway.toml` + `Dockerfile.railway`).
