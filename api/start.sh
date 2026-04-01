#!/bin/bash
set -e

cd /app

echo "[start] Running migrations..."
php artisan migrate --force

echo "[start] Caching config..."
php artisan config:cache

echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
