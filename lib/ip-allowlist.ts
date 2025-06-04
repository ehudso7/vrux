import type { NextApiRequest, NextApiResponse } from 'next';
import logger from './logger';

/**
 * IP allowlist configuration
 */
export interface IpAllowlistConfig {
  enabled: boolean;
  allowedIps?: string[]; // Individual IPs
  allowedRanges?: string[]; // CIDR ranges
  allowPrivateIps?: boolean; // Allow RFC1918 private IPs
  allowCloudflareIps?: boolean; // Allow Cloudflare proxy IPs
  allowVercelIps?: boolean; // Allow Vercel infrastructure
  bypassForAuthenticated?: boolean; // Skip check for authenticated users
}

/**
 * Default Cloudflare IP ranges
 */
const CLOUDFLARE_IPS = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];

/**
 * Private IP ranges (RFC1918)
 */
const PRIVATE_IP_RANGES = [
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '127.0.0.0/8', // Loopback
];

/**
 * Manages IP-based access control
 */
export class IpAllowlistManager {
  private config: IpAllowlistConfig;
  
  constructor(config?: Partial<IpAllowlistConfig>) {
    this.config = {
      enabled: false,
      allowPrivateIps: false,
      allowCloudflareIps: true,
      allowVercelIps: true,
      bypassForAuthenticated: true,
      ...config,
    };
  }
  
  /**
   * Check if IP is allowed
   */
  isIpAllowed(ip: string, isAuthenticated: boolean = false): {
    allowed: boolean;
    reason?: string;
    matchedRule?: string;
  } {
    // Skip check if disabled
    if (!this.config.enabled) {
      return { allowed: true, matchedRule: 'allowlist_disabled' };
    }
    
    // Skip for authenticated users if configured
    if (isAuthenticated && this.config.bypassForAuthenticated) {
      return { allowed: true, matchedRule: 'authenticated_bypass' };
    }
    
    // Normalize IP
    const normalizedIp = this.normalizeIp(ip);
    
    // Check individual allowed IPs
    if (this.config.allowedIps?.includes(normalizedIp)) {
      return { allowed: true, matchedRule: 'allowed_ip' };
    }
    
    // Check allowed ranges
    if (this.config.allowedRanges) {
      for (const range of this.config.allowedRanges) {
        if (this.isIpInRange(normalizedIp, range)) {
          return { allowed: true, matchedRule: `allowed_range:${range}` };
        }
      }
    }
    
    // Check private IPs
    if (this.config.allowPrivateIps && this.isPrivateIp(normalizedIp)) {
      return { allowed: true, matchedRule: 'private_ip' };
    }
    
    // Check Cloudflare IPs
    if (this.config.allowCloudflareIps && this.isCloudflareIp(normalizedIp)) {
      return { allowed: true, matchedRule: 'cloudflare_ip' };
    }
    
    // Check Vercel IPs (simplified check)
    if (this.config.allowVercelIps && this.isVercelIp(normalizedIp)) {
      return { allowed: true, matchedRule: 'vercel_ip' };
    }
    
    return { 
      allowed: false, 
      reason: 'IP address not in allowlist' 
    };
  }
  
  /**
   * Add IP to allowlist
   */
  addIp(ip: string): void {
    if (!this.config.allowedIps) {
      this.config.allowedIps = [];
    }
    
    const normalizedIp = this.normalizeIp(ip);
    if (!this.config.allowedIps.includes(normalizedIp)) {
      this.config.allowedIps.push(normalizedIp);
      logger.info('IP added to allowlist', { ip: normalizedIp });
    }
  }
  
  /**
   * Remove IP from allowlist
   */
  removeIp(ip: string): boolean {
    if (!this.config.allowedIps) return false;
    
    const normalizedIp = this.normalizeIp(ip);
    const index = this.config.allowedIps.indexOf(normalizedIp);
    
    if (index > -1) {
      this.config.allowedIps.splice(index, 1);
      logger.info('IP removed from allowlist', { ip: normalizedIp });
      return true;
    }
    
    return false;
  }
  
  /**
   * Add CIDR range to allowlist
   */
  addRange(range: string): void {
    if (!this.isValidCidr(range)) {
      throw new Error('Invalid CIDR range');
    }
    
    if (!this.config.allowedRanges) {
      this.config.allowedRanges = [];
    }
    
    if (!this.config.allowedRanges.includes(range)) {
      this.config.allowedRanges.push(range);
      logger.info('IP range added to allowlist', { range });
    }
  }
  
