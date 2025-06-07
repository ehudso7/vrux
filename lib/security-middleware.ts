import type { NextApiRequest, NextApiResponse } from 'next';
import type { ExtendedNextApiRequest, ExtendedApiHandler } from './types/api';
import { validateDomain } from './domain-restriction';
import { apiKeyManager, ApiPermission } from './api-key-manager';
import { tieredRateLimiter, UserPlan } from './rate-limiter-tiers';
import { geoRestrictionManager } from './geo-restrictions';
import { enterpriseIpAllowlist } from './ip-allowlist';
import logger from './logger';

/**
 * Security configuration options
 */
export interface SecurityConfig {
  requireDomain?: boolean;
  requireApiKey?: boolean;
  apiPermission?: ApiPermission;
  requireRateLimit?: boolean;
  requireGeoCheck?: boolean;
  requireIpAllowlist?: boolean;
  allowedPlans?: UserPlan[];
}

/**
 * Comprehensive security middleware
 */
export function withSecurity(config: SecurityConfig = {}) {
  return (handler: ExtendedApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      interface SecurityContext {
        timestamp: string;
        url?: string;
        method?: string;
        userId?: string;
        apiKeyId?: string;
        country?: string | null;
        region?: string | null;
        ip?: string;
        ipMatch?: string;
        rateLimit?: {
          limit: number;
          remaining: number;
        };
        [key: string]: unknown; // Allow additional properties
      }
      
      const securityContext: SecurityContext = {
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
      };
      
      try {
        // 1. Domain Validation
        if (config.requireDomain !== false) {
          const domainValidation = validateDomain(req);
          if (!domainValidation.isValid) {
            logger.warn('Security: Domain validation failed', {
              ...securityContext,
              reason: domainValidation.reason,
              origin: req.headers.origin,
              host: req.headers.host,
            });
            
            return res.status(403).json({
              error: 'Forbidden',
              message: 'This service can only be accessed from vrux.dev',
              code: 'DOMAIN_RESTRICTION',
            });
          }
        }
        
        // 2. API Key Validation
        if (config.requireApiKey) {
          const apiKey = req.headers['x-api-key'] as string || req.query.api_key as string;
          
          if (!apiKey) {
            return res.status(401).json({
              error: 'API key required',
              code: 'API_KEY_REQUIRED',
              message: 'Please provide a valid API key',
            });
          }
          
          const keyValidation = apiKeyManager.validateApiKey(apiKey, config.apiPermission);
          
          if (!keyValidation.isValid) {
            logger.warn('Security: API key validation failed', {
              ...securityContext,
              error: keyValidation.error,
            });
            
            return res.status(403).json({
              error: keyValidation.error,
              code: 'INVALID_API_KEY',
            });
          }
          
          // Attach API key context
          const extReq = req as ExtendedNextApiRequest;
          extReq.apiKey = keyValidation.apiKey;
          extReq.userId = keyValidation.userId;
          extReq.permissions = keyValidation.permissions;
          securityContext.userId = keyValidation.userId;
          securityContext.apiKeyId = keyValidation.apiKey?.id;
        }
        
        // 3. Geographic Restrictions
        if (config.requireGeoCheck) {
          const geoInfo = geoRestrictionManager.getGeoInfo(req.headers);
          
          if (geoInfo.country) {
            const geoResult = geoRestrictionManager.isCountryAllowed(geoInfo.country);
            
            if (!geoResult.allowed) {
              logger.warn('Security: Geographic restriction applied', {
                ...securityContext,
                country: geoInfo.country,
                region: geoInfo.region,
                reason: geoResult.reason,
              });
              
              return res.status(451).json({
                error: geoRestrictionManager.getErrorMessage(geoInfo.country),
                code: 'GEO_RESTRICTED',
                country: geoInfo.country,
                region: geoInfo.region,
              });
            }
          }
          
          const extReq = req as ExtendedNextApiRequest;
          extReq.geoInfo = geoInfo;
          securityContext.country = geoInfo.country;
          securityContext.region = geoInfo.region as string | null;
        }
        
        // 4. IP Allowlist
        if (config.requireIpAllowlist) {
          const clientIp = enterpriseIpAllowlist.getClientIp(req.headers);
          const extReq = req as ExtendedNextApiRequest;
          const isAuthenticated = !!extReq.userId;
          const ipResult = enterpriseIpAllowlist.isIpAllowed(clientIp, isAuthenticated);
          
          if (!ipResult.allowed) {
            logger.warn('Security: IP allowlist rejection', {
              ...securityContext,
              ip: clientIp,
              reason: ipResult.reason,
            });
            
            return res.status(403).json({
              error: 'Access denied',
              code: 'IP_NOT_ALLOWED',
              message: 'Your IP address is not authorized',
            });
          }
          
          extReq.clientIp = clientIp;
          securityContext.ip = clientIp;
          securityContext.ipMatch = ipResult.matchedRule;
        }
        
        // 5. Rate Limiting
        if (config.requireRateLimit !== false) {
          const extReq = req as ExtendedNextApiRequest;
          const userId = extReq.userId || (req.headers['x-forwarded-for'] as string) || 'anonymous';
          const userPlan = extReq.user?.plan || UserPlan.FREE;
          const endpoint = req.url;
          
          // Check plan restrictions
          if (config.allowedPlans && !config.allowedPlans.includes(userPlan)) {
            return res.status(403).json({
              error: 'Plan upgrade required',
              code: 'PLAN_RESTRICTION',
              message: `This feature requires ${config.allowedPlans.join(' or ')} plan`,
              upgradeUrl: 'https://vrux.dev/pricing',
            });
          }
          
          const rateResult = tieredRateLimiter.isAllowed(userId, userPlan, endpoint);
          
          // Set rate limit headers
          res.setHeader('X-RateLimit-Limit', rateResult.limit.toString());
          res.setHeader('X-RateLimit-Remaining', rateResult.remaining.toString());
          res.setHeader('X-RateLimit-Reset', rateResult.resetTime.toISOString());
          
          if (!rateResult.allowed) {
            res.setHeader('Retry-After', rateResult.retryAfter!.toString());
            
            logger.warn('Security: Rate limit exceeded', {
              ...securityContext,
              userPlan,
              limit: rateResult.limit,
              endpoint,
            });
            
            return res.status(429).json({
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              limit: rateResult.limit,
              remaining: 0,
              resetTime: rateResult.resetTime,
              retryAfter: rateResult.retryAfter,
              upgradeUrl: 'https://vrux.dev/pricing',
            });
          }
          
          securityContext.rateLimit = {
            limit: rateResult.limit,
            remaining: rateResult.remaining,
          };
        }
        
        // Log successful security check
        logger.info('Security: All checks passed', securityContext);
        
        // Execute the handler
        return handler(req, res);
        
      } catch (error) {
        logger.error('Security middleware error', error as Error, securityContext);
        
        return res.status(500).json({
          error: 'Internal server error',
          code: 'SECURITY_ERROR',
        });
      }
    };
  };
}

