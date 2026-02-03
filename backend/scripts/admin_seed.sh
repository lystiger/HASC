#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <email> <password> [full_name] [role]"
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"
FULL_NAME="${3:-Admin}"
ROLE="${4:-ADMIN}"

if command -v docker &>/dev/null; then
  if docker compose version &>/dev/null; then
    docker compose exec -T backend python -m scripts.admin_seed \
      --email "$EMAIL" \
      --password "$PASSWORD" \
      --full-name "$FULL_NAME" \
      --role "$ROLE"
    exit 0
  fi
fi

echo "Docker Compose not available. Running locally with current environment..."
python -m scripts.admin_seed \
  --email "$EMAIL" \
  --password "$PASSWORD" \
  --full-name "$FULL_NAME" \
  --role "$ROLE"
