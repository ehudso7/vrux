/**
 * API Integration Tests
 */
import { describe, it, expect } from '@jest/globals';
import type { GenerateUIRequest, GenerateUIResponse, GenerateUIError } from '../lib/types';

describe('API Endpoints', () => {
  const baseUrl = process.env.TEST_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        version: expect.any(String),
        environment: expect.any(String),
        openai: {
          configured: expect.any(Boolean)
        },
        uptime: expect.any(Number)
      });
    });
  });

  describe('POST /api/generate-ui', () => {
    it('should reject empty prompt', async () => {
      const request: GenerateUIRequest = { prompt: '' };
      
      const response = await fetch(`${baseUrl}/api/generate-ui`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data: GenerateUIError = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Prompt is required');
    });

    it('should reject very long prompts', async () => {
      const request: GenerateUIRequest = { 
        prompt: 'a'.repeat(1001) // Over 1000 character limit
      };
      
      const response = await fetch(`${baseUrl}/api/generate-ui`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data: GenerateUIError = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Prompt is too long (max 1000 characters)');
    });

    // Note: Actual generation test would require a valid API key
    it.skip('should generate component with valid prompt', async () => {
      const request: GenerateUIRequest = { 
        prompt: 'Create a simple button component'
      };
      
      const response = await fetch(`${baseUrl}/api/generate-ui`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data: GenerateUIResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBeTruthy();
      expect(data.code).toContain('button');
    });
  });
}); 