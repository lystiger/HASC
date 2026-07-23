# HASC Production Readiness Assessment

**Repository:** `https://github.com/lystiger/HASC`  
**Assessment target:** `main` branch  
**Assessment date:** 2026-07-23  
**Scope:** Production readiness for deployment on a single VPS  
**Intended workload:** Low-to-moderate traffic industrial company website with public catalog, admin portal, image processing, PostgreSQL, Nginx, and Umami analytics

---

## 1. Executive Summary

The HASC repository is **deployable**, but it should not be considered fully production-ready in its current state without a short hardening phase.

The project already has a credible production-oriented architecture:

- FastAPI backend
- PostgreSQL database
- React/Vite frontend
- Separate public and admin builds
- Asynchronous image-processing worker
- Nginx reverse proxy
- HTTPS-oriented virtual host configuration
- Persistent Docker volumes
- Umami analytics
- Docker Compose orchestration
- Health checks
- Alembic migrations

The system is therefore beyond the prototype stage. However, several issues remain that could cause security, reliability, or recoverability failures in production.

### Overall assessment

| Area | Score | Assessment |
|---|---:|---|
| Feature readiness | 7/10 | Main product-catalog architecture appears substantially implemented |
| Deployment readiness | 6/10 | Compose and Nginx exist, but migration and environment handling need tightening |
| Security readiness | 4/10 | Public fallback secret and incomplete production secret wiring are major concerns |
| Reliability readiness | 5/10 | Persistent storage exists, but backups, dependency readiness, and restore procedures are missing |
| Observability readiness | 4/10 | Basic health checks exist, but they do not validate database or worker readiness |
| Operational readiness | 4/10 | No complete production runbook, backup automation, or validated recovery process |
| Overall | **5.5/10** | Suitable for controlled staging; not yet suitable for immediate public exposure |

### Final verdict

> HASC can go live on a VPS after a focused production-hardening pass. It does not need a rewrite, WordPress migration, Kubernetes, or enterprise-scale infrastructure. The main work is security, migrations, backups, health verification, TLS operations, and deployment reproducibility.

---

## 2. Architecture Observed

The current repository indicates the following intended deployment:

```text
Internet
   |
   v
Nginx reverse proxy
   |
   +-- hascvn.id.vn
   |      +-- public React frontend
   |      +-- /api -> FastAPI backend
   |      +-- /uploads -> backend static uploads
   |
   +-- admin.hascvn.id.vn
   |      +-- admin React frontend
   |      +-- /api -> FastAPI backend
   |      +-- /uploads -> backend static uploads
   |
   +-- umami.hascvn.id.vn
          +-- Umami analytics

FastAPI backend
   |
   +-- PostgreSQL
   +-- upload volume
   +-- temporary upload volume

Image-processing worker
   |
   +-- PostgreSQL-backed task state
   +-- shared upload volume
   +-- shared temporary upload volume
```

### Major services found in `docker-compose.yml`

- `db`
- `umami-db`
- `umami`
- `backend`
- `worker`
- `frontend-public`
- `frontend-admin`
- `nginx`

### Persistent volumes found

- `postgres_data`
- `umami_data`
- `uploads_data`
- `temp_uploads_data`

This architecture is reasonable for a single VPS serving a small company website.

---

## 3. Evidence-Based Findings

## 3.1 Critical Findings

### C-01: Public fallback JWT secret

**Severity:** Critical  
**Category:** Security  
**Status:** Confirmed

The backend configuration contains a hard-coded fallback secret:

```python
SECRET_KEY: str = os.getenv(
    "SECRET_KEY",
    "51a7e0eafa586be880a06da122600b4c957f8ef4f6aa340c5e0fe2ece7c2bf27",
)
```

Because the repository is public, this fallback value is public.

If production starts without a real `SECRET_KEY`, authentication tokens may be forgeable.

The current Compose environment block for the backend includes:

```yaml
DATABASE_URL
UPLOAD_DIR
TEMP_UPLOAD_DIR
BACKEND_CORS_ORIGINS
```

but does not visibly include:

```yaml
SECRET_KEY
```

### Required remediation

