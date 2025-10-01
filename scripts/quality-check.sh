#!/bin/bash
set -e

echo "🧪 Running Quality Checks..."

cd backend

echo "➡️ Linting..."
npm run lint

echo "➡️ Running unit + integration tests with coverage (thresholds enforced via Jest config)..."
npm run test:coverage

echo "✅ All checks passed!"
