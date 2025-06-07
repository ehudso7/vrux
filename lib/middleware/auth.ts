import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { authStore } from '../auth-store';
import logger from '../logger';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
    apiCalls: number;
    maxApiCalls: number;
  };
}

export function requireAuth(handler: NextApiHandler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // In development, create a mock user for testing
      if (process.env.NODE_ENV === 'development') {
        req.user = {
          id: 'dev-user',
          email: 'dev@vrux.dev',
          name: 'Dev User',
          plan: 'free',
          apiCalls: 0,
          maxApiCalls: 100
        };
        return handler(req, res);
      }

      // Production auth logic
      const sessionCookie = req.cookies.session;
      if (!sessionCookie) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const session = authStore.getSession(sessionCookie);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const user = authStore.findUserById(session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        apiCalls: user.apiCalls,
        maxApiCalls: user.maxApiCalls
      };

      return handler(req, res);
    } catch (error) {
      logger.error('Auth middleware error', error as Error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

export function requireAuthWithApiLimit(handler: NextApiHandler) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user && req.user.apiCalls >= req.user.maxApiCalls) {
      return res.status(429).json({ 
        error: 'API limit exceeded',
        limit: req.user.maxApiCalls,
        used: req.user.apiCalls
      });
    }
    
    const result = await handler(req, res);
    
    // Increment API calls after successful request
    if (req.user && res.statusCode === 200) {
      authStore.updateUserApiCalls(req.user.id);
    }
    
    return result;
  });
}
