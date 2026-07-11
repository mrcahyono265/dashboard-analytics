#!/bin/bash
# Deploy Script - Run from LOCAL machine
# Usage: ./scripts/deploy.sh <ec2-ip> <key-path>
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARN:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; exit 1; }

EC2_IP="${1:-}"
KEY_PATH="${2:-}"

if [ -z "$EC2_IP" ] || [ -z "$KEY_PATH" ]; then
  echo "Usage: ./scripts/deploy.sh <ec2-ip> <key-path>"
  echo "Example: ./scripts/deploy.sh 54.123.45.67 ~/.ssh/key.pem"
  exit 1
fi

SSH_KEY="$HOME/.ssh/$(basename "$KEY_PATH")"
cp "$KEY_PATH" "$SSH_KEY" 2>/dev/null || true
chmod 600 "$SSH_KEY"

SSH_CMD="ssh -o StrictHostKeyChecking=no -i $SSH_KEY ubuntu@$EC2_IP"

log "🚀 Deploying to $EC2_IP..."

# Pre-check: is server reachable?
if ! $SSH_CMD "echo ok" &>/dev/null; then
  error "Cannot connect to $EC2_IP"
fi

# Backup current state
log "💾 Creating backup..."
$SSH_CMD "cd ~/dashboard-analytics && git stash 2>/dev/null || true"

# Pull latest
log "📥 Pulling latest code..."
$SSH_CMD "cd ~/dashboard-analytics && git pull origin main" || {
  warn "Git pull failed, attempting reset..."
  $SSH_CMD "cd ~/dashboard-analytics && git fetch origin && git reset --hard origin/main"
}

# Check if backend deps changed
BACKEND_HASH=$($SSH_CMD "cat ~/dashboard-analytics/server/package.json | md5sum | cut -d' ' -f1" 2>/dev/null || echo "unknown")

# Install backend deps if changed
log "📦 Checking backend dependencies..."
$SSH_CMD "cd ~/dashboard-analytics/server && bun install"

# Rebuild frontend
log "🏗️ Building frontend..."
$SSH_CMD "cd ~/dashboard-analytics && npm run build" || error "Frontend build failed"

# Restart backend
log "🔄 Restarting backend..."
$SSH_CMD "pm2 restart prio-api" || {
  warn "PM2 restart failed, starting fresh..."
  $SSH_CMD "cd ~/dashboard-analytics/server && pm2 start bun --name prio-api -- run src/index.ts"
}

# Wait for startup
sleep 3

# Health check
log "🏥 Running health check..."
HEALTH=$($SSH_CMD "curl -s http://localhost:3001/api/health" 2>/dev/null || echo '{"status":"error"}')

if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "✅ Deploy successful!"
  log "🌐 http://$EC2_IP"
else
  warn "Backend might still be starting... checking logs..."
  $SSH_CMD "pm2 logs prio-api --lines 20 --nostream"
  warn "If backend is down, try: $SSH_CMD 'pm2 restart prio-api'"
fi
