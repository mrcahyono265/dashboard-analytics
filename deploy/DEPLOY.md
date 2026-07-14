# Deploy Analitics to EC2

## Prerequisites
- EC2 instance with Docker + Docker Compose installed
- Existing `~/reverse-proxy/conf.d/` nginx setup (or system nginx)
- Domain pointing to EC2 IP

## Steps

### 1. Clone repo
```bash
cd ~
git clone <repo-url> dashboard_analytics
cd dashboard_analytics
```

### 2. Create .env
```bash
cp .env.example .env
nano .env
# Fill DB_PASSWORD, JWT_SECRET (min 32 chars), FRONTEND_URL (production URL), MS_* (optional)
```

### 3. Generate MS_TOKEN_ENCRYPTION_KEY (if using OneDrive sync)
```bash
openssl rand -hex 32
# Paste into .env as MS_TOKEN_ENCRYPTION_KEY
```

### 4. Build and start
```bash
docker compose up -d --build
```

### 5. Create admin user (first time only)
```bash
docker compose exec api bun -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
bcrypt.hash('YOUR_PASSWORD', 12).then(h =>
  p.user.create({ data: { username: 'admin', passwordHash: h, displayName: 'Admin', role: 'RSE' } })
).then(() => { console.log('Admin created'); process.exit(0); });
"
```
Note: Migrations run automatically via entrypoint.sh — no manual `prisma migrate deploy` needed.

### 6. Connect web container to shared network (if using separate reverse proxy)
```bash
docker network connect shared-web-network dashboard-analytics-web-1
```
This is required if your reverse proxy is in a separate Docker network. The web container loses this connection on every `docker compose up` (recreate), so re-run after restart.

### 7. Setup reverse proxy
```bash
cp deploy/analitics.conf ~/reverse-proxy/conf.d/analitics.conf
# Edit domain + SSL paths
nano ~/reverse-proxy/conf.d/analitics.conf

# Reload nginx
docker exec global-nginx-proxy nginx -t && docker exec global-nginx-proxy nginx -s reload
# OR: sudo nginx -t && sudo nginx -s reload
```

### 8. SSL (if using Let's Encrypt)
```bash
sudo certbot certonly --webroot -w /var/www/certbot -d analitics.example.com
```

## Updating
```bash
cd ~/dashboard_analytics
git pull
docker compose up -d --build
docker network connect shared-web-network dashboard-analytics-web-1
```

## Notes

### Trust Proxy
Backend uses `app.set('trust proxy', 1)` — required when behind a reverse proxy, otherwise `express-rate-limit` throws `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`. This is already set in `backend/src/index.ts`.

### Upload Limit
Nginx `client_max_body_size` must be set at **both** levels:
1. `frontend/nginx.conf` (already set to 50M)
2. Reverse proxy config (`deploy/analitics.conf` — already set to 50M)

### Logs
```bash
docker compose logs -f api
docker compose logs -f web
```

### Backup Database
```bash
docker compose exec db pg_dump -U analitics analitics > backup_$(date +%Y%m%d).sql
```
