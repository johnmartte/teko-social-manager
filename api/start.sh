#!/bin/bash
set -e

cd /app

echo "[start] Running migrations..."
php artisan migrate --force

echo "[start] Caching config..."
php artisan config:cache

echo "[start] Launching scheduler loop in background..."
# Run schedule:run every 60s in a loop — more reliable than schedule:work in containers
(while true; do
  php artisan schedule:run >> /tmp/scheduler.log 2>&1
  sleep 60
done) &

echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
