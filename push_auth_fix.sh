#!/bin/bash
set -e

echo "🚀 Pushing authentication fixes to GitHub..."

cd /Users/evertonhudson/Projects/vrux

# Check current status
echo "📋 Current git status:"
git status --short

# Add all changes
echo -e "\n📦 Adding all changes..."
git add -A

# Commit with descriptive message
echo -e "\n💾 Committing changes..."
git commit -m "Fix authentication: API routes now return JSON, skip domain restriction in dev

- Fixed signup/signin endpoints to always return JSON responses
- Added error handling wrapper to prevent HTML error pages
- Skip domain restriction in development mode
- Created test endpoint at /api/auth/test
- Fixed 'Unexpected token <' error in auth forms

Resolves auth issues preventing signup/signin functionality"

# Push to GitHub
echo -e "\n📤 Pushing to GitHub..."
git push origin main

echo -e "\n✅ Done! Changes pushed to GitHub."
