#!/bin/bash

echo "=== Verifying build can complete locally ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Run type check
echo "Running type check..."
npm run type-check

# If type check passes, try build
if [ $? -eq 0 ]; then
  echo ""
  echo "Type check passed! Running build..."
  npm run build
else
  echo ""
  echo "Type check failed. Please fix the errors above."
  exit 1
fi

echo ""
echo "=== Build verification complete ==="