import type { NextApiResponse } from 'next';
import type { HealthCheckResponse } from '../../lib/types';
import { requireAuth, type AuthenticatedRequest } from '../../lib/middleware/auth';

/**
 * Health check endpoint for monitoring
 * Returns system status and configuration info
 */
function healthHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<HealthCheckResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uptime = process.uptime();
  const environment = process.env.NODE_ENV || 'development';
  
  const healthData: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0', // Hardcoded version to avoid import issues
    environment,
    openai: {
      configured: !!process.env.OPENAI_API_KEY
    },
    uptime: Math.floor(uptime)
  };

  // Set cache headers to prevent caching of health checks
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.status(200).json(healthData);
}

export default requireAuth(healthHandler); 