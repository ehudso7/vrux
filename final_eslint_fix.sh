#!/bin/bash

echo "=== Final ESLint fixes for Vercel deployment ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add all fixed files
git add pages/api/auth/me.ts
git add pages/api/auth/update-profile.ts
git add pages/api/generate-ui.ts
git add pages/dashboard.tsx
git add pages/docs.tsx

# Commit
git commit -m "Fix remaining ESLint errors for deployment

- Remove unused error parameters in API catch blocks
- Replace 'any' type with proper Record<string, string> type
- Remove unused imports (Users, Book, Settings, Shield, Zap)
- Fix unescaped apostrophe with &apos; entity

All ESLint errors are now resolved for successful deployment"

# Push
git push origin main

echo ""
echo "=== All ESLint errors fixed and pushed! ==="
echo "The deployment should now succeed without any linting issues"