import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import logger from './logger';

/**
 * API Key Permissions - Industry standard scoping
 */
export enum ApiPermission {
  // Read permissions
  READ_COMPONENTS = 'read:components',
  READ_TEMPLATES = 'read:templates',
  READ_ANALYTICS = 'read:analytics',
  
  // Write permissions
  WRITE_COMPONENTS = 'write:components',
  WRITE_TEMPLATES = 'write:templates',
  
  // Generation permissions
  GENERATE_UI = 'generate:ui',
  GENERATE_PROJECT = 'generate:project',
  GENERATE_VIEWCOMFY = 'generate:viewcomfy',
  
  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_BILLING = 'admin:billing',
  ADMIN_API_KEYS = 'admin:api_keys',
}

/**
 * API Key metadata
 */
export interface ApiKey {
  id: string;
  key: string; // Hashed version
  prefix: string; // Public prefix (e.g., "vrux_live_")
  name: string;
  userId: string;
  permissions: ApiPermission[];
  rateLimit?: number; // Custom rate limit override
  allowedIps?: string[]; // IP allowlist
  allowedDomains?: string[]; // Domain allowlist
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}

/**
 * API Key validation result
 */
export interface ApiKeyValidation {
  isValid: boolean;
  apiKey?: ApiKey;
  error?: string;
  userId?: string;
  permissions?: ApiPermission[];
}

/**
 * Manages API keys with industry-standard security
 */
export class ApiKeyManager {
  private static readonly KEY_PREFIX = 'vrux';
  private static readonly KEY_LENGTH = 32;
  
  // In production, this would be in a database
  private keys: Map<string, ApiKey> = new Map();
  
  /**
   * Generate a new API key
   */
  generateApiKey(
    userId: string,
    name: string,
    permissions: ApiPermission[],
    options?: {
      expiresIn?: number; // Days
      rateLimit?: number;
      allowedIps?: string[];
      allowedDomains?: string[];
    }
  ): { apiKey: string; keyId: string } {
    const keyId = crypto.randomUUID();
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const rawKey = crypto.randomBytes(this.constructor.KEY_LENGTH).toString('hex');
    const prefix = `${ApiKeyManager.KEY_PREFIX}_${environment}`;
    const fullKey = `${prefix}_${rawKey}`;
    
    // Hash the key for storage
    const hashedKey = this.hashKey(fullKey);
    
    const apiKeyData: ApiKey = {
      id: keyId,
      key: hashedKey,
      prefix: `${prefix}_${rawKey.substring(0, 8)}...`,
      name,
      userId,
      permissions,
      rateLimit: options?.rateLimit,
      allowedIps: options?.allowedIps,
      allowedDomains: options?.allowedDomains,
      expiresAt: options?.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date(),
    };
    
    this.keys.set(hashedKey, apiKeyData);
    
    logger.info('API key created', {
      keyId,
      userId,
      name,
      permissions,
      prefix: apiKeyData.prefix,
    });
    
    return { apiKey: fullKey, keyId };
  }
  
  /**
   * Validate an API key
   */
  validateApiKey(apiKey: string, requiredPermission?: ApiPermission): ApiKeyValidation {
    if (!apiKey) {
      return { isValid: false, error: 'API key is required' };
    }
    
    // Check key format
    const keyPattern = new RegExp(`^${ApiKeyManager.KEY_PREFIX}_(live|test)_[a-f0-9]{64}$`);
    if (!keyPattern.test(apiKey)) {
      return { isValid: false, error: 'Invalid API key format' };
    }
    
    const hashedKey = this.hashKey(apiKey);
    const keyData = this.keys.get(hashedKey);
    
    if (!keyData) {
      return { isValid: false, error: 'Invalid API key' };
    }
    
    // Check if revoked
    if (keyData.revokedAt) {
      return { isValid: false, error: 'API key has been revoked' };
    }
    
    // Check expiration
    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      return { isValid: false, error: 'API key has expired' };
    }
    
    // Check required permission
    if (requiredPermission && !keyData.permissions.includes(requiredPermission)) {
      return { 
        isValid: false, 
        error: `Missing required permission: ${requiredPermission}` 
      };
    }
    
    // Update last used
    keyData.lastUsedAt = new Date();
    
