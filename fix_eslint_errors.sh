#!/bin/bash

echo "=== Fixing ESLint errors for Vercel deployment ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add all fixed files
git add pages/pricing.tsx pages/settings.tsx pages/signin.tsx pages/signup.tsx

# Commit
git commit -m "Fix all ESLint errors blocking deployment

- Remove unused imports in pricing.tsx (Zap, Shield, Code2, etc.)
- Remove unused imports in settings.tsx (Mail, Download, Check, X)
- Fix unescaped apostrophes with &apos; entity
- Remove unused router imports in signin.tsx and signup.tsx
- Remove unused error parameters in catch blocks
- Add missing ArrowRight import in settings.tsx

All linting errors are now resolved"

# Push
git push origin main

echo ""
echo "=== ESLint fixes pushed! ==="
echo "Vercel should now successfully build the project"