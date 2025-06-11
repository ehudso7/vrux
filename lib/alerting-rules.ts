import { EventEmitter } from 'events';
import logger from './logger';
import performanceMonitor from './performance';
// import { monitoring } from './monitoring';
import monitoringBackend, { AlertData } from './monitoring-backend';
import telemetry from './telemetry';

// Alert rule types
type AlertCondition = 'above' | 'below' | 'equals' | 'contains' | 'rate_of_change' | 'anomaly';
type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
type AlertStatus = 'active' | 'resolved' | 'acknowledged' | 'suppressed';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: number; // How long condition must be true (ms)
  severity: AlertSeverity;
  tags: string[];
  enabled: boolean;
  actions: AlertAction[];
  cooldown: number; // Minimum time between alerts (ms)
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  window?: number; // Time window for aggregation (ms)
}

interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'log';
  config: Record<string, unknown>;
}

interface ActiveAlert {
  rule: AlertRule;
  triggeredAt: Date;
  lastNotified: Date;
  status: AlertStatus;
  currentValue: number;
  message: string;
}

// Predefined alert rules
const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Error rate exceeds 5%',
    metric: 'system.errors.rate',
    condition: 'above',
    threshold: 5,
    duration: 300000, // 5 minutes
    severity: 'critical',
    tags: ['reliability', 'errors'],
    enabled: true,
    actions: [
      { type: 'log', config: {} },
      { type: 'slack', config: { channel: '#alerts-critical' } }
    ],
    cooldown: 900000 // 15 minutes
  },
  {
    id: 'high-response-time',
    name: 'High Response Time',
    description: 'Average response time exceeds 3 seconds',
    metric: 'system.response.time.avg',
    condition: 'above',
    threshold: 3000,
    duration: 180000, // 3 minutes
    severity: 'warning',
    tags: ['performance', 'latency'],
    enabled: true,
    actions: [
      { type: 'log', config: {} },
      { type: 'slack', config: { channel: '#alerts-performance' } }
    ],
    cooldown: 600000 // 10 minutes
  },
  {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'Memory usage exceeds 85%',
    metric: 'system.memory.heap.percentage',
    condition: 'above',
    threshold: 85,
    duration: 600000, // 10 minutes
    severity: 'error',
    tags: ['infrastructure', 'memory'],
    enabled: true,
    actions: [
      { type: 'log', config: {} },
      { type: 'pagerduty', config: { serviceKey: 'memory-alerts' } }
    ],
    cooldown: 1800000 // 30 minutes
  },
  {
    id: 'ai-provider-failures',
    name: 'AI Provider Failures',
    description: 'AI provider error rate exceeds 10%',
    metric: 'ai.provider.error.rate',
    condition: 'above',
    threshold: 10,
    duration: 120000, // 2 minutes
    severity: 'error',
    tags: ['ai', 'providers'],
    enabled: true,
    actions: [
      { type: 'log', config: {} },
      { type: 'webhook', config: { url: '/api/alerts/ai-provider' } }
    ],
    cooldown: 300000 // 5 minutes
  },
  {
    id: 'rate-limit-exceeded',
    name: 'Rate Limit Exceeded',
    description: 'Rate limit violations exceed 50 per minute',
    metric: 'security.rate_limit.violations',
    condition: 'above',
    threshold: 50,
    duration: 60000, // 1 minute
    severity: 'warning',
    tags: ['security', 'rate-limit'],
    enabled: true,
    actions: [
      { type: 'log', config: {} },
      { type: 'email', config: { to: 'security@vrux.dev' } }
    ],
    cooldown: 300000,
    aggregation: 'count',
    window: 60000
  },
  {
    id: 'anomaly-detection',
    name: 'Traffic Anomaly',
    description: 'Unusual traffic patterns detected',
    metric: 'system.requests.rate',
    condition: 'anomaly',
    threshold: 3, // 3 standard deviations
    duration: 300000, // 5 minutes
    severity: 'info',
    tags: ['security', 'anomaly'],
    enabled: true,
    actions: [
      { type: 'log', config: {} }
    ],
    cooldown: 3600000 // 1 hour
  }
];

// Alert action handlers
class AlertActionHandlers {
  async handleEmail(action: AlertAction, alert: ActiveAlert): Promise<void> {
    const config = action.config as { to?: string; subject?: string };
    logger.info('Email alert triggered', {
      to: config.to || 'alerts@vrux.dev',
      subject: config.subject || alert.rule.name,
      message: alert.message
    });
    // In production, integrate with email service
  }

