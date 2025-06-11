import type { NextApiRequest, NextApiResponse } from 'next';
import alertingEngine from '../../../../../lib/alerting-rules';
import { requireAuthWithApiLimit } from '../../../../../lib/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid alert ID' });
  }

  try {
    // Acknowledge the alert
    alertingEngine.acknowledgeAlert(id);
    
    res.status(200).json({ 
      success: true,
      message: 'Alert acknowledged' 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to acknowledge alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default requireAuthWithApiLimit(handler);