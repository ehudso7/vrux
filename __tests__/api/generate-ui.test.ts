import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/generate-ui';
import { createAIProvider } from '../../lib/ai-providers';
import { rateLimiter } from '../../lib/rate-limiter';
import logger from '../../lib/logger';

// Mock dependencies
jest.mock('../../lib/ai-providers');
jest.mock('../../lib/rate-limiter');
jest.mock('../../lib/logger');

describe('/api/generate-ui', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimiter.check as jest.Mock).mockResolvedValue(true);
  });

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('returns 400 for missing prompt', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        framework: 'react',
        styling: 'tailwind'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Prompt is required'
    });
  });

  it('returns 429 when rate limited', async () => {
    (rateLimiter.check as jest.Mock).mockResolvedValue(false);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a button',
        framework: 'react',
        styling: 'tailwind'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Too many requests. Please try again later.'
    });
  });

  it('generates UI component successfully', async () => {
    const mockProvider = {
      generateUI: jest.fn().mockResolvedValue({
        code: 'export default function Button() { return <button>Click</button>; }',
        componentName: 'Button',
        dependencies: [],
        metrics: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          provider: 'openai',
          model: 'gpt-4',
          latency: 1234,
          cached: false,
          quality: 95
        }
      })
    };

    (createAIProvider as jest.Mock).mockReturnValue(mockProvider);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a button component with hover effects',
        framework: 'react',
        styling: 'tailwind',
        typescript: true,
        provider: 'openai'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response).toMatchObject({
      code: expect.stringContaining('export default function Button'),
      componentName: 'Button',
      dependencies: [],
      metrics: expect.objectContaining({
        provider: 'openai',
        totalTokens: 150
      })
    });

    expect(mockProvider.generateUI).toHaveBeenCalledWith({
      prompt: 'Create a button component with hover effects',
      framework: 'react',
      styling: 'tailwind',
      typescript: true,
      additionalContext: ''
    });
  });

  it('handles provider errors gracefully', async () => {
    const mockProvider = {
      generateUI: jest.fn().mockRejectedValue(new Error('AI generation failed'))
    };

    (createAIProvider as jest.Mock).mockReturnValue(mockProvider);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a button',
        framework: 'react',
        styling: 'tailwind'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to generate UI component'
    });

    expect(logger.error).toHaveBeenCalledWith(
      'UI generation error:',
      expect.any(Error)
    );
  });

  it('validates framework parameter', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a button',
        framework: 'invalid-framework',
        styling: 'tailwind'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid framework specified'
    });
  });

  it('validates styling parameter', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a button',
        framework: 'react',
        styling: 'invalid-styling'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid styling option specified'
    });
  });

  it('handles no available providers', async () => {
    (createAIProvider as jest.Mock).mockReturnValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Create a button',
        framework: 'react',
        styling: 'tailwind'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(503);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'No AI providers available'
    });
  });
});