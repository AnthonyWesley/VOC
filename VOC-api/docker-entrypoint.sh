#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Migrations applied. Starting server..."
exec node dist/main.js