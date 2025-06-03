import type { NextApiRequest, NextApiResponse } from 'next';
import rateLimiter from '../../lib/rate-limiter';
import cors, { runMiddleware } from '../../lib/cors';
import requestLogger from '../../lib/middleware/request-logger';
import logger from '../../lib/logger';
import performanceMonitor from '../../lib/performance';
import type { GenerateUIResponse, GenerateUIError } from '../../lib/types';
import { promptSchema, validateGeneratedComponent, securityHeaders } from '../../lib/ai-validation';
import { getAvailableProvider } from '../../lib/ai-providers';

// Extend NextApiRequest to include custom properties
interface ExtendedNextApiRequest extends NextApiRequest {
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
8. IMPORTANT: Return ONLY the JSX code, no markdown code blocks, no explanations
9. The code should be a complete React component that can be rendered immediately
10. Use React hooks (useState, useEffect, etc.) from 'react' when needed
11. For icons, use Unicode symbols or SVG paths inline
12. Add Framer Motion animations where appropriate (import from 'framer-motion')
13. Use modern UI patterns and micro-interactions
14. Make the component visually stunning and professional
15. NEVER include any script tags or inline JavaScript
16. NEVER use eval, Function constructor, or dynamic code execution
17. NEVER access document.cookie, localStorage, or sensitive browser APIs
18. NEVER include external scripts or resources
19. Always use proper React event handlers (onClick, onChange, etc.)
20. Ensure all user inputs are properly handled and validated`;


async function generateUIHandler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse<GenerateUIResponse | GenerateUIError>
) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);
  
  // Set security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

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

  // Validate request body
  const validationResult = promptSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(err => err.message);
    logger.warn('Invalid prompt request', { 
      requestId: req.id,
      errors 
    });
    return res.status(400).json({ 
      error: 'Invalid request',
      details: errors.join(', ')
    });
  }
  
  const { prompt } = validationResult.data;

  // Check if any AI provider is available
  try {
    await getAvailableProvider();
  } catch {
    logger.error('No AI providers available');
    return res.status(500).json({ error: 'AI service is not configured properly' });
  }

  try {
    // Start performance monitoring
    performanceMonitor.startTimer('aiGeneration');
    
    let provider = await getAvailableProvider();
    let code: string;
    
    try {
      code = await provider.generateComponent(prompt, systemPrompt);
    } catch (error) {
      // Handle provider failures with fallback
      const errorStatus = (error as { status?: number }).status;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (provider.name === 'OpenAI' && (errorStatus === 429 || errorMessage.includes('quota'))) {
        logger.warn('OpenAI quota exceeded, falling back to Anthropic');
        const { anthropicProvider, mockProvider } = await import('../../lib/ai-providers');
        
        if (anthropicProvider.isAvailable()) {
          try {
            provider = anthropicProvider;
            code = await provider.generateComponent(prompt, systemPrompt);
          } catch {
            // If Anthropic also fails, use mock
            logger.warn('Anthropic also failed, using mock provider');
            provider = mockProvider;
            code = await provider.generateComponent(prompt, systemPrompt);
          }
        } else {
          // Use mock if Anthropic not available
          provider = mockProvider;
          code = await provider.generateComponent(prompt, systemPrompt);
        }
      } else if (provider.name === 'Anthropic' && (errorStatus === 400 || errorMessage.includes('credit'))) {
        // If Anthropic fails with credit error, use mock
        logger.warn('Anthropic credit issue, using mock provider');
        const { mockProvider } = await import('../../lib/ai-providers');
        provider = mockProvider;
        code = await provider.generateComponent(prompt, systemPrompt);
      } else {
        throw error;
      }
    }

    if (!code) {
      throw new Error('No response generated');
    }

    // Clean up the response - remove markdown code blocks if present
    const cleanedCode = code
      .replace(/^```(?:jsx?|javascript|tsx?|typescript)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();
    
    // Validate and sanitize generated code
    const validation = validateGeneratedComponent(cleanedCode);
    
    if (!validation.isValid) {
      logger.error('Generated code validation failed', null, {
        requestId: req.id,
        errors: validation.errors,
        prompt: prompt.substring(0, 100)
      });
      
      // Retry with stricter prompt
      const retryCode = await provider.generateComponent(`${prompt}. Ensure the component has proper imports, exports, and contains no harmful code.`, systemPrompt);
      const cleanedRetryCode = retryCode
        .replace(/^```(?:jsx?|javascript|tsx?|typescript)?\n?/gm, '')
        .replace(/```$/gm, '')
        .trim();
      
      const retryValidation = validateGeneratedComponent(cleanedRetryCode);
      
      if (!retryValidation.isValid) {
        throw new Error('Failed to generate valid component code');
      }
      
      const finalCode = retryValidation.sanitized;
      
      // End performance monitoring
      const generationTime = performanceMonitor.endTimer('aiGeneration', {
        promptLength: prompt.length,
        responseLength: finalCode.length,
        tokensUsed: 0, // Token tracking not available with fallback system
        retried: true
      });
      
      logger.info('UI generated successfully after retry', {
        requestId: req.id,
        promptLength: prompt.length,
        responseLength: finalCode.length,
        model: 'gpt-4o',
        tokensUsed: 0,
        generationTime: generationTime ? `${generationTime.toFixed(2)}ms` : 'unknown'
      });

      res.status(200).json({ 
        code: finalCode,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        remainingRequests: rateLimiter.getRemainingRequests(identifier)
      });
      return;
    }
    
    const finalCode = validation.sanitized;

    // End performance monitoring
    const generationTime = performanceMonitor.endTimer('aiGeneration', {
      promptLength: prompt.length,
      responseLength: cleanedCode.length,
      tokensUsed: 0
    });
    
    // Log successful generation
    logger.info('UI generated successfully', {
      requestId: req.id,
      promptLength: prompt.length,
      responseLength: cleanedCode.length,
      model: 'gpt-4o',
      tokensUsed: 0,
      generationTime: generationTime ? `${generationTime.toFixed(2)}ms` : 'unknown'
    });

    res.status(200).json({ 
      code: finalCode,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      remainingRequests: rateLimiter.getRemainingRequests(identifier)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { status?: number }).status;
    const errorObject = error instanceof Error ? error : null;
    
    logger.error('AI generation error', errorObject, { 
      requestId: req.id,
      errorMessage: errorMessage
    });
    
    if (errorStatus === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (errorStatus === 401) {
      return res.status(500).json({ error: 'AI service authentication failed' });
    }

    res.status(500).json({ 
      error: 'Failed to generate UI. Please try again.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default requestLogger(generateUIHandler); 