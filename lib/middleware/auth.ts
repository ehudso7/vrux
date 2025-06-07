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
  return async (req: AuthenticatedRequest, res: NextApiResponse): Promise<void> => {
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
        await handler(req, res);
        return;
      }

      // Production auth logic
      const sessionCookie = req.cookies.session;
      if (!sessionCookie) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = authStore.getSession(sessionCookie);
      if (!session) {
        res.status(401).json({ error: 'Invalid session' });
        return;
      }

      const user = authStore.findUserById(session.userId);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        apiCalls: user.apiCalls,
        maxApiCalls: user.maxApiCalls
      };

      await handler(req, res);
    } catch (error) {
      logger.error('Auth middleware error', error as Error);
      res.status(500).json({ error: 'Authentication error' });
    }
  };
}

export function requireAuthWithApiLimit(handler: NextApiHandler) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse): Promise<void> => {
    if (req.user && req.user.apiCalls >= req.user.maxApiCalls) {
      res.status(429).json({ 
        error: 'API limit exceeded',
        limit: req.user.maxApiCalls,
        used: req.user.apiCalls
      });
      return;
    }
    
    await handler(req, res);
    
    // Increment API calls after successful request
    if (req.user && res.statusCode === 200) {
      authStore.updateUserApiCalls(req.user.id);
    }
  });
}

export function requireAdmin(handler: NextApiHandler) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse): Promise<void> => {
    if (!req.user || req.user.plan !== 'enterprise') {
      res.status(403).json({ 
        error: 'Admin access required',
        message: 'This endpoint requires enterprise plan access'
      });
      return;
    }
    
    await handler(req, res);
  });
}
