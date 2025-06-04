import type { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiter } from './rate-limiter';
import logger from './logger';

/**
 * User plan tiers - Industry standard
 */
export enum UserPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

/**
 * Rate limit configuration by plan
 */
export interface PlanRateLimit {
  requests: number;
  window: number; // in milliseconds
  burst?: number; // Allow burst requests
  endpoints?: {
    [endpoint: string]: {
      requests: number;
      window: number;
    };
  };
}

/**
 * Industry-standard rate limits by plan
 */
export const PLAN_RATE_LIMITS: Record<UserPlan, PlanRateLimit> = {
  [UserPlan.FREE]: {
    requests: 10,
    window: 60 * 60 * 1000, // 10 per hour
    burst: 3,
    endpoints: {
      '/api/generate-ui': { requests: 5, window: 60 * 60 * 1000 },
      '/api/generate-project': { requests: 2, window: 60 * 60 * 1000 },
    },
  },
  [UserPlan.STARTER]: {
    requests: 100,
    window: 60 * 60 * 1000, // 100 per hour
    burst: 20,
    endpoints: {
      '/api/generate-ui': { requests: 50, window: 60 * 60 * 1000 },
      '/api/generate-project': { requests: 20, window: 60 * 60 * 1000 },
    },
  },
  [UserPlan.PRO]: {
    requests: 1000,
    window: 60 * 60 * 1000, // 1000 per hour
    burst: 100,
    endpoints: {
      '/api/generate-ui': { requests: 500, window: 60 * 60 * 1000 },
      '/api/generate-project': { requests: 200, window: 60 * 60 * 1000 },
    },
  },
  [UserPlan.TEAM]: {
    requests: 5000,
    window: 60 * 60 * 1000, // 5000 per hour
    burst: 500,
    endpoints: {
      '/api/generate-ui': { requests: 2500, window: 60 * 60 * 1000 },
      '/api/generate-project': { requests: 1000, window: 60 * 60 * 1000 },
    },
  },
  [UserPlan.ENTERPRISE]: {
    requests: -1, // Unlimited
    window: 60 * 60 * 1000,
    burst: -1,
    endpoints: {
      '/api/generate-ui': { requests: -1, window: 60 * 60 * 1000 },
      '/api/generate-project': { requests: -1, window: 60 * 60 * 1000 },
    },
  },
};

/**
 * Manages rate limiting by user plan
 */
