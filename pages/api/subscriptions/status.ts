import type { NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';
import logger from '../../../lib/logger';

// In-memory storage for demo purposes (use database in production)
const userSubscriptions = new Map<string, {
  plan: 'Free' | 'Pro' | 'Team';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}>();

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const userId = user.id;
    const subscription = userSubscriptions.get(userId) || {
      plan: 'Free',
      status: 'active',
    };

    // Calculate usage limits based on plan
    const limits = {
      Free: {
        generationsPerMonth: 100,
        templatesAccess: 'basic',
        supportLevel: 'community',
        apiAccess: false,
        teamMembers: 1,
      },
      Pro: {
        generationsPerMonth: -1, // Unlimited
        templatesAccess: 'premium',
        supportLevel: 'priority',
        apiAccess: true,
        teamMembers: 1,
      },
      Team: {
        generationsPerMonth: -1, // Unlimited
        templatesAccess: 'all',
        supportLevel: 'dedicated',
        apiAccess: true,
        teamMembers: -1, // Unlimited
      },
    };

    // Get current usage (mock data)
    const currentUsage = {
      generationsThisMonth: 42,
      teamMembersCount: 1,
      apiCallsThisMonth: 150,
    };

    logger.info('Subscription status fetched', {
      userId,
      plan: subscription.plan,
      status: subscription.status,
    });

    return res.status(200).json({
      success: true,
      subscription: {
        ...subscription,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      },
      limits: limits[subscription.plan],
      usage: currentUsage,
    });
  } catch (error) {
    logger.error('Get subscription status error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
    });
  }
}

export default requireAuth(handler);