#!/bin/bash

# Clean up repository for production deployment
# Remove files that should remain local based on VRUX's purpose

echo "Cleaning repository for production deployment..."

cd /Users/evertonhudson/Projects/vrux

# 1. ENVIRONMENT & SECRETS
echo "=== Removing environment and secret files ==="
git rm --cached .env 2>/dev/null || true
git rm --cached .env.local 2>/dev/null || true
git rm --cached .env.production 2>/dev/null || true
git rm --cached .env.docker 2>/dev/null || true
git rm --cached .env.* 2>/dev/null || true

# 2. LOGS & DEBUGGING
echo "=== Removing logs and debug files ==="
git rm -r --cached logs/ 2>/dev/null || true
git rm --cached *.log 2>/dev/null || true
git rm --cached server.log 2>/dev/null || true

# 3. BUILD ARTIFACTS
echo "=== Removing build artifacts ==="
git rm -r --cached .next/ 2>/dev/null || true
git rm -r --cached out/ 2>/dev/null || true
git rm -r --cached dist/ 2>/dev/null || true
git rm -r --cached build/ 2>/dev/null || true

# 4. IDE & EDITOR FILES
echo "=== Removing IDE files ==="
git rm -r --cached .cursor/ 2>/dev/null || true
git rm -r --cached .vscode/ 2>/dev/null || true
git rm -r --cached .idea/ 2>/dev/null || true
git rm --cached .DS_Store 2>/dev/null || true
git rm --cached **/.DS_Store 2>/dev/null || true

# 5. TEMPORARY & CACHE FILES
echo "=== Removing temporary files ==="
git rm -r --cached .cache/ 2>/dev/null || true
git rm -r --cached tmp/ 2>/dev/null || true
git rm -r --cached temp/ 2>/dev/null || true
git rm --cached *.tmp 2>/dev/null || true

# 6. USER DATA & SESSIONS
echo "=== Removing user data ==="
git rm -r --cached sessions/ 2>/dev/null || true
git rm -r --cached uploads/ 2>/dev/null || true
git rm -r --cached user-data/ 2>/dev/null || true

# 7. API KEYS & CREDENTIALS
echo "=== Removing credential files ==="
git rm --cached *-credentials.json 2>/dev/null || true
git rm --cached *-key.json 2>/dev/null || true
git rm --cached *.pem 2>/dev/null || true
git rm --cached *.key 2>/dev/null || true

# 8. DATABASE FILES
echo "=== Removing database files ==="
git rm --cached *.db 2>/dev/null || true
git rm --cached *.sqlite 2>/dev/null || true
git rm --cached *.sqlite3 2>/dev/null || true

# 9. DOCKER VOLUMES
echo "=== Removing Docker volumes ==="
git rm -r --cached docker-volumes/ 2>/dev/null || true
git rm --cached docker-compose.override.yml 2>/dev/null || true

# Update .gitignore with comprehensive patterns
echo -e "\n=== Updating .gitignore ==="
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build
/dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env
.env.production
.env.development
.env.test
.env.docker

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# IDE & Editors
.cursor/
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
logs/
*.log
server.log
error.log
access.log
combined.log

# OS Files
.DS_Store
Thumbs.db

# Temporary files
.cache/
tmp/
temp/
*.tmp
*.temp

# Build artifacts
dist/
build/
out/

# User data & Sessions
sessions/
uploads/
user-data/
generated-components/

# Security & Credentials
*.pem
*.key
*-credentials.json
*-key.json
.secrets/
private/

# Database
*.db
*.sqlite
*.sqlite3
*.sql

# Docker
docker-volumes/
docker-compose.override.yml

# Testing
test-results/
playwright-report/
playwright/.cache/

# Package files
*.tgz

# Mac
.AppleDouble
.LSOverride

# Windows
Thumbs.db
ehthumbs.db

# Linux
*~

