import type { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import { promises as fs } from 'fs';
import performanceMonitor from '../../../lib/performance';
import { requireAuthWithApiLimit } from '../../../lib/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get system metrics
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const loadAverage = os.loadavg();

    // Get disk usage (simplified - in production use proper disk usage library)
    let diskUsage = { used: 0, total: 0, percentage: 0 };
    try {
      const stats = await fs.statfs('/');
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      diskUsage = {
        used,
        total,
        percentage: (used / total) * 100
      };
    } catch (error) {
      // Fallback for systems where statfs is not available
      diskUsage = {
        used: 50 * 1024 * 1024 * 1024, // 50GB mock
        total: 100 * 1024 * 1024 * 1024, // 100GB mock
        percentage: 50
      };
    }

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Get performance metrics
    const perfMetrics = performanceMonitor.getMetrics();

    const metrics = {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: loadAverage
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      disk: diskUsage,
      network: {
        bytesIn: Math.random() * 1024 * 1024, // Mock data - integrate with actual network monitoring
        bytesOut: Math.random() * 1024 * 1024,
        requestsPerSecond: perfMetrics.requests.requestsPerMinute / 60
      }
    };

    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default requireAuthWithApiLimit(handler);