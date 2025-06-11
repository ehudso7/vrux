import { EventEmitter } from 'events';
import logger from './logger';
import telemetry from './telemetry';
import performanceMonitor from './performance';

// Monitoring provider interfaces
interface MonitoringProvider {
  name: string;
  sendMetrics(metrics: MetricData[]): Promise<void>;
  sendLogs(logs: LogData[]): Promise<void>;
  sendTraces(traces: TraceData[]): Promise<void>;
  sendAlerts(alerts: AlertData[]): Promise<void>;
  isHealthy(): Promise<boolean>;
}

interface MetricData {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
}

interface LogData {
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  traceId?: string;
  spanId?: string;
}

interface TraceData {
  traceId: string;
  spans: SpanData[];
  service: string;
  timestamp: Date;
}

interface SpanData {
  spanId: string;
  parentId?: string;
  name: string;
  startTime: number;
  duration: number;
  tags: Record<string, unknown>;
  status: 'ok' | 'error';
}

interface AlertData {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

// Datadog Provider
class DatadogProvider implements MonitoringProvider {
  name = 'Datadog';
  private apiKey: string;
  private apiUrl = 'https://api.datadoghq.com/api/v1';
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.DATADOG_API_KEY || '';
    this.enabled = !!this.apiKey && process.env.NODE_ENV === 'production';
  }