export class TieredRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  
  /**
   * Get or create rate limiter for a specific key
   */
  private getLimiter(key: string, requests: number, window: number): RateLimiter {
    const limiterKey = `${key}:${requests}:${window}`;
    
    if (!this.limiters.has(limiterKey)) {
      this.limiters.set(limiterKey, new RateLimiter(window, requests));
    }
    
    return this.limiters.get(limiterKey)!;
  }
  
  /**
   * Check if request is allowed based on user plan
   */
  isAllowed(
    userId: string,
    userPlan: UserPlan,
    endpoint?: string,
    customRateLimit?: number
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
  } {
    const planLimits = PLAN_RATE_LIMITS[userPlan];
    
    // Enterprise has unlimited access
    if (planLimits.requests === -1) {
      return {
        allowed: true,
        limit: -1,
        remaining: -1,
        resetTime: new Date(Date.now() + planLimits.window),
      };
    }
    
    // Check endpoint-specific limits first
    if (endpoint && planLimits.endpoints?.[endpoint]) {
      const endpointLimit = planLimits.endpoints[endpoint];
      const limiter = this.getLimiter(
        `${userId}:${endpoint}`,
        customRateLimit || endpointLimit.requests,
        endpointLimit.window
      );
      
      const allowed = limiter.isAllowed(userId);
      const usage = this.getUsage(limiter, userId, endpointLimit.requests);
      
      if (!allowed) {
        logger.warn('Rate limit exceeded for endpoint', {
          userId,
          userPlan,
          endpoint,
          limit: endpointLimit.requests,
        });
      }
      
      return {
        allowed,
        ...usage,
        retryAfter: allowed ? undefined : Math.ceil((usage.resetTime.getTime() - Date.now()) / 1000),
      };
    }
    
    // Check general rate limit
    const limiter = this.getLimiter(
      userId,
      customRateLimit || planLimits.requests,
      planLimits.window
    );
    
    // Check burst allowance
    const requests = limiter.getRequests(userId);
    const isBurst = planLimits.burst && requests.length === 0;
    
    const allowed = limiter.isAllowed(userId);
    const usage = this.getUsage(limiter, userId, planLimits.requests);
    
    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        userId,
        userPlan,
        limit: planLimits.requests,
        window: planLimits.window,
      });
    }
    
    return {
      allowed: allowed || isBurst,
      ...usage,
      retryAfter: allowed ? undefined : Math.ceil((usage.resetTime.getTime() - Date.now()) / 1000),
    };
  }
  
  /**
   * Get current usage statistics
   */
  getUsage(
    limiter: RateLimiter,
    userId: string,
    limit: number
  ): {
    limit: number;
    remaining: number;
    resetTime: Date;
  } {
    const requests = limiter.getRequests(userId);
    const resetTime = limiter.getResetTime(userId);
    
    return {
      limit,
      remaining: Math.max(0, limit - requests.length),
      resetTime,
    };
  }
  
  /**
   * Get usage statistics for user
   */
  getUserUsage(
    userId: string,
    userPlan: UserPlan,
    endpoint?: string
  ): {
    plan: UserPlan;
    globalLimit: number;
    globalUsed: number;
    globalRemaining: number;
    globalResetTime: Date;
    endpointLimit?: number;
    endpointUsed?: number;
    endpointRemaining?: number;
    endpointResetTime?: Date;
  } {
    const planLimits = PLAN_RATE_LIMITS[userPlan];
    
    // Global usage
    const globalLimiter = this.getLimiter(userId, planLimits.requests, planLimits.window);
    const globalRequests = globalLimiter.getRequests(userId);
    
    interface UsageResult {
      plan: UserPlan;
      globalLimit: number;
      globalUsed: number;
      globalRemaining: number;
      globalResetTime: Date;
      endpointLimit?: number;
      endpointUsed?: number;
      endpointRemaining?: number;
      endpointResetTime?: Date;
    }
    
    const result: UsageResult = {
      plan: userPlan,
      globalLimit: planLimits.requests,
      globalUsed: globalRequests.length,
      globalRemaining: planLimits.requests === -1 ? -1 : Math.max(0, planLimits.requests - globalRequests.length),
      globalResetTime: globalLimiter.getResetTime(userId),
    };
    
    // Endpoint-specific usage
    if (endpoint && planLimits.endpoints?.[endpoint]) {
      const endpointLimit = planLimits.endpoints[endpoint];
      const endpointLimiter = this.getLimiter(
        `${userId}:${endpoint}`,
        endpointLimit.requests,
        endpointLimit.window
      );
      const endpointRequests = endpointLimiter.getRequests(userId);
      
      result.endpointLimit = endpointLimit.requests;
      result.endpointUsed = endpointRequests.length;
      result.endpointRemaining = endpointLimit.requests === -1 ? -1 : Math.max(0, endpointLimit.requests - endpointRequests.length);
      result.endpointResetTime = endpointLimiter.getResetTime(userId);
    }
    
    return result;
  }
  
  /**
   * Reset rate limits for a user (admin action)
   */
  resetUserLimits(userId: string): void {
    // Clear all limiters for this user
    const keysToDelete: string[] = [];
    
    for (const key of this.limiters.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.limiters.delete(key));
    
    logger.info('Rate limits reset for user', { userId });
  }
}

// Singleton instance
export const tieredRateLimiter = new TieredRateLimiter();

/**
 * Middleware for tiered rate limiting
 */
export function requireRateLimit(endpoint?: string) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const userId = (req as any).userId || (req.headers['x-user-id'] as string) || req.socket?.remoteAddress;
    const userPlan = (req as any).user?.plan || UserPlan.FREE;
    const customRateLimit = (req as any).apiKey?.rateLimit;
    
    const result = tieredRateLimiter.isAllowed(
      userId,
      userPlan,
      endpoint || req.url,
      customRateLimit
    );
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());
    
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter!.toString());
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: result.limit,
        remaining: 0,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
        upgradeUrl: 'https://vrux.dev/pricing',
      });
    }
    
    if (next) {
      next();
    }
  };
}