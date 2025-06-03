#!/bin/bash

echo "=== Pushing Vercel deployment fix ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Add the updated files
git add scripts/check-env.js
git add vercel.json

# Create commit
git commit -m "Fix Vercel deployment build failure

- Update check-env.js to work in Vercel/production environment
- Skip .env.local check when running in Vercel
- Fix malformed vercel.json (missing newline)
- Add SESSION_SECRET to optional variables list

The script now detects Vercel environment and doesn't require .env.local file"

# Push to GitHub
git push origin main

echo ""
echo "=== Fix pushed! ==="
echo ""
echo "Vercel should now:"
echo "1. Automatically detect the push and start a new deployment"
echo "2. The build should succeed if OPENAI_API_KEY is set in Vercel"
echo ""
echo "Make sure in Vercel dashboard you have:"
echo "- OPENAI_API_KEY set to your actual key"
echo "- SESSION_SECRET set to a random value"
echo "- Any other optional keys you want"