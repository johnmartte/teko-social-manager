#!/bin/bash
set -e

cd /app

# ── Ensure persistent storage ────────────────────────────────────────
echo "[start] Setting up database and uploads..."
mkdir -p /app/database/uploads
touch /app/database/database.sqlite

# Force the DB path
export DB_DATABASE=/app/database/database.sqlite

echo "[start] DB_DATABASE=${DB_DATABASE}"

# ── Clear any cached config from the build step ─────────────────────
rm -f /app/bootstrap/cache/config.php
rm -f /app/bootstrap/cache/routes-v7.php
rm -f /app/bootstrap/cache/services.php
rm -f /app/bootstrap/cache/packages.php

# ── Run migrations ──────────────────────────────────────────────────
# Always use migrate:fresh if the users table doesn't exist,
# because a previous failed deploy may have recorded migrations
# in the migrations table without actually creating the tables.
echo "[start] Checking if users table exists..."
USERS_EXISTS=$(php -r "
    require 'vendor/autoload.php';
    \$db = new SQLite3('/app/database/database.sqlite');
    \$result = \$db->querySingle(\"SELECT name FROM sqlite_master WHERE type='table' AND name='users'\");
    echo \$result ? 'yes' : 'no';
" 2>/dev/null || echo "no")

if [ "$USERS_EXISTS" = "yes" ]; then
    echo "[start] Tables exist, running normal migrate..."
    php artisan migrate --force 2>&1
else
    echo "[start] Tables missing, running migrate:fresh..."
    php artisan migrate:fresh --force 2>&1
fi

# Verify
php -r "
    \$db = new SQLite3('/app/database/database.sqlite');
    \$result = \$db->query(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\");
    echo '[start] Tables: ';
    \$tables = [];
    while (\$row = \$result->fetchArray()) { \$tables[] = \$row['name']; }
    echo implode(', ', \$tables) . PHP_EOL;
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

# ── Start server (no config:cache to avoid DB path issues) ──────────
echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
