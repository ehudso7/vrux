import type { NextApiResponse } from 'next';
import { builtInTemplates } from '../../../../lib/template-store';
import { requireAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';
import logger from '../../../../lib/logger';
import { telemetry } from '../../../../lib/telemetry';

// In-memory storage for likes (in production, use a database)
const userLikes = new Map<string, Set<string>>(); // userId -> Set of templateIds

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const { id: templateId } = req.query;
  if (!templateId || typeof templateId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid template ID',
    });
  }

  // Find template
  const template = builtInTemplates.find(t => t.id === templateId);
  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found',
    });
  }

  const userId = user.id;
  
  // Get or create user's likes set
  if (!userLikes.has(userId)) {
    userLikes.set(userId, new Set());
  }
  const likes = userLikes.get(userId)!;

  try {
    if (req.method === 'POST') {
      // Like template
      if (likes.has(templateId)) {
        return res.status(400).json({
          success: false,
          error: 'Template already liked',
        });
      }

      likes.add(templateId);
      template.likes += 1;

      telemetry.track('template.liked', {
        templateId,
        userId,
        totalLikes: template.likes,
      });

      logger.info('Template liked', {
        templateId,
        userId,
        totalLikes: template.likes,
      });

      return res.status(200).json({
        success: true,
        liked: true,
        likes: template.likes,
      });

    } else if (req.method === 'DELETE') {
      // Unlike template
      if (!likes.has(templateId)) {
        return res.status(400).json({
          success: false,
          error: 'Template not liked',
        });
      }

      likes.delete(templateId);
      template.likes = Math.max(0, template.likes - 1);

      telemetry.track('template.unliked', {
        templateId,
        userId,
        totalLikes: template.likes,
      });

      logger.info('Template unliked', {
        templateId,
        userId,
        totalLikes: template.likes,
      });

      return res.status(200).json({
        success: true,
        liked: false,
        likes: template.likes,
      });
    }
  } catch (error) {
    logger.error('Template like error:', error);
    telemetry.track('api.templates.error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId,
      userId,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export default requireAuth(handler);