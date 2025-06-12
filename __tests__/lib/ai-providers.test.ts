import { createAIProvider } from '../../lib/ai-providers';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Mock the AI SDK modules
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AI Providers', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createAIProvider', () => {
    it('creates OpenAI provider when API key is available', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      const provider = createAIProvider('openai');
      
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
      expect(provider.isAvailable()).toBe(true);
    });

    it('creates Anthropic provider when API key is available', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      const provider = createAIProvider('anthropic');
      
      expect(provider).toBeDefined();
      expect(provider.name).toBe('anthropic');
      expect(provider.isAvailable()).toBe(true);
    });

    it('returns null for unavailable provider', () => {
      delete process.env.OPENAI_API_KEY;
      
      const provider = createAIProvider('openai');
      
      expect(provider).toBeNull();
    });

    it('returns null for unknown provider', () => {
      const provider = createAIProvider('unknown' as any);
      
      expect(provider).toBeNull();
    });
  });

  describe('OpenAI Provider', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
    });

    it('generates UI code successfully', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'export default function Button() { return <button>Click</button>; }'
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        }
      };

      const mockCreate = jest.fn().mockResolvedValue(mockCompletion);
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      } as any));

      const provider = createAIProvider('openai');
      const result = await provider?.generateUI({
        prompt: 'Create a button',
        framework: 'react',
        styling: 'tailwind'
      });

      expect(result).toBeDefined();
      expect(result?.code).toContain('export default function Button');
      expect(result?.metrics).toMatchObject({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        provider: 'openai'
      });
    });

    it('handles generation errors gracefully', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      } as any));

      const provider = createAIProvider('openai');
      
      await expect(provider?.generateUI({
        prompt: 'Create a button',
        framework: 'react',
        styling: 'tailwind'
      })).rejects.toThrow('Failed to generate UI');
    });
  });

  describe('Anthropic Provider', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    });

    it('generates UI code successfully', async () => {
      const mockCompletion = {
        content: [{
          text: 'export default function Card() { return <div className="p-4">Card</div>; }'
        }],
        usage: {
          input_tokens: 80,
          output_tokens: 40
        }
      };

      const mockCreate = jest.fn().mockResolvedValue(mockCompletion);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: {
          create: mockCreate
        }
      } as any));

      const provider = createAIProvider('anthropic');
      const result = await provider?.generateUI({
        prompt: 'Create a card component',
        framework: 'react',
        styling: 'tailwind'
      });

      expect(result).toBeDefined();
      expect(result?.code).toContain('export default function Card');
      expect(result?.metrics).toMatchObject({
        promptTokens: 80,
        completionTokens: 40,
        totalTokens: 120,
        provider: 'anthropic'
      });
    });
  });

  describe('Provider Selection', () => {
    it('selects best available provider automatically', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      const openaiProvider = createAIProvider('openai');
      const anthropicProvider = createAIProvider('anthropic');
      
      expect(openaiProvider).toBeDefined();
      expect(anthropicProvider).toBeDefined();
      expect(openaiProvider?.isAvailable()).toBe(true);
      expect(anthropicProvider?.isAvailable()).toBe(true);
    });

    it('falls back to available provider when preferred is unavailable', () => {
      delete process.env.OPENAI_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      const provider = createAIProvider('openai');
      expect(provider).toBeNull();
      
      const fallbackProvider = createAIProvider('anthropic');
      expect(fallbackProvider).toBeDefined();
      expect(fallbackProvider?.isAvailable()).toBe(true);
    });
  });
});