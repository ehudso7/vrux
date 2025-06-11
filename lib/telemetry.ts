import { EventEmitter } from 'events';
import crypto from 'crypto';
import logger from './logger';

// Advanced telemetry event types
export type TelemetryEventType = 
  | 'component.generated'
  | 'component.error'
  | 'api.request'
  | 'api.response'
  | 'api.templates.request'
  | 'api.templates.error'
  | 'ai.inference.start'
  | 'ai.inference.complete'
  | 'ai.inference.error'
  | 'ai.provider.switch'
  | 'cache.hit'
  | 'cache.miss'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.error'
  | 'checkout.created'
  | 'checkout.error'
  | 'template.created'
  | 'template.used'
  | 'template.liked'
  | 'template.unliked'
  | 'performance.threshold.exceeded'
  | 'rate.limit.exceeded'
  | 'security.violation'
  | 'system.error'
  | 'deployment.start'
  | 'deployment.complete'
  | 'deployment.error';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  data: Record<string, unknown>;
  context: {
    userAgent?: string;
    ip?: string;
    country?: string;
    referrer?: string;
    environment: string;
    version: string;
  };
  metrics?: {
    duration?: number;
    tokens?: number;
    cost?: number;
    quality?: number;
  };
  tags?: string[];
}

export interface TelemetrySpan {
  id: string;
  parentId?: string;
  traceId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'active' | 'completed' | 'error';
  attributes: Record<string, unknown>;
  events: TelemetryEvent[];
  children: TelemetrySpan[];
}

// Advanced distributed tracing
class DistributedTracer {
  private traces: Map<string, TelemetrySpan> = new Map();
  private activeSpans: Map<string, TelemetrySpan> = new Map();

  createTrace(name: string, parentTraceId?: string): string {
    const traceId = parentTraceId || crypto.randomUUID();
    const span: TelemetrySpan = {
      id: crypto.randomUUID(),
      traceId,
      name,
      startTime: new Date(),
      status: 'active',
      attributes: {},
      events: [],
      children: []
    };

    this.traces.set(traceId, span);
    this.activeSpans.set(span.id, span);
    return traceId;
  }

  startSpan(name: string, traceId: string, parentId?: string): string {
    const span: TelemetrySpan = {
      id: crypto.randomUUID(),
      parentId,
      traceId,
      name,
      startTime: new Date(),
      status: 'active',
      attributes: {},
      events: [],
      children: []
    };

    this.activeSpans.set(span.id, span);

    // Add to parent if exists
    if (parentId) {
      const parent = this.activeSpans.get(parentId);
      if (parent) {
        parent.children.push(span);
      }
    }

    return span.id;
  }

  endSpan(spanId: string, status: 'completed' | 'error' = 'completed'): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    this.activeSpans.delete(spanId);
  }

  addSpanAttribute(spanId: string, key: string, value: unknown): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.attributes[key] = value;
    }
  }

  addSpanEvent(spanId: string, event: TelemetryEvent): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push(event);
    }
  }

  getTrace(traceId: string): TelemetrySpan | undefined {
    return this.traces.get(traceId);
  }

  exportTraces(): TelemetrySpan[] {
    return Array.from(this.traces.values());
  }
}

// Main telemetry service
class TelemetryService extends EventEmitter {
  private events: TelemetryEvent[] = [];
  private tracer: DistributedTracer;
  private batchSize = 100;
  private batchInterval = 5000; // 5 seconds
  private batchTimer?: NodeJS.Timeout;
  private sessionStore: Map<string, { userId?: string; startTime: Date; events: number }> = new Map();

  constructor() {
    super();
    this.tracer = new DistributedTracer();
    this.startBatchProcessing();
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.events.length === 0) return;

    const batch = this.events.splice(0, this.batchSize);
    
    try {
      // Process events - in production, send to telemetry backend
      this.emit('batch', batch);
      
      // Log summary
      const summary = this.summarizeBatch(batch);
      logger.info('Telemetry batch processed', { summary });
    } catch (error) {
      logger.error('Failed to process telemetry batch', error as Error, { 
        batchSize: batch.length 
      });
    }
  }

  private summarizeBatch(batch: TelemetryEvent[]): Record<string, unknown> {
    const typeCount: Record<string, number> = {};
    let totalDuration = 0;
    let errorCount = 0;

    batch.forEach(event => {
      typeCount[event.type] = (typeCount[event.type] || 0) + 1;
      if (event.metrics?.duration) {
        totalDuration += event.metrics.duration;
      }
      if (event.type.includes('error')) {
        errorCount++;
      }
    });

    return {
      eventCount: batch.length,
      typeBreakdown: typeCount,
      avgDuration: batch.length > 0 ? totalDuration / batch.length : 0,
      errorCount,
      errorRate: batch.length > 0 ? (errorCount / batch.length) * 100 : 0
    };
  }

  track(
    type: TelemetryEventType,
    data: Record<string, unknown>,
    options: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      metrics?: TelemetryEvent['metrics'];
      tags?: string[];
    } = {}
  ): void {
    const event: TelemetryEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      data,
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },
      ...options
    };

    this.events.push(event);
    this.emit('event', event);

    // Update session tracking
    if (options.sessionId) {
      const session = this.sessionStore.get(options.sessionId) || { 
        startTime: new Date(), 
        events: 0 
      };
      session.events++;
      if (options.userId) session.userId = options.userId;
      this.sessionStore.set(options.sessionId, session);
    }

    // Process immediately if batch is full
    if (this.events.length >= this.batchSize) {
      this.processBatch();
    }
  }

  // Distributed tracing methods
  createTrace(name: string): string {
    return this.tracer.createTrace(name);
  }

  startSpan(name: string, traceId: string, parentId?: string): string {
    return this.tracer.startSpan(name, traceId, parentId);
  }

  endSpan(spanId: string, status?: 'completed' | 'error'): void {
    this.tracer.endSpan(spanId, status);
  }

  addSpanAttribute(spanId: string, key: string, value: unknown): void {
    this.tracer.addSpanAttribute(spanId, key, value);
  }

  // Analytics methods
  getSessionAnalytics(sessionId: string): Record<string, unknown> | undefined {
    const session = this.sessionStore.get(sessionId);
    if (!session) return undefined;

    const duration = new Date().getTime() - session.startTime.getTime();
    return {
      sessionId,
      userId: session.userId,
      duration: duration,
      durationMinutes: duration / 60000,
      eventCount: session.events,
      eventsPerMinute: session.events / (duration / 60000)
    };
  }

  getSystemAnalytics(): Record<string, unknown> {
    const typeCount: Record<string, number> = {};
    let totalEvents = 0;
    let errorEvents = 0;
    let totalDuration = 0;

    this.events.forEach(event => {
      typeCount[event.type] = (typeCount[event.type] || 0) + 1;
      totalEvents++;
      if (event.type.includes('error')) errorEvents++;
      if (event.metrics?.duration) totalDuration += event.metrics.duration;
    });

    return {
      totalEvents,
      errorEvents,
      errorRate: totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0,
      avgDuration: totalEvents > 0 ? totalDuration / totalEvents : 0,
      eventTypes: typeCount,
      activeSessions: this.sessionStore.size,
      queuedEvents: this.events.length,
      traces: this.tracer.exportTraces().length
    };
  }

  // Cleanup
  shutdown(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.processBatch(); // Process remaining events
    this.removeAllListeners();
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();

// Auto-shutdown on process exit
process.on('SIGTERM', () => telemetry.shutdown());
process.on('SIGINT', () => telemetry.shutdown());

export default telemetry;