Add:

```yaml
backend:
  environment:
    SECRET_KEY: ${SECRET_KEY}
```

Generate the secret with:

```bash
openssl rand -hex 64
```

Prefer failing startup when `SECRET_KEY` is missing in production instead of using a default.

### Acceptance criteria

- No production fallback secret exists.
- `docker compose config` shows `SECRET_KEY` is passed to the backend.
- The actual secret is not committed.
- Authentication tokens created with the old public fallback secret are rejected.

---

### C-02: Database migration execution is inconsistent

**Severity:** Critical  
**Category:** Reliability / Deployment  
**Status:** Confirmed

A recent change added:

```bash
alembic upgrade head && uvicorn ...
```

to an image startup command.

However, `docker-compose.yml` overrides the backend startup command with:

```yaml
command: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

When Compose overrides the image command, the migration step may not run.

This can cause:

- missing tables
- stale schema
- API startup against an incompatible database
- worker failures
- deployment succeeding at the container level while application requests fail

### Required remediation

Use one deterministic migration strategy.

Recommended for this VPS deployment:

```yaml
backend:
  command: >
    sh -c "alembic upgrade head &&
           uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

Alternative:

- dedicated one-shot migration service
- manual migration step in a deployment script

Do not allow multiple services to race while applying migrations.

### Acceptance criteria

- A clean database can be initialized automatically.
- An existing database can be upgraded safely.
- Migration failure prevents API startup.
- The worker does not start before schema readiness.
- Deployment documentation states exactly where migrations run.

---

## 3.2 High-Severity Findings

### H-01: No confirmed backup and restore process

**Severity:** High  
**Category:** Recoverability  
**Status:** Confirmed as missing from inspected deployment configuration

Named volumes provide persistence, not backups.

A disk failure, accidental deletion, corrupted volume, VPS cancellation, or destructive migration could still destroy data.

Data requiring backup:

- HASC PostgreSQL database
- Umami PostgreSQL database
- processed product images
- original uploads, if retained
- environment configuration
- TLS configuration
- deployment configuration

### Required remediation

Implement:

- scheduled database dumps
- upload archive or filesystem snapshot
- off-VPS copy
- backup retention
- restore test

Example:

```bash
docker compose exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "/srv/backups/hasc-$(date +%F-%H%M).sql.gz"
```

### Acceptance criteria

- Automated backups run daily.
- At least one backup copy exists outside the VPS.
- Restore is tested on a clean database.
- Upload files are included.
- Backup failures are visible.

---

### H-02: Health check does not verify dependency readiness

**Severity:** High  
**Category:** Reliability  
**Status:** Confirmed

The current endpoint returns:

```json
{"status": "ok"}
```

without checking:

- PostgreSQL connectivity
- migration state
- worker health
- storage writability

Docker can therefore mark the backend healthy while the application is unusable.

### Required remediation

Implement:

```text
/health/live
/health/ready
```

`/health/live` should verify that the process is alive.

`/health/ready` should verify at least:

- database connection
- minimal query
- expected schema or migration revision
- writable upload path

Worker readiness can be checked separately through:

- heartbeat row
- heartbeat timestamp
- queue processing status
- last successful task timestamp

### Acceptance criteria

- database outage causes readiness failure
- process remains live during dependency outage
- Nginx or deployment checks use readiness where appropriate
- worker failure becomes visible

---

### H-03: Database startup order does not guarantee database readiness

**Severity:** High  
**Category:** Reliability  
**Status:** Confirmed

The backend uses `depends_on`, but the database service has no confirmed readiness condition in the inspected Compose configuration.

Basic `depends_on` ensures container startup order, not readiness to accept SQL connections.

### Required remediation

Add:

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 10s
    timeout: 5s
    retries: 10
```

Then:

```yaml
backend:
  depends_on:
    db:
      condition: service_healthy
