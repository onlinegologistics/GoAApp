# Deploying the backend to app.goairclass.com

This backend is the API for the GoAirclass mobile app (React Native — there's no separate
web frontend to deploy). `app.goairclass.com` only needs to serve this Node/Express API.

## Architecture

```
Internet ──HTTPS──▶ Nginx (host, port 443/80) ──▶ Docker container "goaapp-backend" (127.0.0.1:7001)
                                                          │
                                                          └──▶ MongoDB Atlas (cloud, unchanged)
```

- The Node app runs **inside Docker**, bound only to `127.0.0.1:7001` — never exposed directly.
- **Nginx runs on the host** (not in Docker), terminates TLS for `app.goairclass.com`, and reverse-proxies to the container.
- **GitHub Actions** builds the image on every push to `main`, pushes it to GitHub Container Registry (GHCR), then SSHes into the server and rolls the container over.
- MongoDB stays on Atlas — no database container is deployed.

Files involved (already committed):
- [backend/Dockerfile](Dockerfile) — production image, listens on port 7001
- [backend/docker-compose.yml](docker-compose.yml) — how the container runs on the server
- [backend/.env.example](.env.example) — template for the real `.env` you create on the server
- [backend/deploy/nginx/app.goairclass.com.conf](deploy/nginx/app.goairclass.com.conf) — Nginx vhost
- [.github/workflows/backend-ci.yml](../.github/workflows/backend-ci.yml) — PR checks
- [.github/workflows/backend-deploy.yml](../.github/workflows/backend-deploy.yml) — build, push, deploy on merge to `main`

---

## 0. What you need before starting

- A VPS/server (Ubuntu 22.04+ recommended) with a public IP. Any provider works (DigitalOcean, Hetzner, AWS EC2, etc.) — this repo doesn't assume one.
- Access to the DNS for `goairclass.com` (to add an A record for the `app` subdomain).
- Admin access to the `Rutuja-Dhayatidak/GoAApp` GitHub repo (to add secrets).

---

## 1. One-time server setup

SSH into the fresh server and run:

```bash
# Docker + compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in again after this

# Nginx + certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# App directory the deploy pipeline will operate on
sudo mkdir -p /opt/goaapp/backend
sudo chown -R $USER:$USER /opt/goaapp
mkdir -p /opt/goaapp/backend/{uploads,tickets,data}
touch /opt/goaapp/backend/data/incremental_sync_state.json
```

Create a deploy SSH keypair **for GitHub Actions** (don't reuse your personal key):

```bash
ssh-keygen -t ed25519 -f ~/goaapp_deploy_key -N ""
cat ~/goaapp_deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/goaapp_deploy_key      # copy this private key -> GitHub secret VPS_SSH_KEY (next section)
```

## 2. Point the domain at the server

In your DNS provider for `goairclass.com`, add:

```
Type: A
Host: app
Value: <your server's public IP>
TTL:   auto / 300
```

Wait for it to propagate (`dig app.goairclass.com` should return the server IP) before issuing the SSL certificate in step 4.

## 3. Copy the deploy files onto the server

From your machine (or via `git clone` on the server itself):

```bash
scp backend/docker-compose.yml backend/.env.example user@SERVER_IP:/opt/goaapp/backend/
scp backend/deploy/nginx/app.goairclass.com.conf user@SERVER_IP:/tmp/
```

On the server:

```bash
cd /opt/goaapp/backend
cp .env.example .env
nano .env   # fill in real values — MONGO_URI, JWT_SECRET, RAZORPAY live keys, SMTP creds, etc.
            # keep PORT=7001

sudo mv /tmp/app.goairclass.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/app.goairclass.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Issue the SSL certificate

```bash
sudo certbot --nginx -d app.goairclass.com
```

This edits the Nginx config in place to add the `ssl_certificate` lines and sets up auto-renewal (`certbot renew` runs via systemd timer already — verify with `systemctl list-timers | grep certbot`).

## 5. Add GitHub repo secrets

In `GoAApp` → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|---|---|
| `VPS_HOST` | VPS's public IP or hostname |
| `VPS_USER` | the SSH user from step 1 |
| `VPS_SSH_KEY` | the **private** key generated in step 1 (`~/goaapp_deploy_key`) |
| `VPS_PORT` | only if not 22 |
| `DEPLOY_PATH` | only if not `/opt/goaapp/backend` |
| `GHCR_TOKEN` | a [classic PAT](https://github.com/settings/tokens) with `read:packages` scope — only needed if you keep the `ghcr.io/.../goaapp-backend` package **private** (default). Skip it if you make the package public instead. |

## 6. First deploy

Run the first deploy manually so the container exists before the automated pipeline tries to `pull`/`up` it:

```bash
cd /opt/goaapp/backend
docker compose pull || docker compose build   # pull works once an image has been pushed by CI at least once
docker compose up -d
docker compose logs -f   # confirm "MongoDB Connected Successfully" and "Server running on port 7001"
```

If this is truly the very first run and no image has been pushed to GHCR yet, either push once to `main` to let CI build it, or run `docker compose build && docker compose up -d` locally on the server to bootstrap.

Then confirm:

```bash
curl -k https://app.goairclass.com/    # should return "API Working..."
```

## 7. Everyday deploys

After the above one-time setup, deploying is just:

```bash
git push origin main   # touching anything under backend/
```

`.github/workflows/backend-deploy.yml` builds the image, pushes `ghcr.io/rutuja-dhayatidak/goaapp-backend:latest` and `:<commit-sha>`, then connects to the VPS and runs `docker compose pull && docker compose up -d`. You can also trigger it manually from the Actions tab (`workflow_dispatch`).

## 8. Rollback

```bash
ssh user@SERVER_IP
cd /opt/goaapp/backend
export BACKEND_IMAGE=ghcr.io/rutuja-dhayatidak/goaapp-backend:<previous-good-sha>
docker compose pull
docker compose up -d
```

## 9. Persistent data

`uploads/`, `tickets/`, and `data/incremental_sync_state.json` on the server are bind-mounted into the container (see [docker-compose.yml](docker-compose.yml)), so they survive every redeploy. Back these up along with your Atlas database — they aren't stored in Atlas.

## Troubleshooting

- `docker compose logs -f` on the server — app logs (mongoose connection errors, cron errors, etc.).
- `sudo journalctl -u nginx` / `sudo nginx -t` — Nginx issues.
- `docker ps` — confirm the container is `Up` and `healthy` (the image ships a `HEALTHCHECK` that hits `/`).
- GitHub Actions tab — build/push/deploy logs for every run.
