import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
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

    // Get current user
    const user = authStore.findUserById(session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
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
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Check if email is already taken
      const existingUser = authStore.findUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ message: 'Email already in use' });
      }

      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    // Update user
    const updatedUser = authStore.updateUser(user.id, updates);
    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update profile' });
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
    res.status(500).json({ message: 'Internal server error' });
  }
}