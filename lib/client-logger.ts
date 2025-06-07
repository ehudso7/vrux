/**
 * Client-safe logger that doesn't import server-side modules
 */
class ClientLogger {
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
  ) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Log info message
   */
  info(message: string, meta: Record<string, unknown> = {}): void {
    const logEntry = this.formatLogEntry('info', message, meta);
    if (this.isDevelopment) {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, meta: Record<string, unknown> = {}): void {
    const logEntry = this.formatLogEntry('warn', message, meta);
    if (this.isDevelopment) {
      console.warn(JSON.stringify(logEntry));
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
    if (this.isDevelopment) {
      console.error(JSON.stringify(logEntry));
    }
  }
}

// Export singleton instance
const clientLogger = new ClientLogger();
export default clientLogger;