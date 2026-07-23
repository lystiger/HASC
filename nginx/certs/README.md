# TLS certificates

TLS certificates go here at deploy time. **They are git-ignored and must never be
committed** — private keys do not belong in version control.

Required files (mounted read-only into the nginx container):

- `fullchain.pem`
- `privkey.pem`

## Production (VPS)

Obtain real certificates for your domains (e.g. from Let's Encrypt / certbot) and
place/symlink them here, for example:

```sh
cp /etc/letsencrypt/live/hascvn.id.vn/fullchain.pem nginx/certs/fullchain.pem
cp /etc/letsencrypt/live/hascvn.id.vn/privkey.pem   nginx/certs/privkey.pem
```

## Local development

The local preview stack (`docker-compose.preview.yml`) intentionally omits nginx
and TLS, so certificates are not needed for day-to-day development. If you want to
exercise the full nginx stack locally, generate a throwaway self-signed pair
(never reuse it anywhere real):

```sh
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```
