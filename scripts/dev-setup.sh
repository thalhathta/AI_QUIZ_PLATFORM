#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# Install backend dependencies
cd backend
npm install

# Copy environment files if not present
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  Remember to update .env with your real values"
fi

echo "✅ Dev setup complete."
