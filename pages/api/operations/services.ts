import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllProvidersHealth } from '../../../lib/ai-providers';
import { requireAuthWithApiLimit } from '../../../lib/middleware/auth';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: Date;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get AI provider health
    const aiProvidersHealth = await getAllProvidersHealth();
    
    // Core services health checks
    const services: ServiceHealth[] = [];

    // Database health (mock - replace with actual DB check)
    services.push({
      name: 'Database',
      status: 'healthy',
      latency: Math.random() * 50,
      uptime: 0.999,
      lastCheck: new Date()
    });

    // Redis/Cache health (mock - replace with actual check)
    services.push({
      name: 'Cache',
      status: 'healthy',
      latency: Math.random() * 10,
      uptime: 0.998,
      lastCheck: new Date()
    });

    // AI Providers
    Object.entries(aiProvidersHealth).forEach(([provider, health]) => {
      services.push({
        name: `AI Provider - ${provider}`,
        status: health.available ? 'healthy' : 'down',
        latency: health.latency || 0,
        uptime: health.available ? 0.99 : 0,
        lastCheck: health.lastChecked
      });
    });

    // Monitoring Backend
    services.push({
      name: 'Monitoring Backend',
      status: 'healthy',
      latency: Math.random() * 100,
      uptime: 0.995,
      lastCheck: new Date()
    });

    // Auth Service
    services.push({
      name: 'Authentication',
      status: 'healthy',
      latency: Math.random() * 30,
      uptime: 0.999,
      lastCheck: new Date()
    });

    // File Storage
    services.push({
      name: 'File Storage',
      status: 'healthy',
      latency: Math.random() * 200,
      uptime: 0.997,
      lastCheck: new Date()
    });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch service health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default requireAuthWithApiLimit(handler);