# Railway Deployment (24/7)

The production setup is four Railway services in one project, all built from this
repository plus a managed Postgres:

| Service | Builder | Dockerfile | Notes |
|---|---|---|---|
| `hasc-postgres` | Railway Postgres plugin | — | Provides `DATABASE_URL` |
| `hasc-backend` | Dockerfile | `Dockerfile.railway` | API + embedded image worker + uploads volume |
| `hasc-frontend-public` | Dockerfile | `Dockerfile.railway.frontend-public` | See [railway-frontend-services.md](railway-frontend-services.md) |
| `hasc-frontend-admin` | Dockerfile | `Dockerfile.railway.frontend-admin` | See [railway-frontend-services.md](railway-frontend-services.md) |

## Backend service (`hasc-backend`)

### Build
- Root Directory: `.`
- Set the service variable `RAILWAY_DOCKERFILE_PATH=Dockerfile.railway`
  (the repo intentionally has no `railway.toml`, because the frontend services
  build from the same repo with different Dockerfiles).

On boot the container runs `alembic upgrade head` and then starts uvicorn, so
database migrations are applied automatically on every deploy.

### Volume
Railway volumes can be attached to **one** service only, so the backend runs the
image-processing worker inside the API process (`RUN_EMBEDDED_WORKER=true`)
instead of as a separate service.

- Attach a volume to `hasc-backend` with mount path `/data`.

### Variables
| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (plain `postgresql://` URLs are normalized to asyncpg automatically) |
| `RUN_EMBEDDED_WORKER` | `true` |
| `UPLOAD_DIR` | `/data/uploads` |
| `TEMP_UPLOAD_DIR` | `/data/temp_uploads` |
| `BACKEND_CORS_ORIGINS` | `https://<public-frontend-domain>,https://<admin-frontend-domain>` |
| `SECRET_KEY` | a fresh random secret (`openssl rand -hex 32`) |

`TEMP_UPLOAD_DIR` must also live on the volume: raw uploads waiting in the task
queue have to survive a redeploy or restart.

### 24/7 settings (service → Settings)
- Healthcheck Path: `/health`
- Restart Policy: `Always`
- Region: pick one close to your users (e.g. Southeast Asia)

## Frontend services

Configure as described in [railway-frontend-services.md](railway-frontend-services.md).
Set `VITE_API_BASE_URL` on both to the backend public URL
(`https://<hasc-backend-domain>`), and remember `VITE_*` values are baked in at
build time — redeploy after changing them.

## First deploy: seed the catalog

Run these once after the backend is up. The category/admin seeds talk straight
to Postgres, so run them locally with the Railway Postgres **public** URL:

```bash
cd backend
DATABASE_URL="<railway postgres public URL>" python -m scripts.category_seed
DATABASE_URL="<railway postgres public URL>" python -m scripts.admin_seed \
    --email <admin-email> --password <admin-password>
```

Then upload the product catalog images (from `frontend/public/`) through the
API — they go through the normal async pipeline (resize, WebP, thumbnails) and
the products publish automatically once processing finishes:

```bash
python -m scripts.product_seed \
    --api-base-url https://<hasc-backend-domain> \
    --email <admin-email> --password <admin-password>
```

The product seed is idempotent: products whose SKU already exists are skipped,
so it is safe to re-run. Equivalent Make target from the repo root:

```bash
make seed-products API_BASE_URL=https://<hasc-backend-domain> EMAIL=<admin-email> PASSWORD=<admin-password>
```

## Verifying

- `https://<hasc-backend-domain>/health` → `{"status":"ok"}`
- `https://<hasc-backend-domain>/api/v1/products` → published products with `/uploads/...` image URLs
- Open the public frontend → catalog shows the product photos.
