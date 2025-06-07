import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';
import { requireDomain } from '../../../lib/domain-restriction';
import { withAuthRateLimit, logFailedAuth, getUserIdentifier } from '../../../lib/auth-rate-limiter';

async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid request parameters',
        code: 'INVALID_REQUEST'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid request parameters',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Password does not meet requirements',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user exists
    const existingUser = authStore.findUserByEmail(email);
    const identifier = getUserIdentifier(req);
    
    if (existingUser) {
      logFailedAuth('signup', identifier, 'email_exists', { email });
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'Unable to create account',
        code: 'ACCOUNT_EXISTS'
      });
    }

    // Create user
    const user = authStore.createUser({ email, password, name });

    // Create session
    const sessionId = authStore.createSession(user.id);

    // Set session cookie
    res.setHeader(
      'Set-Cookie',
      `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    logger.info('User signed up', { userId: user.id, email: user.email });

    // Return user data (without password)
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      plan: user.plan,
      apiCalls: user.apiCalls,
      maxApiCalls: user.maxApiCalls,
    });
  } catch (error) {
    logger.error('Sign up error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred during registration',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Apply domain restriction and rate limiting
// Wrap with error handling to ensure JSON responses
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // In development, skip domain restriction
    if (process.env.NODE_ENV === 'development') {
      return await withAuthRateLimit(signupHandler, 'signup')(req, res);
    }
    // In production, apply domain restriction
    return await requireDomain(withAuthRateLimit(signupHandler, 'signup'))(req, res);
  } catch (error) {
    // Always return JSON for API errors
    logger.error('Signup endpoint error', error as Error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process signup request',
      code: 'SIGNUP_ERROR'
    });
  }
};

export default handler;