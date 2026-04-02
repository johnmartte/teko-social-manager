#!/bin/bash
set -e

cd /app

RUNTIME_MIGRATIONS_PATH="/app/runtime/migrations"

# Ensure the SQLite file exists (volume starts empty)
echo "[start] Ensuring database file exists..."
mkdir -p /app/database
touch /app/database/database.sqlite

echo "[start] Running migrations..."
if [ "${FORCE_MIGRATE_FRESH:-false}" = "true" ]; then
	echo "[start] FORCE_MIGRATE_FRESH=true -> running migrate:fresh..."
	php artisan migrate:fresh --path="$RUNTIME_MIGRATIONS_PATH" --realpath --force 2>&1
else
	php artisan migrate --path="$RUNTIME_MIGRATIONS_PATH" --realpath --force 2>&1
fi

echo "[start] Verifying critical tables..."
if ! php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); exit(Illuminate\\Support\\Facades\\Schema::hasTable('users') ? 0 : 1);"; then
	echo "[start] users table missing. Running migrate:fresh..."
	php artisan migrate:fresh --path="$RUNTIME_MIGRATIONS_PATH" --realpath --force 2>&1
fi

if [ "${SEED_SYSTEM_USER:-false}" = "true" ]; then
	echo "[start] Seeding system user..."
	php -r "require 'vendor/autoload.php'; \
		\$app = require 'bootstrap/app.php'; \
		\$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); \
		\$email = getenv('SYSTEM_USER_EMAIL'); \
		\$password = getenv('SYSTEM_USER_PASSWORD'); \
		\$name = getenv('SYSTEM_USER_NAME') ?: 'System User'; \
		if (!\$email || !\$password) { fwrite(STDERR, 'Missing SYSTEM_USER_EMAIL or SYSTEM_USER_PASSWORD'.PHP_EOL); exit(1);} \
		App\\Models\\User::updateOrCreate(['email' => \$email], ['name' => \$name, 'password' => \$password]);" 2>&1 || \
		echo "[start] Warning: system user upsert failed; continuing startup."
fi

echo "[start] Caching config..."
php artisan config:cache

echo "[start] Starting scheduler worker..."
php artisan schedule:work > /app/storage/logs/scheduler.log 2>&1 &

echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
