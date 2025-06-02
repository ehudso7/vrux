#!/bin/bash

# Push VRUX changes to GitHub

echo "Starting git push process..."

# Navigate to project directory
cd /Users/evertonhudson/Projects/vrux

# Check current status
echo "=== Git Status ==="
git status

# Add all changes
echo -e "\n=== Adding all changes ==="
git add -A

# Create commit
echo -e "\n=== Creating commit ==="
git commit -m "Implement complete authentication system with user management

- Add authentication context and session management
- Create sign in/sign up pages with form validation  
- Implement user dashboard and settings pages
- Add pricing, docs, and templates pages
- Update navigation with auth-aware components
- Include demo user (demo@vrux.app / demo123)
- Fix all placeholder links and 404 errors
- Create complete user flow from sign up to dashboard"

# Check remote
echo -e "\n=== Checking remote ==="
git remote -v

# Push to GitHub
echo -e "\n=== Pushing to GitHub ==="
git push -u origin main

echo -e "\n=== Push complete! ==="