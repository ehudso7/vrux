import type { LogEntry } from './types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Production-ready logging utility
 * File operations are only performed server-side
 */
class Logger {
  private isDevelopment: boolean;
  private isServer: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isServer = typeof window === 'undefined';
  }

  /**
   * Format log entry with metadata
   */
  private formatLogEntry(
    level: 'info' | 'warn' | 'error', 
    message: string, 
    meta: Record<string, unknown> = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
      environment: process.env.NODE_ENV || 'development',
      ...(this.isServer ? { pid: process.pid } : {})
    };
  }

  /**
   * Write log entry to file in production (server-side only)
   */
  private async writeToFile(logEntry: LogEntry): Promise<void> {
    if (this.isDevelopment || !this.isServer) return;
    
    try {
      // Dynamic import for server-side only
      const fs = await import('fs');
      const path = await import('path');
      
      const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
      
      // Ensure log directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const date = new Date().toISOString().split('T')[0];
      const filename = path.join(logDir, `app-${date}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFileSync(filename, logLine, 'utf8');
    } catch {
      // Silently fail if file operations are not available
    }
  }

  /**
   * Log info message
   */
  info(message: string, meta: Record<string, unknown> = {}): void {
    const logEntry = this.formatLogEntry('info', message, meta);
    if (this.isDevelopment || this.isServer) {
      console.log(JSON.stringify(logEntry));
    }
    if (this.isServer) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, meta: Record<string, unknown> = {}): void {
    const logEntry = this.formatLogEntry('warn', message, meta);
    if (this.isDevelopment || this.isServer) {
      console.warn(JSON.stringify(logEntry));
    }
    if (this.isServer) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error: Error | null = null, meta: Record<string, unknown> = {}): void {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: this.isServer ? error.stack : 'Stack trace hidden in browser',
        name: error.name
      }
    } : {};
    
    const logEntry = this.formatLogEntry('error', message, { ...errorMeta, ...meta });
    if (this.isDevelopment || this.isServer) {
      console.error(JSON.stringify(logEntry));
    }
    if (this.isServer) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log HTTP request (server-side only)
   */
  logRequest(req: NextApiRequest, res: NextApiResponse, responseTime: number): void {
    if (!this.isServer) return;
    
    const logEntry = this.formatLogEntry('info', 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      referrer: req.headers.referer || req.headers.referrer
    });
    
    if (this.isDevelopment || this.isServer) {
      console.log(JSON.stringify(logEntry));
    }
    this.writeToFile(logEntry);
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;