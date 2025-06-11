import monitoringBackend from './monitoring-backend';
import alertingEngine from './alerting-rules';
import logAggregation from './log-aggregation';
import distributedTracer from './distributed-tracing';
import telemetry from './telemetry';
import performanceMonitor from './performance';
import logger from './logger';

// Initialize all monitoring systems
export function initializeMonitoring(): void {
  logger.info('Initializing monitoring systems...');

  // Set up integrations between systems
  setupTelemetryIntegration();
  setupTracingIntegration();
  setupAlertingIntegration();
  setupLogIntegration();

  // Start health checks
  startHealthChecks();

  logger.info('Monitoring systems initialized successfully');
}

// Integrate telemetry with other systems
function setupTelemetryIntegration(): void {
  // Forward telemetry events to monitoring backend
  telemetry.on('batch', async (events) => {
    for (const event of events) {
      monitoringBackend.recordMetric({
        name: `telemetry.event.${event.type}`,
        value: 1,
        type: 'counter',
        tags: {
          event_type: event.type,
          user_id: event.userId || 'anonymous'
        },
        timestamp: event.timestamp
      });
    }
  });

  // Track performance metrics
  setInterval(() => {
    const perfMetrics = performanceMonitor.getMetrics();
    const telemetryAnalytics = telemetry.getSystemAnalytics();

    // Record combined metrics
    monitoringBackend.recordMetric({
      name: 'system.combined.health_score',
      value: calculateHealthScore(perfMetrics, telemetryAnalytics),
      type: 'gauge',
      tags: { source: 'combined' },
      timestamp: new Date()
    });
  }, 30000); // Every 30 seconds
}

// Integrate distributed tracing
function setupTracingIntegration(): void {
  // Automatically trace all API routes
  if (process.env.NODE_ENV === 'production') {
    logger.info('Distributed tracing enabled for production');
  }

  // Trace AI operations
  const originalGenerateComponent = (global as any).__ai_generate_component__;
  if (originalGenerateComponent) {
    (global as any).__ai_generate_component__ = distributedTracer.wrap(
      'ai.generate_component',
      originalGenerateComponent,
      { attributes: { 'ai.operation': 'component_generation' } }
    );
  }
}

// Integrate alerting with monitoring
function setupAlertingIntegration(): void {
  // Forward alerts to monitoring backend
  alertingEngine.on('alert:triggered', (alert) => {
    monitoringBackend.sendAlert({
      id: alert.rule.id,
      severity: alert.rule.severity,
      title: alert.rule.name,
      message: alert.message,
      metadata: {
        rule: alert.rule.id,
        value: alert.currentValue,
        threshold: alert.rule.threshold
      },
      timestamp: alert.triggeredAt,
      source: 'alerting-engine'
    });
  });

  // Track alert metrics
  alertingEngine.on('alert:resolved', (alert) => {
    const duration = Date.now() - alert.triggeredAt.getTime();
    monitoringBackend.recordMetric({
      name: 'alerts.resolution_time',
      value: duration,
      type: 'histogram',
      tags: {
        rule: alert.rule.id,
        severity: alert.rule.severity
      },
      timestamp: new Date()
    });
  });
}

// Integrate log aggregation
function setupLogIntegration(): void {
  // Check for pending logs periodically
  setInterval(() => {
    const pendingLogs = (global as any).__pending_logs__;
    if (pendingLogs && Array.isArray(pendingLogs)) {
      pendingLogs.forEach(log => {
        monitoringBackend.recordLog({
          level: log.level,
          message: log.message,
          metadata: log.metadata,
          timestamp: new Date(log.timestamp),
          traceId: log.traceId,
          spanId: log.spanId
        });
      });
      // Clear the pending logs
      (global as any).__pending_logs__ = null;
    }
  }, 1000); // Check every second
}

// Start periodic health checks
function startHealthChecks(): void {
  setInterval(async () => {
    const health = await performSystemHealthCheck();
    
    monitoringBackend.recordMetric({
      name: 'system.health.status',
      value: health.score,
      type: 'gauge',
      tags: {
        status: health.status,
        checks_passed: health.checksPassedCount.toString(),
        checks_total: health.checksTotalCount.toString()
      },
      timestamp: new Date()
    });

    // Trigger alerts if health degrades
    if (health.status === 'critical') {
      alertingEngine.emit('health:critical', health);
    }
  }, 60000); // Every minute
}

// Perform comprehensive health check
async function performSystemHealthCheck(): Promise<{
  status: string;
  score: number;
  checksPassedCount: number;
  checksTotalCount: number;
  details: Record<string, any>;
}> {
  const checks: Record<string, boolean> = {};
  let score = 100;

  // Check memory usage
  const perfMetrics = performanceMonitor.getMetrics();
  checks.memory = perfMetrics.memory.heapUsagePercent < 80;
  if (!checks.memory) score -= 20;

  // Check error rate
  checks.errorRate = perfMetrics.requests.errorRate < 5;
  if (!checks.errorRate) score -= 30;

  // Check response time
  checks.responseTime = perfMetrics.requests.avgResponseTime < 2000;
  if (!checks.responseTime) score -= 20;

  // Check active alerts
  const activeAlerts = alertingEngine.getActiveAlerts();
  checks.alerts = activeAlerts.filter(a => a.rule.severity === 'critical').length === 0;
  if (!checks.alerts) score -= 30;

  const checksPassedCount = Object.values(checks).filter(v => v).length;
  const checksTotalCount = Object.keys(checks).length;

  let status = 'healthy';
  if (score < 50) status = 'critical';
  else if (score < 70) status = 'degraded';
  else if (score < 90) status = 'warning';

  return {
    status,
    score,
    checksPassedCount,
    checksTotalCount,
    details: checks
  };
}

// Calculate combined health score
function calculateHealthScore(perfMetrics: any, telemetryAnalytics: any): number {
  let score = 100;

  // Performance factors
  if (perfMetrics.requests.errorRate > 5) score -= 20;
  if (perfMetrics.requests.avgResponseTime > 2000) score -= 15;
  if (perfMetrics.memory.heapUsagePercent > 80) score -= 15;

  // Telemetry factors
  const telemetryErrorRate = (telemetryAnalytics as any).errorRate || 0;
  if (telemetryErrorRate > 10) score -= 20;

  return Math.max(0, score);
}

// Shutdown all monitoring systems gracefully
export function shutdownMonitoring(): void {
  logger.info('Shutting down monitoring systems...');

  monitoringBackend.shutdown();
  alertingEngine.shutdown();
  logAggregation.shutdown();
  distributedTracer.shutdown();
  telemetry.shutdown();

  logger.info('Monitoring systems shut down successfully');
}

// Auto-initialize on import
if (process.env.NODE_ENV !== 'test') {
  initializeMonitoring();
}

// Graceful shutdown
process.on('SIGTERM', shutdownMonitoring);
process.on('SIGINT', shutdownMonitoring);

const monitoringIntegration = {
  initializeMonitoring,
  shutdownMonitoring
};

export default monitoringIntegration;