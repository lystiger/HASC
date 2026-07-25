#!/usr/bin/env bash
#
# Restore the HASC stack from a backup produced by scripts/backup.sh.
#
# DESTRUCTIVE: overwrites the current HASC database, Umami database, and uploads.
# The stack must already be up (docker compose up -d). The app (backend + worker) is
# stopped during the database restore to release connections, then restarted.
#
# Usage:
#   ./scripts/restore.sh <backup-dir>     # e.g. ./scripts/restore.sh backups/20260725-030000
#   ./scripts/restore.sh --latest         # most recent local backup
#   FORCE=1 ./scripts/restore.sh --latest # skip the confirmation prompt

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

DC() { docker compose "$@"; }
env_get() { grep -E "^$1=" .env 2>/dev/null | tail -n1 | cut -d= -f2- | sed -e 's/^"\(.*\)"$/\1/' || true; }
BACKUP_DIR="${BACKUP_DIR:-$(env_get BACKUP_DIR)}"; BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"

SRC="${1:-}"
if [ "$SRC" = "--latest" ]; then
  SRC="$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -n1)"
fi
if [ -z "$SRC" ] || [ ! -d "$SRC" ]; then
  echo "Usage: $0 <backup-dir>|--latest" >&2
  exit 1
fi
SRC="$(cd "$SRC" && pwd)"  # absolute
echo "[restore] source: $SRC"

if [ "${FORCE:-0}" != "1" ]; then
  printf "This will OVERWRITE the current databases and uploads. Type 'yes' to continue: "
  read -r ans
  [ "$ans" = "yes" ] || { echo "Aborted."; exit 1; }
fi

# Integrity check
if [ -f "$SRC/SHA256SUMS" ]; then
  echo "[restore] verifying checksums"
  ( cd "$SRC" && sha256sum -c SHA256SUMS )
fi

# Quiesce the app so DROP/CREATE during DB restore is not blocked by open connections.
echo "[restore] stopping backend + worker"
DC stop backend worker >/dev/null 2>&1 || true

# --- 1) HASC database ---
PG_USER="$(DC exec -T db printenv POSTGRES_USER | tr -d '\r\n')"
PG_DB="$(DC exec -T db printenv POSTGRES_DB | tr -d '\r\n')"
echo "[restore] HASC db '$PG_DB'"
gunzip -c "$SRC/hasc_db.sql.gz" | DC exec -T db psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" >/dev/null

# --- 2) Umami database (if present and running) ---
if [ -f "$SRC/umami_db.sql.gz" ] && UM_USER="$(DC exec -T umami-db printenv POSTGRES_USER 2>/dev/null | tr -d '\r\n')" && [ -n "$UM_USER" ]; then
  UM_DB="$(DC exec -T umami-db printenv POSTGRES_DB | tr -d '\r\n')"
  echo "[restore] Umami db '$UM_DB'"
  gunzip -c "$SRC/umami_db.sql.gz" | DC exec -T umami-db psql -v ON_ERROR_STOP=1 -U "$UM_USER" -d "$UM_DB" >/dev/null
fi

# --- 3) Uploads (via a one-off container so it works while backend is stopped) ---
if [ -f "$SRC/uploads.tar.gz" ]; then
  echo "[restore] uploads"
  DC run --rm --no-deps -T -v "$SRC:/backup:ro" --entrypoint sh backend \
    -c 'rm -rf /app/uploads/* && tar xzf /backup/uploads.tar.gz -C /app/uploads'
fi

# Restart the app.
echo "[restore] starting backend + worker"
DC start backend worker >/dev/null 2>&1 || DC up -d backend worker >/dev/null 2>&1

echo "[restore] done. If restoring an OLDER dump into NEWER code, also run:"
echo "           docker compose run --rm migrate"
