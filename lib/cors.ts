import Cors from 'cors';
import type { CorsOptions } from 'cors';
import type { NextApiRequest, NextApiResponse } from 'next';

type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  callback: (result?: Error | unknown) => void
) => void;

/**
 * Helper method to wait for a middleware to execute before continuing
 */
export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Middleware
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

/**
 * Configure CORS with environment-based settings
 * Restricts access to vrux.dev in production
 */
const getCorsOptions = (): CorsOptions => {
  // Define allowed origins based on environment
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://vrux.dev',
        'https://www.vrux.dev',
        'https://preview.vrux.dev', // Staging environment
      ]
    : ['http://localhost:3000', 'http://localhost:3001'];

  return {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps or curl requests) only in development
      if (!origin && process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // In production, always require an origin
      if (!origin && process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin required'));
      }
      
      // Check if origin is allowed
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Also allow Vercel preview deployments
        if (origin && origin.includes('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
  };
};

// Initialize the cors middleware
const cors = Cors(getCorsOptions());

export default cors;