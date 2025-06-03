# Files That MUST Be Removed from GitHub

## Execute these commands to remove each file:

### 1. Environment Files (Contains API Keys)
```bash
git rm --cached .env.local
git rm --cached .env.docker
git rm --cached .env
```

### 2. Log Files (May Contain User Data)
```bash
git rm -r --cached logs/
git rm --cached server.log
```

### 3. IDE Configuration (Contains Local Paths)
```bash
git rm -r --cached .cursor/
```

### 4. Build Artifacts (Large Files, Generated)
```bash
git rm -r --cached .next/
```

### 5. OS System Files
```bash
git rm --cached .DS_Store
git rm --cached **/.DS_Store
```

### 6. Any Other Sensitive Files
```bash
# Check for any credential files
git ls-files | grep -i credential
git ls-files | grep -i secret
git ls-files | grep -i private
git ls-files | grep ".key"
git ls-files | grep ".pem"
```

## Complete Removal Process:

1. **Run the removal script**:
   ```bash
   bash remove_sensitive_files.sh
   ```

2. **Commit the changes**:
   ```bash
   git commit -m "Remove sensitive files from tracking

   - Remove all .env files containing API keys
   - Remove logs directory with user data
   - Remove .cursor IDE configuration
   - Remove .next build artifacts
   - Remove OS system files
   - Update .gitignore to prevent re-adding"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin main
   ```

4. **Verify on GitHub**:
   - Check that `.env.local` is gone
   - Check that `.env.docker` is gone
   - Check that `logs/` directory is gone
   - Check that `.cursor/` directory is gone
   - Check that `.next/` directory is gone

## If Files Were Already Pushed:

If any of these files contain sensitive data and were already pushed to GitHub:

1. **Revoke any exposed API keys immediately**
2. **Remove from entire git history**:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.local' \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (WARNING: This rewrites history):
   ```bash
   git push origin --force --all
   ```

## Files That Are Safe to Keep:

- `.env.example` (contains only dummy values)
- `README.md`
- `package.json`
- Source code files
- Documentation files

Remember: **These files will still exist on your local machine after removal from git!**