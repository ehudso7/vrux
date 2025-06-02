import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    res.status(200).json({ message: 'Signed out successfully' });
  } catch (error) {
    logger.error('Sign out error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ message: 'Internal server error' });
  }
}