#!/bin/bash

set -e

echo "🚀 Starting BarberPro Backend in Docker..."

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy --skip-generate

echo "✅ Migrations complete"

# Start the development server
echo "🎯 Starting dev server with hot reload..."
exec npm run dev
