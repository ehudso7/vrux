import logger from './logger';
import type { NextApiRequest, NextApiResponse } from 'next';

interface Metric {
  startTime: bigint;
}

interface PerformanceThresholds {
  apiResponse: number;
  aiGeneration: number;
  memoryUsage: number;
}

interface MemoryUsageData {
  heapUsed: string;
  heapTotal: string;
  external: string;
  rss: string;
  heapUsedPercent: string;
}

interface PerformanceStats {
  memory: MemoryUsageData;
  uptime: string;
  cpu: {
    user: string;
    system: string;
  };
  nodeVersion: string;
  platform: string;
  pid: number;
}

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Performance monitoring hooks
 */
class PerformanceMonitor {
  private metrics: Map<string, Metric>;
  private thresholds: PerformanceThresholds;

  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      apiResponse: 3000, // 3 seconds
      aiGeneration: 10000, // 10 seconds
      memoryUsage: 500 * 1024 * 1024, // 500MB
    };
  }

  /**
   * Start timing an operation
   */
  startTimer(operationName: string): bigint {
    const startTime = process.hrtime.bigint();
    this.metrics.set(operationName, { startTime });
    return startTime;
  }

  /**
   * End timing and log if exceeds threshold
   */
  endTimer(operationName: string, metadata: Record<string, unknown> = {}): number | undefined {
    const metric = this.metrics.get(operationName);
    if (!metric) return undefined;

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - metric.startTime) / 1e6; // Convert to milliseconds
    
    this.metrics.delete(operationName);

    // Log performance data
    const perfData = {
      operation: operationName,
      duration: `${duration.toFixed(2)}ms`,
      ...metadata
    };

    // Check if operation exceeded threshold
    const threshold = this.thresholds[operationName as keyof PerformanceThresholds];
    if (threshold && duration > threshold) {
      logger.warn(`Performance threshold exceeded: ${operationName}`, {
        ...perfData,
        threshold: `${threshold}ms`,
        exceeded: true
      });
    } else if (duration > 1000) { // Log all operations over 1 second
      logger.info('Performance metric', perfData);
    }

    return duration;
  }

  /**
   * Monitor memory usage
   */
  checkMemoryUsage(): MemoryUsageData {
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed;
    const heapTotal = usage.heapTotal;
    const external = usage.external;
    const rss = usage.rss;

    const memoryData: MemoryUsageData = {
      heapUsed: `${(heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(external / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(rss / 1024 / 1024).toFixed(2)}MB`,
      heapUsedPercent: `${((heapUsed / heapTotal) * 100).toFixed(2)}%`
    };

    if (heapUsed > this.thresholds.memoryUsage) {
      logger.warn('High memory usage detected', {
        ...memoryData,
        threshold: `${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      });
    }

    return memoryData;
  }

  /**
   * Create performance middleware
   */
  middleware() {
    return (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
      this.startTimer('apiResponse');
      
      // Monitor memory periodically
      const memoryCheckInterval = setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Check every 30 seconds

      try {
        await handler(req, res);
      } finally {
        clearInterval(memoryCheckInterval);
        this.endTimer('apiResponse', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode
        });
      }
    };
  }

  /**
   * Get current performance stats
   */
  getStats(): PerformanceStats {
    const memory = this.checkMemoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();

    return {
      memory,
      uptime: `${(uptime / 60).toFixed(2)} minutes`,
      cpu: {
        user: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
        system: `${(cpuUsage.system / 1000000).toFixed(2)}s`
      },
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    };
  }

  /**
   * Log performance stats periodically
   */
  startPeriodicLogging(intervalMs: number = 300000): void { // 5 minutes default
    setInterval(() => {
      const stats = this.getStats();
      logger.info('Periodic performance stats', { ...stats });
    }, intervalMs);
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

// Start periodic logging in production
if (process.env.NODE_ENV === 'production') {
  performanceMonitor.startPeriodicLogging();
}

export default performanceMonitor; 