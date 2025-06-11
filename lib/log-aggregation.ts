import { Writable } from 'stream';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import zlib from 'zlib';
import logger from './logger';
import monitoringBackend, { LogData } from './monitoring-backend';

// Log formats
interface StructuredLog {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  version: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  metadata: Record<string, unknown>;
  context: {
    file?: string;
    function?: string;
    line?: number;
  };
}

// Log processors
interface LogProcessor {
  name: string;
  process(log: StructuredLog): StructuredLog | null;
}

// Log enrichers
class LogEnricher implements LogProcessor {
  name = 'LogEnricher';
  
  process(log: StructuredLog): StructuredLog {
    // Add environment info
    log.environment = process.env.NODE_ENV || 'development';
    log.version = process.env.npm_package_version || '1.0.0';
    log.service = 'vrux-api';
    
    // Add correlation IDs from async context if available
    const asyncContext = (global as any).__async_context__;
    if (asyncContext) {
      log.traceId = log.traceId || asyncContext.traceId;
      log.spanId = log.spanId || asyncContext.spanId;
      log.userId = log.userId || asyncContext.userId;
      log.requestId = log.requestId || asyncContext.requestId;
    }
    
    // Add system metadata
    log.metadata = {
      ...log.metadata,
      hostname: process.env.HOSTNAME || 'unknown',
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    };
    
    return log;
  }
}

// Log filter for sensitive data
class SensitiveDataFilter implements LogProcessor {
  name = 'SensitiveDataFilter';
  private patterns = [
    /api[_-]?key["\s]*[:=]\s*["']?([^"'\s]+)/gi,
    /password["\s]*[:=]\s*["']?([^"'\s]+)/gi,
    /token["\s]*[:=]\s*["']?([^"'\s]+)/gi,
    /secret["\s]*[:=]\s*["']?([^"'\s]+)/gi,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  ];
  
  process(log: StructuredLog): StructuredLog {
    // Sanitize message
    let sanitizedMessage = log.message;
    this.patterns.forEach(pattern => {
      sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]');
    });
    log.message = sanitizedMessage;
    
    // Sanitize metadata
    log.metadata = this.sanitizeObject(log.metadata);
    
    return log;
  }
  
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      const value = obj[key];
      
      // Check if key contains sensitive words
      if (/password|secret|token|key|auth/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        let sanitizedValue = value;
        this.patterns.forEach(pattern => {
          sanitizedValue = sanitizedValue.replace(pattern, '[REDACTED]');
        });
        sanitized[key] = sanitizedValue;
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

// Log sampler for high volume
class LogSampler implements LogProcessor {
  name = 'LogSampler';
  private sampleRates: Record<string, number> = {
    debug: 0.1,    // 10% of debug logs
    info: 0.5,     // 50% of info logs
    warn: 1.0,     // 100% of warnings
    error: 1.0,    // 100% of errors
    critical: 1.0  // 100% of critical
  };
  
  process(log: StructuredLog): StructuredLog | null {
    const sampleRate = this.sampleRates[log.level] || 1.0;
    
    // Always include logs with errors or high severity
    if (log.level === 'error' || log.level === 'critical') {
      return log;
    }
    
    // Sample based on rate
    if (Math.random() < sampleRate) {
      log.metadata.sampled = true;
      log.metadata.sampleRate = sampleRate;
      return log;
    }
    
    return null; // Filter out
  }
}

// Log buffer for batching
class LogBuffer {
  private buffer: StructuredLog[] = [];
  private maxSize: number = 1000;
  private flushInterval: number = 5000; // 5 seconds
  private timer?: NodeJS.Timeout;
  private onFlush: (logs: StructuredLog[]) => Promise<void>;
  
  constructor(onFlush: (logs: StructuredLog[]) => Promise<void>) {
    this.onFlush = onFlush;
    this.startTimer();
  }
  
  add(log: StructuredLog): void {
    this.buffer.push(log);
    
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }
  
  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }
  
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      await this.onFlush(logs);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-add logs to buffer if flush failed
      this.buffer.unshift(...logs);
    }
  }
  
  shutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

// Main log aggregation pipeline
class LogAggregationPipeline {
  private processors: LogProcessor[] = [];
  private buffer: LogBuffer;
  private fileStream?: Writable;
  private currentLogFile?: string;
  private logRotateSize = 100 * 1024 * 1024; // 100MB
  private logRetentionDays = 30;
  private logDirectory = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  
  constructor() {
    this.setupProcessors();
    this.buffer = new LogBuffer(this.flushLogs.bind(this));
    this.setupFileStream();
    this.setupLogRotation();
    this.integrateWithLogger();
  }
  
  private setupProcessors(): void {
    this.processors.push(new LogEnricher());
    this.processors.push(new SensitiveDataFilter());
    
    // Only sample in production for high volume
    if (process.env.NODE_ENV === 'production') {
      this.processors.push(new LogSampler());
    }
  }
  
