import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';
import crypto from 'crypto';
import logger from './logger';
import monitoringBackend, { TraceData, SpanData } from './monitoring-backend';

// OpenTelemetry-compatible trace context
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
  baggage?: Record<string, string>;
}

// Span attributes following OpenTelemetry semantic conventions
interface SpanAttributes {
  'service.name': string;
  'service.version': string;
  'deployment.environment': string;
  'http.method'?: string;
  'http.url'?: string;
  'http.status_code'?: number;
  'http.user_agent'?: string;
  'db.system'?: string;
  'db.operation'?: string;
  'ai.provider'?: string;
  'ai.model'?: string;
  'ai.prompt.tokens'?: number;
  'ai.completion.tokens'?: number;
  [key: string]: any;
}

// Span events
interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, any>;
}

// Span class
class Span {
  public readonly spanId: string;
  public readonly traceId: string;
  public readonly parentSpanId?: string;
  public readonly name: string;
  public readonly startTime: number;
  public endTime?: number;
  public attributes: SpanAttributes;
  public events: SpanEvent[] = [];
  public status: 'ok' | 'error' = 'ok';
  public statusMessage?: string;
  private children: Span[] = [];

  constructor(name: string, traceId: string, parentSpanId?: string) {
    this.spanId = this.generateSpanId();
    this.traceId = traceId;
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.startTime = performance.now();
    this.attributes = {
      'service.name': 'vrux',
      'service.version': process.env.npm_package_version || '1.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development'
    };
  }

  private generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  setAttribute(key: string, value: any): void {
    this.attributes[key] = value;
  }

  setAttributes(attributes: Partial<SpanAttributes>): void {
    Object.assign(this.attributes, attributes);
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes
    });
  }

  setStatus(status: 'ok' | 'error', message?: string): void {
    this.status = status;
    this.statusMessage = message;
  }

  recordException(error: Error): void {
    this.setStatus('error', error.message);
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack
    });
  }

  addChild(child: Span): void {
    this.children.push(child);
  }

  end(): void {
    this.endTime = performance.now();
    
    // Export span data
    const _spanData: SpanData = {
      spanId: this.spanId,
      parentId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      duration: this.endTime - this.startTime,
      tags: this.attributes,
      status: this.status
    };

    // Notify tracer
    distributedTracer.endSpan(this);
  }

  toJSON(): SpanData {
    return {
      spanId: this.spanId,
      parentId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      duration: this.endTime ? this.endTime - this.startTime : 0,
      tags: this.attributes,
      status: this.status
    };
  }
}

// Distributed Tracer implementation
class DistributedTracer {
  private asyncLocalStorage = new AsyncLocalStorage<TraceContext>();
  private activeSpans = new Map<string, Span>();
  private completedTraces = new Map<string, Span[]>();
  private exportInterval = 5000; // 5 seconds
  private exportTimer?: NodeJS.Timeout;
  private propagators = new Map<string, TracePropagator>();

  constructor() {
    this.setupPropagators();
    this.startExporting();
    (global as any).__async_context__ = this.asyncLocalStorage;
  }

  private setupPropagators(): void {
    // W3C Trace Context propagator
    this.propagators.set('w3c', new W3CTracePropagator());
    // B3 propagator (Zipkin compatible)
    this.propagators.set('b3', new B3TracePropagator());
  }

  private startExporting(): void {
    this.exportTimer = setInterval(() => {
      this.exportTraces();
    }, this.exportInterval);
  }

  // Create a new trace
  createTrace(name: string): Span {
    const traceId = this.generateTraceId();
    const span = new Span(name, traceId);
    
    const context: TraceContext = {
      traceId,
      spanId: span.spanId,
      traceFlags: 1 // Sampled
    };

    this.activeSpans.set(span.spanId, span);
    
    // Store in async context
    this.asyncLocalStorage.enterWith(context);
    
    return span;
  }

  // Start a new span
  startSpan(name: string): Span {
    const context = this.asyncLocalStorage.getStore();
    
    if (!context) {
      // No active trace, create a new one
      return this.createTrace(name);
    }

    const span = new Span(name, context.traceId, context.spanId);
    this.activeSpans.set(span.spanId, span);

    // Update context for child spans
    const newContext: TraceContext = {
      ...context,
      spanId: span.spanId,
      parentSpanId: context.spanId
    };

    this.asyncLocalStorage.enterWith(newContext);

    return span;
  }

  // End a span
  endSpan(span: Span): void {
    this.activeSpans.delete(span.spanId);

    // Store completed span
    const traces = this.completedTraces.get(span.traceId) || [];
    traces.push(span);
    this.completedTraces.set(span.traceId, traces);

    // Restore parent context
    const context = this.asyncLocalStorage.getStore();
    if (context && context.spanId === span.spanId && span.parentSpanId) {
      const newContext: TraceContext = {
        ...context,
        spanId: span.parentSpanId
      };
      this.asyncLocalStorage.enterWith(newContext);
    }
  }

  // Inject trace context into headers
  inject(headers: Record<string, string>, format: string = 'w3c'): void {
    const context = this.asyncLocalStorage.getStore();
    if (!context) return;

    const propagator = this.propagators.get(format);
    if (propagator) {
      propagator.inject(context, headers);
    }
  }