  async handleSlack(action: AlertAction, alert: ActiveAlert): Promise<void> {
    const config = action.config as { channel?: string; webhookUrl?: string };
    const color = {
      info: '#36a64f',
      warning: '#ff9800',
      error: '#f44336',
      critical: '#d32f2f'
    }[alert.rule.severity];

    const payload = {
      channel: config.channel || '#alerts',
      attachments: [{
        color,
        title: alert.rule.name,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.rule.severity, short: true },
          { title: 'Current Value', value: alert.currentValue.toString(), short: true },
          { title: 'Threshold', value: alert.rule.threshold.toString(), short: true },
          { title: 'Duration', value: `${alert.rule.duration / 1000}s`, short: true }
        ],
        footer: 'VRUX Monitoring',
        ts: Math.floor(alert.triggeredAt.getTime() / 1000)
      }]
    };

    if (config.webhookUrl) {
      try {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        logger.error('Failed to send Slack alert', error as Error);
      }
    }
  }

  async handleWebhook(action: AlertAction, alert: ActiveAlert): Promise<void> {
    const config = action.config as { url?: string; headers?: Record<string, string> };
    if (!config.url) return;

    try {
      await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {})
        },
        body: JSON.stringify({
          alert: {
            id: alert.rule.id,
            name: alert.rule.name,
            severity: alert.rule.severity,
            message: alert.message,
            value: alert.currentValue,
            threshold: alert.rule.threshold,
            triggeredAt: alert.triggeredAt,
            tags: alert.rule.tags
          }
        })
      });
    } catch (error) {
      logger.error('Failed to send webhook alert', error as Error);
    }
  }

  async handlePagerDuty(action: AlertAction, alert: ActiveAlert): Promise<void> {
    const config = action.config as { serviceKey?: string; routingKey?: string };
    const eventAction = alert.status === 'resolved' ? 'resolve' : 'trigger';

    const payload = {
      routing_key: config.routingKey || process.env.PAGERDUTY_ROUTING_KEY,
      event_action: eventAction,
      dedup_key: alert.rule.id,
      payload: {
        summary: alert.message,
        severity: alert.rule.severity,
        source: 'vrux-monitoring',
        custom_details: {
          metric: alert.rule.metric,
          value: alert.currentValue,
          threshold: alert.rule.threshold,
          tags: alert.rule.tags
        }
      }
    };

    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      logger.error('Failed to send PagerDuty alert', error as Error);
    }
  }

  async handleLog(action: AlertAction, alert: ActiveAlert): Promise<void> {
    logger.warn(`Alert triggered: ${alert.rule.name}`, {
      rule: alert.rule.id,
      severity: alert.rule.severity,
      message: alert.message,
      value: alert.currentValue,
      threshold: alert.rule.threshold,
      status: alert.status
    });
  }
}

