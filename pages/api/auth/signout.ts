import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';
import { requireDomain } from '../../../lib/domain-restriction';
import { withAuthRateLimit } from '../../../lib/auth-rate-limiter';

async function signoutHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Invalid request method',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Get session from cookie
    const sessionId = req.cookies.session;
    
    if (sessionId) {
      // Delete session
      authStore.deleteSession(sessionId);
    }

    // Clear session cookie
    res.setHeader(
      'Set-Cookie',
      `session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    logger.info('User signed out');

    res.status(200).json({ 
      success: true,
      message: 'Signed out successfully' 
    });
  } catch (error) {
    logger.error('Sign out error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred during sign out',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Apply domain restriction and standard rate limiting
export default requireDomain(
  withAuthRateLimit(signoutHandler, 'standard')
);