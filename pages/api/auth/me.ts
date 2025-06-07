import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';
import { requireDomain } from '../../../lib/domain-restriction';
import { withAuthRateLimit } from '../../../lib/auth-rate-limiter';

async function meHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Invalid request method',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Get session from cookie
    const sessionId = req.cookies.session;
    
    if (!sessionId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Get session
    const session = authStore.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'SESSION_EXPIRED'
      });
    }

    // Get user
    const user = authStore.findUserById(session.userId);
    if (!user) {
      logger.error('User not found for valid session', new Error('User not found'), { sessionId, userId: session.userId });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'USER_NOT_FOUND'
      });
    }

    // Return user data (without password)
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      plan: user.plan,
      apiCalls: user.apiCalls,
      maxApiCalls: user.maxApiCalls,
    });
  } catch (error) {
    logger.error('Get user error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user data',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Apply domain restriction and standard rate limiting
export default requireDomain(
  withAuthRateLimit(meHandler, 'standard')
);