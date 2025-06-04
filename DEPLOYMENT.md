# Deployment Guide for VRUX

## Deploying to Vercel

### Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Your API keys ready

### Step 1: Environment Variables

You need to add environment variables in Vercel. There are two ways:

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to your project on https://vercel.com
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=your-random-session-secret
NODE_ENV=production
```

#### Option B: Using Vercel CLI
```bash
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add SESSION_SECRET production
```

### Step 2: Deploy

#### First Deployment
```bash
vercel
```

Follow the prompts:
- Set up and deploy: Y
- Which scope: Select your account
- Link to existing project: N (first time) or Y (if already created)
- Project name: vrux
- Directory: ./
- Override settings: N

#### Subsequent Deployments
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 3: Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., vrux.dev)
3. Follow DNS configuration instructions

## Environment Variables Reference

### Required Variables
- `OPENAI_API_KEY` - Your OpenAI API key (required for component generation)
- `SESSION_SECRET` - Random string for session encryption (generate with `openssl rand -base64 32`)

### Optional Variables
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude fallback
- `VIEWCOMFY_API_KEY` - ViewComfy integration
- `RATE_LIMIT_MAX` - Max requests per window (default: 100)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default: 60000)
- `LOG_LEVEL` - Logging level (default: info)

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set in Vercel
- [ ] API keys are valid and have sufficient quota
- [ ] Rate limiting is configured appropriately
- [ ] Error tracking is set up (optional)
- [ ] Analytics are configured (optional)
- [ ] Custom domain is configured (if applicable)

## Troubleshooting

### "Environment Variable references Secret which does not exist"
This error occurs when `vercel.json` references secrets that haven't been created. The updated `vercel.json` removes these references. Set environment variables through the Vercel dashboard instead.

### "Build Failed"
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Run `npm run build` locally to test

### "API Key Invalid"
1. Verify your API keys are correct
2. Check API key quotas/limits
3. Ensure keys are set for the correct environment (production/preview/development)

### Function Timeout
The API routes have a 30-second timeout configured. If generations take longer:
1. Optimize prompts for faster generation
2. Consider upgrading to Vercel Pro for longer timeouts

## Security Notes

1. Never commit `.env.local` or any file with real API keys
2. Use different API keys for development and production
3. Regularly rotate your API keys
4. Monitor API usage for unusual activity
5. Keep the `SESSION_SECRET` secure and unique

## Monitoring

After deployment:
1. Monitor function logs in Vercel dashboard
2. Set up alerts for errors
3. Track API usage and costs
4. Monitor performance metrics

## Updates

To update your deployment:
```bash
git push origin main
```

Vercel will automatically deploy changes pushed to the main branch.