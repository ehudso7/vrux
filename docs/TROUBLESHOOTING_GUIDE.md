# Troubleshooting Guide

This guide addresses common issues and their solutions based on the development and user requirements.

## API Provider Issues

### Problem: "429 You exceeded your current quota"
**Symptoms**: 
- OpenAI API returns 429 error
- Generation fails

**Solution**:
1. Add credits to OpenAI account at https://platform.openai.com/billing
2. System will automatically fall back to Anthropic
3. If both fail, mock provider activates

### Problem: "Your credit balance is too low"
**Symptoms**:
- Anthropic API returns 400 error
- Fallback from OpenAI fails

**Solution**:
1. Add credits to Anthropic account at https://console.anthropic.com/billing
2. Mock provider will activate automatically
3. Consider setting up additional providers

### Problem: "No AI providers available"
**Symptoms**:
- All providers fail
- No generation possible

**Solution**:
1. Check environment variables are set correctly
2. Verify API keys are valid
3. Mock provider should activate as last resort
4. Check logs for specific errors

## Generation Issues

### Problem: "Rate limit exceeded"
**Symptoms**:
- 429 error from our API
- Cannot generate components

**Solution**:
1. Wait 1 minute for rate limit reset
2. Or increase `RATE_LIMIT_MAX_REQUESTS` in environment
3. Default is 10 requests per minute

### Problem: Generated code doesn't render
**Symptoms**:
- Preview shows error
- Component fails to display

**Solution**:
1. Check browser console for errors
2. Verify React syntax is correct
3. Ensure all imports are available
4. Try regenerating with clearer prompt

### Problem: Image analysis fails
**Symptoms**:
- Image upload doesn't work
- No code generated from image

**Solution**:
1. Ensure image is JPEG, PNG, GIF, or WebP
2. Check file size is under 20MB
3. Verify OpenAI Vision API is available
4. Try a different image

## Database Features

### Problem: Schema generation fails
**Symptoms**:
- Database designer doesn't generate SQL
- Types not created

**Solution**:
1. Check prompt is clear and specific
2. Verify AI provider is working
3. Review generated SQL for syntax errors
4. Try simpler schema first

### Problem: Supabase connection fails
**Symptoms**:
- Cannot connect to Supabase
- API calls fail

**Solution**:
1. Verify Supabase URL and keys
2. Check network connectivity
3. Ensure CORS is configured
4. Review Supabase dashboard for issues

## Deployment Issues

### Problem: Vercel deployment fails
**Symptoms**:
- Build errors during deployment
- Site doesn't go live

**Solution**:
1. Run `npm run build` locally first
2. Check all environment variables are set
3. Verify no TypeScript errors
4. Review Vercel build logs

### Problem: Environment variables not working
**Symptoms**:
- API keys not recognized
- Features fail in production

**Solution**:
1. Ensure variables are set in Vercel dashboard
2. Use `NEXT_PUBLIC_` prefix for client variables
3. Restart deployment after changes
4. Check for typos in variable names

## Performance Issues

### Problem: Slow generation times
**Symptoms**:
- Takes >10s to generate
- Timeouts occur

**Solution**:
1. Check API provider status
2. Reduce prompt complexity
3. Monitor rate limits
4. Consider upgrading API tier

### Problem: High memory usage
**Symptoms**:
- Browser becomes slow
- Page crashes

**Solution**:
1. Limit number of previews open
2. Clear generation history
3. Reduce component complexity
4. Refresh page periodically

## UI/UX Issues

### Problem: Preview not updating
**Symptoms**:
- Code changes don't reflect
- Preview stuck

**Solution**:
1. Check for syntax errors in code
2. Refresh the preview manually
3. Clear browser cache
4. Restart development server

### Problem: Features not working
**Symptoms**:
- Buttons don't respond
- Features seem disabled

**Solution**:
1. Check browser console for errors
2. Verify JavaScript is enabled
3. Try different browser
4. Check network connectivity

## Development Issues

### Problem: Build fails locally
**Symptoms**:
- `npm run build` errors
- TypeScript complaints

**Solution**:
1. Run `npm install` to ensure dependencies
2. Check for TypeScript errors
3. Clear `.next` folder and rebuild
4. Update Node.js version if needed

### Problem: Hot reload not working
**Symptoms**:
- Changes don't appear
- Need manual refresh

**Solution**:
1. Restart dev server
2. Check file watching limits
3. Clear Next.js cache
4. Verify Turbopack is enabled

## Error Messages

### "Failed to generate UI"
**Meaning**: AI generation failed
**Fix**: Check API provider status and credits

### "Invalid request"
**Meaning**: Input validation failed
**Fix**: Check prompt format and length

### "No response generated"
**Meaning**: AI returned empty response
**Fix**: Try different prompt or provider

### "Component validation failed"
**Meaning**: Generated code has issues
**Fix**: Report specific error for investigation

## Best Practices

### For Optimal Results
1. Use clear, specific prompts
2. Include design details
3. Specify component type
4. Mention required features
5. Keep prompts under 500 characters

### For Performance
1. Close unused tabs
2. Clear history periodically
3. Use production build
4. Monitor API usage
5. Enable caching

### For Reliability
1. Keep API keys secure
2. Monitor credit balance
3. Set up billing alerts
4. Use fallback providers
5. Test before deploying

## Getting Help

### Check First
1. Browser console for errors
2. Application logs
3. Network tab for API calls
4. This troubleshooting guide

### Report Issues
1. Include error messages
2. Provide steps to reproduce
3. Share relevant logs
4. Mention browser/OS

### Contact Support
- GitHub Issues: Bug reports
- API Providers: Billing/quota
- Vercel: Deployment issues
- Community: Feature requests

## Common Solutions Summary

1. **Most issues**: Add API credits
2. **Performance**: Clear cache/history
3. **Errors**: Check logs and console
4. **Features**: Verify all working per checklist
5. **Deployment**: Check environment variables

---

*Remember: The mock provider ensures VRUX always works, even without API credits!*