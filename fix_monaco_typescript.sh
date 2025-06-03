#!/bin/bash

echo "=== Fixing Monaco Editor TypeScript error ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add the fixed file
git add components/intelligent-chat-interface.tsx

# Commit
git commit -m "Fix Monaco Editor TypeScript error

- Remove invalid 'diffEditor' property from Monaco options
- This property doesn't exist in IStandaloneEditorConstructionOptions

Resolves TypeScript compilation error for deployment"

# Push
git push origin main

echo ""
echo "=== Monaco Editor error fixed and pushed! ==="
echo "Deployment should now proceed successfully"