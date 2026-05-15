#!/bin/bash
set -e

cd /app

# ── Ensure persistent storage ────────────────────────────────────────
echo "[start] Ensuring database file and uploads directory exist..."
mkdir -p /app/database
mkdir -p /app/database/uploads
touch /app/database/database.sqlite

# Force the DB path so config:cache picks it up
export DB_DATABASE=/app/database/database.sqlite

echo "[start] DB_DATABASE=${DB_DATABASE}"
echo "[start] SQLite file size: $(wc -c < /app/database/database.sqlite) bytes"

# ── Clear any stale config cache ────────────────────────────────────
echo "[start] Clearing config cache..."
php artisan config:clear 2>&1 || true
php artisan cache:clear 2>&1 || true

# ── Run migrations ──────────────────────────────────────────────────
echo "[start] Running migrations..."
php artisan migrate --force --verbose 2>&1

# Verify the users table exists
echo "[start] Verifying critical tables..."
if ! php -r "
    require 'vendor/autoload.php';
    \$app = require 'bootstrap/app.php';
    \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    if (!Illuminate\Support\Facades\Schema::hasTable('users')) { echo 'MISSING'; exit(1); }
    echo 'OK (' . App\Models\User::count() . ' users)';
"; then
    echo "[start] users table missing after migrate. Running migrate:fresh..."
    php artisan migrate:fresh --force 2>&1
fi

# ── Seed system user if configured ──────────────────────────────────
if [ "${SEED_SYSTEM_USER:-false}" = "true" ]; then
    echo "[start] Seeding system user..."
    php -r "
        require 'vendor/autoload.php';
        \$app = require 'bootstrap/app.php';
        \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        \$email = getenv('SYSTEM_USER_EMAIL');
        \$password = getenv('SYSTEM_USER_PASSWORD');
        \$name = getenv('SYSTEM_USER_NAME') ?: 'System User';
        if (!\$email || !\$password) { fwrite(STDERR, 'Missing SYSTEM_USER_EMAIL or SYSTEM_USER_PASSWORD'.PHP_EOL); exit(1);}
        App\Models\User::updateOrCreate(['email' => \$email], ['name' => \$name, 'password' => \$password]);
        echo 'System user ready';
    " 2>&1 || echo "[start] Warning: system user upsert failed; continuing startup."
fi

# ── Cache config for performance ────────────────────────────────────
echo "[start] Caching config..."
php artisan config:cache

echo "[start] Final SQLite size: $(wc -c < /app/database/database.sqlite) bytes"

# ── Start server ────────────────────────────────────────────────────
echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
