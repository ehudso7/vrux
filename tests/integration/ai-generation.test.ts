import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import generateUIStreamHandler from '../../pages/api/generate-ui-stream';
import { 
  openAIProvider, 
  anthropicProvider, 
  mockProvider,
  getAllProvidersHealth,
  generateComponentWithFallback,
} from '../../lib/ai-providers';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

describe('AI Generation Integration Tests', () => {
  describe('Provider Health Checks', () => {
    it('should report health status for all providers', async () => {
      const health = await getAllProvidersHealth();
      
      expect(health).toHaveProperty('OpenAI');
      expect(health).toHaveProperty('Anthropic');
      expect(health).toHaveProperty('Mock');
      
      // Mock provider should always be available
      expect(health.Mock.available).toBe(true);
      expect(health.Mock.latency).toBeLessThan(100);
    });
  });
  
  describe('Component Generation', () => {
    it('should generate a button component with mock provider', async () => {
      const result = await mockProvider.generateComponent(
        'Create a button component',
        'You are an expert React developer',
        { requestId: 'test-123' }
      );
      
      expect(result.content).toContain('button');
      expect(result.content).toContain('onClick');
      expect(result.metrics.provider).toBe('Mock');
      expect(result.metrics.quality).toBeGreaterThan(50);
    });
    
    it('should handle fallback when primary provider fails', async () => {
      // Mock OpenAI to fail
      jest.spyOn(openAIProvider, 'isAvailable').mockResolvedValue(false);
      
      const result = await generateComponentWithFallback(
        'Create a card component',
        'You are an expert React developer'
      );
      
      expect(result.provider).not.toBe('OpenAI');
      expect(result.content).toBeTruthy();
    });
    
    it('should validate quality scores', async () => {
      const testCases = [
        { prompt: 'button with state', minQuality: 70 },
        { prompt: 'simple div', minQuality: 40 },
        { prompt: 'form with validation', minQuality: 60 },
      ];
      
      for (const { prompt, minQuality } of testCases) {
        const result = await mockProvider.generateComponent(
          prompt,
          'Generate a React component'
        );
        
        expect(result.metrics.quality).toBeGreaterThanOrEqual(minQuality);
      }
    });
  });
  
  describe('Streaming Generation', () => {
    it('should stream content in chunks', async () => {
      const chunks: string[] = [];
      
      const generator = mockProvider.generateStream(
        'Create a navigation menu',
        'You are an expert React developer'
      );
      
      for await (const chunk of generator) {
        chunks.push(chunk.content);
        
        if (chunk.isFirst) {
          expect(chunk.metrics?.provider).toBe('Mock');
        }
        
        if (chunk.isLast) {
          expect(chunk.metrics?.quality).toBeDefined();
        }
      }
      
      expect(chunks.length).toBeGreaterThan(5);
      const fullContent = chunks.join('');
      expect(fullContent).toContain('nav');
    });
  });
  
  describe('API Endpoint Tests', () => {
    it('should validate input parameters', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://vrux.dev',
        },
        body: {
          prompt: '', // Invalid empty prompt
          variants: 5, // Invalid variant count
        },
      });
      
      await generateUIStreamHandler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });
    
    it('should handle rate limiting', async () => {
      // Simulate multiple requests to trigger rate limit
      const requests = Array(15).fill(null).map(() => 
        createMocks({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'origin': 'https://vrux.dev',
            'x-forwarded-for': '127.0.0.1',
          },
          body: {
            prompt: 'Create a button',
          },
        })
      );
      
      let rateLimitHit = false;
      
      for (const { req, res } of requests) {
        await generateUIStreamHandler(req as any, res as any);
        
        if (res._getStatusCode() === 429) {
          rateLimitHit = true;
          const data = JSON.parse(res._getData());
          expect(data.error).toContain('Too many requests');
          expect(data.resetTime).toBeDefined();
          break;
        }
      }
      
      expect(rateLimitHit).toBe(true);
    });
  });
  
  describe('Performance Tests', () => {
    it('should generate components within acceptable time limits', async () => {
      const start = Date.now();
      
      await generateComponentWithFallback(
        'Create a complex dashboard with charts',
        'You are an expert React developer',
        { cache: false }
      );
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
    
    it('should utilize caching for repeated requests', async () => {
      const prompt = 'Create a cached button component';
      const systemPrompt = 'You are an expert React developer';
      
      // First request - no cache
      const start1 = Date.now();
      const result1 = await generateComponentWithFallback(prompt, systemPrompt);
      const duration1 = Date.now() - start1;
      
      // Second request - should hit cache
      const start2 = Date.now();
      const result2 = await generateComponentWithFallback(prompt, systemPrompt);
      const duration2 = Date.now() - start2;
      
      expect(result1.content).toBe(result2.content);
      expect(duration2).toBeLessThan(duration1 / 2); // Cache should be much faster
      expect(result2.metrics?.cached).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock all providers to fail
      jest.spyOn(openAIProvider, 'isAvailable').mockResolvedValue(false);
      jest.spyOn(anthropicProvider, 'isAvailable').mockResolvedValue(false);
      jest.spyOn(mockProvider, 'isAvailable').mockResolvedValue(false);
      
      await expect(
        generateComponentWithFallback('test', 'test')
      ).rejects.toThrow('All AI providers failed');
    });
    
    it('should provide helpful error messages', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://vrux.dev',
        },
        body: {
          prompt: 'x'.repeat(1001), // Too long
        },
      });
      
      await generateUIStreamHandler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.details[0].message).toContain('1000 characters');
    });
  });
  
  describe('Security Tests', () => {
    it('should reject requests from unauthorized domains', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://malicious-site.com',
        },
        body: {
          prompt: 'Create a button',
        },
      });
      
      await generateUIStreamHandler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Forbidden');
    });
    
    it('should sanitize generated code', async () => {
      const maliciousPrompts = [
        'Create a component that executes <script>alert("XSS")</script>',
        'Generate code with eval() function',
        'Make a component that accesses document.cookie',
      ];
      
      for (const prompt of maliciousPrompts) {
        const result = await generateComponentWithFallback(prompt, 'Generate safe React code');
        
        expect(result.content).not.toContain('<script>');
        expect(result.content).not.toContain('eval(');
        expect(result.content).not.toContain('document.cookie');
      }
    });
  });
  
  // Cleanup
  afterAll(() => {
    jest.restoreAllMocks();
  });
});