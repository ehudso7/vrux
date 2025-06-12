import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/generate-ui-db';
import { prisma } from '../../lib/prisma';
import { SubscriptionTier, Framework, StylingOption, AnalyticsEvent } from '@prisma/client';

// Mock dependencies
jest.mock('../../lib/ai-providers', () => ({
  getAvailableProvider: jest.fn(),
}));

jest.mock('../../lib/rate-limiter', () => ({
  __esModule: true,
  default: {
    check: jest.fn(),
  }
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

import { getAvailableProvider } from '../../lib/ai-providers';
import rateLimiter from '../../lib/rate-limiter';

describe('/api/generate-ui-db with Database Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    subscription: SubscriptionTier.PRO,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    (rateLimiter.check as jest.Mock).mockResolvedValue(true);
  });

  it('generates UI component and stores in database', async () => {
    const mockProvider = {
      name: 'OpenAI',
      generateUI: jest.fn().mockResolvedValue({
        code: 'export default function Button() { return <button className="px-4 py-2 bg-blue-500">Click me</button>; }',
        componentName: 'Button',
        dependencies: ['react'],
        metrics: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          provider: 'openai',
          model: 'gpt-4o',
          latency: 1234,
          cached: false,
          quality: 95
        }
      })
    };

    (getAvailableProvider as jest.Mock).mockResolvedValue(mockProvider);

    // Mock database responses
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      subscription: SubscriptionTier.PRO,
      apiCallsCount: 10,
      apiCallsReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionExpiry: new Date('2025-12-31'),
    });

    const mockProject = {
      id: 'project-123',
      name: 'Default Project',
      userId: 'user-123',
      description: 'Auto-generated project for components',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

    const mockComponent = {
      id: 'component-123',
      name: 'Button',
      description: 'Generated from: Create a modern button component...',
      prompt: 'Create a modern button component',
      code: 'export default function Button() { return <button className="px-4 py-2 bg-blue-500">Click me</button>; }',
      framework: Framework.REACT,
      styling: StylingOption.TAILWIND,
      typescript: true,
      projectId: 'project-123',
      provider: 'OpenAI',
      model: 'gpt-4o',
      tokens: 150,
      generationTime: 1234,
      dependencies: ['react'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.component.create as jest.Mock).mockResolvedValue(mockComponent);
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.analytics.create as jest.Mock).mockResolvedValue({});

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        prompt: 'Create a modern button component',
        framework: 'react',
        styling: 'tailwind',
        typescript: true,
      },
      user: mockUser, // Simulating authenticated request
    });

    // Manually set the user on the request for testing
    (req as any).user = mockUser;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response).toMatchObject({
      id: 'component-123',
      code: expect.stringContaining('export default function Button'),
      componentName: 'Button',
      dependencies: ['react'],
      projectId: 'project-123',
      metrics: expect.objectContaining({
        provider: 'openai',
        totalTokens: 150,
      })
    });

    // Verify all database operations
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: expect.any(Object),
    });

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Default Project',
        userId: 'user-123',
        description: 'Auto-generated project for components',
      },
    });

    expect(prisma.component.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Button',
        prompt: 'Create a modern button component',
        framework: 'REACT',
        styling: 'TAILWIND',
        typescript: true,
        provider: 'OpenAI',
        model: 'gpt-4o',
        tokens: 150,
      }),
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        apiCallsCount: { increment: 1 },
      },
    });

    expect(prisma.analytics.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        event: AnalyticsEvent.COMPONENT_GENERATED,
        metadata: expect.any(Object),
      },
    });
  });

  it('enforces API limits for FREE tier users', async () => {
    const freeUser = { ...mockUser, subscription: SubscriptionTier.FREE };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      subscription: SubscriptionTier.FREE,
      apiCallsCount: 10, // Already at limit
      apiCallsReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        prompt: 'Create a button',
        framework: 'react',
        styling: 'tailwind',
      },
      user: freeUser,
    });

    (req as any).user = freeUser;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'API limit exceeded. Please upgrade your subscription.',
      limit: 10,
      used: 10,
    });
  });

  it('allows unlimited API calls for ENTERPRISE tier', async () => {
    const enterpriseUser = { ...mockUser, subscription: SubscriptionTier.ENTERPRISE };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      subscription: SubscriptionTier.ENTERPRISE,
      apiCallsCount: 10000, // High usage but should still work
      apiCallsReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const mockProvider = {
      name: 'OpenAI',
      generateUI: jest.fn().mockResolvedValue({
        code: 'export default function Component() { return <div>Enterprise</div>; }',
        componentName: 'Component',
        dependencies: [],
        metrics: { totalTokens: 100 }
      })
    };

    (getAvailableProvider as jest.Mock).mockResolvedValue(mockProvider);
    (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'project-123' });
    (prisma.component.create as jest.Mock).mockResolvedValue({ id: 'component-123' });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.analytics.create as jest.Mock).mockResolvedValue({});

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        prompt: 'Create a component',
        framework: 'react',
        styling: 'tailwind',
      },
      user: enterpriseUser,
    });

    (req as any).user = enterpriseUser;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockProvider.generateUI).toHaveBeenCalled();
  });

  it('resets API call count when period expires', async () => {
    const expiredResetDate = new Date(Date.now() - 1000); // 1 second ago

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      subscription: SubscriptionTier.FREE,
      apiCallsCount: 10, // Was at limit
      apiCallsReset: expiredResetDate,
    });

    (prisma.user.update as jest.Mock).mockResolvedValue({});
    
    const mockProvider = {
      name: 'OpenAI',
      generateUI: jest.fn().mockResolvedValue({
        code: 'export default function Component() { return <div>Reset</div>; }',
        componentName: 'Component',
        dependencies: [],
        metrics: { totalTokens: 100 }
      })
    };

    (getAvailableProvider as jest.Mock).mockResolvedValue(mockProvider);
    (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'project-123' });
    (prisma.component.create as jest.Mock).mockResolvedValue({ id: 'component-123' });
    (prisma.analytics.create as jest.Mock).mockResolvedValue({});

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        prompt: 'Create a component',
        framework: 'react',
        styling: 'tailwind',
      },
      user: mockUser,
    });

    (req as any).user = mockUser;

    await handler(req, res);

    // Should reset the count
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        apiCallsCount: 0,
        apiCallsReset: expect.any(Date),
      },
    });

    // Should generate successfully
    expect(res._getStatusCode()).toBe(200);
  });
});