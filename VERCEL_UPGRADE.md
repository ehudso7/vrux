# Vercel Deployment Configuration

## Current Configuration (Free Tier)

The application is configured to work within Vercel's free tier limits:
- Max function duration: 60 seconds for streaming endpoints, 30 seconds for generation, 10 seconds for others
- Memory: Default (1024 MB)
- Build memory: 4GB

## Optimization Strategies Used

1. **Streaming Responses**: The AI generation endpoints use streaming to deliver content progressively
2. **Tiered Timeouts**: Different endpoints have different timeout limits based on their needs
3. **Client-Side Caching**: Implemented to reduce API calls
4. **Edge Functions**: Where possible, use edge runtime for faster responses

## Upgrading to Pro

When you upgrade to Vercel Pro ($20/month), you can:

1. Replace `vercel.json` with `vercel-pro.json`:
   ```bash
   mv vercel-pro.json vercel.json
   ```

2. This will enable:
   - 300-second timeout for all API routes
   - 3GB memory for serverless functions
   - Better performance for AI generation

## Performance Tips for Free Tier

1. **Use Streaming**: Always use the streaming endpoints (`/api/generate-ui-stream`, `/api/generate-viewcomfy-stream`)
2. **Implement Retry Logic**: Add client-side retry for timeout errors
3. **Cache Aggressively**: Use the built-in caching system
4. **Optimize Prompts**: Shorter, more specific prompts generate faster

## Alternative Deployment

For unlimited timeouts and full god-tier performance, use Render.com which has no timeout limits on their paid tiers.