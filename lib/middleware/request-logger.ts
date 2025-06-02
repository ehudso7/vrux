import logger from '../logger';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ExtendedNextApiRequest extends NextApiRequest {
  id?: string;
}

type NextApiHandler = (req: ExtendedNextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Request logging middleware
 */
export default function requestLogger(handler: NextApiHandler) {
  return async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    
    // Generate request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.id = requestId;
    
    // Add request ID to response headers
    res.setHeader('X-Request-Id', requestId);
    
    // Log incoming request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept']
      },
      query: req.query,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    // Capture the original end function
    const originalEnd = res.end;
    const originalEndFunc = originalEnd.bind(res);
    
    // Override the end function with proper typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.end = ((chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): any => {
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Log the response
      logger.logRequest(req, res, responseTime);
      
      // Call the original end function with proper arguments
      if (typeof encoding === 'function') {
        // encoding is actually the callback
        return originalEndFunc(chunk, encoding);
      } else if (cb) {
        return originalEndFunc(chunk, encoding as BufferEncoding, cb);
      } else if (encoding) {
        return originalEndFunc(chunk, encoding as BufferEncoding);
      } else if (chunk !== undefined) {
        return originalEndFunc(chunk);
      } else {
        return originalEndFunc();
      }
    }) as typeof res.end;

    try {
      // Call the actual handler
      await handler(req, res);
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error('Unknown error');
      
      // Log any errors
      logger.error(`Request failed: ${req.method} ${req.url}`, errorObject, { requestId });
      
      // Send error response if not already sent
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          requestId 
        });
      }
    }
  };
} 