  // Extract trace context from headers
  extract(headers: Record<string, string>, format: string = 'w3c'): TraceContext | null {
    const propagator = this.propagators.get(format);
    if (!propagator) return null;

    return propagator.extract(headers);
  }

  // Wrap async function with tracing
  wrap<T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    options?: { attributes?: Partial<SpanAttributes> }
  ): T {
    return ((...args: Parameters<T>) => {
      const span = this.startSpan(name);
      
      if (options?.attributes) {
        span.setAttributes(options.attributes);
      }

      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result
            .then(value => {
              span.setStatus('ok');
              span.end();
              return value;
            })
            .catch(error => {
              span.recordException(error);
              span.end();
              throw error;
            });
        }

        span.setStatus('ok');
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    }) as T;
  }

  // Export traces
  private async exportTraces(): Promise<void> {
    const traces = Array.from(this.completedTraces.entries());
    
    if (traces.length === 0) return;

    // Clear completed traces
    this.completedTraces.clear();

    // Group spans by trace
    for (const [traceId, spans] of traces) {
      const traceData: TraceData = {
        traceId,
        spans: spans.map(span => span.toJSON()),
        service: 'vrux',
        timestamp: new Date()
      };

      try {
        await monitoringBackend.recordTrace(traceData);
      } catch (error) {
        logger.error('Failed to export trace', error as Error, { traceId });
      }
    }
  }

  // Get current trace context
  getContext(): TraceContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  // Run function with specific context
  runWithContext<T>(context: TraceContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  private generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  shutdown(): void {
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
    }
    this.exportTraces();
  }
}

// Trace propagator interface
interface TracePropagator {
  inject(context: TraceContext, carrier: Record<string, string>): void;
  extract(carrier: Record<string, string>): TraceContext | null;
}

// W3C Trace Context propagator
class W3CTracePropagator implements TracePropagator {
  inject(context: TraceContext, carrier: Record<string, string>): void {
    const version = '00';
    const traceFlags = context.traceFlags.toString(16).padStart(2, '0');
    carrier['traceparent'] = `${version}-${context.traceId}-${context.spanId}-${traceFlags}`;
    
    if (context.traceState) {
      carrier['tracestate'] = context.traceState;
    }
  }

  extract(carrier: Record<string, string>): TraceContext | null {
    const traceparent = carrier['traceparent'];
    if (!traceparent) return null;

    const parts = traceparent.split('-');
    if (parts.length !== 4) return null;

    return {
      traceId: parts[1],
      spanId: parts[2],
      traceFlags: parseInt(parts[3], 16),
      traceState: carrier['tracestate']
    };
  }
}

// B3 propagator (Zipkin compatible)
class B3TracePropagator implements TracePropagator {
  inject(context: TraceContext, carrier: Record<string, string>): void {
    carrier['X-B3-TraceId'] = context.traceId;
    carrier['X-B3-SpanId'] = context.spanId;
    carrier['X-B3-Sampled'] = context.traceFlags > 0 ? '1' : '0';
    
    if (context.parentSpanId) {
      carrier['X-B3-ParentSpanId'] = context.parentSpanId;
    }
  }

  extract(carrier: Record<string, string>): TraceContext | null {
    const traceId = carrier['X-B3-TraceId'] || carrier['x-b3-traceid'];
    const spanId = carrier['X-B3-SpanId'] || carrier['x-b3-spanid'];
    
    if (!traceId || !spanId) return null;

    return {
      traceId,
      spanId,
      parentSpanId: carrier['X-B3-ParentSpanId'] || carrier['x-b3-parentspanid'],
      traceFlags: carrier['X-B3-Sampled'] === '1' ? 1 : 0
    };
  }
}

// Create middleware for automatic tracing
export function tracingMiddleware(_serviceName?: string) {
  return (req: any, res: any, next: any) => {
    // Extract trace context from headers
    const context = distributedTracer.extract(req.headers, 'w3c') || 
                   distributedTracer.extract(req.headers, 'b3');

    const startTrace = () => {
      const span = context 
        ? distributedTracer.runWithContext(context, () => 
            distributedTracer.startSpan(`${req.method} ${req.path}`)
          )
        : distributedTracer.createTrace(`${req.method} ${req.path}`);

      // Set HTTP attributes
      span.setAttributes({
        'http.method': req.method,
        'http.url': req.url,
        'http.user_agent': req.headers['user-agent'],
        'http.host': req.headers.host,
        'net.peer.ip': req.ip || req.connection.remoteAddress
      });

      // Inject trace context into response headers
      const responseHeaders: Record<string, string> = {};
      distributedTracer.inject(responseHeaders, 'w3c');
      Object.entries(responseHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Track response
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        span.setAttribute('http.status_code', res.statusCode);
        
        if (res.statusCode >= 400) {
          span.setStatus('error', `HTTP ${res.statusCode}`);
        } else {
          span.setStatus('ok');
        }

        span.end();
        originalEnd.apply(res, args);
      };

      next();
    };

    if (context) {
      distributedTracer.runWithContext(context, startTrace);
    } else {
      startTrace();
    }
  };
}

// Export singleton instance
export const distributedTracer = new DistributedTracer();

// Auto-shutdown on process exit
process.on('SIGTERM', () => distributedTracer.shutdown());
process.on('SIGINT', () => distributedTracer.shutdown());

// Convenience exports
export default distributedTracer;
export { Span };
export type { TraceContext, SpanAttributes };