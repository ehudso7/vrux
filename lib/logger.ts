import fs from 'fs';
import path from 'path';
import type { LogEntry } from './types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Production-ready logging utility
 */
class Logger {
  private isDevelopment: boolean;
  private logDir: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    
    // Ensure log directory exists
    if (!this.isDevelopment && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
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
      pid: process.pid
    };
  }

  /**
   * Write log entry to file in production
   */
  private writeToFile(logEntry: LogEntry): void {
    if (this.isDevelopment) return;
    
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logDir, `app-${date}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(filename, logLine, 'utf8');
  }

  /**
   * Log info message
   */
  info(message: string, meta: Record<string, unknown> = {}): void {
    const logEntry = this.formatLogEntry('info', message, meta);
    console.log(JSON.stringify(logEntry));
    this.writeToFile(logEntry);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta: Record<string, unknown> = {}): void {
    const logEntry = this.formatLogEntry('warn', message, meta);
    console.warn(JSON.stringify(logEntry));
    this.writeToFile(logEntry);
  }

  /**
   * Log error message
   */
  error(message: string, error: Error | null = null, meta: Record<string, unknown> = {}): void {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : {};
    
    const logEntry = this.formatLogEntry('error', message, { ...errorMeta, ...meta });
    console.error(JSON.stringify(logEntry));
    this.writeToFile(logEntry);
  }

  /**
   * Log HTTP request
   */
  logRequest(req: NextApiRequest, res: NextApiResponse, responseTime: number): void {
    const logEntry = this.formatLogEntry('info', 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      referrer: req.headers.referer || req.headers.referrer
    });
    
    console.log(JSON.stringify(logEntry));
    this.writeToFile(logEntry);
  }
}

// Export singleton instance
const logger = new Logger();
export default logger; 