# Generated files
sitemap.xml.gz
robots.txt.gz

# API response cache
.api-cache/

# User uploaded images
public/uploads/

# Backup files
*.backup
*.bak

# Lock files (optional - some teams prefer to commit these)
# package-lock.json
# yarn.lock
# pnpm-lock.yaml
EOF

# Create comprehensive .env.example
echo -e "\n=== Creating comprehensive .env.example ==="
cat > .env.example << 'EOF'
# ==========================================
# VRUX Environment Variables
# ==========================================
# Copy this file to .env.local and fill in your values
# DO NOT commit .env.local to version control

# API Keys
# --------
# OpenAI API Key (Required)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic API Key (Optional - for Claude integration)
# Get your key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ViewComfy API (Optional)
VIEWCOMFY_API_URL=https://api.viewcomfy.com
VIEWCOMFY_API_KEY=your_viewcomfy_api_key_here

# Application Configuration
# ------------------------
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session & Security
# -----------------
# Generate a random string: openssl rand -base64 32
SESSION_SECRET=your_random_session_secret_here
JWT_SECRET=your_random_jwt_secret_here

# Rate Limiting
# ------------
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Performance
# ----------
MAX_GENERATION_TIME_MS=30000
MAX_TOKENS=2000
ENABLE_CACHE=true

# Logging
# -------
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# Feature Flags
# ------------
NEXT_PUBLIC_ENABLE_VIEWCOMFY=false
NEXT_PUBLIC_ENABLE_QUALITY_CHECKS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Analytics (Optional)
# -------------------
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Database (Future)
# ----------------
# DATABASE_URL=postgresql://user:password@localhost:5432/vrux

# Email (Future)
# -------------
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password

# Storage (Future)
# ---------------
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=vrux-uploads
EOF

# Create README for environment setup
echo -e "\n=== Creating environment setup guide ==="
cat > ENV_SETUP.md << 'EOF'
# Environment Setup Guide

## Required Environment Variables

### 1. API Keys
- **OPENAI_API_KEY** (Required): Your OpenAI API key for generating UI components
- **ANTHROPIC_API_KEY** (Optional): For Claude AI integration

### 2. Security
- **SESSION_SECRET**: Random string for session encryption
- **JWT_SECRET**: Random string for JWT token signing

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your API keys and generate secrets:
   ```bash
   # Generate random secrets
   openssl rand -base64 32  # Use this for SESSION_SECRET
   openssl rand -base64 32  # Use this for JWT_SECRET
   ```

3. Never commit `.env.local` or any file containing real API keys

## Files That Should Remain Local

The following files contain sensitive data and should NEVER be committed:

- `.env*` (except .env.example)
- `logs/`
- `.next/`
- `sessions/`
- Any file containing API keys or user data
- IDE configuration folders (`.cursor/`, `.vscode/`, etc.)

## Security Best Practices

1. Rotate API keys regularly
2. Use different keys for development and production
3. Store production secrets in a secure vault
4. Enable 2FA on all service accounts
5. Monitor API usage for anomalies
EOF

# Add files to git
git add .gitignore
git add .env.example
git add ENV_SETUP.md

# Create commit
echo -e "\n=== Creating commit ==="
git commit -m "Secure repository for production deployment

- Add comprehensive .gitignore for all sensitive files
- Create detailed .env.example with all required variables
- Add ENV_SETUP.md with security best practices
- Remove all local-only files from tracking
- Ensure no secrets or user data can be committed"

# Push to GitHub
echo -e "\n=== Pushing to GitHub ==="
git push origin main

echo -e "\n=== Repository secured for production! ==="
echo "Remember to:"
echo "1. Store production secrets securely (not in the repo)"
echo "2. Use environment variables for all configuration"
echo "3. Never commit real API keys or user data"
echo "4. Review pull requests for accidental secret commits"
EOF

# Make script executable
chmod +x cleanup_for_production.sh