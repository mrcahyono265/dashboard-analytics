# Deploy Analitics to EC2

## Prerequisites
- EC2 instance with Docker + Docker Compose installed
- Existing `~/reverse-proxy/conf.d/` nginx setup
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
# Fill DB_PASSWORD, JWT_SECRET (min 32 chars), MS_* (optional)
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

### 5. Run Prisma migrations + seed (first time only)
```bash
docker compose exec api npx prisma migrate deploy
# Seed is dev-only — create admin user manually in production:
docker compose exec api node -e "
  const bcrypt = require('bcryptjs');
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  bcrypt.hash('YOUR_PASSWORD', 12).then(h =>
    p.user.create({ data: { username: 'admin', passwordHash: h, displayName: 'Admin', role: 'RSE' } })
  ).then(() => { console.log('Admin created'); process.exit(0); });
"
```

### 6. Setup reverse proxy
```bash
cp deploy/analitics.conf ~/reverse-proxy/conf.d/analitics.conf
# Edit domain + SSL paths
nano ~/reverse-proxy/conf.d/analitics.conf

# Reload nginx
docker exec reverse-proxy nginx -t && docker exec reverse-proxy nginx -s reload
# OR: sudo nginx -t && sudo nginx -s reload
```

### 7. SSL (if using Let's Encrypt)
```bash
sudo certbot certonly --nginx -d analitics.example.com
```

## Updating
```bash
cd ~/dashboard_analytics
git pull
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

## Logs
```bash
docker compose logs -f api
docker compose logs -f web
```

## Backup Database
```bash
docker compose exec db pg_dump -U analitics analitics > backup_$(date +%Y%m%d).sql
```
