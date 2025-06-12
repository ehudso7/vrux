import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    subscription: string;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        subscription: string;
      };

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          subscription: true,
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Attach user to request
      req.user = user;

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

// Middleware to check subscription level
export function requireSubscription(level: 'FREE' | 'PRO' | 'ENTERPRISE') {
  return function(
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
  ) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const subscriptionLevels = {
        'FREE': 0,
        'PRO': 1,
        'ENTERPRISE': 2
      };

      const userLevel = subscriptionLevels[req.user!.subscription as keyof typeof subscriptionLevels] || 0;
      const requiredLevel = subscriptionLevels[level];

      if (userLevel < requiredLevel) {
        return res.status(403).json({ 
          error: 'Insufficient subscription level',
          required: level,
          current: req.user!.subscription
        });
      }

      return handler(req, res);
    });
  };
}