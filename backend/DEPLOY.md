# Deploying the backend to app.goairclass.com

This backend is the API for the GoAirclass mobile app (React Native — there's no separate
web frontend to deploy). `app.goairclass.com` only needs to serve this Node/Express API.

**This server (`srv994393`) is a shared, multi-tenant Docker host** — it already runs ~15
other apps (worknai, worknaicrm, worknaihrms, raktdaan, onlinegologistics, and the existing
GoAirClass_V3 stack) behind one shared reverse-proxy container. Everything below is written
for that real topology, not a fresh/dedicated VPS.

## Architecture

```
Internet ──HTTPS──▶ nginx_gateway (Docker container, host ports 80/443)
                          │  routes by server_name, shared nginx.conf for every app on the box
                          │
                          ├─ goairclass.com / www.goairclass.com ──▶ goairclass_frontend:80  (V3 website, unchanged)
                          │
                          └─ app.goairclass.com ──▶ goaapp-backend:7001  (THIS backend, new)
                                                          │
                                                          └──▶ MongoDB Atlas (cloud)
```

- `nginx_gateway` is one Docker container (`nginx:alpine`) whose `nginx.conf` has a `server{}`
  block per domain for every app on this box. It is already joined to the
  `goairclass_v3_app_network` Docker network — the same network the old
  GoAirClass_V3 backend/frontend containers use, reached by container name (no host ports).
- The new backend container joins that same network as `goaapp-backend` and is reached by
  the gateway the same way — `http://goaapp-backend:7001`, no host port published, nothing
  exposed to the internet directly.
- **`app.goairclass.com` used to share one `server{}` block with `goairclass.com`/`www`**,
  all three routed to the old V3 website. That block gets split: `goairclass.com`/`www` keep
  working exactly as before; `app.goairclass.com` becomes its own block pointing only at
  this backend. See step 3.
- The TLS cert at `/etc/letsencrypt/live/goairclass.com/` already covers `app.goairclass.com`
  (it did before the split too — that's how the combined block served HTTPS for it). No new
  certbot run is needed.
- MongoDB stays on Atlas — no database container is deployed for this backend.
- The old GoAirClass_V3 stack (mongo/backend/frontend/admin-frontend) keeps running
  untouched — only the `app.goairclass.com` route changes where it points.

Files involved (already committed):
- [backend/Dockerfile](Dockerfile) — production image, listens on port 7001
- [backend/docker-compose.yml](docker-compose.yml) — joins `goairclass_v3_app_network`, no host port
- [backend/.env.example](.env.example) — template for the real `.env` you create on the server
- [backend/deploy/nginx/app.goairclass.com.conf](deploy/nginx/app.goairclass.com.conf) — the `server{}` block to add to the shared gateway config
- [.github/workflows/backend-ci.yml](../.github/workflows/backend-ci.yml) — PR checks
- [.github/workflows/backend-deploy.yml](../.github/workflows/backend-deploy.yml) — build, push, deploy on merge to `main`

---

## 0. What's already true on this server

- Repo is cloned at `/var/www/GoAApp` (from `github.com/onlinegologistics/GoAApp` — this is
  the same repo as the old `Rutuja-Dhayatidak/GoAApp` remote, just transferred to the org;
  GitHub redirects git operations on the old URL automatically).
- Docker + compose plugin are already installed and in heavy use.
- Ports 80/443 belong to the `nginx_gateway` container — do **not** install a host-level
  Nginx or run certbot directly on the host; both would conflict with what's already there.
- DNS for `app.goairclass.com` already resolves to this server — nothing to change there.

## 1. Bring up the new backend container

```bash
cd /var/www/GoAApp/backend
cp .env.example .env
nano .env   # fill in real production values — MONGO_URI, JWT_SECRET, RAZORPAY live keys,
            # SMTP creds, etc. Keep PORT=7001.

mkdir -p uploads tickets data
touch data/incremental_sync_state.json

# First run: no image has been pushed to GHCR yet, so build locally once.
docker compose build
docker compose up -d
docker compose logs -f   # confirm "MongoDB Connected Successfully" and "Server running on port 7001"
```

Sanity-check it's reachable from inside the gateway's network before touching any routing:

```bash
docker exec nginx_gateway wget -qO- http://goaapp-backend:7001/
# should print: API Working...
```

## 2. Back up the shared gateway config

This server already has a strong habit of timestamped backups before editing
`/var/www/gateway/nginx.conf` — keep doing that:

```bash
cp /var/www/gateway/nginx.conf /var/www/gateway/nginx.conf.bak-goaapp-switch-$(date +%Y%m%d-%H%M%S)
```

## 3. Split `app.goairclass.com` out of the shared block

Currently, one `server{}` block in `/var/www/gateway/nginx.conf` handles
`goairclass.com www.goairclass.com app.goairclass.com` together, proxying all three to the
old V3 frontend/backend. Two edits:

**a) Remove `app.goairclass.com` from that block's `server_name` line.** Open the file and
change:

