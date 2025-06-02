import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const sessionId = req.cookies.session;
    
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get session
    const session = authStore.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Session expired' });
    }

    // Get user
    const user = authStore.findUserById(session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
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
    res.status(500).json({ message: 'Internal server error' });
  }
}