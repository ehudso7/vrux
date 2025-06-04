import type { NextApiRequest, NextApiResponse } from 'next';
import type { ExtendedNextApiRequest } from './types/api';
import logger from './logger';

/**
 * Geographic regions
 */
export enum GeoRegion {
  US = 'US',
  EU = 'EU',
  UK = 'UK',
  CA = 'CA',
  AU = 'AU',
  JP = 'JP',
  SG = 'SG',
  IN = 'IN',
  BR = 'BR',
  OTHER = 'OTHER',
}

/**
 * Country to region mapping
 */
const COUNTRY_TO_REGION: Record<string, GeoRegion> = {
  // North America
  'US': GeoRegion.US,
  'CA': GeoRegion.CA,
  
  // Europe
  'DE': GeoRegion.EU,
  'FR': GeoRegion.EU,
  'IT': GeoRegion.EU,
  'ES': GeoRegion.EU,
  'NL': GeoRegion.EU,
  'BE': GeoRegion.EU,
  'AT': GeoRegion.EU,
  'SE': GeoRegion.EU,
  'DK': GeoRegion.EU,
  'FI': GeoRegion.EU,
  'NO': GeoRegion.EU,
  'PL': GeoRegion.EU,
  'CZ': GeoRegion.EU,
  'RO': GeoRegion.EU,
  'HU': GeoRegion.EU,
  'GR': GeoRegion.EU,
  'PT': GeoRegion.EU,
  'IE': GeoRegion.EU,
  
  // UK
  'GB': GeoRegion.UK,
  
  // Asia Pacific
  'AU': GeoRegion.AU,
  'NZ': GeoRegion.AU,
  'JP': GeoRegion.JP,
  'SG': GeoRegion.SG,
  'MY': GeoRegion.SG,
  'TH': GeoRegion.SG,
  'IN': GeoRegion.IN,
  
  // South America
  'BR': GeoRegion.BR,
  'AR': GeoRegion.BR,
  'CL': GeoRegion.BR,
  'CO': GeoRegion.BR,
  'MX': GeoRegion.BR,
};

/**
 * Blocked countries list (OFAC sanctions, etc.)
 */
const BLOCKED_COUNTRIES = [
  'KP', // North Korea
  'IR', // Iran
  'SY', // Syria
  'CU', // Cuba
  'RU', // Russia (optional based on policy)
];

/**
 * Geographic restriction configuration
 */
export interface GeoRestrictionConfig {
  allowedRegions?: GeoRegion[];
  blockedRegions?: GeoRegion[];
  allowedCountries?: string[];
  blockedCountries?: string[];
  defaultAllow: boolean;
}

/**
 * Default geographic restrictions
 */
export const DEFAULT_GEO_RESTRICTIONS: GeoRestrictionConfig = {
  allowedRegions: [
    GeoRegion.US,
    GeoRegion.EU,
    GeoRegion.UK,
    GeoRegion.CA,
    GeoRegion.AU,
    GeoRegion.JP,
    GeoRegion.SG,
  ],
  blockedCountries: BLOCKED_COUNTRIES,
  defaultAllow: false,
};

/**
 * Manages geographic restrictions
 */
export class GeoRestrictionManager {
  private config: GeoRestrictionConfig;
  
  constructor(config?: Partial<GeoRestrictionConfig>) {
    this.config = {
      ...DEFAULT_GEO_RESTRICTIONS,
      ...config,
    };
  }
  
  /**
   * Check if a country is allowed
   */
  isCountryAllowed(countryCode: string): { allowed: boolean; reason?: string } {
    // Check blocked countries first
    if (this.config.blockedCountries?.includes(countryCode)) {
      return { 
        allowed: false, 
        reason: 'Country is blocked by policy' 
      };
    }
    
    // Check allowed countries
    if (this.config.allowedCountries) {
      const allowed = this.config.allowedCountries.includes(countryCode);
      return { 
        allowed, 
        reason: allowed ? undefined : 'Country not in allowed list' 
      };
    }
    
    // Check by region
    const region = this.getRegion(countryCode);
    
    // Check blocked regions
    if (this.config.blockedRegions?.includes(region)) {
      return { 
        allowed: false, 
        reason: 'Region is blocked' 
      };
    }
    
    // Check allowed regions
    if (this.config.allowedRegions) {
      const allowed = this.config.allowedRegions.includes(region);
      return { 
        allowed, 
        reason: allowed ? undefined : 'Region not allowed' 
      };
    }
    
    // Default policy
    return { 
      allowed: this.config.defaultAllow,
      reason: this.config.defaultAllow ? undefined : 'Geographic access restricted' 
    };
  }
  
