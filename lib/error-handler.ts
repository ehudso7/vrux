import logger from './logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { APIError } from './types';

interface ExtendedNextApiRequest extends NextApiRequest {
  id?: string;
}

interface ErrorResponse {
  error: string;
  requestId?: string;
  stack?: string;
  details?: unknown;
}

/**
 * Global error handler with logging
 */
class ErrorHandler {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.setupProcessHandlers();
  }

  /**
   * Setup global process error handlers
   */
  private setupProcessHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error, {
        type: 'uncaughtException',
        fatal: true
      });
      
      // Give logger time to write, then exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      logger.error('Unhandled Promise Rejection', error, {
        type: 'unhandledRejection',
        promise: promise.toString()
      });
    });

    // Handle warnings
    process.on('warning', (warning: Error) => {
      logger.warn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });
  }

  /**
   * Format error for response
   */
  formatError(error: Error | APIError, requestId?: string): ErrorResponse {
    const baseError: ErrorResponse = {
      error: error.message || 'Internal server error',
      requestId
    };

    // Add additional details in development
    if (this.isDevelopment) {
      baseError.stack = error.stack;
      baseError.details = error;
    }

    return baseError;
  }

  /**
   * Handle API errors
   */
  handleApiError(error: Error | APIError, req: ExtendedNextApiRequest, res: NextApiResponse): void {
    const requestId = req.id || 'unknown';
    
    // Log the error
    logger.error(`API Error: ${req.method} ${req.url}`, error, {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Determine status code
    const statusCode = (error as APIError).statusCode || 500;
    
    // Send error response
    if (!res.headersSent) {
      res.status(statusCode).json(this.formatError(error, requestId));
    }
  }

  /**
   * Create custom error classes
   */
  createError(message: string, statusCode: number = 500, details: Record<string, unknown> = {}): APIError {
    const error = new Error(message) as APIError;
    error.statusCode = statusCode;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Common error creators
   */
  badRequest(message: string = 'Bad Request', details: Record<string, unknown> = {}): APIError {
    return this.createError(message, 400, details);
  }

  unauthorized(message: string = 'Unauthorized', details: Record<string, unknown> = {}): APIError {
    return this.createError(message, 401, details);
  }

  forbidden(message: string = 'Forbidden', details: Record<string, unknown> = {}): APIError {
    return this.createError(message, 403, details);
  }

  notFound(message: string = 'Not Found', details: Record<string, unknown> = {}): APIError {
    return this.createError(message, 404, details);
  }

  tooManyRequests(message: string = 'Too Many Requests', details: Record<string, unknown> = {}): APIError {
    return this.createError(message, 429, details);
  }

  internalError(message: string = 'Internal Server Error', details: Record<string, unknown> = {}): APIError {
    return this.createError(message, 500, details);
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler; 