  /**
   * Get real client IP from request headers
   */
  getClientIp(headers: Record<string, string | string[] | undefined>): string {
    // Priority order for IP headers
    const ipHeaders = [
      'x-real-ip',
      'x-forwarded-for',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'x-vercel-forwarded-for', // Vercel
      'x-original-forwarded-for',
      'x-forwarded',
      'forwarded-for',
      'forwarded',
    ];
    
    for (const header of ipHeaders) {
      const value = headers[header];
      if (value) {
        // Handle comma-separated list (take first IP)
        const ip = Array.isArray(value) ? value[0] : value.split(',')[0].trim();
        if (this.isValidIp(ip)) {
          return ip;
        }
      }
    }
    
    // Fallback to socket remote address
    return '127.0.0.1';
  }
  
  /**
   * Normalize IP address
   */
  private normalizeIp(ip: string): string {
    // Remove IPv6 prefix for IPv4 addresses
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    
    // Trim whitespace
    return ip.trim();
  }
  
  /**
   * Check if IP is valid
   */
  private isValidIp(ip: string): boolean {
    // Simple IPv4 validation
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
    }
    
    // Simple IPv6 validation
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Pattern.test(ip);
  }
  
  /**
   * Check if CIDR is valid
   */
  private isValidCidr(cidr: string): boolean {
    const parts = cidr.split('/');
    if (parts.length !== 2) return false;
    
    const [ip, bits] = parts;
    const bitsNum = parseInt(bits);
    
    return this.isValidIp(ip) && bitsNum >= 0 && bitsNum <= 32;
  }
  
  /**
   * Check if IP is in CIDR range
   */
  private isIpInRange(ip: string, cidr: string): boolean {
    const [rangeIp, bits] = cidr.split('/');
    if (!bits) return ip === rangeIp;
    
    const ipInt = this.ipToInt(ip);
    const rangeInt = this.ipToInt(rangeIp);
    const mask = (0xffffffff << (32 - parseInt(bits))) >>> 0;
    
    return (ipInt & mask) === (rangeInt & mask);
  }
  
  /**
   * Convert IP to integer
   */
  private ipToInt(ip: string): number {
    const parts = ip.split('.');
    return parts.reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
  }
  
  /**
   * Check if IP is private
   */
  private isPrivateIp(ip: string): boolean {
    return PRIVATE_IP_RANGES.some(range => this.isIpInRange(ip, range));
  }
  
  /**
   * Check if IP is from Cloudflare
   */
  private isCloudflareIp(ip: string): boolean {
    return CLOUDFLARE_IPS.some(range => this.isIpInRange(ip, range));
  }
  
  /**
   * Check if IP is from Vercel (simplified)
   */
  private isVercelIp(ip: string): boolean {
    // Vercel doesn't publish static IP ranges
    // This is a simplified check based on common patterns
    return ip.startsWith('76.76.') || ip.startsWith('76.223.');
  }
}

// Default instance for enterprise use
export const enterpriseIpAllowlist = new IpAllowlistManager({
  enabled: true,
  allowedIps: [], // Add specific IPs
  allowedRanges: [], // Add office networks
  allowCloudflareIps: true,
  allowVercelIps: true,
  bypassForAuthenticated: false, // Strict mode
});

/**
 * Middleware for IP allowlisting
 */
export function requireIpAllowlist(customConfig?: Partial<IpAllowlistConfig>) {
  const manager = customConfig 
    ? new IpAllowlistManager(customConfig)
    : enterpriseIpAllowlist;
  
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const clientIp = manager.getClientIp(req.headers);
    const isAuthenticated = !!(req as any).user || !!(req as any).userId;
    
    const result = manager.isIpAllowed(clientIp, isAuthenticated);
    
    if (!result.allowed) {
      logger.warn('IP allowlist rejection', {
        ip: clientIp,
        reason: result.reason,
        url: req.url,
        isAuthenticated,
      });
      
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_NOT_ALLOWED',
        message: 'Your IP address is not authorized to access this resource',
      });
    }
    
    // Attach IP info to request
    (req as any).clientIp = clientIp;
    (req as any).ipAllowlistMatch = result.matchedRule;
    
    if (next) {
      next();
    }
  };
}