#!/bin/bash
set -e

cd /app

# Ensure the SQLite file exists (volume starts empty)
echo "[start] Ensuring database file exists..."
mkdir -p /app/database
touch /app/database/database.sqlite

echo "[start] Running migrations..."
php artisan migrate --force 2>&1

if [ "${SEED_SYSTEM_USER:-false}" = "true" ]; then
	echo "[start] Seeding system user..."
	php artisan db:seed --class=Database\\Seeders\\ProductionSystemUserSeeder --force 2>&1
fi

echo "[start] Caching config..."
php artisan config:cache

echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
