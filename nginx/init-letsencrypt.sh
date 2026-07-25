#!/usr/bin/env bash
#
# First-boot Let's Encrypt bootstrap for the HASC nginx reverse proxy.
#
# nginx will not start without a certificate, but certbot needs nginx to be up
# (serving the HTTP-01 challenge on port 80) to issue one. This script breaks that
# chicken-and-egg: it drops a throwaway self-signed cert so nginx can start, then
# replaces it with a real Let's Encrypt certificate and reloads nginx.
#
# PREREQUISITES (do these first):
#   1. DNS A records for all domains point at THIS VPS.
#   2. Ports 80 and 443 are open to the internet.
#   3. A real .env exists (see .env.example), and images are built:
#        docker compose build
#
# USAGE (run once, from the repo root):
#   CERTBOT_EMAIL="you@example.com" ./nginx/init-letsencrypt.sh
#
#   # while testing, use the Let's Encrypt staging CA to avoid rate limits:
#   CERTBOT_EMAIL="you@example.com" CERTBOT_STAGING=1 ./nginx/init-letsencrypt.sh
#
# After a successful run the certbot service renews automatically; you do not need
# to run this again unless the certificate store (certbot_conf volume) is wiped.

set -euo pipefail

# --- Configuration (override via environment) ---------------------------------
# Space-separated list; the FIRST domain names the certificate lineage and MUST
# match the ssl_certificate path in nginx/nginx.conf (…/live/<first-domain>/).
read -r -a DOMAINS <<< "${CERTBOT_DOMAINS:-hascvn.id.vn admin.hascvn.id.vn umami.hascvn.id.vn}"
EMAIL="${CERTBOT_EMAIL:-}"          # empty -> registers without email (not recommended)
STAGING="${CERTBOT_STAGING:-0}"     # non-zero -> use the LE staging environment
RSA_KEY_SIZE="${CERTBOT_RSA_KEY_SIZE:-4096}"

PRIMARY="${DOMAINS[0]}"
LIVE_PATH="/etc/letsencrypt/live/${PRIMARY}"

# Use the same docker compose invocation the operator uses (v2 plugin).
dc() { docker compose "$@"; }

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH." >&2
  exit 1
fi

echo "### Domains: ${DOMAINS[*]}"
echo "### Primary (cert lineage): ${PRIMARY}"
[ -z "${EMAIL}" ] && echo "### WARNING: CERTBOT_EMAIL is empty — no expiry notices will be sent."
[ "${STAGING}" != "0" ] && echo "### Using Let's Encrypt STAGING (certificates will NOT be trusted by browsers)."

echo "### 1/4 Creating a temporary self-signed certificate so nginx can start ..."
dc run --rm --entrypoint sh certbot -c "\
  mkdir -p ${LIVE_PATH} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ${LIVE_PATH}/privkey.pem \
    -out ${LIVE_PATH}/fullchain.pem \
    -subj '/CN=${PRIMARY}'"

echo "### 2/4 Starting nginx (and its dependencies) ..."
dc up -d nginx

echo "### 3/4 Removing the temporary certificate and requesting the real one ..."
dc run --rm --entrypoint sh certbot -c "\
  rm -rf /etc/letsencrypt/live/${PRIMARY} \
    /etc/letsencrypt/archive/${PRIMARY} \
    /etc/letsencrypt/renewal/${PRIMARY}.conf"

domain_args=()
for d in "${DOMAINS[@]}"; do domain_args+=(-d "$d"); done

email_arg=(--register-unsafely-without-email)
[ -n "${EMAIL}" ] && email_arg=(--email "${EMAIL}")

staging_arg=()
[ "${STAGING}" != "0" ] && staging_arg=(--staging)

dc run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  "${staging_arg[@]}" \
  "${email_arg[@]}" \
  "${domain_args[@]}" \
  --rsa-key-size "${RSA_KEY_SIZE}" \
  --agree-tos --no-eff-email --force-renewal

echo "### 4/4 Reloading nginx to load the new certificate ..."
dc exec nginx nginx -s reload

echo "### Done. HTTPS is live for: ${DOMAINS[*]}"
echo "### The certbot service will now auto-renew in the background."