```nginx
    server_name goairclass.com www.goairclass.com app.goairclass.com;
```

to:

```nginx
    server_name goairclass.com www.goairclass.com;
```

(This is the line inside the `listen 443 ssl` block — leave the `listen 80` block, which
lists five domains together for the ACME challenge/redirect, exactly as it is.)

**b) Append the new block** from
[backend/deploy/nginx/app.goairclass.com.conf](deploy/nginx/app.goairclass.com.conf) to the
end of the same file:

```bash
cat /var/www/GoAApp/backend/deploy/nginx/app.goairclass.com.conf >> /var/www/gateway/nginx.conf
```

## 4. Test and reload

```bash
docker exec nginx_gateway nginx -t
docker exec nginx_gateway nginx -s reload
```

`nginx -t` must print `syntax is ok` / `test is successful` before you reload — if it
doesn't, fix the reported line before proceeding (nothing is live yet at that point, so
there's no rush).

Then confirm from outside:

```bash
curl -s https://app.goairclass.com/         # should return "API Working..." (was the V3 website before)
curl -s https://goairclass.com/ | head -c 200   # should be unchanged — still the V3 website
```

## 5. GitHub Actions secrets (for automatic deploys going forward)

In `onlinegologistics/GoAApp` → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `VPS_HOST` | this server's public IP or hostname |
| `VPS_USER` | the SSH user the deploy workflow connects as |
| `VPS_SSH_KEY` | a private key matching an `authorized_keys` entry on the server (use a dedicated deploy keypair, not a personal one) |
| `VPS_PORT` | only if SSH isn't on port 22 |
| `DEPLOY_PATH` | **`/var/www/GoAApp/backend`** — required here, since it's not the workflow's generic default |
| `GHCR_TOKEN` | a [classic PAT](https://github.com/settings/tokens) with `read:packages` — only needed if you keep the `ghcr.io/onlinegologistics/goaapp-backend` package **private**. Skip it if you make the package public instead. |

After these are set, `git push origin main` (touching `backend/`) builds the image, pushes
`ghcr.io/onlinegologistics/goaapp-backend:latest` + `:<sha>`, then SSHes in and runs
`docker compose pull && docker compose up -d` in `/var/www/GoAApp/backend` — the gateway
needs no further changes on future deploys, since it already routes to the container by name.

## 6. Rollback

```bash
ssh user@SERVER_IP
cd /var/www/GoAApp/backend
export BACKEND_IMAGE=ghcr.io/onlinegologistics/goaapp-backend:<previous-good-sha>
docker compose pull
docker compose up -d
```

To revert the domain routing itself, restore the gateway config backup from step 2 and reload:

```bash
cp /var/www/gateway/nginx.conf.bak-goaapp-switch-<timestamp> /var/www/gateway/nginx.conf
docker exec nginx_gateway nginx -t && docker exec nginx_gateway nginx -s reload
```

## 7. Persistent data

`uploads/`, `tickets/`, and `data/incremental_sync_state.json` under
`/var/www/GoAApp/backend` are bind-mounted into the container (see
[docker-compose.yml](docker-compose.yml)), so they survive every redeploy. Back these up
along with your Atlas database — they aren't stored in Atlas.

## Troubleshooting

- `docker compose logs -f` in `/var/www/GoAApp/backend` — app logs (mongoose connection
  errors, cron errors, etc.).
- `docker exec nginx_gateway nginx -t` — gateway config syntax errors.
- `docker logs nginx_gateway` — gateway runtime/proxy errors (e.g. "connect() failed" means
  it can't reach `goaapp-backend:7001` — check `docker network ls`/`docker inspect
  goaapp-backend` to confirm it's actually on `goairclass_v3_app_network`).
- `docker ps` — confirm `goaapp-backend` is `Up` and `healthy` (the image ships a
  `HEALTHCHECK` that hits `/`).
- GitHub Actions tab — build/push/deploy logs for every run.
