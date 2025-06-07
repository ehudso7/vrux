import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';
import { requireDomain } from '../../../lib/domain-restriction';
import { withAuthRateLimit } from '../../../lib/auth-rate-limiter';

async function updateProfileHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
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

    // Get current user
    const user = authStore.findUserById(session.userId);
    if (!user) {
      logger.error('User not found for valid session', new Error('User not found'), { sessionId, userId: session.userId });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user
    const { name, email } = req.body;
    const updates: Record<string, string> = {};

    if (name && name !== user.name) {
      updates.name = name;
    }

    if (email && email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Invalid request parameters',
          code: 'INVALID_EMAIL'
        });
      }

      // Check if email is already taken
      const existingUser = authStore.findUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ 
          error: 'Conflict',
          message: 'Unable to update profile',
          code: 'EMAIL_IN_USE'
        });
      }

      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid request parameters',
        code: 'NO_UPDATES'
      });
    }

    // Update user
    const updatedUser = authStore.updateUser(user.id, updates);
    if (!updatedUser) {
      logger.error('Failed to update user profile', new Error('Update failed'), { userId: user.id, updates });
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Unable to update profile',
        code: 'UPDATE_FAILED'
      });
    }

    logger.info('User profile updated', { userId: user.id, updates });

    // Return updated user data
    res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt,
      plan: updatedUser.plan,
      apiCalls: updatedUser.apiCalls,
      maxApiCalls: updatedUser.maxApiCalls,
    });
  } catch (error) {
    logger.error('Profile update error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred while updating profile',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Apply domain restriction and standard rate limiting
export default requireDomain(
  withAuthRateLimit(updateProfileHandler, 'standard')
);