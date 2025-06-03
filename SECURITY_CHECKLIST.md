# VRUX Security Checklist

## Files That Must Remain Local (Never Push to GitHub)

### 1. **Environment Files**
- `.env` - Base environment file
- `.env.local` - Local development secrets
- `.env.production` - Production secrets
- `.env.development` - Development specific config
- `.env.docker` - Docker environment variables
- Any file matching `.env*` pattern (except `.env.example`)

### 2. **API Keys & Credentials**
- Any file containing `OPENAI_API_KEY`
- Any file containing `ANTHROPIC_API_KEY`
- `*-credentials.json` - Service account credentials
- `*.pem`, `*.key` - SSL certificates and private keys
- JWT secrets and session secrets
- OAuth client secrets

### 3. **Logs & Debug Information**
- `logs/` directory - Contains user activity and errors
- `*.log` files - May contain sensitive data
- `server.log`, `error.log`, `access.log`
- Debug dumps and stack traces

### 4. **Build Artifacts**
- `.next/` - Next.js build output
- `out/` - Static export directory
- `dist/` - Distribution builds
- `build/` - Build output

### 5. **User Data**
- `sessions/` - User session data
- `uploads/` - User uploaded files
- `generated-components/` - User-generated content
- Any database files (`*.db`, `*.sqlite`)
- Cached API responses with user data

### 6. **IDE & System Files**
- `.cursor/` - Cursor IDE settings
- `.vscode/` - VS Code settings
- `.idea/` - IntelliJ settings
- `.DS_Store` - macOS system files
- `Thumbs.db` - Windows system files

### 7. **Temporary Files**
- `.cache/` - Application cache
- `tmp/`, `temp/` - Temporary directories
- `*.tmp`, `*.temp` - Temporary files
- Backup files (`*.backup`, `*.bak`)

## Security Best Practices for VRUX

### API Key Management
1. ✅ Use environment variables for all API keys
2. ✅ Provide `.env.example` with dummy values
3. ✅ Implement key rotation reminders
4. ✅ Use different keys for dev/staging/production
5. ✅ Monitor API usage for anomalies

### Code Security
1. ✅ Sanitize all user inputs before AI processing
2. ✅ Validate generated code in sandbox
3. ✅ Implement CSP headers
4. ✅ Use rate limiting on all endpoints
5. ✅ Escape all dynamic content

### Data Protection
1. ✅ Don't store user prompts permanently
2. ✅ Use HTTP-only cookies for sessions
3. ✅ Implement session timeouts
4. ✅ Hash passwords with bcrypt (when implemented)
5. ✅ Clear sensitive data from memory

### Infrastructure Security
1. ✅ Use HTTPS in production
2. ✅ Keep dependencies updated
3. ✅ Implement security headers
4. ✅ Use least-privilege principles
5. ✅ Regular security audits

## Pre-Push Checklist

Before pushing to GitHub, verify:

- [ ] No `.env` files are staged
- [ ] No API keys in code or comments
- [ ] No hardcoded secrets or passwords
- [ ] No user data or logs included
- [ ] `.gitignore` is comprehensive
- [ ] No debug console.logs with sensitive data
- [ ] No TODO comments with security implications

## Incident Response

If sensitive data is accidentally pushed:

1. **Immediately** revoke the exposed keys
2. Remove the commit from history using `git filter-branch`
3. Force push the cleaned history
4. Generate new API keys
5. Audit logs for any unauthorized usage
6. Notify affected users if applicable

## Regular Maintenance

- **Weekly**: Review logs for security anomalies
- **Monthly**: Rotate API keys
- **Quarterly**: Security dependency audit
- **Annually**: Full security review

Remember: **When in doubt, keep it out!**