  /**
   * Get region for a country
   */
  getRegion(countryCode: string): GeoRegion {
    return COUNTRY_TO_REGION[countryCode] || GeoRegion.OTHER;
  }
  
  /**
   * Parse country from various headers
   */
  getCountryFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
    // CloudFlare
    if (headers['cf-ipcountry']) {
      return headers['cf-ipcountry'] as string;
    }
    
    // Vercel
    if (headers['x-vercel-ip-country']) {
      return headers['x-vercel-ip-country'] as string;
    }
    
    // AWS CloudFront
    if (headers['cloudfront-viewer-country']) {
      return headers['cloudfront-viewer-country'] as string;
    }
    
    // Fastly
    if (headers['x-country-code']) {
      return headers['x-country-code'] as string;
    }
    
    // Generic
    if (headers['x-geo-country']) {
      return headers['x-geo-country'] as string;
    }
    
    return null;
  }
  
  /**
   * Get detailed geo information from headers
   */
  getGeoInfo(headers: Record<string, string | string[] | undefined>): {
    country: string | null;
    region: GeoRegion | null;
    city?: string;
    latitude?: string;
    longitude?: string;
  } {
    const country = this.getCountryFromHeaders(headers);
    
    return {
      country,
      region: country ? this.getRegion(country) : null,
      city: headers['x-vercel-ip-city'] as string || headers['cf-ipcity'] as string,
      latitude: headers['x-vercel-ip-latitude'] as string || headers['cf-latitude'] as string,
      longitude: headers['x-vercel-ip-longitude'] as string || headers['cf-longitude'] as string,
    };
  }
  
  /**
   * Format geo restriction error message
   */
  getErrorMessage(countryCode: string): string {
    if (BLOCKED_COUNTRIES.includes(countryCode)) {
      return 'Service is not available in your country due to legal restrictions';
    }
    
    const region = this.getRegion(countryCode);
    if (region === GeoRegion.OTHER) {
      return 'Service is not yet available in your region';
    }
    
    return 'Service is currently limited to specific geographic regions';
  }
}

// Singleton instance
export const geoRestrictionManager = new GeoRestrictionManager();

/**
 * Middleware for geographic restrictions
 */
export function requireGeoAccess(customConfig?: Partial<GeoRestrictionConfig>) {
  const manager = customConfig 
    ? new GeoRestrictionManager(customConfig)
    : geoRestrictionManager;
  
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const geoInfo = manager.getGeoInfo(req.headers);
    
    if (!geoInfo.country) {
      // Can't determine country - apply default policy
      if (!manager['config'].defaultAllow) {
        logger.warn('Geographic restriction - unknown country', {
          ip: (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
          headers: req.headers,
        });
        
        return res.status(403).json({
          error: 'Geographic location could not be determined',
          code: 'GEO_UNKNOWN',
        });
      }
    } else {
      // Check if country is allowed
      const result = manager.isCountryAllowed(geoInfo.country);
      
      if (!result.allowed) {
        logger.warn('Geographic restriction applied', {
          country: geoInfo.country,
          region: geoInfo.region,
          reason: result.reason,
          ip: (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
        });
        
        return res.status(451).json({ // 451 = Unavailable For Legal Reasons
          error: manager.getErrorMessage(geoInfo.country),
          code: 'GEO_RESTRICTED',
          country: geoInfo.country,
          region: geoInfo.region,
        });
      }
    }
    
    // Attach geo info to request
    const extReq = req as ExtendedNextApiRequest;
    extReq.geoInfo = geoInfo;
    
    if (next) {
      next();
    }
  };
}

/**
 * Get user-friendly region name
 */
export function getRegionName(region: GeoRegion): string {
  const names: Record<GeoRegion, string> = {
    [GeoRegion.US]: 'United States',
    [GeoRegion.EU]: 'European Union',
    [GeoRegion.UK]: 'United Kingdom',
    [GeoRegion.CA]: 'Canada',
    [GeoRegion.AU]: 'Australia & New Zealand',
    [GeoRegion.JP]: 'Japan',
    [GeoRegion.SG]: 'Southeast Asia',
    [GeoRegion.IN]: 'India',
    [GeoRegion.BR]: 'Latin America',
    [GeoRegion.OTHER]: 'Other',
  };
  
  return names[region] || 'Unknown';
}