```

Apply the equivalent pattern to `umami-db`.

### Acceptance criteria

- cold boot does not produce backend crash loops
- migration waits for PostgreSQL readiness
- worker waits for database and API readiness

---

### H-04: TLS certificate lifecycle is manual

**Severity:** High  
**Category:** Operations / Availability  
**Status:** Confirmed

Nginx expects certificate files at fixed local paths:

```text
/etc/nginx/certs/fullchain.pem
/etc/nginx/certs/privkey.pem
```

The inspected deployment does not show automatic issuance or renewal.

Potential failure:

- certificate expires
- Nginx restart fails because certificate files are absent
- multi-domain certificate does not include all required hostnames

Required hostnames:

- `hascvn.id.vn`
- `admin.hascvn.id.vn`
- `umami.hascvn.id.vn`

### Required remediation

Use one of:

1. host-level Certbot with automated renewal
2. Certbot container
3. Caddy with automatic TLS
4. external proxy with managed certificates

### Acceptance criteria

- certificate covers all domains
- renewal is automated
- renewal reloads the proxy
- expiry monitoring exists
- VPS reboot succeeds without manual certificate repair

---

### H-05: Upload pipeline requires explicit security validation

**Severity:** High  
**Category:** Security  
**Status:** Requires code-level confirmation

The backend serves upload output publicly through `/uploads`.

The production deployment should confirm enforcement of:

- file size limit
- file count limit
- accepted MIME types
- actual image decoding
- safe generated filenames
- path traversal prevention
- image dimension limits
- decompression-bomb handling
- temporary-file cleanup
- failed-job cleanup
- authorization on upload endpoints
- protection against executable or script uploads

### Required remediation

Use server-side image decoding and re-encoding.

Do not trust:

- original filename
- extension
- client-provided MIME type

### Acceptance criteria

- non-image uploads are rejected
- oversized uploads are rejected
- malicious filenames cannot escape storage paths
- corrupt images do not crash the worker
- failed temporary files are removed
- uploaded images are re-encoded before public serving

---

## 3.3 Medium-Severity Findings

### M-01: Environment configuration is not fully reproducible

**Severity:** Medium  
**Category:** Deployment  
**Status:** Confirmed

The stack depends on many environment variables, but no complete `.env.example` was confirmed.

Expected variables include:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
DATABASE_URL
SECRET_KEY
UPLOAD_DIR
TEMP_UPLOAD_DIR
BACKEND_CORS_ORIGINS
UMAMI_POSTGRES_USER
UMAMI_POSTGRES_PASSWORD
UMAMI_POSTGRES_DB
UMAMI_HASH_SALT
VITE_UMAMI_ENABLED
VITE_UMAMI_SCRIPT_URL
VITE_UMAMI_WEBSITE_ID_PUBLIC
VITE_UMAMI_WEBSITE_ID_ADMIN
VITE_UMAMI_DASHBOARD_URL
VITE_API_BASE_URL_PUBLIC
VITE_API_BASE_URL_ADMIN
```

### Required remediation

Create `.env.example` with placeholders and comments.

### Acceptance criteria

- a clean VPS can be configured from documentation
- no real secrets are committed
- required variables are validated at startup
- production and local defaults are clearly separated

---

### M-02: Backend image is not self-contained

**Severity:** Medium  
**Category:** Packaging  
**Status:** Confirmed

The inspected backend Dockerfile installs dependencies and copies source code but does not visibly include:

- runtime `CMD`
- non-root user
- explicit health behavior
- build metadata
- runtime hardening

Compose can still run the image by providing a command, but the image itself is less portable and easier to misconfigure.

### Required remediation

Add an explicit default runtime command.

Example:

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Consider running as a non-root user.

### Acceptance criteria

- image starts correctly outside Compose
- image does not require undocumented runtime assumptions
- container does not run as root unless justified

---

### M-03: Log growth can exhaust VPS disk

**Severity:** Medium  
**Category:** Operations  
**Status:** Not shown in inspected Compose configuration

Docker JSON logs may grow indefinitely.

### Required remediation

