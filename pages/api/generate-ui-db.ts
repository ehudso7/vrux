import type { NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../lib/auth-middleware';
import rateLimiter from '../../lib/rate-limiter';
import logger from '../../lib/logger';
import { getAvailableProvider } from '../../lib/ai-providers';
import { AnalyticsEvent, Framework, StylingOption } from '@prisma/client';

interface GenerateUIRequest {
  prompt: string;
  framework?: string;
  styling?: string;
  typescript?: boolean;
  projectId?: string;
}

async function generateUIHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user!.id;
    
    // Check rate limit
    const rateLimitResult = await rateLimiter.check(res, 10, userId);
    if (!rateLimitResult) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }

    const { 
      prompt, 
      framework = 'react', 
      styling = 'tailwind', 
      typescript = true,
      projectId 
    } = req.body as GenerateUIRequest;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate framework and styling
    const validFrameworks = ['react', 'vue', 'angular', 'svelte', 'solid', 'qwik'];
    const validStyling = ['tailwind', 'css', 'scss', 'styled_components', 'emotion', 'css_modules'];
    
    if (!validFrameworks.includes(framework.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid framework specified' });
    }
    
    if (!validStyling.includes(styling.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid styling option specified' });
    }

    // Check user's subscription and API limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscription: true,
        apiCallsCount: true,
        apiCallsReset: true,
        subscriptionExpiry: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if API calls need to be reset (monthly reset)
    const now = new Date();
    if (user.apiCallsReset < now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          apiCallsCount: 0,
          apiCallsReset: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
      user.apiCallsCount = 0;
    }

    // Check API limits based on subscription
    const apiLimits = {
      FREE: 10,
      PRO: 1000,
      ENTERPRISE: -1 // unlimited
    };

    const limit = apiLimits[user.subscription];
    if (limit !== -1 && user.apiCallsCount >= limit) {
      return res.status(403).json({ 
        error: 'API limit exceeded. Please upgrade your subscription.',
        limit,
        used: user.apiCallsCount
      });
    }

    // Get AI provider and generate component
    const provider = await getAvailableProvider();
    if (!provider) {
      return res.status(503).json({ error: 'No AI providers available' });
    }

    const startTime = Date.now();
    const result = await provider.generateUI({
      prompt,
      framework,
      styling,
      typescript
    });

    const generationTime = Date.now() - startTime;

    // Get or create project
    let project = null;
    if (projectId) {
      project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      });
    }
    
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Default Project',
          userId,
          description: 'Auto-generated project for components'
        }
      });
    }

    // Save component to database
    const component = await prisma.component.create({
      data: {
        name: result.componentName || 'GeneratedComponent',
        description: `Generated from: ${prompt.substring(0, 100)}...`,
        prompt,
        code: result.code,
        framework: framework.toUpperCase() as Framework,
        styling: styling.toUpperCase() as StylingOption,
        typescript,
        projectId: project.id,
        provider: provider.name,
        model: result.metrics?.model || 'unknown',
        tokens: result.metrics?.totalTokens || 0,
        generationTime,
        dependencies: result.dependencies || [],
      }
    });

    // Update user's API call count
    await prisma.user.update({
      where: { id: userId },
      data: {
        apiCallsCount: { increment: 1 }
      }
    });

    // Log analytics
    await prisma.analytics.create({
      data: {
        userId,
        event: AnalyticsEvent.COMPONENT_GENERATED,
        metadata: {
          componentId: component.id,
          framework,
          styling,
          promptLength: prompt.length,
          provider: provider.name,
          generationTime
        }
      }
    });

    logger.info('Component generated', {
      userId,
      componentId: component.id,
      provider: provider.name,
      tokens: result.metrics?.totalTokens
    });

    res.status(200).json({
      id: component.id,
      code: result.code,
      componentName: result.componentName,
      dependencies: result.dependencies,
      projectId: project.id,
      metrics: {
        ...result.metrics,
        generationTime
      }
    });
  } catch (error) {
    logger.error('UI generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate UI component' 
    });
  }
}

export default withAuth(generateUIHandler);