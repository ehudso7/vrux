import { RateLimiter } from './rate-limiter';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import logger from './logger';

/**
 * Specialized rate limiters for authentication endpoints
 */
const signinLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const signupLimiter = new RateLimiter(60 * 60 * 1000, 3); // 3 attempts per hour
const standardAuthLimiter = new RateLimiter(15 * 60 * 1000, 30); // 30 attempts per 15 minutes for other auth endpoints

/**
 * Get user identifier for rate limiting
 * Uses IP address and user agent to prevent bypass via different accounts
 */
export function getUserIdentifier(req: NextApiRequest): string {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
             req.socket?.remoteAddress || 
             'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Combine IP and a hash of user agent for more robust identification
  const agentHash = userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  return `${ip}:${agentHash}`;
}

/**
 * Apply rate limiting to authentication endpoints
 */
export function withAuthRateLimit(
  handler: NextApiHandler,
  type: 'signin' | 'signup' | 'standard' = 'standard'
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const identifier = getUserIdentifier(req);
    
    // Select appropriate limiter based on endpoint type
    let limiter: RateLimiter;
    let limitName: string;
    
    switch (type) {
      case 'signin':
        limiter = signinLimiter;
        limitName = 'signin';
        break;
      case 'signup':
        limiter = signupLimiter;
        limitName = 'signup';
        break;
      default:
        limiter = standardAuthLimiter;
        limitName = 'auth';
    }
    
    // Check if request is allowed
    const allowed = limiter.isAllowed(identifier);
    const requests = limiter.getRequests(identifier);
    const resetTime = limiter.getResetTime(identifier);
    const limit = limiter.getLimit();
    const remaining = Math.max(0, limit - requests.length);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
    res.setHeader('X-RateLimit-Type', limitName);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      logger.warn(`Auth rate limit exceeded: ${limitName}`, {
        identifier,
        endpoint: req.url,
        limit,
        attempts: requests.length,
        resetTime,
      });
      
      // Return generic error message to prevent information leakage
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }
    
    // Continue with the handler
    return handler(req, res);
  };
}

/**
 * Log failed authentication attempts
 */
export function logFailedAuth(
  endpoint: string,
  identifier: string,
  reason: string,
  details?: Record<string, unknown>
): void {
  logger.warn('Failed authentication attempt', {
    endpoint,
    identifier,
    reason,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Get current rate limit status for an identifier
 */
export function getAuthRateLimitStatus(
  identifier: string,
  type: 'signin' | 'signup' | 'standard' = 'standard'
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
} {
  let limiter: RateLimiter;
  
  switch (type) {
    case 'signin':
      limiter = signinLimiter;
      break;
    case 'signup':
      limiter = signupLimiter;
      break;
    default:
      limiter = standardAuthLimiter;
  }
  
  const allowed = limiter.isAllowed(identifier);
  const requests = limiter.getRequests(identifier);
  const resetTime = limiter.getResetTime(identifier);
  const limit = limiter.getLimit();
  const remaining = Math.max(0, limit - requests.length);
  
  return {
    allowed,
    limit,
    remaining,
    resetTime,
  };
}