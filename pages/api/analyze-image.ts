import type { NextApiResponse } from 'next';
import { analyzeImage, generatePromptFromAnalysis } from '../../lib/image-analyzer';
import rateLimiter from '../../lib/rate-limiter';
import cors, { runMiddleware } from '../../lib/cors';
import requestLogger from '../../lib/middleware/request-logger';
import logger from '../../lib/logger';
import { z } from 'zod';
import { validateDomain } from '../../lib/domain-restriction';
import { requireAuthWithApiLimit, type AuthenticatedRequest } from '../../lib/middleware/auth';

const requestSchema = z.object({
  image: z.string().min(1),
  generatePrompt: z.boolean().optional().default(true),
});

async function analyzeImageHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const identifier = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anonymous';
  if (!rateLimiter.isAllowed(identifier)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
    });
  }

  try {
    // Validate request
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.errors 
      });
    }

    const { image, generatePrompt } = validationResult.data;

    // Analyze image
    logger.info('Analyzing uploaded image', { 
      generatePrompt,
      imageSize: image.length 
    });

    const analysis = await analyzeImage(image);
    
    // Generate prompt if requested
    let prompt = undefined;
    if (generatePrompt) {
      prompt = generatePromptFromAnalysis(analysis);
    }

    logger.info('Image analysis completed', {
      layout: analysis.layout,
      componentsCount: analysis.components.length,
      style: analysis.style
    });

    res.status(200).json({
      analysis,
      prompt,
      remainingRequests: rateLimiter.getRemainingRequests(identifier)
    });

  } catch (error) {
    logger.error('Image analysis error', error as Error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : undefined 
    });
  }
}

// Apply domain restriction inside the handler
async function protectedAnalyzeImageHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const validation = validateDomain(req);
  if (!validation.isValid) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This service can only be accessed from vrux.dev',
      code: 'DOMAIN_RESTRICTION'
    });
  }
  return analyzeImageHandler(req, res);
}

export default requireAuthWithApiLimit(requestLogger(protectedAnalyzeImageHandler));