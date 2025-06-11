import type { NextApiRequest, NextApiResponse } from 'next';
import { builtInTemplates, Template } from '../../lib/template-store';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware/auth';
import logger from '../../lib/logger';
import { telemetry } from '../../lib/telemetry';

// In a real app, this would come from a database
const userTemplates: Template[] = [];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  telemetry.track('api.templates.request', {
    method: req.method,
    query: req.query,
  });

  try {
    if (req.method === 'GET') {
      // Get templates with optional filtering
      const { category, search, sort = 'popular' } = req.query;
      
      let templates = [...builtInTemplates, ...userTemplates];
      
      // Filter by category
      if (category && typeof category === 'string') {
        templates = templates.filter(t => t.category === category);
      }
      
      // Search by name or tags
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // Sort templates
      switch (sort) {
        case 'newest':
          templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'popular':
          templates.sort((a, b) => b.likes - a.likes);
          break;
        case 'used':
          templates.sort((a, b) => b.uses - a.uses);
          break;
      }
      
      logger.info('Templates fetched successfully', {
        count: templates.length,
        category,
        search,
        sort,
      });
      
      return res.status(200).json({
        success: true,
        templates,
        total: templates.length,
      });
      
    } else if (req.method === 'POST') {
      // Create a new template (requires authentication)
      return requireAuth(async (authReq: AuthenticatedRequest, authRes: NextApiResponse) => {
        const user = authReq.user;
        if (!user) {
          return authRes.status(401).json({
            success: false,
            error: 'Authentication required',
          });
        }
      
      const { name, description, category, tags, code, framework, dependencies } = req.body;
      
      if (!name || !description || !category || !code) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }
      
      const newTemplate: Template = {
        id: `user-${Date.now()}`,
        name,
        description,
        category,
        tags: tags || [],
        code,
        author: {
          name: user.name || user.email || 'Anonymous',
        },
        likes: 0,
        uses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        framework: framework || 'react',
        dependencies: dependencies || {},
      };
      
      userTemplates.push(newTemplate);
      
        telemetry.track('template.created', {
          templateId: newTemplate.id,
          category: newTemplate.category,
          userId: user.id,
        });
      
        logger.info('Template created successfully', {
          templateId: newTemplate.id,
          userId: user.id,
        });
      
        return authRes.status(201).json({
          success: true,
          template: newTemplate,
        });
      })(req, res);
      
    } else if (req.method === 'PUT') {
      // Update template use count
      const { templateId } = req.body;
      
      if (!templateId) {
        return res.status(400).json({
          success: false,
          error: 'Template ID required',
        });
      }
      
      // Find template in both built-in and user templates
      let template = builtInTemplates.find(t => t.id === templateId);
      const _isBuiltIn = true;
      
      if (!template) {
        template = userTemplates.find(t => t.id === templateId);
        const _isBuiltIn2 = false;
      }
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      }
      
      // Increment use count
      template.uses += 1;
      template.updatedAt = new Date();
      
      telemetry.track('template.used', {
        templateId,
        uses: template.uses,
      });
      
      return res.status(200).json({
        success: true,
        message: 'Template use count updated',
        uses: template.uses,
      });
      
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }
  } catch (error) {
    logger.error('Template API error:', error);
    telemetry.track('api.templates.error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      method: req.method,
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export default handler;