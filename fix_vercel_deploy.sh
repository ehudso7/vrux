#!/bin/bash

echo "=== Fixing Vercel deployment configuration ==="

cd /Users/evertonhudson/Projects/vrux

# Add the updated files
git add vercel.json
git add DEPLOYMENT.md

# Commit the fix
git commit -m "Fix Vercel deployment configuration

- Remove secret references from vercel.json
- Add comprehensive deployment guide
- Update function paths to .ts extensions
- Add security headers including CSP
- Add clean URLs configuration
- Document environment variable setup process

Fixes deployment error: 'Environment Variable references Secret which does not exist'"

# Push to GitHub
git push origin main

echo "=== Deployment fix pushed! ==="
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add environment variables in Settings → Environment Variables"
echo "3. Redeploy your project"
echo ""
echo "Required environment variables:"
echo "- OPENAI_API_KEY"
echo "- SESSION_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "See DEPLOYMENT.md for full instructions"