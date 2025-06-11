// Client-safe telemetry module
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

// Client-safe telemetry that sends events to API
class ClientTelemetry {
  private queue: Array<{
    type: TelemetryEventType;
    data: Record<string, unknown>;
    timestamp: string;
  }> = [];
  
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      // Flush events every 5 seconds
      this.flushInterval = setInterval(() => this.flush(), 5000);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
  
  track(type: TelemetryEventType, data: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') return;
    
    this.queue.push({
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    
    // Flush if queue is getting large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Re-add events to queue on failure
      this.queue.unshift(...events);
      console.error('Failed to send telemetry:', error);
    }
  }
  
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Export singleton instance
export const telemetry = typeof window !== 'undefined' ? new ClientTelemetry() : {
  track: () => {},
  destroy: () => {},
};