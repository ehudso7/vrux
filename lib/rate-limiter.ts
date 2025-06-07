/**
 * Simple in-memory rate limiter for serverless environments
 */
export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private requests: Map<string, number[]>;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  /**
   * Clean up expired timestamps
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of Array.from(this.requests.entries())) {
      const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  /**
   * Check if a request is allowed for the given identifier
   */
  isAllowed(identifier: string): boolean {
    this.cleanup();
    
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const recentRequests = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemainingRequests(identifier: string): number {
    this.cleanup();
    
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const recentRequests = timestamps.filter(ts => now - ts < this.windowMs);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Get the reset time for rate limit
   */
  getResetTime(identifier: string): Date {
    const timestamps = this.requests.get(identifier) || [];
    if (timestamps.length === 0) {
      return new Date(Date.now() + this.windowMs);
    }
    
    const oldestTimestamp = Math.min(...timestamps);
    return new Date(oldestTimestamp + this.windowMs);
  }

  /**
   * Get current requests for an identifier
   */
  getRequests(identifier: string): number[] {
    this.cleanup();
    
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    return timestamps.filter(ts => now - ts < this.windowMs);
  }

  /**
   * Get the maximum number of requests allowed
   */
  getLimit(): number {
    return this.maxRequests;
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter(60000, 10); // 10 requests per minute

export default rateLimiter; 