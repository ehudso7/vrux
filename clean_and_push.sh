#!/bin/bash

# Remove sensitive files from git and push clean commit

echo "Cleaning sensitive files and pushing to GitHub..."

# Navigate to project directory
cd /Users/evertonhudson/Projects/vrux

# Remove sensitive files from git tracking (but keep them locally)
echo "=== Removing sensitive files from git ==="
git rm --cached .env.local 2>/dev/null || true
git rm --cached .env.docker 2>/dev/null || true
git rm -r --cached logs/ 2>/dev/null || true
git rm --cached server.log 2>/dev/null || true
git rm -r --cached .cursor/ 2>/dev/null || true
git rm -r --cached .next/ 2>/dev/null || true

# Update .gitignore to ensure these are ignored
echo -e "\n=== Updating .gitignore ==="
cat >> .gitignore << 'EOF'

# Cursor IDE
.cursor/

# Logs
logs/
server.log

# Environment files
.env.docker
EOF

# Add the updated .gitignore and .env.example
git add .gitignore
git add .env.example

# Commit the removal of sensitive files
echo -e "\n=== Committing removal of sensitive files ==="
git commit -m "Remove sensitive files from tracking

- Remove .env.local and .env.docker from git tracking
- Remove logs directory and server.log
- Remove .cursor IDE directory
- Remove .next build directory
- Update .gitignore to prevent future tracking"

# Push to GitHub
echo -e "\n=== Pushing clean commit to GitHub ==="
git push origin main

echo -e "\n=== Done! Sensitive files removed from git but kept locally ==="