  private async setupFileStream(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
      
      const timestamp = new Date().toISOString().split('T')[0];
      this.currentLogFile = path.join(this.logDirectory, `vrux-${timestamp}.log`);
      
      this.fileStream = createWriteStream(this.currentLogFile, { flags: 'a' });
      
      // Also create compressed stream for archival
      const gzipStream = zlib.createGzip();
      const compressedFile = `${this.currentLogFile}.gz`;
      const compressedStream = createWriteStream(compressedFile, { flags: 'a' });
      
      gzipStream.pipe(compressedStream);
    } catch (error) {
      console.error('Failed to setup log file stream:', error);
    }
  }
  
  private setupLogRotation(): void {
    // Check for rotation every hour
    setInterval(async () => {
      await this.rotateLogsIfNeeded();
      await this.cleanOldLogs();
    }, 3600000);
  }
  
  private async rotateLogsIfNeeded(): Promise<void> {
    if (!this.currentLogFile) return;
    
    try {
      const stats = await fs.stat(this.currentLogFile);
      
      if (stats.size > this.logRotateSize) {
        // Close current stream
        this.fileStream?.end();
        
        // Create new file
        await this.setupFileStream();
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }
  
  private async cleanOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDirectory);
      const now = Date.now();
      const maxAge = this.logRetentionDays * 24 * 60 * 60 * 1000;
      
      for (const file of files) {
        const filePath = path.join(this.logDirectory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
  
  private integrateWithLogger(): void {
    // Override logger methods to pipe through aggregation
    const originalInfo = logger.info.bind(logger);
    const originalWarn = logger.warn.bind(logger);
    const originalError = logger.error.bind(logger);
    
    logger.info = (message: string, meta?: Record<string, unknown>) => {
      this.processLog('info', message, meta);
      originalInfo(message, meta);
    };
    
    logger.warn = (message: string, meta?: Record<string, unknown>) => {
      this.processLog('warn', message, meta);
      originalWarn(message, meta);
    };
    
    logger.error = (message: string, error?: Error | null, meta?: Record<string, unknown>) => {
      const errorMeta = error ? {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        ...meta
      } : meta;
      
      this.processLog('error', message, errorMeta);
      originalError(message, error, meta);
    };
  }
  
  processLog(level: string, message: string, metadata?: Record<string, unknown>): void {
    let log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'vrux-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      metadata: metadata || {},
      context: this.extractContext()
    };
    
    // Process through pipeline
    for (const processor of this.processors) {
      const result = processor.process(log);
      if (result === null) return; // Filtered out
      log = result;
    }
    
    // Add to buffer
    this.buffer.add(log);
  }
  
  private extractContext(): { file?: string; function?: string; line?: number } {
    const stack = new Error().stack;
    if (!stack) return {};
    
    const lines = stack.split('\n');
    // Skip first 4 lines (Error, extractContext, processLog, logger method)
    const relevantLine = lines[4];
    
    if (!relevantLine) return {};
    
    const match = relevantLine.match(/at (\S+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1],
        file: match[2],
        line: parseInt(match[3], 10)
      };
    }
    
    return {};
  }
  
  private async flushLogs(logs: StructuredLog[]): Promise<void> {
    // Write to file
    if (this.fileStream && this.fileStream.writable) {
      for (const log of logs) {
        this.fileStream.write(JSON.stringify(log) + '\n');
      }
    }
    
    // Send to monitoring backend
    const logData: LogData[] = logs.map(log => ({
      level: log.level,
      message: log.message,
      metadata: log.metadata,
      timestamp: new Date(log.timestamp),
      traceId: log.traceId,
      spanId: log.spanId
    }));
    
    await monitoringBackend.recordLog(logData[0]); // Send logs individually or batch
    
    // For real-time streaming, could also push to WebSocket
    this.streamToRealtime(logs);
  }
  
  private streamToRealtime(logs: StructuredLog[]): void {
    // This would connect to a WebSocket server for real-time log streaming
    // For now, store in global for monitoring integration
    (global as any).__pending_logs__ = logs;
  }
  
  // Public API
  async search(query: {
    startTime?: Date;
    endTime?: Date;
    level?: string;
    search?: string;
    userId?: string;
    requestId?: string;
    limit?: number;
  }): Promise<StructuredLog[]> {
    // In production, this would query from Elasticsearch or similar
    // For now, search recent logs from file
    const logs: StructuredLog[] = [];
    
    try {
      const files = await fs.readdir(this.logDirectory);
      const recentFiles = files
        .filter(f => f.startsWith('vrux-') && f.endsWith('.log'))
        .sort()
        .slice(-5); // Last 5 files
      
      for (const file of recentFiles) {
        const content = await fs.readFile(path.join(this.logDirectory, file), 'utf-8');
        const lines = content.trim().split('\n');
        
        for (const line of lines) {
          try {
            const log = JSON.parse(line) as StructuredLog;
            
            // Apply filters
            if (query.level && log.level !== query.level) continue;
            if (query.userId && log.userId !== query.userId) continue;
            if (query.requestId && log.requestId !== query.requestId) continue;
            if (query.search && !log.message.includes(query.search)) continue;
            
            if (query.startTime && new Date(log.timestamp) < query.startTime) continue;
            if (query.endTime && new Date(log.timestamp) > query.endTime) continue;
            
            logs.push(log);
            
            if (logs.length >= (query.limit || 100)) {
              return logs;
            }
          } catch {
            // Skip invalid log lines
          }
        }
      }
    } catch (error) {
      console.error('Failed to search logs:', error);
    }
    
    return logs;
  }
  
  shutdown(): void {
    this.buffer.shutdown();
    this.fileStream?.end();
  }
}

// Export singleton instance
export const logAggregation = new LogAggregationPipeline();

// Auto-shutdown on process exit
process.on('SIGTERM', () => logAggregation.shutdown());
process.on('SIGINT', () => logAggregation.shutdown());

export default logAggregation;
export type { StructuredLog };