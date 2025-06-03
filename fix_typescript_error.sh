#!/bin/bash

echo "=== Fixing TypeScript error for Vercel deployment ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add the fixed file
git add components/code-editor.tsx

# Commit
git commit -m "Fix TypeScript error in code-editor component

- Change cursorSmoothCaretAnimation from boolean to string value
- TypeScript expects 'on' | 'off' | 'explicit' instead of true

This resolves the build error preventing deployment"

# Push
git push origin main

echo ""
echo "=== TypeScript error fixed and pushed! ==="
echo "The deployment should now succeed"