  async sendMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const series = metrics.map(metric => ({
        metric: `vrux.${metric.name}`,
        points: [[Math.floor(metric.timestamp.getTime() / 1000), metric.value]],
        type: metric.type,
        tags: Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`)
      }));

      await fetch(`${this.apiUrl}/series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.apiKey
        },
        body: JSON.stringify({ series })
      });
    } catch (error) {
      logger.error('Failed to send metrics to Datadog', error as Error);
    }
  }

  async sendLogs(logs: LogData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const ddLogs = logs.map(log => ({
        message: log.message,
        ddsource: 'vrux',
        ddtags: `env:${process.env.NODE_ENV},version:${process.env.npm_package_version}`,
        service: 'vrux-api',
        ...log.metadata,
        level: log.level,
        timestamp: log.timestamp.toISOString()
      }));

      await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.apiKey
        },
        body: JSON.stringify(ddLogs)
      });
    } catch (error) {
      logger.error('Failed to send logs to Datadog', error as Error);
    }
  }

  async sendTraces(_traces: TraceData[]): Promise<void> {
    // Datadog APM integration would be configured separately
    // This is a placeholder for trace forwarding
  }

  async sendAlerts(alerts: AlertData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      for (const alert of alerts) {
        await fetch(`${this.apiUrl}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': this.apiKey
          },
          body: JSON.stringify({
            title: alert.title,
            text: alert.message,
            priority: alert.severity === 'critical' ? 'high' : 'normal',
            tags: [`severity:${alert.severity}`, `source:${alert.source}`],
            alert_type: alert.severity
          })
        });
      }
    } catch (error) {
      logger.error('Failed to send alerts to Datadog', error as Error);
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.enabled) return false;
    
    try {
      const response = await fetch(`${this.apiUrl}/validate`, {
        headers: { 'DD-API-KEY': this.apiKey }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// New Relic Provider
class NewRelicProvider implements MonitoringProvider {
  name = 'NewRelic';
  private apiKey: string;
  private accountId: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.NEW_RELIC_API_KEY || '';
    this.accountId = process.env.NEW_RELIC_ACCOUNT_ID || '';
    this.enabled = !!this.apiKey && !!this.accountId && process.env.NODE_ENV === 'production';
  }

  async sendMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const nrMetrics = metrics.map(metric => ({
        name: `vrux.${metric.name}`,
        type: metric.type,
        value: metric.value,
        timestamp: metric.timestamp.getTime(),
        attributes: metric.tags
      }));

      await fetch(`https://metric-api.newrelic.com/metric/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey
        },
        body: JSON.stringify([{
          metrics: nrMetrics,
          common: {
            attributes: {
              'service.name': 'vrux',
              'environment': process.env.NODE_ENV
            }
          }
        }])
      });
    } catch (error) {
      logger.error('Failed to send metrics to New Relic', error as Error);
    }
  }

  async sendLogs(logs: LogData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const nrLogs = logs.map(log => ({
        timestamp: log.timestamp.getTime(),
        message: log.message,
        level: log.level,
        attributes: {
          ...log.metadata,
          'service.name': 'vrux',
          'trace.id': log.traceId,
          'span.id': log.spanId
        }
      }));

      await fetch(`https://log-api.newrelic.com/log/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey
        },
        body: JSON.stringify([{ logs: nrLogs }])
      });
    } catch (error) {
      logger.error('Failed to send logs to New Relic', error as Error);
    }
  }

  async sendTraces(_traces: TraceData[]): Promise<void> {
    // New Relic APM would handle traces through their agent
  }

  async sendAlerts(_alerts: AlertData[]): Promise<void> {
    // New Relic Alerts would be configured through their UI
  }

  async isHealthy(): Promise<boolean> {
    return this.enabled;
  }
}

// Custom Backend Provider
class CustomBackendProvider implements MonitoringProvider {
  name = 'CustomBackend';
  private apiUrl: string;
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.apiUrl = process.env.CUSTOM_MONITORING_URL || '';
    this.apiKey = process.env.CUSTOM_MONITORING_API_KEY || '';
    this.enabled = !!this.apiUrl && !!this.apiKey;
  }

  async sendMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.apiUrl}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          source: 'vrux',
          environment: process.env.NODE_ENV,
          metrics
        })
      });
    } catch (error) {
      logger.error('Failed to send metrics to custom backend', error as Error);
    }
  }

  async sendLogs(logs: LogData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.apiUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          source: 'vrux',
          environment: process.env.NODE_ENV,
          logs
        })
      });
    } catch (error) {
      logger.error('Failed to send logs to custom backend', error as Error);
    }
  }

  async sendTraces(traces: TraceData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.apiUrl}/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          source: 'vrux',
          environment: process.env.NODE_ENV,
          traces
        })
      });
    } catch (error) {
      logger.error('Failed to send traces to custom backend', error as Error);
    }
  }

  async sendAlerts(alerts: AlertData[]): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.apiUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          source: 'vrux',
          environment: process.env.NODE_ENV,
          alerts
        })
      });
    } catch (error) {
      logger.error('Failed to send alerts to custom backend', error as Error);
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Main Monitoring Backend Service
class MonitoringBackend extends EventEmitter {
  private providers: MonitoringProvider[] = [];
  private metricsBuffer: MetricData[] = [];
  private logsBuffer: LogData[] = [];
  private tracesBuffer: TraceData[] = [];
  private batchInterval = 10000; // 10 seconds
  private batchTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeProviders();
    this.startBatchProcessing();
    this.setupTelemetryIntegration();
  }

  private initializeProviders(): void {
    // Initialize all configured providers
    this.providers.push(new DatadogProvider());
    this.providers.push(new NewRelicProvider());
    this.providers.push(new CustomBackendProvider());

    // Log which providers are enabled
    this.providers.forEach(async provider => {
      const healthy = await provider.isHealthy();
      if (healthy) {
        logger.info(`Monitoring provider ${provider.name} is enabled and healthy`);
      }
    });
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.batchInterval);
  }

  private setupTelemetryIntegration(): void {
    // Listen to telemetry events and convert to metrics
    telemetry.on('event', (event) => {
      if (event.metrics) {
        this.recordMetric({
          name: `telemetry.${event.type}`,
          value: event.metrics.duration || 1,
          type: 'histogram',
          tags: {
            event_type: event.type,
            user_id: event.userId || 'anonymous'
          },
          timestamp: event.timestamp
        });
      }
    });

    // Periodic system metrics collection
    setInterval(() => {
      const perfMetrics = performanceMonitor.getMetrics();
      
      // System metrics
      this.recordMetric({
        name: 'system.memory.heap.used',
        value: perfMetrics.memory.heapUsedMB,
        type: 'gauge',
        tags: { unit: 'megabytes' },
        timestamp: new Date()
      });

      this.recordMetric({
        name: 'system.requests.rate',
        value: perfMetrics.requests.requestsPerMinute,
        type: 'gauge',
        tags: { unit: 'requests_per_minute' },
        timestamp: new Date()
      });

      this.recordMetric({
        name: 'system.response.time.avg',
        value: perfMetrics.requests.avgResponseTime,
        type: 'gauge',
        tags: { unit: 'milliseconds' },
        timestamp: new Date()
      });

      this.recordMetric({
        name: 'system.errors.rate',
        value: perfMetrics.requests.errorRate,
        type: 'gauge',
        tags: { unit: 'percentage' },
        timestamp: new Date()
      });
    }, 60000); // Every minute
  }

  recordMetric(metric: MetricData): void {
    this.metricsBuffer.push(metric);
    
    // Auto-flush if buffer is getting large
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics();
    }
  }

  recordLog(log: LogData): void {
    this.logsBuffer.push(log);
    
    if (this.logsBuffer.length > 50) {
      this.flushLogs();
    }
  }

  recordTrace(trace: TraceData): void {
    this.tracesBuffer.push(trace);
    
    if (this.tracesBuffer.length > 20) {
      this.flushTraces();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    await Promise.all(
      this.providers.map(provider => 
        provider.sendMetrics(metrics).catch(err => 
          logger.error(`Failed to send metrics to ${provider.name}`, err as Error)
        )
      )
    );
  }

  private async flushLogs(): Promise<void> {
    if (this.logsBuffer.length === 0) return;

    const logs = [...this.logsBuffer];
    this.logsBuffer = [];

    await Promise.all(
      this.providers.map(provider => 
        provider.sendLogs(logs).catch(err => 
          logger.error(`Failed to send logs to ${provider.name}`, err as Error)
        )
      )
    );
  }

  private async flushTraces(): Promise<void> {
    if (this.tracesBuffer.length === 0) return;

    const traces = [...this.tracesBuffer];
    this.tracesBuffer = [];

    await Promise.all(
      this.providers.map(provider => 
        provider.sendTraces(traces).catch(err => 
          logger.error(`Failed to send traces to ${provider.name}`, err as Error)
        )
      )
    );
  }

  async flush(): Promise<void> {
    await Promise.all([
      this.flushMetrics(),
      this.flushLogs(),
      this.flushTraces()
    ]);
  }

  // Alert management
  async sendAlert(alert: AlertData): Promise<void> {
    await Promise.all(
      this.providers.map(provider => 
        provider.sendAlerts([alert]).catch(err => 
          logger.error(`Failed to send alert to ${provider.name}`, err as Error)
        )
      )
    );
  }

  shutdown(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flush();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const monitoringBackend = new MonitoringBackend();

// Auto-shutdown on process exit
process.on('SIGTERM', () => monitoringBackend.shutdown());
process.on('SIGINT', () => monitoringBackend.shutdown());

export default monitoringBackend;
export type { MetricData, LogData, TraceData, SpanData, AlertData };