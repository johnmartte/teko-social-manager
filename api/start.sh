#!/bin/bash
set -e

cd /app

echo "Running migrations..."
php artisan migrate --force

echo "Caching config..."
php artisan config:cache

echo "Starting supervisord..."
exec supervisord -c /app/supervisord.conf