/**
 * Pre-configured security levels
 */
export const SecurityLevels = {
  // Public endpoints (only domain + rate limit)
  PUBLIC: {
    requireDomain: true,
    requireApiKey: false,
    requireRateLimit: true,
    requireGeoCheck: false,
    requireIpAllowlist: false,
  },
  
  // Standard API access
  STANDARD: {
    requireDomain: true,
    requireApiKey: true,
    requireRateLimit: true,
    requireGeoCheck: true,
    requireIpAllowlist: false,
  },
  
  // Enhanced security for sensitive operations
  ENHANCED: {
    requireDomain: true,
    requireApiKey: true,
    apiPermission: ApiPermission.GENERATE_UI,
    requireRateLimit: true,
    requireGeoCheck: true,
    requireIpAllowlist: false,
    allowedPlans: [UserPlan.PRO, UserPlan.TEAM, UserPlan.ENTERPRISE],
  },
  
  // Maximum security for admin operations
  MAXIMUM: {
    requireDomain: true,
    requireApiKey: true,
    apiPermission: ApiPermission.ADMIN_USERS,
    requireRateLimit: true,
    requireGeoCheck: true,
    requireIpAllowlist: true,
    allowedPlans: [UserPlan.ENTERPRISE],
  },
};

/**
 * Convenience functions for common security configurations
 */
export const secureEndpoint = withSecurity(SecurityLevels.STANDARD);
export const publicEndpoint = withSecurity(SecurityLevels.PUBLIC);
export const enhancedEndpoint = withSecurity(SecurityLevels.ENHANCED);
export const adminEndpoint = withSecurity(SecurityLevels.MAXIMUM);