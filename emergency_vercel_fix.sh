#!/bin/bash

echo "=== EMERGENCY: Fixing Vercel deployment ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add files
git add package.json scripts/check-env.js

# Commit
git commit -m "URGENT: Fix Vercel deployment - remove prebuild env check

- Remove prebuild script that runs check-env during build
- Make check-env exit immediately in production/Vercel
- Environment checks only run in local development now

This allows Vercel to build without requiring .env.local file"

# Push
git push origin main

echo ""
echo "=== PUSHED! Vercel should start building immediately ==="