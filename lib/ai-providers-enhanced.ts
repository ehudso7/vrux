import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import logger from './logger';
import crypto from 'crypto';
import telemetry from './telemetry';
import { AIProvider } from './ai-providers';

// Enhanced provider configuration with multi-model support
const PROVIDER_CONFIG = {
  openai: {
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    maxRetries: 3,
    timeout: 30000,
    rateLimit: { requests: 60, window: 60000 },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: true,
    }
  },
  anthropic: {
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    maxRetries: 2,
    timeout: 45000,
    rateLimit: { requests: 30, window: 60000 },
    features: {
      streaming: true,
      functionCalling: false,
      vision: true,
      jsonMode: false,
    }
  },
  google: {
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    maxRetries: 3,
    timeout: 40000,
    rateLimit: { requests: 50, window: 60000 },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: true,
    }
  },
  cohere: {
    models: ['command-r', 'command-r-plus', 'command'],
    maxRetries: 2,
    timeout: 30000,
    rateLimit: { requests: 40, window: 60000 },
    features: {
      streaming: true,
      functionCalling: false,
      vision: false,
      jsonMode: false,
    }
  }
} as const;

// Model capabilities and characteristics
export const MODEL_PROFILES = {
  'gpt-4o': {
    provider: 'openai',
    capabilities: ['code', 'reasoning', 'vision', 'fast'],
    contextWindow: 128000,
    outputTokens: 16384,
    costPer1kTokens: { input: 0.005, output: 0.015 },
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['complex UI', 'interactive components', 'real-time generation']
  },
  'gpt-4-turbo': {
    provider: 'openai',
    capabilities: ['code', 'reasoning', 'vision'],
    contextWindow: 128000,
    outputTokens: 4096,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    speed: 'medium',
    quality: 'excellent',
    bestFor: ['complex logic', 'detailed components', 'high-quality output']
  },
  'gpt-4': {
    provider: 'openai',
    capabilities: ['code', 'reasoning'],
    contextWindow: 8192,
    outputTokens: 4096,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    speed: 'slow',
    quality: 'excellent',
    bestFor: ['complex reasoning', 'architectural decisions']
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    capabilities: ['code', 'fast'],
    contextWindow: 16385,
    outputTokens: 4096,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    speed: 'very-fast',
    quality: 'good',
    bestFor: ['simple components', 'rapid prototyping', 'cost-effective generation']
  },
  'claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    capabilities: ['code', 'reasoning', 'vision', 'safety'],
    contextWindow: 200000,
    outputTokens: 8192,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['clean code', 'best practices', 'secure components']
  },
  'claude-3-opus-20240229': {
    provider: 'anthropic',
    capabilities: ['code', 'reasoning', 'vision', 'safety'],
    contextWindow: 200000,
    outputTokens: 4096,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    speed: 'slow',
    quality: 'excellent',
    bestFor: ['complex architectures', 'enterprise components', 'highest quality']
  },
  'claude-3-sonnet-20240229': {
    provider: 'anthropic',
    capabilities: ['code', 'reasoning', 'vision'],
    contextWindow: 200000,
    outputTokens: 4096,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    speed: 'medium',
    quality: 'very-good',
    bestFor: ['balanced performance', 'general components']
  },
  'claude-3-haiku-20240307': {
    provider: 'anthropic',
    capabilities: ['code', 'fast'],
    contextWindow: 200000,
    outputTokens: 4096,
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    speed: 'very-fast',
    quality: 'good',
    bestFor: ['simple tasks', 'rapid iteration', 'cost optimization']
  },
  'gemini-1.5-pro': {
    provider: 'google',
    capabilities: ['code', 'reasoning', 'vision', 'long-context'],
    contextWindow: 1048576, // 1M tokens
    outputTokens: 8192,
    costPer1kTokens: { input: 0.00125, output: 0.005 },
    speed: 'medium',
    quality: 'very-good',
    bestFor: ['large codebases', 'multi-file components', 'context-heavy tasks']
  },
  'gemini-1.5-flash': {
    provider: 'google',
    capabilities: ['code', 'fast', 'vision'],
    contextWindow: 1048576,
    outputTokens: 8192,
    costPer1kTokens: { input: 0.00025, output: 0.001 },
    speed: 'very-fast',
    quality: 'good',
    bestFor: ['quick generation', 'cost-effective', 'high-volume tasks']
  },
  'gemini-pro': {
    provider: 'google',
    capabilities: ['code', 'reasoning'],
    contextWindow: 32760,
    outputTokens: 8192,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    speed: 'fast',
    quality: 'good',
    bestFor: ['general components', 'balanced approach']
  }
} as const;

// Initialize providers
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: PROVIDER_CONFIG.openai.maxRetries,
  timeout: PROVIDER_CONFIG.openai.timeout,
  defaultHeaders: {
    'X-Client-Name': 'VRUX',
    'X-Client-Version': '1.0.0',
  },
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Google AI SDK initialization would go here
// const googleAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(...) : null;

