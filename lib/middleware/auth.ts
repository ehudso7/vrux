import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { authStore } from '../auth-store';
import type { User } from '../auth-store';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: User;
}

export function requireAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // Parse cookies
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const sessionToken = cookies['auth-token'];
    
    if (!sessionToken) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'Please sign in to use this feature',
        code: 'AUTH_REQUIRED',
      });
    }

    // Validate session and get user
    const user = authStore.validateSession(sessionToken);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Session',
        message: 'Your session has expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
      });
    }

    // Attach user to request
    req.user = user;

    // Call the handler
    return handler(req, res);
  };
}

export function requireAuthWithApiLimit(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const user = req.user!;

    // Check API usage limits
    if (user.apiCalls >= user.maxApiCalls) {
      return res.status(429).json({
        error: 'API Limit Exceeded',
        message: `You have reached your ${user.plan} plan limit of ${user.maxApiCalls} API calls. Please upgrade your plan.`,
        code: 'API_LIMIT_EXCEEDED',
        usage: {
          used: user.apiCalls,
          limit: user.maxApiCalls,
          plan: user.plan,
        },
      });
    }

    // Track API usage after successful response
    const originalJson = res.json;
    res.json = function<T>(data: T) {
      // Only increment if it's a successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        authStore.incrementApiCalls(user.id);
      }
      return originalJson.call(this, data);
    };

    return handler(req, res);
  });
}

// Middleware for endpoints that should be admin-only
export function requireAdmin(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const user = req.user!;

    if (user.plan !== 'enterprise') {
      return res.status(403).json({
        error: 'Admin Access Required',
        message: 'This endpoint requires enterprise plan access',
        code: 'ADMIN_REQUIRED',
      });
    }

    return handler(req, res);
  });
}