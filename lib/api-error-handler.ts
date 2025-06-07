import { NextApiRequest, NextApiResponse } from 'next';
import logger from './logger';

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function handleApiError(
  error: unknown,
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.error('API Error', error as Error, {
    url: req.url,
    method: req.method,
    body: req.body,
  });

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  // Ensure we always return JSON for API routes
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}

export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res);
    }
  };
}