#!/usr/bin/env bash
#
# Automated backup for the single-VPS HASC stack:
#   - HASC PostgreSQL database   (pg_dump, gzip)
#   - Umami PostgreSQL database  (pg_dump, gzip; skipped if umami-db is not running)
#   - Uploads volume             (processed product images, tar.gz)
#
# Backups are non-disruptive (the stack keeps running) and written to a timestamped
# directory under BACKUP_DIR, with SHA-256 checksums. Old backups are pruned by age.
# Run from cron on the VPS — see docs/backup-restore.md.
#
# What is intentionally NOT backed up here:
#   - .env            : secrets/config — store it in a password manager / secrets vault.
#   - TLS certificates: regenerated automatically by the certbot service.
#
# Usage:  ./scripts/backup.sh
# Config (env var, or a matching line in .env):
#   BACKUP_DIR              where backups are written        (default: <repo>/backups)
#   BACKUP_RETENTION_DAYS   delete local backups older than  (default: 7)
#   BACKUP_RSYNC_DEST       optional rsync target for off-VPS copy (e.g. user@host:/srv/hasc-backups)
#   BACKUP_HEALTHCHECK_URL  optional URL pinged on success (…/fail on failure) for monitoring

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

DC() { docker compose "$@"; }
# Read a single key from .env WITHOUT executing it (values may contain spaces).
env_get() { grep -E "^$1=" .env 2>/dev/null | tail -n1 | cut -d= -f2- | sed -e 's/^"\(.*\)"$/\1/' || true; }

BACKUP_DIR="${BACKUP_DIR:-$(env_get BACKUP_DIR)}"; BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-$(env_get BACKUP_RETENTION_DAYS)}"; RETENTION_DAYS="${RETENTION_DAYS:-7}"
RSYNC_DEST="${BACKUP_RSYNC_DEST:-$(env_get BACKUP_RSYNC_DEST)}"
HC_URL="${BACKUP_HEALTHCHECK_URL:-$(env_get BACKUP_HEALTHCHECK_URL)}"

ping_hc() { [ -n "$HC_URL" ] && curl -fsS -m 10 "$1" >/dev/null 2>&1 || true; }
on_err() { echo "[backup][ERROR] failed at line ${1:-?}. Is the stack running? (docker compose ps)" >&2; ping_hc "${HC_URL}/fail"; }
trap 'on_err $LINENO' ERR

TS="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/$TS"
echo "[backup] starting -> $DEST"
mkdir -p "$DEST"

# --- 1) HASC database (creds read from the running container = source of truth) ---
PG_USER="$(DC exec -T db printenv POSTGRES_USER | tr -d '\r\n')"
PG_DB="$(DC exec -T db printenv POSTGRES_DB | tr -d '\r\n')"
echo "[backup] dumping HASC db '$PG_DB'"
DC exec -T db pg_dump -U "$PG_USER" --clean --if-exists "$PG_DB" | gzip > "$DEST/hasc_db.sql.gz"

# --- 2) Umami database (optional) ---
if UM_USER="$(DC exec -T umami-db printenv POSTGRES_USER 2>/dev/null | tr -d '\r\n')" && [ -n "$UM_USER" ]; then
  UM_DB="$(DC exec -T umami-db printenv POSTGRES_DB | tr -d '\r\n')"
  echo "[backup] dumping Umami db '$UM_DB'"
  DC exec -T umami-db pg_dump -U "$UM_USER" --clean --if-exists "$UM_DB" | gzip > "$DEST/umami_db.sql.gz"
else
  echo "[backup] umami-db not running — skipping Umami dump"
fi

# --- 3) Uploads (processed product images) ---
echo "[backup] archiving uploads"
DC exec -T backend tar czf - -C /app/uploads . > "$DEST/uploads.tar.gz"

# --- 4) Checksums ---
( cd "$DEST" && sha256sum ./*.gz > SHA256SUMS )
echo "[backup] contents:"; ls -lh "$DEST" | sed 's/^/  /'

# --- 5) Optional off-VPS copy ---
if [ -n "$RSYNC_DEST" ]; then
  echo "[backup] rsync -> $RSYNC_DEST"
  rsync -az --delete "$BACKUP_DIR/" "$RSYNC_DEST/"
fi

# --- 6) Retention (local) ---
echo "[backup] pruning local backups older than ${RETENTION_DAYS}d"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true

ping_hc "$HC_URL"
echo "[backup] done: $DEST"
