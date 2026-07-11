#!/bin/bash
# Health Check Script - Run on EC2
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; }

echo "🏥 Prio Dashboard Health Check"
echo "=============================="

# Check PM2
echo ""
echo "📦 PM2 Status:"
pm2 list --no-color 2>/dev/null || warn "PM2 not running"

# Check backend
echo ""
echo "🔌 Backend API:"
HEALTH=$(curl -s http://localhost:3001/api/health 2>/dev/null || echo '{"status":"error"}')
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "Backend is healthy"
else
  fail "Backend is DOWN"
fi

# Check Nginx
echo ""
echo "🌐 Nginx:"
if systemctl is-active --quiet nginx; then
  log "Nginx is running"
else
  fail "Nginx is DOWN"
fi

# Check disk space
echo ""
echo "💾 Disk Space:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
  fail "Disk usage critical: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -gt 70 ]; then
  warn "Disk usage high: ${DISK_USAGE}%"
else
  log "Disk usage OK: ${DISK_USAGE}%"
fi

# Check database
echo ""
echo "🗄️ Database:"
DB_PATH="/home/ubuntu/dashboard-analytics/server/prisma/prod.db"
if [ -f "$DB_PATH" ]; then
  DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
  log "Database exists ($DB_SIZE)"
else
  fail "Database not found"
fi

# Check backups
echo ""
echo "💾 Backups:"
BACKUP_COUNT=$(ls /home/ubuntu/backups/prod_*.db 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
  LATEST=$(ls -t /home/ubuntu/backups/prod_*.db 2>/dev/null | head -1)
  log "Latest backup: $(basename "$LATEST")"
else
  warn "No backups found"
fi

# Check frontend
echo ""
echo "🏗️ Frontend:"
if [ -d "/home/ubuntu/dashboard-analytics/dist" ]; then
  log "Frontend build exists"
else
  fail "Frontend build missing"
fi

echo ""
echo "=============================="
echo "✅ Health check complete"
