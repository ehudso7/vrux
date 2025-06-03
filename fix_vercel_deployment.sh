#!/bin/bash

echo "=== Fixing Vercel Deployment Issue ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Step 1: Remove any Vercel cache
echo "1. Removing Vercel cache..."
rm -rf .vercel

# Step 2: Ensure vercel.json has NO env section
echo "2. Creating clean vercel.json..."
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "pages/api/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
EOF

# Step 3: Add and commit
echo "3. Committing clean configuration..."
git add vercel.json
git add -A
git commit -m "Fix Vercel deployment - remove all secret references

- Remove any env section from vercel.json
- Clear Vercel cache
- Simplify configuration
- Environment variables should be set in Vercel dashboard only"

# Step 4: Push to GitHub
echo "4. Pushing to GitHub..."
git push origin main

echo ""
echo "=== Fix Complete! ==="
echo ""
echo "Now do the following:"
echo ""
echo "1. Go to your Vercel dashboard"
echo "2. Go to Settings → Environment Variables"
echo "3. Delete ALL existing environment variables"
echo "4. Re-add them fresh:"
echo "   - OPENAI_API_KEY = your-actual-api-key"
echo "   - SESSION_SECRET = $(openssl rand -base64 32)"
echo "   - ANTHROPIC_API_KEY = your-anthropic-key (optional)"
echo ""
echo "5. In Vercel dashboard, go to Deployments"
echo "6. Click the three dots (...) on the latest deployment"
echo "7. Click 'Redeploy'"
echo "8. Do NOT use 'Use existing Build Cache' - uncheck it"
echo ""
echo "This should fix the secret reference error!"