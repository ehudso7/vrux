import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import logger from './logger';

/**
 * Validates that requests come from the allowed domain (vrux.dev)
 */
export function validateDomain(req: NextApiRequest): { isValid: boolean; reason?: string } {
  // Allow all requests in development
  if (process.env.NODE_ENV === 'development') {
    return { isValid: true };
  }

  // Get request origin
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  
  // For server-side requests or API routes without origin
  if (!origin) {
    // Check if the host is vrux.dev
    if (host && (host === 'vrux.dev' || host === 'www.vrux.dev' || host.endsWith('.vrux.dev'))) {
      return { isValid: true };
    }
    
    // Allow Vercel preview deployments
    if (host && host.includes('vercel.app')) {
      return { isValid: true };
    }
    
    return { 
      isValid: false, 
      reason: 'No origin header and host is not vrux.dev' 
    };
  }

  try {
    const originUrl = new URL(origin);
    const allowedDomains = [
      'vrux.dev',
      'www.vrux.dev',
      'preview.vrux.dev', // For staging
    ];
    
    // Check if origin hostname matches allowed domains
    const isAllowed = allowedDomains.some(domain => 
      originUrl.hostname === domain || originUrl.hostname.endsWith(`.${domain}`)
    );
    
    // Also allow Vercel preview deployments
    if (originUrl.hostname.includes('vercel.app')) {
      return { isValid: true };
    }
    
    if (!isAllowed) {
      return { 
        isValid: false, 
        reason: `Origin ${originUrl.hostname} is not allowed` 
      };
    }
    
    // Ensure HTTPS in production
    if (originUrl.protocol !== 'https:') {
      return { 
        isValid: false, 
        reason: 'HTTPS is required' 
      };
    }
    
    return { isValid: true };
  } catch (error) {
    logger.error('Invalid origin URL', error as Error, { origin });
    return { 
      isValid: false, 
      reason: 'Invalid origin URL' 
    };
  }
}

/**
 * Middleware to enforce domain restrictions
 */
export function requireDomain(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const validation = validateDomain(req);
    
    if (!validation.isValid) {
      logger.warn('Request blocked by domain restriction', {
        reason: validation.reason,
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        url: req.url,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      });
      
      res.status(403).json({
        error: 'Forbidden',
        message: 'This service can only be accessed from vrux.dev',
        code: 'DOMAIN_RESTRICTION'
      });
      return;
    }
    
    return handler(req, res);
  };
}