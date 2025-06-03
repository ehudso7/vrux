#!/bin/bash

echo "=== Removing sensitive files from GitHub ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# List of specific files to remove based on common patterns
# These are the files that MUST be manually removed from GitHub

echo "Removing the following files from git tracking:"
echo ""

# Environment files
echo "Environment files:"
if git ls-files | grep -q ".env.local"; then
    echo "  - .env.local"
    git rm --cached .env.local 2>/dev/null
fi
if git ls-files | grep -q ".env.docker"; then
    echo "  - .env.docker"
    git rm --cached .env.docker 2>/dev/null
fi
if git ls-files | grep -q ".env"; then
    echo "  - .env"
    git rm --cached .env 2>/dev/null
fi

# Log files
echo ""
echo "Log files:"
if git ls-files | grep -q "logs/"; then
    echo "  - logs/ directory and all contents"
    git rm -r --cached logs/ 2>/dev/null
fi
if git ls-files | grep -q "server.log"; then
    echo "  - server.log"
    git rm --cached server.log 2>/dev/null
fi

# Cursor IDE
echo ""
echo "IDE files:"
if git ls-files | grep -q ".cursor/"; then
    echo "  - .cursor/ directory and all contents"
    git rm -r --cached .cursor/ 2>/dev/null
fi

# Build artifacts
echo ""
echo "Build artifacts:"
if git ls-files | grep -q ".next/"; then
    echo "  - .next/ directory and all contents"
    git rm -r --cached .next/ 2>/dev/null
fi

# OS files
echo ""
echo "OS files:"
for file in $(git ls-files | grep "DS_Store"); do
    echo "  - $file"
    git rm --cached "$file" 2>/dev/null
done

# Create comprehensive .gitignore
echo ""
echo "=== Creating comprehensive .gitignore ==="
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
/dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files - CRITICAL
.env
.env.*
!.env.example
.env.local
.env.production
.env.development
.env.test
.env.docker

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE & Editors
.cursor/
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Logs - May contain sensitive data
logs/
*.log
server.log
error.log
access.log
combined.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS Files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
.cache/
tmp/
temp/
*.tmp
*.temp
.temp/
.tmp/

# Build artifacts
dist/
build/
out/
.next/
.nuxt/
.vuepress/dist
.serverless/
.fusebox/
.dynamodb/

# User data & Sessions
sessions/
uploads/
user-data/
generated-components/
user-uploads/
private/

# Security & Credentials
*.pem
*.key
*.cert
*.crt
*-credentials.json
*-key.json
.secrets/
private/
credentials/
auth/

# Database
*.db
*.sqlite
*.sqlite3
*.sql
local.db
development.db

# Docker
docker-volumes/
docker-compose.override.yml
.dockerignore.local

# Testing artifacts
test-results/
playwright-report/
playwright/.cache/
cypress/videos/
cypress/screenshots/

# Package files
*.tgz

# Backup files
*.backup
*.bak
*.old
*~

# API response cache
.api-cache/
cache/

# User uploaded images
public/uploads/
static/uploads/

# Local configuration
config.local.js
config.local.json
settings.local.json

# Python (if any Python scripts)
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Ruby (if any Ruby scripts)
*.gem
*.rbc
/.config

# Sensitive patterns
*secret*
*private*
*credential*
*password*
!*example*
!*template*
EOF

# Add to git
git add .gitignore

# Show what will be committed
echo ""
echo "=== Files staged for removal: ==="
git status --porcelain | grep "^D"

echo ""
echo "=== To complete the removal: ==="
echo "1. Run: git commit -m 'Remove sensitive files and update .gitignore'"
echo "2. Run: git push origin main"
echo ""
echo "=== IMPORTANT: ==="
echo "These files are now untracked but still exist locally."
echo "They will be removed from GitHub but remain on your machine."