Add:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "5"
```

Apply to:

- backend
- worker
- Nginx
- Umami
- databases where appropriate

### Acceptance criteria

- logs rotate
- disk usage remains bounded
- application errors remain inspectable
- log retention policy is documented

---

### M-04: Admin token lifetime may be excessive

**Severity:** Medium  
**Category:** Security  
**Status:** Confirmed

The configured access token lifetime is eight days.

This may be acceptable for a low-risk internal admin interface only if:

- token storage is secure
- server-side authorization is correct
- XSS risk is controlled
- admin device access is trusted

Risk is higher if the token is stored in `localStorage`.

### Required remediation

Review frontend token storage.

Preferred options:

- secure `HttpOnly`, `SameSite`, HTTPS-only cookie
- shorter token lifetime
- refresh-token rotation if required
- logout invalidation strategy
- login rate limiting

### Acceptance criteria

- token storage mechanism is documented
- admin session lifetime is intentional
- stolen old tokens have limited usefulness
- login endpoint has rate limiting or equivalent protection

---

### M-05: Public Umami administration endpoint increases exposure

**Severity:** Medium  
**Category:** Security  
**Status:** Confirmed

`umami.hascvn.id.vn` is publicly routed.

This is technically valid, but exposes the authentication surface publicly.

### Required remediation

Use at least one:

- strong unique credentials
- Cloudflare Access
- VPN
- IP allowlist
- Nginx basic authentication
- private network access

### Acceptance criteria

- default credentials are removed
- brute-force protection exists
- dashboard access is limited intentionally

---

### M-06: Documentation is stale

**Severity:** Medium  
**Category:** Maintainability  
**Status:** Confirmed

The README describes the project as being in a design and initial implementation phase, while the repository contains a much more complete deployment stack.

Stale documentation creates deployment risk because operators may follow incorrect instructions.

### Required remediation

Update:

- architecture
- service list
- environment variables
- deployment steps
- migration process
- backup process
- restore process
- admin seed process
- product seed process
- troubleshooting
- rollback steps

### Acceptance criteria

- README matches current `main`
- production setup is reproducible from documentation
- recovery procedure is documented

---

## 4. Production Requirements by Priority

## 4.1 Must Fix Before Public Launch

- replace public fallback JWT secret
- pass `SECRET_KEY` through Compose
- make migrations deterministic
- add database readiness checks
- implement daily backups
- test restore procedure
- automate TLS renewal
- validate upload security
- confirm admin authorization
- configure log rotation
- confirm persistent upload paths
- test full reboot recovery

## 4.2 Strongly Recommended Before Launch

- add `/health/live`
- add `/health/ready`
- implement worker heartbeat
- shorten admin session lifetime
- protect Umami dashboard
- create `.env.example`
- update deployment documentation
- run containers as non-root where practical
- add basic rate limiting
- add security headers
- add database connection pool limits
- add disk-space monitoring

## 4.3 Can Wait Until After Initial Launch

- Kubernetes
- autoscaling
- multi-region deployment
- distributed tracing
- blue-green deployment
- service mesh
- separate object storage
- Redis queue migration
- CDN optimization
- advanced SIEM
- high-availability PostgreSQL

These are not required for a low-to-moderate traffic company catalog.

---

## 5. Recommended VPS Baseline

### Minimum

- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- Ubuntu LTS
- Docker Engine
- Docker Compose plugin

### Preferred

- 4 vCPU
- 8 GB RAM
- 80 GB SSD
- automated snapshots
- external backup storage

The stack includes:

- two PostgreSQL instances
- backend
- worker
- two frontend containers
- Nginx
- Umami

A 2 GB VPS is not recommended because memory pressure may become unstable during image processing, builds, analytics, or PostgreSQL activity.

---

## 6. Recommended Network Exposure

Only expose:

```text
22/tcp
80/tcp
443/tcp
```

Do not expose directly:

```text
5432
8000
3000
frontend container ports
worker ports
```

Nginx should be the only public application entry point.

Recommended host hardening:

- SSH key authentication
- disable password login
- disable direct root SSH
- UFW
- Fail2ban or equivalent
- unattended security updates
- limited sudo access
- regular Docker and OS patching

---

## 7. Recommended Compose Corrections

Example production-oriented fragment:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  backend:
    build: ./backend
    restart: unless-stopped
    command: >
      sh -c "alembic upgrade head &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000"
    volumes:
      - uploads_data:/app/uploads
      - temp_uploads_data:/app/temp_uploads
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      UPLOAD_DIR: /app/uploads
      TEMP_UPLOAD_DIR: /app/temp_uploads
      BACKEND_CORS_ORIGINS: ${BACKEND_CORS_ORIGINS}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/ready', timeout=2)\""
        ]
      interval: 30s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  worker:
    build: ./backend
    restart: unless-stopped
    command: python -m app.worker
    volumes:
      - uploads_data:/app/uploads
      - temp_uploads_data:/app/temp_uploads
    environment:
      DATABASE_URL: ${DATABASE_URL}
      UPLOAD_DIR: /app/uploads
      TEMP_UPLOAD_DIR: /app/temp_uploads
    depends_on:
      db:
        condition: service_healthy
      backend:
        condition: service_healthy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

---

## 8. Go-Live Acceptance Checklist

## Security

- [ ] production `SECRET_KEY` generated
- [ ] fallback secret removed or forbidden in production
- [ ] database passwords are unique and strong
- [ ] Umami credentials changed
- [ ] `.env` excluded from Git
- [ ] admin authorization verified server-side
- [ ] upload endpoints restricted to authorized users
- [ ] file validation tested
- [ ] login rate limiting enabled
- [ ] HTTPS enabled
- [ ] security headers configured

## Database

- [ ] database health check added
- [ ] migrations run automatically or through a documented release step
- [ ] migration failure blocks startup
- [ ] clean-database deployment tested
- [ ] upgrade from existing database tested
- [ ] database backup automated
- [ ] database restore tested

## Storage

- [ ] upload volume persists after container recreation
- [ ] upload files survive VPS reboot
- [ ] temporary files are cleaned
- [ ] failed image jobs are cleaned
- [ ] upload backup exists
- [ ] disk usage is monitored

## Application

- [ ] public frontend loads
- [ ] admin frontend loads
- [ ] login succeeds
- [ ] invalid login fails safely
- [ ] product creation succeeds
- [ ] upload succeeds
- [ ] image worker completes processing
- [ ] product status transitions correctly
- [ ] product update succeeds
- [ ] product deletion behaves correctly
- [ ] public catalog reflects admin changes
- [ ] logout works
- [ ] mobile layout tested
- [ ] broken-image behavior tested

## Infrastructure

- [ ] Nginx routes all domains
- [ ] HTTP redirects to HTTPS
- [ ] TLS certificate covers all domains
- [ ] TLS renewal is automated
- [ ] only ports 22, 80, and 443 are exposed
- [ ] SSH password login disabled
- [ ] root SSH disabled
- [ ] UFW enabled
- [ ] containers restart after reboot
- [ ] logs rotate
- [ ] backups run automatically

## Observability

- [ ] liveness endpoint exists
- [ ] readiness endpoint checks PostgreSQL
- [ ] worker heartbeat exists
- [ ] application errors are logged
- [ ] disk usage alert exists
- [ ] backup failure is visible
- [ ] certificate expiry is monitored

## Recovery

- [ ] VPS reboot tested
- [ ] backend restart tested
- [ ] worker restart tested
- [ ] database restore tested
- [ ] upload restore tested
- [ ] rollback procedure documented
- [ ] previous image or release can be redeployed

---

## 9. Suggested Deployment Procedure

1. Provision Ubuntu LTS VPS.
2. Create a non-root deployment user.
3. Configure SSH keys.
4. Disable root and password SSH login.
5. Enable UFW.
6. Install Docker Engine.
7. Install Docker Compose plugin.
8. Clone repository into `/srv/hasc`.
9. Create production `.env`.
10. Generate all secrets.
11. apply production Compose changes.
12. validate with:

```bash
docker compose config
```

13. build:

```bash
docker compose build --no-cache
```

14. start database first if using a staged procedure.
15. run migrations.
16. start all services.
17. inspect:

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 worker
docker compose logs --tail=200 nginx
```

