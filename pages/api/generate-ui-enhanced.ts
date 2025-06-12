import type { NextApiResponse } from 'next';
import rateLimiter from '../../lib/rate-limiter';
import cors, { runMiddleware } from '../../lib/cors';
import requestLogger from '../../lib/middleware/request-logger';
import logger from '../../lib/logger';
import performanceMonitor from '../../lib/performance';
import { generateStreamWithFallback, getAllProvidersHealth } from '../../lib/ai-providers';
import { validateDomain } from '../../lib/domain-restriction';
import { requireAuthWithApiLimit, type AuthenticatedRequest } from '../../lib/middleware/auth';
import { streamingEngine } from '../../lib/ai-streaming-engine';
import { z } from 'zod';
import crypto from 'crypto';

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

async function generateUIEnhancedHandler(
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

  // Enhanced input validation
  const inputSchema = z.object({
    prompt: z.string().min(1).max(1000).trim(),
    variants: z.number().int().min(1).max(3).default(3),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    style: z.enum(['modern', 'bold', 'elegant']).optional(),
    enablePreview: z.boolean().default(true),
    previewThrottle: z.number().min(50).max(500).default(100),
  });
  
  let validatedInput;
  try {
    validatedInput = inputSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    return res.status(400).json({ error: 'Invalid request body' });
  }
  
  const { 
    prompt, 
    variants: variantCount, 
    model, 
    temperature, 
    style,
    enablePreview,
    previewThrottle
  } = validatedInput;

  // Check AI providers health
  const providersHealth = await getAllProvidersHealth();
  const hasAvailableProvider = Object.values(providersHealth).some(h => h.available);
  
  if (!hasAvailableProvider) {
    logger.error('No AI providers available', null, { providersHealth });
    return res.status(503).json({ 
      error: 'AI service temporarily unavailable',
      message: 'All AI providers are currently offline. Please try again later.',
      providers: providersHealth
    });
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });

  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  const userId = req.user?.id || identifier;
  
  try {
    performanceMonitor.startTimer('aiEnhancedStreamGeneration');
    
    // Send initial metadata
    res.write(`data: ${JSON.stringify({ 
      type: 'metadata',
      requestId,
      variantCount,
      providers: Object.entries(providersHealth)
        .filter(([_, h]) => h.available)
        .map(([name]) => name),
      features: {
        preview: enablePreview,
        streaming: true,
        multiModel: true,
        caching: true
      }
    })}\n\n`);
    
    // Generate multiple variants with enhanced streaming
    for (let i = 0; i < Math.min(variantCount, 3); i++) {
      const variantStyle = style || VARIANT_PROMPTS[i].split(' ')[2].toLowerCase();
      const variantPrompt = variantCount > 1 
        ? `${prompt}\n\nStyle directive: ${VARIANT_PROMPTS[i]}`
        : prompt;

      // Reset streaming engine for new variant
      streamingEngine.reset();

      // Send variant start event
      res.write(`data: ${JSON.stringify({ 
        type: 'variant_start', 
        variant: i,
        style: variantStyle 
      })}\n\n`);

      let fullContent = '';
      let providerUsed = '';
      let metrics: Partial<Record<string, unknown>> = {};
      let lastPreview: any = null;
      
      try {
        // Use enhanced streaming with fallback
        const streamGenerator = generateStreamWithFallback(
          variantPrompt, 
          systemPrompt,
          {
            requestId,
            userId,
            model,
            temperature,
            cache: true,
          }
        );
        
        // Process stream with enhanced features
        const enhancedStream = streamingEngine.processStream(streamGenerator as any, {
          model,
          temperature,
          onProgress: (progress) => {
            res.write(`data: ${JSON.stringify({
              type: 'progress',
              variant: i,
              progress
            })}\n\n`);
          },
          onPreview: enablePreview ? (preview) => {
            lastPreview = preview;
            res.write(`data: ${JSON.stringify({
              type: 'preview',
              variant: i,
              preview: {
                html: preview.html,
                css: preview.css,
                confidence: preview.confidence,
                isComplete: preview.isComplete
              }
            })}\n\n`);
          } : undefined,
        });

        for await (const chunk of enhancedStream) {
          switch (chunk.type) {
            case 'token':
              if (chunk.content) {
                fullContent += chunk.content;
                res.write(`data: ${JSON.stringify({ 
                  type: 'content', 
                  variant: i, 
                  content: chunk.content 
                })}\n\n`);
              }
              break;
              
            case 'preview':
              // Preview already handled by callback
              break;
              
            case 'progress':
              // Progress already handled by callback
              break;
              
            case 'complete':
              fullContent = chunk.content || fullContent;
              if (chunk.preview) {
                lastPreview = chunk.preview;
              }
              break;
              
            case 'error':
              throw new Error(chunk.error || 'Stream processing failed');
          }
        }
      } catch (streamError) {
        logger.error('Variant generation failed', streamError as Error, {
          requestId,
          variant: i,
        });
        
        res.write(`data: ${JSON.stringify({ 
          type: 'variant_error', 
          variant: i,
          error: 'Failed to generate this variant',
          canRetry: true
        })}\n\n`);
        
        continue;
      }

      // Clean up the response
      let cleanedCode = fullContent
        .replace(/^```(?:jsx?|javascript|tsx?|typescript)?\n?/gm, '')
        .replace(/```$/gm, '')
        .replace(/^import\s+.*$/gm, '')
        .replace(/^export\s+default\s+/gm, '')
        .replace(/^export\s+/gm, '')
        .trim();
      
      // Ensure the component is properly formatted
      if (!cleanedCode.startsWith('()')) {
        cleanedCode = cleanedCode
          .replace(/^function\s*\w*\s*\([^)]*\)\s*{/, '() => {')
          .replace(/^const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{/, '() => {')
          .replace(/^const\s+\w+\s*=\s*function\s*\([^)]*\)\s*{/, '() => {');
        
        if (!cleanedCode.startsWith('()')) {
          cleanedCode = `() => {\n${cleanedCode}\n}`;
        }
      }

      // Send variant complete event with final preview
      res.write(`data: ${JSON.stringify({ 
        type: 'variant_complete', 
        variant: i, 
        code: cleanedCode,
        provider: providerUsed,
        metrics,
        style: variantStyle,
        finalPreview: lastPreview
      })}\n\n`);
    }

    const generationTime = performanceMonitor.endTimer('aiEnhancedStreamGeneration', {
      promptLength: prompt.length,
      variantCount: variantCount
    });

    logger.info('Enhanced UI stream generated successfully', {
      requestId,
      promptLength: prompt.length,
      variantCount,
      generationTime: generationTime ? `${generationTime.toFixed(2)}ms` : 'unknown',
      userId,
      features: {
        preview: enablePreview,
        streaming: true
      }
    });

    // Send done event
    res.write(`data: ${JSON.stringify({ 
      type: 'done', 
      remainingRequests: rateLimiter.getRemainingRequests(identifier),
      totalTime: generationTime,
      requestId
    })}\n\n`);
    
    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Enhanced AI generation stream error', error instanceof Error ? error : null, { 
      requestId,
      errorMessage: errorMessage,
      userId,
    });
    
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: 'Failed to generate UI', 
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred. Please try again.',
      requestId,
      canRetry: true,
      suggestions: [
        'Try simplifying your prompt',
        'Check if the service is experiencing high load',
        'Try again in a few moments'
      ]
    })}\n\n`);
    
    res.end();
  }
}

export default requestLogger(requireAuthWithApiLimit(generateUIEnhancedHandler));