#!/bin/bash
set -e

cd /app

# ── Persistent volume is mounted at /data ────────────────────────────
# This avoids overwriting /app/database which contains migrations/
echo "[start] Setting up persistent storage at /data..."
mkdir -p /data/uploads
touch /data/database.sqlite

# Point Laravel at the volume-backed SQLite
export DB_DATABASE=/data/database.sqlite

echo "[start] DB_DATABASE=${DB_DATABASE}"
echo "[start] SQLite size: $(wc -c < /data/database.sqlite) bytes"

# ── Clear any cached config from the build step ─────────────────────
rm -f /app/bootstrap/cache/config.php
rm -f /app/bootstrap/cache/routes-v7.php
rm -f /app/bootstrap/cache/services.php
rm -f /app/bootstrap/cache/packages.php

# ── Run migrations ──────────────────────────────────────────────────
USERS_EXISTS=$(php -r "
    \$db = new SQLite3('/data/database.sqlite');
    \$result = \$db->querySingle(\"SELECT name FROM sqlite_master WHERE type='table' AND name='users'\");
    echo \$result ? 'yes' : 'no';
" 2>/dev/null || echo "no")

if [ "$USERS_EXISTS" = "yes" ]; then
    echo "[start] Tables exist, running migrate..."
    php artisan migrate --force 2>&1
else
    echo "[start] Tables missing, running migrate:fresh..."
    php artisan migrate:fresh --force 2>&1
fi

# Verify
php -r "
    \$db = new SQLite3('/data/database.sqlite');
    \$result = \$db->query(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\");
    \$tables = [];
    while (\$row = \$result->fetchArray()) { \$tables[] = \$row['name']; }
    echo '[start] Tables: ' . implode(', ', \$tables) . PHP_EOL;
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

echo "[start] Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
