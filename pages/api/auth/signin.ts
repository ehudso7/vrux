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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = authStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    if (!authStore.verifyPassword(user, password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
    res.status(500).json({ message: 'Internal server error' });
  }
}