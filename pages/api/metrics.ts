import type { NextApiRequest, NextApiResponse } from 'next';
import { monitoring } from '../../lib/monitoring';
import { getAllProvidersHealth } from '../../lib/ai-providers';
import requestLogger from '../../lib/middleware/request-logger';
import { withSecurity, SecurityLevels } from '../../lib/security-middleware';
import logger from '../../lib/logger';

interface MetricsData {
  timestamp: Date;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
  };
  performance: Record<string, {
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
    recent: Array<unknown>;
  };
  providers: Record<string, {
    available: boolean;
    latency?: number;
    error?: string;
    lastChecked: Date;
  }>;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  interactions: {
    total: number;
    byAction: Record<string, number>;
    byComponent: Record<string, number>;
    uniqueUsers: number;
  };
}

async function metricsHandler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get time range from query
    const range = req.query.range as string || '1h';
    const timeRanges: Record<string, number> = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
    };
    const timeRange = timeRanges[range] || timeRanges['1h'];

    // Get monitoring data
    const healthStatus = monitoring.getHealthStatus();
    const metricsSummary = monitoring.getMetricsSummary(timeRange);
    const errorSummary = monitoring.getErrorSummary(timeRange);
    const interactionSummary = monitoring.getInteractionSummary(timeRange);

    // Get AI provider health
    const providersHealth = await getAllProvidersHealth();

    // Get system metrics
    const memUsage = process.memoryUsage();
    const systemMetrics = {
      uptime: process.uptime(),
      memory: {
        used: memUsage.heapUsed / 1024 / 1024,
        total: memUsage.heapTotal / 1024 / 1024,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
      },
    };

    // Determine overall health message
    let healthMessage = 'All systems operational';
    if (healthStatus.status === 'degraded') {
      healthMessage = 'Some systems experiencing issues';
    } else if (healthStatus.status === 'unhealthy') {
      healthMessage = 'Critical issues detected';
    }

    const response: MetricsData = {
      timestamp: new Date(),
      health: {
        status: healthStatus.status,
        message: healthMessage,
      },
      performance: metricsSummary,
      errors: errorSummary,
      providers: providersHealth,
      system: systemMetrics,
      interactions: interactionSummary,
    };

    // Log metrics request
    logger.info('Metrics requested', {
      range,
      healthStatus: healthStatus.status,
      errorCount: errorSummary.total,
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to fetch metrics', error as Error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

// Apply security middleware with standard level
export default requestLogger(
  withSecurity({
    ...SecurityLevels.STANDARD,
    requireApiKey: false, // Allow public access to metrics for demo
  })(metricsHandler)
);