#!/bin/sh
set -e

echo "[Entrypoint] Waiting for database..."
until bun x prisma db execute --schema prisma/schema.prisma --stdin <<"EOF" 2>/dev/null; do
SELECT 1
EOF
  echo "  Database not ready, retrying in 2s..."
  sleep 2
done
echo "[Entrypoint] Database is ready."

if [ -d "prisma/migrations" ]; then
  echo "[Entrypoint] Running prisma migrate deploy..."
  bun x prisma migrate deploy
else
  echo "[Entrypoint] No migrations dir — running prisma db push..."
  bun x prisma db push
fi

echo "[Entrypoint] Starting server..."
exec "$@"
