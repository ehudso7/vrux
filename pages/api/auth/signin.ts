import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, handlePrismaError } from '../../../lib/prisma';
import logger from '../../../lib/logger';
import { withAuthRateLimit, logFailedAuth, getUserIdentifier } from '../../../lib/auth-rate-limiter';

async function signinHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required'
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        avatarUrl: true,
        subscription: true,
        subscriptionExpiry: true,
        apiCallsCount: true,
        apiCallsReset: true,
        createdAt: true,
      }
    });
    
    const identifier = getUserIdentifier(req);
    
    if (!user || !user.password) {
      logFailedAuth('signin', identifier, 'user_not_found', { email });
      return res.status(401).json({ 
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logFailedAuth('signin', identifier, 'invalid_password', { email, userId: user.id });
      return res.status(401).json({ 
        error: 'Invalid credentials'
      });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        subscription: user.subscription 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    logger.info('User signed in', { userId: user.id, email: user.email });

    // Return user data (without password)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        apiCallsCount: user.apiCallsCount,
        apiCallsReset: user.apiCallsReset,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    logger.error('Sign in error', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
}

// Apply rate limiting
export default withAuthRateLimit(signinHandler, 'signin');