// Main alerting engine
class AlertingEngine extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private metricHistory: Map<string, number[]> = new Map();
  private checkInterval = 30000; // 30 seconds
  private checkTimer?: NodeJS.Timeout;
  private actionHandlers = new AlertActionHandlers();

  constructor() {
    super();
    this.loadRules();
    this.startMonitoring();
  }

  private loadRules(): void {
    DEFAULT_RULES.forEach(rule => {
      if (rule.enabled) {
        this.rules.set(rule.id, rule);
      }
    });
    
    logger.info(`Loaded ${this.rules.size} alert rules`);
  }

  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      this.checkAllRules();
    }, this.checkInterval);

    // Initial check
    this.checkAllRules();
  }

  private async checkAllRules(): Promise<void> {
    const metrics = await this.collectMetrics();
    
    for (const [ruleId, rule] of this.rules) {
      try {
        await this.evaluateRule(rule, metrics);
      } catch (error) {
        logger.error(`Failed to evaluate rule ${ruleId}`, error as Error);
      }
    }
  }

  private async collectMetrics(): Promise<Record<string, number>> {
    const perfMetrics = performanceMonitor.getMetrics();
    // const telemetryMetrics = telemetry.getSystemAnalytics();
    
    // Collect various metrics
    const metrics: Record<string, number> = {
      'system.errors.rate': perfMetrics.requests.errorRate,
      'system.response.time.avg': perfMetrics.requests.avgResponseTime,
      'system.memory.heap.percentage': perfMetrics.memory.heapUsagePercent,
      'system.memory.heap.used': perfMetrics.memory.heapUsedMB,
      'system.requests.rate': perfMetrics.requests.requestsPerMinute,
      'system.cpu.usage': perfMetrics.cpu.totalSeconds,
      'ai.provider.error.rate': this.calculateAIErrorRate(perfMetrics),
      'security.rate_limit.violations': this.getRateLimitViolations(),
    };

    // Store in history for anomaly detection
    Object.entries(metrics).forEach(([key, value]) => {
      const history = this.metricHistory.get(key) || [];
      history.push(value);
      if (history.length > 100) history.shift(); // Keep last 100 values
      this.metricHistory.set(key, history);
    });

    return metrics;
  }

  private calculateAIErrorRate(perfMetrics: any): number {
    const aiStats = perfMetrics.operations?.aiGeneration;
    if (!aiStats) return 0;
    return aiStats.errorRate || 0;
  }

  private getRateLimitViolations(): number {
    // This would come from rate limiter metrics
    return 0; // Placeholder
  }

  private async evaluateRule(rule: AlertRule, metrics: Record<string, number>): Promise<void> {
    const metricValue = metrics[rule.metric];
    if (metricValue === undefined) return;

    const shouldAlert = this.checkCondition(rule, metricValue);
    const activeAlert = this.activeAlerts.get(rule.id);

    if (shouldAlert && !activeAlert) {
      // New alert
      await this.triggerAlert(rule, metricValue);
    } else if (!shouldAlert && activeAlert && activeAlert.status === 'active') {
      // Alert resolved
      await this.resolveAlert(rule);
    } else if (shouldAlert && activeAlert && activeAlert.status === 'active') {
      // Update existing alert
      await this.updateAlert(rule, metricValue);
    }
  }

  private checkCondition(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'above':
        return value > rule.threshold;
      case 'below':
        return value < rule.threshold;
      case 'equals':
        return value === rule.threshold;
      case 'anomaly':
        return this.detectAnomaly(rule.metric, value, rule.threshold);
      default:
        return false;
    }
  }

  private detectAnomaly(metric: string, value: number, stdDevThreshold: number): boolean {
    const history = this.metricHistory.get(metric) || [];
    if (history.length < 10) return false; // Need sufficient history

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    return Math.abs(value - mean) > stdDev * stdDevThreshold;
  }

  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const alert: ActiveAlert = {
      rule,
      triggeredAt: new Date(),
      lastNotified: new Date(),
      status: 'active',
      currentValue: value,
      message: `${rule.name}: ${rule.description}. Current value: ${value}, Threshold: ${rule.threshold}`
    };

    this.activeAlerts.set(rule.id, alert);

    // Send to monitoring backend
    const alertData: AlertData = {
      id: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: alert.message,
      metadata: {
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        condition: rule.condition
      },
      timestamp: alert.triggeredAt,
      source: 'alerting-engine'
    };

    await monitoringBackend.sendAlert(alertData);

    // Execute actions
    for (const action of rule.actions) {
      await this.executeAction(action, alert);
    }

    // Track in telemetry
    telemetry.track('system.error', {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      value,
      threshold: rule.threshold
    });

    this.emit('alert:triggered', alert);
  }

  private async resolveAlert(rule: AlertRule): Promise<void> {
    const alert = this.activeAlerts.get(rule.id);
    if (!alert) return;

    alert.status = 'resolved';
    
    const alertData: AlertData = {
      id: rule.id,
      severity: 'info',
      title: `${rule.name} - Resolved`,
      message: `Alert resolved: ${rule.name}`,
      metadata: {
        metric: rule.metric,
        resolvedAt: new Date()
      },
      timestamp: new Date(),
      source: 'alerting-engine'
    };

    await monitoringBackend.sendAlert(alertData);

    // Notify resolution
    for (const action of rule.actions) {
      await this.executeAction(action, alert);
    }

    this.activeAlerts.delete(rule.id);
    this.emit('alert:resolved', alert);
  }

  private async updateAlert(rule: AlertRule, value: number): Promise<void> {
    const alert = this.activeAlerts.get(rule.id);
    if (!alert) return;

    alert.currentValue = value;

    // Check cooldown
    const timeSinceLastNotification = Date.now() - alert.lastNotified.getTime();
    if (timeSinceLastNotification < rule.cooldown) return;

    // Re-notify if cooldown has passed
    alert.lastNotified = new Date();
    for (const action of rule.actions) {
      await this.executeAction(action, alert);
    }
  }

  private async executeAction(action: AlertAction, alert: ActiveAlert): Promise<void> {
    try {
      switch (action.type) {
        case 'email':
          await this.actionHandlers.handleEmail(action, alert);
          break;
        case 'slack':
          await this.actionHandlers.handleSlack(action, alert);
          break;
        case 'webhook':
          await this.actionHandlers.handleWebhook(action, alert);
          break;
        case 'pagerduty':
          await this.actionHandlers.handlePagerDuty(action, alert);
          break;
        case 'log':
          await this.actionHandlers.handleLog(action, alert);
          break;
      }
    } catch (error) {
      logger.error(`Failed to execute alert action ${action.type}`, error as Error);
    }
  }

  // Public API
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.activeAlerts.delete(ruleId);
  }

  getActiveAlerts(): ActiveAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  acknowledgeAlert(ruleId: string): void {
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  shutdown(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const alertingEngine = new AlertingEngine();

// Auto-shutdown on process exit
process.on('SIGTERM', () => alertingEngine.shutdown());
process.on('SIGINT', () => alertingEngine.shutdown());

export default alertingEngine;