#!/bin/bash

echo "=== Searching for sensitive files that may be tracked by git ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

echo "1. Environment files:"
git ls-files | grep -E '\.env' || echo "  None found"
echo ""

echo "2. Log files:"
git ls-files | grep -E '\.(log|logs)' || echo "  None found"
git ls-files | grep -E '^logs/' || echo "  No logs directory found"
echo ""

echo "3. Cursor IDE files:"
git ls-files | grep -E '\.cursor' || echo "  None found"
echo ""

echo "4. Build artifacts (.next):"
git ls-files | grep -E '^\.next/' || echo "  None found"
echo ""

echo "5. OS files (.DS_Store):"
git ls-files | grep -E 'DS_Store' || echo "  None found"
echo ""

echo "6. Docker environment:"
git ls-files | grep -E 'env\.docker' || echo "  None found"
echo ""

echo "7. Any credential files:"
git ls-files | grep -E '(credential|key\.json|\.pem|\.key)' || echo "  None found"
echo ""

echo "8. Cache or temp files:"
git ls-files | grep -E '(\.cache|tmp/|temp/)' || echo "  None found"
echo ""

echo "=== Full list of files to remove and add to .gitignore: ==="
git ls-files | grep -E '(\.env|\.log|logs/|\.cursor|\.next/|DS_Store|credential|key\.json|\.pem|\.key|\.cache|tmp/|temp/|env\.docker)' | sort | uniq