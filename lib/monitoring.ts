import logger from './logger';

// Performance metrics collector
export interface Metric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface ErrorMetric {
  error: Error;
  context: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserInteraction {
  action: string;
  component: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private metrics: Metric[] = [];
  private errors: ErrorMetric[] = [];
  private interactions: UserInteraction[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private errorHandlers = new Set<(error: ErrorMetric) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientMonitoring();
    } else {
      this.initializeServerMonitoring();
    }
  }

  // Initialize client-side monitoring
  private initializeClientMonitoring() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            this.recordMetric({
              name: `client.${entry.name}`,
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
            });
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        // Some browsers don't support all entry types
      }
    }

    // Error monitoring
    window.addEventListener('error', (event) => {
      this.recordError({
        error: new Error(event.message),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        severity: 'high',
        timestamp: new Date(),
      });
    });

    // Unhandled promise rejection monitoring
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        error: new Error(`Unhandled Promise Rejection: ${event.reason}`),
        context: {
          reason: event.reason,
          promise: event.promise,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        severity: 'high',
        timestamp: new Date(),
      });
    });

    // Performance monitoring
    this.measureWebVitals();
  }

  // Initialize server-side monitoring
  private initializeServerMonitoring() {
    // Process monitoring
    if (process) {
      // Memory usage
      setInterval(() => {
        const memUsage = process.memoryUsage();
        this.recordMetric({
          name: 'server.memory.heapUsed',
          value: memUsage.heapUsed / 1024 / 1024,
          unit: 'MB',
          timestamp: new Date(),
        });
        this.recordMetric({
          name: 'server.memory.heapTotal',
          value: memUsage.heapTotal / 1024 / 1024,
          unit: 'MB',
          timestamp: new Date(),
        });
      }, 30000); // Every 30 seconds

      // CPU usage
      let lastCpuUsage = process.cpuUsage();
      setInterval(() => {
        const currentCpuUsage = process.cpuUsage(lastCpuUsage);
        const totalUsage = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to seconds
        
        this.recordMetric({
          name: 'server.cpu.usage',
          value: totalUsage,
          unit: 'seconds',
          timestamp: new Date(),
        });
        
        lastCpuUsage = process.cpuUsage();
      }, 30000);
    }
  }

  // Measure Web Vitals (client-side)
  private measureWebVitals() {
    if (typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            name: 'webvitals.fcp',
            value: entry.startTime,
            unit: 'ms',
            timestamp: new Date(),
          });
        }
      }
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Not supported
    }

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric({
        name: 'webvitals.lcp',
        value: lastEntry.startTime,
        unit: 'ms',
        timestamp: new Date(),
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Not supported
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          const delay = entry.processingStart - entry.startTime;
          this.recordMetric({
            name: 'webvitals.fid',
            value: delay,
            unit: 'ms',
            timestamp: new Date(),
          });
        }
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Not supported
    }
  }

  // Record a metric
  recordMetric(metric: Metric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log important metrics
    if (metric.value > 1000 && metric.unit === 'ms') {
      logger.warn('High latency detected', { metric });
    }
  }

  // Record an error
  recordError(errorMetric: ErrorMetric) {
    this.errors.push(errorMetric);
    
    // Keep only last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-50);
    }

    // Log the error
    logger.error(errorMetric.error.message, errorMetric.error, errorMetric.context);

    // Notify error handlers
    this.errorHandlers.forEach(handler => handler(errorMetric));

    // Send critical errors to monitoring service
    if (errorMetric.severity === 'critical') {
      this.sendToMonitoringService('error', errorMetric);
    }
  }

  // Record user interaction
  recordInteraction(interaction: UserInteraction) {
    this.interactions.push(interaction);
    
    // Keep only last 500 interactions in memory
    if (this.interactions.length > 500) {
      this.interactions = this.interactions.slice(-250);
    }
  }

  // Start timing an operation
  startTimer(name: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.recordMetric({
        name: `timer.${name}`,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
      });
      
      return duration;
    };
  }

  // Get metrics summary
  getMetricsSummary(timeRange: number = 3600000): Record<string, {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  }> {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < timeRange
    );

    const summary: Record<string, {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    }> = {};
    
    // Group metrics by name
    const grouped = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics
    for (const [name, values] of Object.entries(grouped)) {
      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return summary;
  }

  // Get error summary
  getErrorSummary(timeRange: number = 3600000): {
    total: number;
    bySeverity: Record<string, number>;
    byMessage: Record<string, number>;
    recent: ErrorMetric[];
  } {
    const now = Date.now();
    const recentErrors = this.errors.filter(
      e => now - e.timestamp.getTime() < timeRange
    );

    const summary = {
      total: recentErrors.length,
      bySeverity: {} as Record<string, number>,
      byMessage: {} as Record<string, number>,
      recent: recentErrors.slice(-10),
    };

    recentErrors.forEach(error => {
      // By severity
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
      
      // By message
      const message = error.error.message.substring(0, 50);
      summary.byMessage[message] = (summary.byMessage[message] || 0) + 1;
    });

    return summary;
  }

  // Get interaction summary
  getInteractionSummary(timeRange: number = 3600000): {
    total: number;
    byAction: Record<string, number>;
    byComponent: Record<string, number>;
    uniqueUsers: number;
  } {
    const now = Date.now();
    const recentInteractions = this.interactions.filter(
      i => now - i.timestamp.getTime() < timeRange
    );

    const summary = {
      total: recentInteractions.length,
      byAction: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      uniqueUsers: new Set(recentInteractions.map(i => i.userId).filter(Boolean)).size,
    };

    recentInteractions.forEach(interaction => {
      summary.byAction[interaction.action] = (summary.byAction[interaction.action] || 0) + 1;
      summary.byComponent[interaction.component] = (summary.byComponent[interaction.component] || 0) + 1;
    });

    return summary;
  }

  // Send data to external monitoring service
  private async sendToMonitoringService(type: string, data: unknown) {
    // In production, this would send to services like Sentry, DataDog, etc.
    try {
      if (process.env.MONITORING_ENDPOINT) {
        await fetch(process.env.MONITORING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          }),
        });
      }
    } catch (error) {
      logger.error('Failed to send to monitoring service', error as Error);
    }
  }

  // Add error handler
  onError(handler: (error: ErrorMetric) => void) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // Get current health status
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    }>;
    errors: {
      total: number;
      bySeverity: Record<string, number>;
      byMessage: Record<string, number>;
      recent: ErrorMetric[];
    };
  } {
    const metricsSummary = this.getMetricsSummary(300000); // Last 5 minutes
    const errorSummary = this.getErrorSummary(300000);
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check error rate
    if (errorSummary.total > 50) {
      status = 'unhealthy';
    } else if (errorSummary.total > 10) {
      status = 'degraded';
    }
    
    // Check performance metrics
    const responseTime = metricsSummary['timer.aiGeneration']?.p95;
    if (responseTime && responseTime > 5000) {
      status = status === 'healthy' ? 'degraded' : status;
    }
    
    return {
      status,
      metrics: metricsSummary,
      errors: errorSummary,
    };
  }

  // Cleanup
  cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.metrics = [];
    this.errors = [];
    this.interactions = [];
    this.errorHandlers.clear();
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// React hook for monitoring
export function useMonitoring() {
  const recordInteraction = (action: string, component: string, metadata?: Record<string, unknown>) => {
    monitoring.recordInteraction({
      action,
      component,
      timestamp: new Date(),
      metadata,
    });
  };

  const trackTiming = (name: string) => {
    return monitoring.startTimer(name);
  };

  return {
    recordInteraction,
    trackTiming,
    recordError: (error: Error, context?: Record<string, unknown>) => {
      monitoring.recordError({
        error,
        context: context || {},
        severity: 'medium',
        timestamp: new Date(),
      });
    },
  };
}