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
 */
const getCorsOptions = (): CorsOptions => {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

  return {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
  };
};

// Initialize the cors middleware
const cors = Cors(getCorsOptions());

export default cors; 