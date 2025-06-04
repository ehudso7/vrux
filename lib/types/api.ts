import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiKey, ApiPermission } from '../api-key-manager';
import type { UserPlan } from '../rate-limiter-tiers';
import type { GeoRegion } from '../geo-restrictions';

/**
 * Extended request type with security context
 */
export interface ExtendedNextApiRequest extends NextApiRequest {
  // API Key context
  apiKey?: ApiKey;
  userId?: string;
  permissions?: ApiPermission[];
  
  // User context
  user?: {
    id: string;
    email: string;
    plan: UserPlan;
  };
  
  // Geographic context
  geoInfo?: {
    country: string | null;
    region: GeoRegion | null;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
  
  // IP context
  clientIp?: string;
  ipAllowlistMatch?: string;
}

/**
 * Type guard to check if request has user context
 */
export function hasUserContext(req: NextApiRequest): req is ExtendedNextApiRequest {
  return 'userId' in req || 'user' in req;
}

/**
 * Type guard to check if request has API key context
 */
export function hasApiKeyContext(req: NextApiRequest): req is ExtendedNextApiRequest {
  return 'apiKey' in req && 'permissions' in req;
}

/**
 * Handler type with extended request
 */
export type ExtendedApiHandler = (
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) => void | Promise<void>;