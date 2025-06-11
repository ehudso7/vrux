import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import crypto from 'crypto';
import telemetry from '../../lib/telemetry';
import performanceMonitor from '../../lib/performance';
import { monitoring } from '../../lib/monitoring';
import logger from '../../lib/logger';
import { requireAuthWithApiLimit } from '../../lib/middleware/auth';

// Query schema for telemetry endpoint
const querySchema = z.object({
  type: z.enum(['events', 'analytics', 'traces', 'metrics', 'sessions']).optional(),
  sessionId: z.string().optional(),
  traceId: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

interface TelemetryResponse {
  success: boolean;
  data: Record<string, unknown>;
  metadata: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

interface TelemetryError {
  error: string;
  message: string;
  code: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TelemetryResponse | TelemetryError>
): Promise<void> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Validate query parameters
    const query = querySchema.parse(req.query);
    
    logger.info('Telemetry data requested', { 
      type: query.type,
      requestId,
      userId: (req as any).user?.id
    });

    let data: Record<string, unknown> = {};

    switch (query.type) {
      case 'events':
        // Get recent telemetry events
        data = {
          events: [], // Events are batched and processed, not stored
          message: 'Events are processed in batches. Use analytics for aggregated data.'
        };
        break;

      case 'analytics':
        // Get system analytics
        const systemAnalytics = telemetry.getSystemAnalytics();
        const perfMetrics = performanceMonitor.getMetrics();
        const monitoringMetrics = monitoring.getMetricsSummary(300000); // Last 5 minutes
        
        data = {
          telemetry: systemAnalytics,
          performance: {
            requests: perfMetrics.requests,
            memory: perfMetrics.memory,
            cpu: perfMetrics.cpu,
            operations: perfMetrics.operations,
            system: perfMetrics.system
          },
          monitoring: monitoringMetrics,
          insights: generateInsights(systemAnalytics, perfMetrics, monitoringMetrics)
        };
        break;

      case 'traces':
        // Get distributed traces
        if (query.traceId) {
          const trace = (telemetry as any).tracer?.getTrace(query.traceId);
          data = { trace: trace || null };
        } else {
          const traces = (telemetry as any).tracer?.exportTraces() || [];
          data = { 
            traces: traces.slice(0, query.limit),
            total: traces.length 
          };
        }
        break;

      case 'metrics':
        // Get detailed metrics
        const metrics = performanceMonitor.getMetrics();
        const monitoringSummary = monitoring.getMetricsSummary(3600000); // Last hour
        
        data = {
          performance: metrics,
          monitoring: monitoringSummary,
          health: {
            status: determineHealthStatus(metrics, monitoringSummary),
            scores: calculateHealthScores(metrics, monitoringSummary)
          }
        };
        break;

      case 'sessions':
        // Get session analytics
        if (query.sessionId) {
          const sessionAnalytics = telemetry.getSessionAnalytics(query.sessionId);
          data = { session: sessionAnalytics || null };
        } else {
          data = {
            message: 'Session ID required for session analytics',
            activeSessions: (telemetry.getSystemAnalytics() as any).activeSessions || 0
          };
        }
        break;

      default:
        // Return summary of all available data
        const summary = telemetry.getSystemAnalytics();
        const perf = performanceMonitor.getMetrics();
        
        data = {
          summary: {
            totalEvents: summary.totalEvents,
            errorRate: summary.errorRate,
            activeSessions: (summary as any).activeSessions || 0,
            requestsPerMinute: perf.requests.requestsPerMinute,
            avgResponseTime: perf.requests.avgResponseTime,
            memoryUsage: perf.memory.heapUsagePercent,
            uptime: perf.system.uptimeHuman
          },
          availableTypes: ['events', 'analytics', 'traces', 'metrics', 'sessions']
        };
    }

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTime
      }
    });

  } catch (error) {
    logger.error('Telemetry endpoint error', error as Error, { requestId });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        message: error.errors.map(e => e.message).join(', '),
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve telemetry data',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Helper functions
function generateInsights(
  telemetry: Record<string, unknown>, 
  performance: Record<string, any>,
  _monitoring: Record<string, any>
): Record<string, unknown> {
  const insights: Record<string, unknown> = {};

  // Performance insights
  if (performance.requests.avgResponseTime > 1000) {
    insights.performance = 'Response times are higher than optimal. Consider optimization.';
  }

  // Error insights
  const errorRate = telemetry.errorRate as number || 0;
  if (errorRate > 5) {
    insights.errors = `High error rate detected: ${errorRate.toFixed(2)}%. Investigation recommended.`;
  }

  // Memory insights
  if (performance.memory.heapUsagePercent > 80) {
    insights.memory = 'High memory usage detected. Monitor for potential memory leaks.';
  }

  // AI provider insights
  const aiOperations = performance.operations.aiGeneration;
  if (aiOperations && aiOperations.avgDuration > 5000) {
    insights.ai = 'AI generation times are elevated. Consider provider optimization.';
  }

  return insights;
}

function determineHealthStatus(
  performance: Record<string, any>,
  _monitoring: Record<string, any>
): string {
  const errorRate = performance.requests.errorRate || 0;
  const memoryUsage = performance.memory.heapUsagePercent || 0;
  const avgResponseTime = performance.requests.avgResponseTime || 0;

  if (errorRate > 10 || memoryUsage > 90 || avgResponseTime > 3000) {
    return 'critical';
  } else if (errorRate > 5 || memoryUsage > 80 || avgResponseTime > 2000) {
    return 'warning';
  } else if (errorRate > 2 || memoryUsage > 70 || avgResponseTime > 1000) {
    return 'degraded';
  }
  
  return 'healthy';
}

function calculateHealthScores(
  performance: Record<string, any>,
  _monitoring: Record<string, any>
): Record<string, number> {
  return {
    performance: Math.max(0, 100 - (performance.requests.avgResponseTime / 30)),
    reliability: Math.max(0, 100 - performance.requests.errorRate),
    efficiency: Math.max(0, 100 - performance.memory.heapUsagePercent),
    overall: Math.max(0, 100 - (
      (performance.requests.errorRate + 
       performance.memory.heapUsagePercent / 2 +
       performance.requests.avgResponseTime / 100) / 3
    ))
  };
}

// Export with auth middleware
export default requireAuthWithApiLimit(handler);