#!/bin/bash
set -e

cd /app

# ── Ensure persistent storage ────────────────────────────────────────
echo "[start] Setting up database and uploads..."
mkdir -p /app/database/uploads
touch /app/database/database.sqlite

# Force the DB path
export DB_DATABASE=/app/database/database.sqlite

# ── ALWAYS clear any cached config from the build step ───────────────
# Railpack may cache config during build; we must clear it so
# artisan picks up the runtime DB_DATABASE we just set.
rm -f /app/bootstrap/cache/config.php
rm -f /app/bootstrap/cache/*.php

echo "[start] Running migrations (DB: ${DB_DATABASE})..."
php artisan migrate --force 2>&1

# Double-check: if users table is still missing, run fresh
php -r "
    require 'vendor/autoload.php';
    \$app = require 'bootstrap/app.php';
    \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    if (!\Illuminate\Support\Facades\Schema::hasTable('users')) {
        echo '[start] Tables missing, running migrate:fresh...' . PHP_EOL;
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
        echo \Illuminate\Support\Facades\Artisan::output();
    } else {
        echo '[start] Tables OK (' . \App\Models\User::count() . ' users)' . PHP_EOL;
    }
"

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
        if (!\$email || !\$password) { fwrite(STDERR, 'Missing env vars'.PHP_EOL); exit(1);}
        App\Models\User::updateOrCreate(['email' => \$email], ['name' => \$name, 'password' => \$password]);
        echo 'System user ready' . PHP_EOL;
    " 2>&1 || echo "[start] Warning: system user seed failed."
fi

# ── Do NOT cache config — it causes DB path issues on Railway ───────
echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
