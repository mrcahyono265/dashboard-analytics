#!/bin/sh
set -e

echo "[Entrypoint] Waiting for database..."
until npx prisma db execute --schema prisma/schema.prisma --stdin <<< "SELECT 1" 2>/dev/null; do
  echo "  Database not ready, retrying in 2s..."
  sleep 2
done
echo "[Entrypoint] Database is ready."

if [ -d "prisma/migrations" ]; then
  echo "[Entrypoint] Running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "[Entrypoint] No migrations dir — running prisma db push..."
  npx prisma db push
fi

echo "[Entrypoint] Starting server..."
exec "$@"
