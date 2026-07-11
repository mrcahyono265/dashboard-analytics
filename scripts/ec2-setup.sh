#!/bin/bash
# EC2 Setup Script - Prio Dashboard
# Run this ONCE on fresh EC2 instance
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Check if running as ubuntu
if [ "$USER" != "ubuntu" ]; then
  error "Run this script as 'ubuntu' user, not root"
fi

log "🚀 Starting EC2 setup for Prio Dashboard..."

# Update system
log "📦 Updating system packages..."
sudo apt update -qq && sudo apt upgrade -y -qq

# Install dependencies
log "📦 Installing Node.js, Nginx, PM2..."
sudo apt install -y -qq nginx curl git build-essential

# Install Bun
log "📦 Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Verify Bun
bun --version || error "Bun installation failed"

# Install PM2 globally
log "📦 Installing PM2..."
npm install -g pm2 2>/dev/null

# Clone repo
log "📥 Cloning repository..."
cd /home/ubuntu
if [ -d "dashboard-analytics" ]; then
  warn "Repository already exists, pulling latest..."
  cd dashboard-analytics
  git pull origin main
else
  git clone https://github.com/mrcahyono265/dashboard-analytics.git
  cd dashboard-analytics
fi

# Setup backend
log "⚙️ Setting up backend..."
cd server
bun install
cp .env.example .env 2>/dev/null || true

# Generate random JWT secret
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"file:./prod.db\"|" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=\"http://$(curl -s ifconfig.me)\"|" .env

bun run db:generate
bun run db:push
bun run db:seed
cd ..

# Build frontend
log "🏗️ Building frontend..."
npm install
npm run build

# Setup PM2
log "🚀 Starting backend with PM2..."
pm2 delete prio-api 2>/dev/null || true
pm2 start bun --name "prio-api" --cwd /home/ubuntu/dashboard-analytics/server -- run src/index.ts
pm2 save
pm2 startup 2>/dev/null || true

# Setup Nginx
log "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/prio-dashboard > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /home/ubuntu/dashboard-analytics/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 256;
}
EOF

sudo ln -sf /etc/nginx/sites-available/prio-dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t || error "Nginx config test failed"
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup firewall
log "🔥 Configuring firewall..."
sudo ufw allow 22/tcp 2>/dev/null || true
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
sudo ufw --force enable 2>/dev/null || true

# Setup database backup cron
log "💾 Setting up database backup..."
mkdir -p /home/ubuntu/backups
cat > /home/ubuntu/backup-db.sh <<'BACKUP'
#!/bin/bash
DB_PATH="/home/ubuntu/dashboard-analytics/server/prisma/prod.db"
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
cp "$DB_PATH" "$BACKUP_DIR/prod_$DATE.db"
# Keep only last 7 backups
ls -t "$BACKUP_DIR"/prod_*.db | tail -n +8 | xargs rm -f 2>/dev/null
BACKUP
chmod +x /home/ubuntu/backup-db.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-db.sh") | sort -u | crontab -

# Health check
log "🏥 Running health check..."
sleep 2
HEALTH=$(curl -s http://localhost:3001/api/health || echo '{"status":"error"}')
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "✅ Backend is running!"
else
  warn "Backend might need a moment to start..."
fi

PUBLIC_IP=$(curl -s ifconfig.me)
log "============================================"
log "✅ Setup complete!"
log "🌐 Dashboard: http://$PUBLIC_IP"
log "📊 API Health: http://$PUBLIC_IP/api/health"
log "============================================"
log ""
log "Default login credentials:"
log "  RSE:           zahra / admin123"
log "  Store Manager: febriana / sm123"
log "  CRR:           dyah / crr123"
log ""
log "To deploy updates: ./scripts/deploy.sh"
