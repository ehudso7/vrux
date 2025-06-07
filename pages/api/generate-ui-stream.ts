import type { NextApiResponse } from 'next';
import rateLimiter from '../../lib/rate-limiter';
import cors, { runMiddleware } from '../../lib/cors';
import requestLogger from '../../lib/middleware/request-logger';
import logger from '../../lib/logger';
import performanceMonitor from '../../lib/performance';
import { getAvailableProvider } from '../../lib/ai-providers';
import { validateDomain } from '../../lib/domain-restriction';
import { requireAuthWithApiLimit, type AuthenticatedRequest } from '../../lib/middleware/auth';

interface ExtendedAuthenticatedRequest extends AuthenticatedRequest {
  id?: string;
}


const systemPrompt = `You are an expert React/Tailwind CSS UI developer. Generate production-ready JSX code that:
1. Uses modern React patterns and hooks
2. Implements Tailwind CSS for styling (no custom CSS)
3. Is fully self-contained and functional
4. Includes proper state management where needed
5. Has excellent UX with hover states, transitions, and responsive design
6. Uses semantic HTML
7. Includes accessibility features (ARIA labels, keyboard navigation)
8. IMPORTANT: Return ONLY the component code, no markdown, no explanations
9. The code should be a complete React component
10. DO NOT include any import statements
11. Use React hooks directly as: const [state, setState] = useState()
12. For icons, use Unicode symbols or SVG paths inline
13. For animations, use CSS transitions/transforms only (no external libraries)
14. CRITICAL: Start your code with a function component like: () => { ... return (<Component />) }
15. The component must be an arrow function that returns JSX
16. DO NOT use export statements`;

const VARIANT_PROMPTS = [
  'Create a modern, minimalist version with subtle animations and clean lines',
  'Create a bold, vibrant version with strong visual hierarchy and dynamic colors',
  'Create a sophisticated, professional version with refined details and elegant typography'
];

async function generateUIStreamHandler(
  req: ExtendedAuthenticatedRequest,
  res: NextApiResponse
): Promise<void> {
  // Validate domain
  const domainValidation = validateDomain(req);
  if (!domainValidation.isValid) {
    logger.warn('Request blocked by domain restriction', {
      reason: domainValidation.reason,
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    });
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This service can only be accessed from vrux.dev',
      code: 'DOMAIN_RESTRICTION'
    });
  }

  // Run CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const identifier = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anonymous';
  if (!rateLimiter.isAllowed(identifier)) {
    const resetTime = rateLimiter.getResetTime(identifier);
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
      resetTime: resetTime?.toISOString(),
      remainingRequests: 0
    });
  }

  const { prompt, variants = 3 } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (prompt.length > 1000) {
    return res.status(400).json({ error: 'Prompt is too long (max 1000 characters)' });
  }

  // Check if any AI provider is available
  try {
    await getAvailableProvider();
  } catch {
    logger.error('No AI providers available');
    return res.status(500).json({ error: 'AI service is not configured properly' });
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    performanceMonitor.startTimer('aiStreamGeneration');
    
    // Generate multiple variants
    for (let i = 0; i < Math.min(variants, 3); i++) {
      const variantPrompt = variants > 1 
        ? `${prompt}\n\nStyle directive: ${VARIANT_PROMPTS[i]}`
        : prompt;

      const provider = await getAvailableProvider();
      const fullPrompt = `${systemPrompt}

Create a React component for: ${variantPrompt}`;

      // Send variant start event
      res.write(`data: ${JSON.stringify({ type: 'variant_start', variant: i })}\n\n`);

      // For now, generate the full content at once since streaming is not supported by fallback
      const fullContent = await provider.generateComponent(fullPrompt, systemPrompt);
      
      // Simulate streaming by sending content in chunks
      const chunkSize = 50;
      for (let j = 0; j < fullContent.length; j += chunkSize) {
        const chunk = fullContent.slice(j, Math.min(j + chunkSize, fullContent.length));
        res.write(`data: ${JSON.stringify({ type: 'content', variant: i, content: chunk })}\n\n`);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Clean up the response
      let cleanedCode = fullContent
        .replace(/^```(?:jsx?|javascript|tsx?|typescript)?\n?/gm, '')
        .replace(/```$/gm, '')
        .replace(/^import\s+.*$/gm, '') // Remove any import statements
        .replace(/^export\s+default\s+/gm, '') // Remove export default
        .replace(/^export\s+/gm, '') // Remove any export
        .trim();
      
      // Ensure the component is properly formatted for react-live
      if (!cleanedCode.startsWith('()')) {
        // If it's a function declaration, convert to arrow function
        cleanedCode = cleanedCode
          .replace(/^function\s*\w*\s*\([^)]*\)\s*{/, '() => {')
          .replace(/^const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{/, '() => {')
          .replace(/^const\s+\w+\s*=\s*function\s*\([^)]*\)\s*{/, '() => {');
        
        // If still doesn't start with arrow function, wrap it
        if (!cleanedCode.startsWith('()')) {
          cleanedCode = `() => {\n${cleanedCode}\n}`;
        }
      }

      // Send variant complete event
      res.write(`data: ${JSON.stringify({ type: 'variant_complete', variant: i, code: cleanedCode })}\n\n`);
    }

    const generationTime = performanceMonitor.endTimer('aiStreamGeneration', {
      promptLength: prompt.length,
      variantCount: variants
    });

    logger.info('UI stream generated successfully', {
      requestId: req.id,
      promptLength: prompt.length,
      variantCount: variants,
      generationTime: generationTime ? `${generationTime.toFixed(2)}ms` : 'unknown'
    });

    // Send done event
    res.write(`data: ${JSON.stringify({ type: 'done', remainingRequests: rateLimiter.getRemainingRequests(identifier) })}\n\n`);
    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('AI generation stream error', error instanceof Error ? error : null, { 
      requestId: req.id,
      errorMessage: errorMessage
    });
    
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate UI. Please try again.' })}\n\n`);
    res.end();
  }
}

export default requestLogger(requireAuthWithApiLimit(generateUIStreamHandler));