18. create admin account.
19. seed products if required.
20. test image processing.
21. configure TLS.
22. configure backup automation.
23. reboot VPS.
24. repeat smoke tests.
25. point DNS to the VPS only after all checks pass.

---

## 10. Smoke-Test Commands

```bash
docker compose config
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 worker
docker compose logs --tail=200 nginx
```

```bash
curl -I https://hascvn.id.vn
curl -I https://admin.hascvn.id.vn
curl -I https://umami.hascvn.id.vn
```

```bash
curl https://hascvn.id.vn/health/live
curl https://hascvn.id.vn/health/ready
```

Database:

```bash
docker compose exec db pg_isready \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB"
```

Migration status:

```bash
docker compose exec backend alembic current
docker compose exec backend alembic heads
```

Disk usage:

```bash
df -h
docker system df
docker volume ls
```

---

## 11. Failure Scenarios That Must Be Tested

### Scenario A: VPS reboot

Expected result:

- Docker starts
- containers restart
- PostgreSQL becomes healthy
- migrations do not fail
- backend becomes ready
- worker resumes
- Nginx serves HTTPS
- uploads remain present

### Scenario B: Database unavailable

Expected result:

- readiness fails
- liveness remains valid
- backend logs clear errors
- system recovers after database returns

### Scenario C: Worker stopped

