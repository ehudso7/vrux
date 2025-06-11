import type { NextApiRequest, NextApiResponse } from 'next';
import alertingEngine from '../../../lib/alerting-rules';
import { requireAuthWithApiLimit } from '../../../lib/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    try {
      // Get active alerts
      const activeAlerts = alertingEngine.getActiveAlerts();
      
      // Transform to API format
      const alerts = activeAlerts.map(alert => ({
        id: alert.rule.id,
        severity: alert.rule.severity,
        title: alert.rule.name,
        message: alert.message,
        timestamp: alert.triggeredAt,
        acknowledged: alert.status === 'acknowledged',
        currentValue: alert.currentValue,
        threshold: alert.rule.threshold,
        tags: alert.rule.tags
      }));

      res.status(200).json(alerts);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuthWithApiLimit(handler);