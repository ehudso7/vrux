import type { NextApiResponse } from 'next';
import { z } from 'zod';
import { shareStore } from '../../lib/share-store';
import { requireAuth, type AuthenticatedRequest } from '../../lib/middleware/auth';
import { shareComponentSchema } from '../../lib/validation';
import logger from '../../lib/logger';

const shareIdSchema = z.object({
  id: z.string().min(1),
});

const listSharesSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
  tag: z.string().optional(),
  userId: z.string().optional(),
  sortBy: z.enum(['recent', 'popular', 'views']).optional(),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  const user = req.user!;

  try {
    switch (req.method) {
      case 'GET': {
        // Get single share by ID
        if (req.query.id) {
          const { id } = shareIdSchema.parse(req.query);
          const share = await shareStore.getShare(id, user.id);
          
          if (!share) {
            res.status(404).json({ error: 'Share not found' });
            return;
          }
          
          res.status(200).json({ share });
          return;
        }
        
        // List shares
        const params = listSharesSchema.parse(req.query);
        const result = await shareStore.listPublicShares({
          ...params,
          userId: params.userId || undefined,
        });
        
        res.status(200).json(result);
        return;
      }

      case 'POST': {
        // Create new share
        const data = shareComponentSchema.parse(req.body);
        const share = await shareStore.createShare(user.id, user.name || 'Anonymous', data as {
          code: string;
          title: string;
          description?: string;
          tags?: string[];
          isPublic?: boolean;
        });
        
        logger.info('Component shared', {
          shareId: share.id,
          userId: user.id,
          title: share.title,
          isPublic: share.isPublic,
        });
        
        res.status(201).json({ 
          share,
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vrux.dev'}/share/${share.id}`
        });
        return;
      }

      case 'PUT': {
        // Update share
        const { id } = shareIdSchema.parse(req.query);
        const updates = shareComponentSchema.pick({
          title: true,
          description: true,
          tags: true,
          isPublic: true
        }).partial().parse(req.body);
        
        const share = await shareStore.updateShare(id, user.id, updates);
        
        if (!share) {
          res.status(404).json({ error: 'Share not found or access denied' });
          return;
        }
        
        logger.info('Share updated', {
          shareId: id,
          userId: user.id,
        });
        
        res.status(200).json({ share });
        return;
      }

      case 'DELETE': {
        // Delete share
        const { id } = shareIdSchema.parse(req.query);
        const deleted = await shareStore.deleteShare(id, user.id);
        
        if (!deleted) {
          res.status(404).json({ error: 'Share not found or access denied' });
          return;
        }
        
        logger.info('Share deleted', {
          shareId: id,
          userId: user.id,
        });
        
        res.status(204).end();
        return;
      }

      default:
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid request',
        details: error.errors,
      });
      return;
    }
    
    logger.error('Share API error', error as Error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default requireAuth(handler);