import type { NextApiResponse } from 'next';
import { shareStore } from '../../../../lib/share-store';
import { requireAuth, type AuthenticatedRequest } from '../../../../lib/middleware/auth';
import logger from '../../../../lib/logger';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shareId = req.query.id as string;
  const user = req.user!;

  try {
    const result = await shareStore.toggleLike(shareId, user.id);
    
    logger.info('Share like toggled', {
      shareId,
      userId: user.id,
      liked: result.liked,
    });
    
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Share not found or access denied' });
    }
    
    logger.error('Share like error', error as Error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);