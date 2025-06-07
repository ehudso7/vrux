# Environment Variables Documentation

This document lists all environment variables used in the VRUX application.

## Environment Variables Used in Codebase

### Core API Keys (Required)
- `OPENAI_API_KEY` - OpenAI API key for GPT models (Required)
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude models (Optional)

### Application Configuration
- `NODE_ENV` - Node environment (development/production/test)
- `NEXT_PUBLIC_APP_URL` - Public URL of the application (default: http://localhost:3000)
- `PORT` - Server port (default: 3000)
- `HOSTNAME` - Server hostname (default: localhost)
- `KEEP_ALIVE_TIMEOUT` - Keep-alive timeout for connections (default: 60000)

### Feature Flags
- `NEXT_PUBLIC_ENABLE_VIEWCOMFY` - Enable ViewComfy integration (default: false)
- `NEXT_PUBLIC_ENABLE_CACHE` - Enable caching (default: true)
- `NEXT_PUBLIC_ENABLE_QUALITY_CHECKS` - Enable quality checks (default: true)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: 10)

### Performance
- `MAX_GENERATION_TIME_MS` - Maximum generation time in milliseconds (default: 30000)
- `MAX_TOKENS` - Maximum tokens for AI generation (default: 2000)

### Logging
- `LOG_LEVEL` - Logging level (info/warn/error)
- `LOG_FILE_PATH` - Path to log file
- `LOG_DIR` - Directory for log files

### Security
- `SESSION_SECRET` - Secret for session encryption (Required in production)
- `ALLOWED_DOMAIN` - Allowed domain for CORS (default: https://vrux.dev)

### ViewComfy Integration (Optional)
- `VIEWCOMFY_API_URL` - ViewComfy API URL
- `VIEWCOMFY_CLIENT_ID` - ViewComfy client ID
- `VIEWCOMFY_CLIENT_SECRET` - ViewComfy client secret

### Supabase Integration (Optional)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Deployment Tokens (Optional)
- `VERCEL_TOKEN` - Vercel deployment token
- `NETLIFY_TOKEN` - Netlify deployment token
- `GITHUB_TOKEN` - GitHub API token

### Testing
- `TEST_URL` - URL for testing (default: http://localhost:3000)

### CI/CD (Auto-set by providers)
- `CI` - Set to true in CI environments
- `VERCEL` - Set to 1 when running on Vercel
- `NEXT_RUNTIME` - Set by Next.js runtime

### OpenTelemetry (Optional)
- `NEXT_OTEL_VERBOSE` - Enable verbose OpenTelemetry logging
- `NEXT_OTEL_PERFORMANCE_PREFIX` - Prefix for performance metrics

## Environment Variables in .env.example but Not Used

The following variables are defined in .env.example but not found in the codebase:
- Analytics: `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`
- Security headers and features (many security-related variables)
- Rate limiting tiers
- Geographic restrictions
- IP allowlisting
- Authentication settings
- Security monitoring

These may be for future features or have been removed from the codebase.

## Recommendations

1. **Remove unused variables**: Clean up .env.example to remove variables that are no longer used
2. **Add missing variables**: Add the following to .env.example:
   - `LOG_DIR`
   - `HOSTNAME`
   - `KEEP_ALIVE_TIMEOUT`
   - `PORT`
   - `TEST_URL`
   - OpenTelemetry variables
3. **Document defaults**: Add default values in comments for optional variables
4. **Validate required variables**: Ensure all required variables are validated at startup