    return {
      isValid: true,
      apiKey: keyData,
      userId: keyData.userId,
      permissions: keyData.permissions,
    };
  }
  
  /**
   * Check if IP is allowed for API key
   */
  isIpAllowed(apiKey: ApiKey, ip: string): boolean {
    if (!apiKey.allowedIps || apiKey.allowedIps.length === 0) {
      return true; // No IP restriction
    }
    
    return apiKey.allowedIps.some(allowedIp => {
      // Support CIDR notation
      if (allowedIp.includes('/')) {
        return this.isIpInCidr(ip, allowedIp);
      }
      return ip === allowedIp;
    });
  }
  
  /**
   * Check if domain is allowed for API key
   */
  isDomainAllowed(apiKey: ApiKey, domain: string): boolean {
    if (!apiKey.allowedDomains || apiKey.allowedDomains.length === 0) {
      return true; // No domain restriction
    }
    
    return apiKey.allowedDomains.some(allowedDomain => {
      // Support wildcard domains
      if (allowedDomain.startsWith('*.')) {
        const baseDomain = allowedDomain.substring(2);
        return domain.endsWith(baseDomain);
      }
      return domain === allowedDomain;
    });
  }
  
  /**
   * Revoke an API key
   */
  revokeApiKey(keyId: string): boolean {
    for (const [, keyData] of this.keys.entries()) {
      if (keyData.id === keyId) {
        keyData.revokedAt = new Date();
        logger.info('API key revoked', { keyId, userId: keyData.userId });
        return true;
      }
    }
    return false;
  }
  
  /**
   * List API keys for a user
   */
  listUserApiKeys(userId: string): Omit<ApiKey, 'key'>[] {
    const userKeys: Omit<ApiKey, 'key'>[] = [];
    
    for (const keyData of this.keys.values()) {
      if (keyData.userId === userId && !keyData.revokedAt) {
        const { key: _, ...publicData } = keyData;
        userKeys.push(publicData);
      }
    }
    
    return userKeys;
  }
  
  /**
   * Hash API key for secure storage
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  /**
   * Check if IP is in CIDR range
   */
  private isIpInCidr(ip: string, cidr: string): boolean {
    // Simple implementation - in production, use a library like 'ip-range-check'
    const [range, bits] = cidr.split('/');
    if (!bits) return false;
    
    const ipInt = this.ipToInt(ip);
    const rangeInt = this.ipToInt(range);
    const mask = (0xffffffff << (32 - parseInt(bits))) >>> 0;
    
    return (ipInt & mask) === (rangeInt & mask);
  }
  
  /**
   * Convert IP to integer for CIDR comparison
   */
  private ipToInt(ip: string): number {
    const parts = ip.split('.');
    return parts.reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
  }
}

// Singleton instance
export const apiKeyManager = new ApiKeyManager();

/**
 * Express/Next.js middleware for API key validation
 */
export function requireApiKey(permission?: ApiPermission) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_REQUIRED',
      });
    }
    
    const validation = apiKeyManager.validateApiKey(apiKey, permission);
    
    if (!validation.isValid) {
      logger.warn('Invalid API key attempt', {
        error: validation.error,
        ip: (req.headers['x-forwarded-for'] as string) || (req.socket as any)?.remoteAddress,
      });
      
      return res.status(403).json({
        error: validation.error,
        code: 'INVALID_API_KEY',
      });
    }
    
    // Check IP allowlist
    const clientIp = (req.headers['x-forwarded-for'] as string) || (req.socket as any)?.remoteAddress || '127.0.0.1';
    if (validation.apiKey && !apiKeyManager.isIpAllowed(validation.apiKey, clientIp)) {
      return res.status(403).json({
        error: 'IP address not allowed',
        code: 'IP_NOT_ALLOWED',
      });
    }
    
    // Check domain allowlist
    const origin = req.headers.origin || req.headers.referer;
    if (validation.apiKey && origin) {
      try {
        const domain = new URL(origin).hostname;
        if (!apiKeyManager.isDomainAllowed(validation.apiKey, domain)) {
          return res.status(403).json({
            error: 'Domain not allowed',
            code: 'DOMAIN_NOT_ALLOWED',
          });
        }
      } catch {
        // Invalid origin URL
      }
    }
    
    // Attach user info to request
    (req as any).apiKey = validation.apiKey;
    (req as any).userId = validation.userId;
    (req as any).permissions = validation.permissions;
    
    if (next) {
      next();
    }
  };
}