Expected result:

- uploads enter queued or processing state
- API remains available
- worker failure is visible
- queued jobs resume after restart

### Scenario D: Invalid upload

Expected result:

- request is rejected
- no unsafe file is served
- no orphan database task remains
- temporary files are removed

### Scenario E: Disk nearly full

Expected result:

- monitoring warns operator
- logs do not grow without bounds
- upload failure is handled cleanly
- database corruption is avoided

### Scenario F: Failed migration

Expected result:

- deployment stops
- old application remains recoverable
- database backup exists
- rollback procedure is known

---

## 12. Assumptions and Limitations

This assessment was based on repository inspection, including deployment and backend configuration files.

The following require runtime or deeper code verification:

- whether all API routes enforce authorization correctly
- how the frontend stores access tokens
- whether upload validation is robust
- whether image processing handles malformed images safely
- whether all Alembic migrations are reversible
- whether worker tasks can become permanently stuck
- whether rate limiting exists
- whether CSRF protection is required based on authentication transport
- whether database sessions and pools are configured safely
- whether automated tests cover production-critical paths
- whether current certificates exist and match all domains
- whether DNS is already configured correctly

Therefore, the score should be treated as a deployment audit, not a formal penetration test or complete source-code security review.

---

## 13. Independent Review Questions

A second reviewer or frontier model should answer these questions:

1. Can the public fallback `SECRET_KEY` lead to forged JWTs in the current deployment?
2. Does Compose override the migration-enabled image command?
3. Are migrations guaranteed to run exactly once?
4. Can the worker start against an outdated schema?
5. Does the health endpoint prove the application is actually ready?
6. Are uploads validated through decoding and re-encoding?
7. Can uploaded filenames cause path traversal?
8. Is admin authorization enforced on every write endpoint?
9. Where are tokens stored in the frontend?
10. Are backups automated and restorable?
11. Is certificate renewal automatic?
12. Can Docker logs fill the disk?
13. Are PostgreSQL ports inaccessible from the internet?
14. Can the stack recover automatically after VPS reboot?
15. Are persistent upload paths consistent with application configuration?
16. Can product image jobs become permanently stuck?
17. Is Umami appropriately protected?
18. Is the selected VPS large enough for two PostgreSQL instances and image processing?
19. Are database migrations safe for existing production data?
20. Is there a documented rollback process?

---

## 14. Final Recommendation

HASC should proceed to a **staging deployment on the rented VPS**.

It should not be publicly announced or treated as final production until the following six conditions are met:

1. authentication secret handling is fixed
2. migrations are deterministic
3. backups and restore are tested
4. TLS renewal is automated
5. upload security is verified
6. reboot and dependency-failure tests pass

Once those are complete, the system is suitable for a small industrial company website with low-to-moderate traffic.

The correct engineering objective is not enterprise perfection. It is:

> The website must protect administrative access, preserve business data, survive restarts, recover from failure, and expose failures clearly enough to be repaired.

That standard is achievable with the current architecture.
