#!/bin/bash
set -e

echo "[start.sh] Running migrations..."
php artisan migrate --force

echo "[start.sh] Caching config..."
php artisan config:cache

echo "[start.sh] Starting supervisord (web + scheduler)..."
exec supervisord -n -c /app/supervisord.conf
