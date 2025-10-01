#!/bin/bash
set -e

echo "🧪 Running Quality Checks..."

cd backend

echo "➡️ Linting..."
npm run lint

echo "➡️ Running unit + integration tests with coverage..."
npm run test:coverage

echo "➡️ Checking coverage thresholds..."
# Jest enforces thresholds from jest.config.js
# Fail the build if below threshold

echo "✅ All checks passed!"
