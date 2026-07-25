# Backup & Restore

Automated, non-disruptive backups for the single-VPS HASC deployment, plus a tested
restore procedure. Covers the two things that cannot be regenerated: the databases
and the uploaded product images.

| Item | Backed up? | Notes |
|---|---|---|
| HASC PostgreSQL database | ✅ `hasc_db.sql.gz` | `pg_dump --clean --if-exists` |
| Umami PostgreSQL database | ✅ `umami_db.sql.gz` | skipped if `umami-db` isn't running |
| Uploaded product images | ✅ `uploads.tar.gz` | the `uploads_data` volume |
| `.env` (secrets/config) | ❌ | store in a password manager / secrets vault |
| TLS certificates | ❌ | regenerated automatically by the `certbot` service |

Each run writes a timestamped folder under `BACKUP_DIR` with a `SHA256SUMS` file.

## Configuration

Set these in `.env` (see `.env.example`) or as environment variables:

- `BACKUP_DIR` — where backups are written (default `<repo>/backups`)
- `BACKUP_RETENTION_DAYS` — prune local backups older than this (default `7`)
- `BACKUP_RSYNC_DEST` — optional rsync target for an **off-VPS** copy
- `BACKUP_HEALTHCHECK_URL` — optional monitoring ping (success → URL, failure → `URL/fail`)

## Run a backup manually

```sh
cd /srv/hasc          # your repo checkout
./scripts/backup.sh
```

The stack must be running (`docker compose up -d`). Backups do not stop the app.

## Schedule daily backups (host cron)

`crontab -e` on the VPS, then add (adjust the path):

```cron
30 3 * * * cd /srv/hasc && ./scripts/backup.sh >> /var/log/hasc-backup.log 2>&1
```

This runs every day at 03:30. Set `BACKUP_HEALTHCHECK_URL` so a **missed or failed**
run raises an alert — cron staying silent is not proof a backup happened.

> Prefer systemd? Create a `hasc-backup.service` (`Type=oneshot`, `ExecStart=/srv/hasc/scripts/backup.sh`)
> and a `hasc-backup.timer` (`OnCalendar=*-*-* 03:30:00`, `Persistent=true`).

## Off-VPS copies

A backup on the same disk as the data does not survive disk loss or VPS cancellation.
Set `BACKUP_RSYNC_DEST` to push each run to another host, or add your own step (e.g.
`rclone copy "$BACKUP_DIR" remote:hasc-backups`) after `backup.sh`. **Off-site copies
that include database dumps should be encrypted at rest.**

## Restore

⚠️ Destructive — overwrites the current databases and uploads. The stack must be up.

```sh
cd /srv/hasc
./scripts/restore.sh --latest              # or: ./scripts/restore.sh backups/20260725-030000
```

The script verifies checksums, stops `backend` + `worker`, restores both databases and
the uploads, then restarts the app. Use `FORCE=1` to skip the confirmation prompt.

If you are restoring an **older** dump into a **newer** codebase, apply migrations after:

```sh
docker compose run --rm migrate
```

## Recommended verification cadence

- **Monthly**: restore the latest backup into a throwaway stack (a second checkout with
  a different `COMPOSE_PROJECT_NAME`) and confirm the catalog + images come back. A
  backup you have never restored is not a backup.
- **After schema changes**: take a fresh backup before deploying.
