#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_cmd docker

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required (v2). Install or enable Docker Compose v2." >&2
  exit 1
fi

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
else
  echo "Missing .env in repo root. This script expects env vars to be defined." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d_%H%M%S)"
backup_dir="${ROOT_DIR}/backups/${timestamp}"
mkdir -p "$backup_dir"

echo "Backup directory: ${backup_dir}"
echo
echo "This script will:"
echo "1) Start db containers (if needed)"
echo "2) Dump databases to ${backup_dir}"
echo "3) Stop containers"
echo "4) Remove postgres volumes"
echo "5) Start db containers (Postgres 16)"
echo "6) Restore dumps"
echo

read -r -p "Continue? (yes/no) " confirm
if [[ "${confirm}" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

echo "Starting db containers..."
docker compose up -d db umami-db

db_id="$(docker compose ps -q db)"
umami_db_id="$(docker compose ps -q umami-db)"

if [[ -z "${db_id}" || -z "${umami_db_id}" ]]; then
  echo "Unable to resolve db container IDs. Are the services named db and umami-db?" >&2
  exit 1
fi

echo "Dumping primary database..."
docker exec -t "$db_id" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > "${backup_dir}/hasc_db.sql"

echo "Dumping Umami database..."
docker exec -t "$umami_db_id" pg_dump -U "${UMAMI_POSTGRES_USER}" -d "${UMAMI_POSTGRES_DB}" > "${backup_dir}/umami_db.sql"

echo "Stopping containers..."
docker compose down

echo
echo "About to remove volumes:"
docker volume ls --format '{{.Name}}' | grep -E 'postgres_data|umami_data' || true
echo
read -r -p "Remove postgres volumes now? (yes/no) " confirm_rm
if [[ "${confirm_rm}" != "yes" ]]; then
  echo "Aborted before volume removal."
  exit 0
fi

# Remove by name if present; ignore if already removed.
docker volume rm "$(docker volume ls --format '{{.Name}}' | grep -E 'postgres_data|umami_data' || true)" 2>/dev/null || true

echo "Starting fresh db containers..."
docker compose up -d db umami-db

db_id="$(docker compose ps -q db)"
umami_db_id="$(docker compose ps -q umami-db)"

echo "Restoring primary database..."
cat "${backup_dir}/hasc_db.sql" | docker exec -i "$db_id" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "Restoring Umami database..."
cat "${backup_dir}/umami_db.sql" | docker exec -i "$umami_db_id" psql -U "${UMAMI_POSTGRES_USER}" -d "${UMAMI_POSTGRES_DB}"

echo "Done. You can now start all services with: docker compose up -d"