// Enhanced interfaces
export interface AIGenerationMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number;
  provider: string;
  model: string;
  cached: boolean;
  quality: number;
  cost: number;
}

export interface ModelSelectionCriteria {
  priority: 'speed' | 'quality' | 'cost' | 'balanced';
  requiresVision?: boolean;
  requiresFunctionCalling?: boolean;
  maxLatency?: number;
  maxCost?: number;
  preferredProviders?: string[];
}

export interface EnhancedAIProvider extends AIProvider {
  getModelProfile: (model: string) => typeof MODEL_PROFILES[keyof typeof MODEL_PROFILES] | null;
  selectBestModel: (criteria: ModelSelectionCriteria) => string;
  estimateCost: (model: string, promptTokens: number, outputTokens: number) => number;
}

// Model selection algorithm
export function selectOptimalModel(
  criteria: ModelSelectionCriteria,
  availableProviders: Set<string>
): string {
  const candidates = Object.entries(MODEL_PROFILES).filter(([model, profile]) => {
    // Filter by available providers
    if (!availableProviders.has(profile.provider)) return false;
    
    // Filter by vision requirement
    if (criteria.requiresVision && !profile.capabilities.includes('vision' as any)) return false;
    
    // Filter by preferred providers
    if (criteria.preferredProviders?.length && 
        !criteria.preferredProviders.includes(profile.provider)) return false;
    
    return true;
  });

  // Score models based on criteria
  const scoredModels = candidates.map(([model, profile]) => {
    let score = 0;
    
    switch (criteria.priority) {
      case 'speed':
        score += profile.speed === 'very-fast' ? 100 : 
                profile.speed === 'fast' ? 75 : 
                profile.speed === 'medium' ? 50 : 25;
        break;
      case 'quality':
        score += profile.quality === 'excellent' ? 100 : 
                profile.quality === 'very-good' ? 75 : 50;
        break;
      case 'cost':
        const avgCost = (profile.costPer1kTokens.input + profile.costPer1kTokens.output) / 2;
        score += avgCost < 0.002 ? 100 : 
                avgCost < 0.01 ? 75 : 
                avgCost < 0.02 ? 50 : 25;
        break;
      case 'balanced':
      default:
        // Balanced scoring
        score += profile.speed === 'fast' || profile.speed === 'very-fast' ? 25 : 15;
        score += profile.quality === 'excellent' || profile.quality === 'very-good' ? 25 : 15;
        const balancedCost = (profile.costPer1kTokens.input + profile.costPer1kTokens.output) / 2;
        score += balancedCost < 0.01 ? 25 : 15;
        score += profile.capabilities.length * 5; // Bonus for capabilities
    }
    
    return { model, score };
  });

  // Sort by score and return best model
  scoredModels.sort((a, b) => b.score - a.score);
  return scoredModels[0]?.model || 'gpt-3.5-turbo'; // Default fallback
}

// Export enhanced provider factory
export function createEnhancedProvider(provider: AIProvider): EnhancedAIProvider {
  return {
    ...provider,
    getModelProfile(model: string) {
      return MODEL_PROFILES[model as keyof typeof MODEL_PROFILES] || null;
    },
    selectBestModel(criteria: ModelSelectionCriteria) {
      const availableModels = new Set(
        provider.supportedModels.filter(m => 
          MODEL_PROFILES[m as keyof typeof MODEL_PROFILES]
        )
      );
      return selectOptimalModel(criteria, new Set([provider.name]));
    },
    estimateCost(model: string, promptTokens: number, outputTokens: number) {
      const profile = MODEL_PROFILES[model as keyof typeof MODEL_PROFILES];
      if (!profile) return 0;
      
      const inputCost = (promptTokens / 1000) * profile.costPer1kTokens.input;
      const outputCost = (outputTokens / 1000) * profile.costPer1kTokens.output;
      return inputCost + outputCost;
    }
  };
}

// Export all available models for UI selection
export const ALL_AVAILABLE_MODELS = Object.entries(MODEL_PROFILES)
  .map(([model, profile]) => ({
    value: model,
    label: model,
    provider: profile.provider,
    quality: profile.quality,
    speed: profile.speed,
    costIndicator: profile.costPer1kTokens.input < 0.001 ? '$' : 
                   profile.costPer1kTokens.input < 0.01 ? '$$' : '$$$',
    capabilities: profile.capabilities,
    bestFor: profile.bestFor
  }));

// Model groups for UI organization
export const MODEL_GROUPS = {
  'High Performance': ['gpt-4o', 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro'],
  'Balanced': ['gpt-4-turbo', 'claude-3-sonnet-20240229', 'gemini-pro'],
  'Fast & Efficient': ['gpt-3.5-turbo', 'claude-3-haiku-20240307', 'gemini-1.5-flash'],
  'Specialized': ['gpt-4', 'claude-3-opus-20240229', 'gemini-pro-vision']
};