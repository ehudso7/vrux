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
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimeHistory: number[] = [];
  private operationStats: Map<string, { count: number; totalTime: number; errors: number }> = new Map();
  private gcStats: { count: number; totalTime: number } = { count: 0, totalTime: 0 };

  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      apiResponse: 3000, // 3 seconds
      aiGeneration: 10000, // 10 seconds
      memoryUsage: 500 * 1024 * 1024, // 500MB
    };
    this.initializeGCTracking();
  }

  private initializeGCTracking(): void {
    // GC tracking would require --expose-gc flag
    // For now, we'll skip this advanced feature to avoid type conflicts
    // In production, you'd run Node with --expose-gc and properly type the global
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

    // Update operation statistics
    const stats = this.operationStats.get(operationName) || { count: 0, totalTime: 0, errors: 0 };
    stats.count++;
    stats.totalTime += duration;
    this.operationStats.set(operationName, stats);

    // Track response times for percentile calculations
    if (operationName === 'apiResponse') {
      this.requestCount++;
      this.responseTimeHistory.push(duration);
      // Keep only last 1000 entries for memory efficiency
      if (this.responseTimeHistory.length > 1000) {
        this.responseTimeHistory.shift();
      }
    }

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
   * Track errors
   */
  recordError(operationName: string): void {
    this.errorCount++;
    const stats = this.operationStats.get(operationName) || { count: 0, totalTime: 0, errors: 0 };
    stats.errors++;
    this.operationStats.set(operationName, stats);
  }

  /**
   * Calculate percentiles from response times
   */
  private calculatePercentile(data: number[], percentile: number): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): Record<string, any> {
    const now = Date.now();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate response time percentiles
    const p50 = this.calculatePercentile(this.responseTimeHistory, 50);
    const p75 = this.calculatePercentile(this.responseTimeHistory, 75);
    const p95 = this.calculatePercentile(this.responseTimeHistory, 95);
    const p99 = this.calculatePercentile(this.responseTimeHistory, 99);

    // Calculate average response time
    const avgResponseTime = this.responseTimeHistory.length > 0
      ? this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length
      : 0;

    // Calculate operation-specific metrics
    const operationMetrics: Record<string, any> = {};
    this.operationStats.forEach((stats, operation) => {
      operationMetrics[operation] = {
        count: stats.count,
        avgDuration: stats.count > 0 ? stats.totalTime / stats.count : 0,
        totalTime: stats.totalTime,
        errors: stats.errors,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0
      };
    });

    return {
      system: {
        uptime: uptime,
        uptimeHuman: `${(uptime / 3600).toFixed(2)} hours`,
        timestamp: now,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development'
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
        requestsPerMinute: uptime > 60 ? (this.requestCount / (uptime / 60)) : this.requestCount,
        avgResponseTime: avgResponseTime,
        percentiles: {
          p50: p50,
          p75: p75,
          p95: p95,
          p99: p99
        }
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        heapUsedMB: memoryUsage.heapUsed / 1024 / 1024,
        heapTotalMB: memoryUsage.heapTotal / 1024 / 1024,
        rssMB: memoryUsage.rss / 1024 / 1024,
        heapUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        userSeconds: cpuUsage.user / 1000000,
        systemSeconds: cpuUsage.system / 1000000,
        totalSeconds: (cpuUsage.user + cpuUsage.system) / 1000000
      },
      gc: {
        count: this.gcStats.count,
        totalTime: this.gcStats.totalTime,
        avgTime: this.gcStats.count > 0 ? this.gcStats.totalTime / this.gcStats.count : 0
      },
      operations: operationMetrics,
      activeOperations: Array.from(this.metrics.keys())
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