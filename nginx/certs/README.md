# TLS certificates

**Certificates are no longer mounted from this directory.** They are now issued and
auto-renewed by the `certbot` service (Let's Encrypt, HTTP-01 webroot challenge) and
stored in the `certbot_conf` Docker volume, mounted into both nginx and certbot at
`/etc/letsencrypt`. nginx reads them from
`/etc/letsencrypt/live/hascvn.id.vn/{fullchain,privkey}.pem`.

This directory is kept only so the path exists in the repo; it is otherwise unused.

## First-time setup (VPS)

1. Point DNS A records for `hascvn.id.vn`, `admin.hascvn.id.vn`, and
   `umami.hascvn.id.vn` at the VPS, and open ports 80 and 443.
2. Create a real `.env` (see `.env.example`) and build images: `docker compose build`.
3. Bootstrap certificates once:

   ```sh
   CERTBOT_EMAIL="you@example.com" ./nginx/init-letsencrypt.sh
   ```

   Add `CERTBOT_STAGING=1` while testing to avoid Let's Encrypt rate limits.

After that, `docker compose up -d` brings the stack up normally and the `certbot`
service renews certificates automatically (nginx reloads every 6h to pick them up).

## Local development

The local preview stack (`docker-compose.preview.yml`) omits nginx and TLS, so no
certificates are needed for day-to-day development.
