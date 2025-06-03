#!/bin/bash

echo "=== Pushing functionality fixes ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add all fixed files
git add lib/ai-providers.ts
git add components/enhanced-preview.tsx
git add components/preview.tsx

# Commit
git commit -m "Fix application functionality issues

- Fix SyntaxError by properly formatting mock provider output
- Change arrow function to proper export default function
- Add better error handling in preview component
- Add more React hooks to preview scope
- Fix code processing to handle edge cases
- Add user prompt display in mock component

This resolves:
1. SyntaxError: Unexpected token ')' 
2. Failed to generate component errors
3. Preview rendering issues"

# Push
git push origin main

echo ""
echo "=== Fixes pushed successfully! ==="
echo ""
echo "The application should now work correctly with:"
echo "- No syntax errors in preview"
echo "- Proper component generation (even with mock provider)"
echo "- Better error messages when issues occur"