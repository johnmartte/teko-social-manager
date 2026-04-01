#!/bin/bash
set -e

cd /app

echo "[start] Running migrations..."
php artisan migrate --force

echo "[start] Caching config..."
php artisan config:cache

# Trap signals so both children get cleaned up
cleanup() {
  echo "[start] Shutting down..."
  kill "$SCHED_PID" 2>/dev/null || true
  kill "$WEB_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "[start] Launching scheduler loop..."
(while true; do
  php artisan schedule:run --verbose --no-interaction 2>&1
  sleep 60
done) &
SCHED_PID=$!

echo "[start] Starting web server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}" &
WEB_PID=$!

# Wait for the web server — if it dies, the container should restart
wait $WEB_PID
