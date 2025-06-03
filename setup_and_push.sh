#!/bin/bash

# Setup remote and push VRUX changes to GitHub

echo "Setting up GitHub remote and pushing..."

# Navigate to project directory
cd /Users/evertonhudson/Projects/vrux

# Check if remote exists
echo "=== Current remotes ==="
git remote -v

# Remove origin if it exists (in case it's misconfigured)
git remote remove origin 2>/dev/null || true

# Add the correct remote
echo -e "\n=== Adding GitHub remote ==="
git remote add origin https://github.com/ehudso7/vrux.git

# Verify remote was added
echo -e "\n=== Verifying remote ==="
git remote -v

# Check current branch
echo -e "\n=== Current branch ==="
git branch

# Push to GitHub
echo -e "\n=== Pushing to GitHub ==="
git push -u origin main

echo -e "\n=== Push complete! ==="