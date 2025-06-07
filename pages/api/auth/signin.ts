import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';
import { requireDomain } from '../../../lib/domain-restriction';
import { withAuthRateLimit, logFailedAuth, getUserIdentifier } from '../../../lib/auth-rate-limiter';

async function signinHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid request parameters',
        code: 'INVALID_REQUEST'
      });
    }

    // Find user
    const user = authStore.findUserByEmail(email);
    const identifier = getUserIdentifier(req);
    
    if (!user) {
      logFailedAuth('signin', identifier, 'user_not_found', { email });
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    if (!authStore.verifyPassword(user, password)) {
      logFailedAuth('signin', identifier, 'invalid_password', { email, userId: user.id });
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Create session
    const sessionId = authStore.createSession(user.id);

    // Set session cookie
    res.setHeader(
      'Set-Cookie',
      `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    logger.info('User signed in', { userId: user.id, email: user.email });

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
    logger.error('Sign in error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred during authentication',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Apply domain restriction and rate limiting
// Fixed handler with proper error handling
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // In development, skip domain restriction
    if (process.env.NODE_ENV === 'development') {
      return await withAuthRateLimit(signinHandler, 'signin')(req, res);
    }
    // In production, apply domain restriction
    return await requireDomain(withAuthRateLimit(signinHandler, 'signin'))(req, res);
  } catch (error) {
    // Always return JSON for API errors
    logger.error('Signin endpoint error', error as Error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process signin request',
      code: 'SIGNIN_ERROR'
    });
  }
};

export default handler;