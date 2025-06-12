import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, handlePrismaError } from '../../../lib/prisma';
import logger from '../../../lib/logger';
import { withAuthRateLimit } from '../../../lib/auth-rate-limiter';
import { SubscriptionTier } from '@prisma/client';

async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        subscription: SubscriptionTier.FREE,
        apiCallsCount: 0,
        apiCallsReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        subscription: true,
        subscriptionExpiry: true,
        apiCallsCount: true,
        apiCallsReset: true,
        createdAt: true,
      }
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

    // Log analytics event
    await prisma.analytics.create({
      data: {
        userId: user.id,
        event: 'SUBSCRIPTION_UPGRADED', // Track new user signup
        metadata: {
          source: 'signup_form',
          subscription: user.subscription
        }
      }
    }).catch(err => logger.error('Failed to log analytics', err));

    logger.info('New user created', { userId: user.id, email: user.email });

    res.status(201).json({
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
    logger.error('Sign up error', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
}

// Apply rate limiting
export default withAuthRateLimit(signupHandler, 'signup');