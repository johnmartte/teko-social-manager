#!/bin/bash
set -e

cd /app

# Ensure the SQLite file exists (volume starts empty)
echo "[start] Ensuring database file exists..."
mkdir -p /app/database
touch /app/database/database.sqlite

echo "[start] Running migrations..."
if [ "${FORCE_MIGRATE_FRESH:-false}" = "true" ]; then
	echo "[start] FORCE_MIGRATE_FRESH=true -> running migrate:fresh..."
	php artisan migrate:fresh --force 2>&1
else
	php artisan migrate --force 2>&1
fi

echo "[start] Verifying critical tables..."
if ! php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); exit(Illuminate\\Support\\Facades\\Schema::hasTable('users') ? 0 : 1);"; then
	echo "[start] users table missing. Running migrate:fresh..."
	php artisan migrate:fresh --force 2>&1
fi

if [ "${SEED_SYSTEM_USER:-false}" = "true" ]; then
	echo "[start] Seeding system user..."
	php artisan db:seed --class=Database\\Seeders\\ProductionSystemUserSeeder --force 2>&1 || \
		echo "[start] Warning: system user seeder failed; continuing startup."
fi

echo "[start] Caching config..."
php artisan config:cache

echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
