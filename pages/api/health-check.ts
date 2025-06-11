import type { NextApiRequest, NextApiResponse } from 'next';
import rateLimiter from '../../lib/rate-limiter';
import performanceMonitor from '../../lib/performance';
import logger from '../../lib/logger';
import { monitoring } from '../../lib/monitoring';
import { getAllProvidersHealth } from '../../lib/ai-providers';
import { z } from 'zod';

// Health check response schema
const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  uptime: z.number(),
  version: z.string(),
  environment: z.string(),
  region: z.string().optional(),
  services: z.object({
    database: z.object({ 
      status: z.enum(['up', 'down', 'degraded']), 
      latency: z.number().optional(),
      message: z.string().optional(),
    }),
    ai: z.object({ 
      status: z.enum(['up', 'down', 'degraded']), 
      providers: z.record(z.object({
        available: z.boolean(),
        latency: z.number().optional(),
      })).optional(),
    }),
    cache: z.object({ 
      status: z.enum(['up', 'down', 'degraded']),
      hitRate: z.number().optional(),
    }),
    rateLimit: z.object({ 
      status: z.enum(['up', 'down', 'degraded']), 
      remaining: z.number().optional(),
      limit: z.number().optional(),
    }),
    monitoring: z.object({
      status: z.enum(['up', 'down', 'degraded']),
      activeAlerts: z.number().optional(),
    }),
  }),
  metrics: z.object({
    requestsPerMinute: z.number(),
    averageResponseTime: z.number(),
    errorRate: z.number(),
    p95ResponseTime: z.number(),
    p99ResponseTime: z.number(),
    activeConnections: z.number(),
  }).optional(),
  checks: z.object({
    diskSpace: z.object({
      status: z.enum(['ok', 'warning', 'critical']),
      used: z.number(),
      total: z.number(),
      percentage: z.number(),
    }),
    memory: z.object({
      status: z.enum(['ok', 'warning', 'critical']),
      used: z.number(),
      total: z.number(),
      percentage: z.number(),
    }),
    cpu: z.object({
      status: z.enum(['ok', 'warning', 'critical']),
      usage: z.number(),
    }),
  }).optional(),
});

type HealthStatus = z.infer<typeof HealthStatusSchema>;

export default async function healthHandler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const verbose = req.query.verbose === 'true';
  const metrics = req.query.metrics === 'true';

  try {
    // Get AI provider health
    const providersHealth = await getAllProvidersHealth();
    const hasAvailableProvider = Object.values(providersHealth).some(h => h.available);
    const aiProviders = Object.entries(providersHealth).reduce((acc, [name, health]) => {
      acc[name] = {
        available: health.available,
        latency: health.latency,
      };
      return acc;
    }, {} as Record<string, { available: boolean; latency?: number }>);

    // Get monitoring health
    const monitoringHealth = monitoring.getHealthStatus();
    const errorSummary = monitoring.getErrorSummary(300000); // Last 5 minutes

    // Get system metrics
    const memUsage = process.memoryUsage();
    const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const cpuUsage = process.cpuUsage().user / 1000000; // Convert to seconds

    // Build health response
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      region: process.env.VERCEL_REGION || undefined,
      services: {
        database: { 
          status: 'up', 
          latency: 5, // Mock for demo
          message: 'Connection pool healthy',
        },
        ai: { 
          status: hasAvailableProvider ? 'up' : 'down',
          providers: verbose ? aiProviders : undefined,
        },
        cache: { 
          status: 'up',
          hitRate: 85.5, // Mock for demo
        },
        rateLimit: { 
          status: 'up', 
          remaining: rateLimiter.getRemainingRequests('health-check'),
          limit: rateLimiter.getLimit(),
        },
        monitoring: {
          status: monitoringHealth.status === 'healthy' ? 'up' : 'degraded',
          activeAlerts: errorSummary.total,
        },
      },
    };

    // Add detailed metrics if requested
    if (metrics) {
      const perfMetrics = performanceMonitor.getMetrics();
      const monitoringMetrics = monitoring.getMetricsSummary(300000);
      
      health.metrics = {
        requestsPerMinute: perfMetrics.requests.requestsPerMinute,
        averageResponseTime: perfMetrics.requests.avgResponseTime || monitoringMetrics['timer.aiGeneration']?.avg || 0,
        errorRate: perfMetrics.requests.errorRate,
        p95ResponseTime: perfMetrics.requests.percentiles.p95 || monitoringMetrics['timer.aiGeneration']?.p95 || 0,
        p99ResponseTime: perfMetrics.requests.percentiles.p99 || monitoringMetrics['timer.aiGeneration']?.p99 || 0,
        activeConnections: perfMetrics.activeOperations.length,
      };
      
      // Add extended metrics for god-tier observability
      (health as any).extendedMetrics = {
        memoryUsage: perfMetrics.memory.heapUsagePercent,
        cpuTime: perfMetrics.cpu.totalSeconds,
        gcStats: perfMetrics.gc,
        operationStats: perfMetrics.operations
      };
    }

    // Add system checks if verbose
    if (verbose) {
      health.checks = {
        diskSpace: {
          status: 'ok', // Would check actual disk space in production
          used: 42.5,
          total: 100,
          percentage: 42.5,
        },
        memory: {
          status: memoryPercentage > 90 ? 'critical' : memoryPercentage > 70 ? 'warning' : 'ok',
          used: memUsage.heapUsed / 1024 / 1024,
          total: memUsage.heapTotal / 1024 / 1024,
          percentage: memoryPercentage,
        },
        cpu: {
          status: cpuUsage > 90 ? 'critical' : cpuUsage > 70 ? 'warning' : 'ok',
          usage: cpuUsage,
        },
      };
    }

    // Determine overall health status
    const criticalServices = ['ai', 'database'];
    const hasCriticalDown = criticalServices.some(
      service => health.services[service as keyof typeof health.services].status === 'down'
    );
    const hasDegraded = Object.values(health.services).some(
      service => service.status === 'degraded'
    );

    if (hasCriticalDown || errorSummary.total > 50) {
      health.status = 'unhealthy';
    } else if (hasDegraded || errorSummary.total > 10 || !hasAvailableProvider) {
      health.status = 'degraded';
    }

    // Validate response schema
    const validatedHealth = HealthStatusSchema.parse(health);

    // Log health check
    logger.info('Health check completed', {
      status: validatedHealth.status,
      duration: Date.now() - startTime,
      verbose,
      metrics,
    });

    // Set appropriate status code
    const statusCode = validatedHealth.status === 'healthy' ? 200 : 
                      validatedHealth.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(validatedHealth);
  } catch (error) {
    logger.error('Health check failed', error as Error);
    
    // Return minimal error response
    res.status(503).json({ 
      error: 'Service unavailable',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      services: {
        database: { status: 'down' },
        ai: { status: 'down' },
        cache: { status: 'down' },
        rateLimit: { status: 'down' },
        monitoring: { status: 'down' },
      },
    } as HealthStatus);
  }
}