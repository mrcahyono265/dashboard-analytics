#!/bin/bash
# Database Backup Script - Run on EC2
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

DB_PATH="/home/ubuntu/dashboard-analytics/server/prisma/prod.db"
BACKUP_DIR="/home/ubuntu/backups"
MAX_BACKUPS=7

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  error "Database not found at $DB_PATH"
fi

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/prod_$DATE.db"

log "💾 Backing up database..."
cp "$DB_PATH" "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"
log "✅ Backup created: prod_$DATE.db.gz"

# Cleanup old backups
KEEP=$((MAX_BACKUPS + 1))
ls -t "$BACKUP_DIR"/prod_*.db.gz 2>/dev/null | tail -n +$KEEP | xargs rm -f 2>/dev/null || true

REMAINING=$(ls "$BACKUP_DIR"/prod_*.db.gz 2>/dev/null | wc -l)
log "📦 Backups on disk: $REMAINING"

# Show sizes
echo ""
du -sh "$BACKUP_DIR"/* 2>/dev/null
