import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import logger from './logger';
import crypto from 'crypto';

// Provider configuration with enhanced error handling
const PROVIDER_CONFIG = {
  openai: {
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    maxRetries: 3,
    timeout: 30000,
    rateLimit: { requests: 60, window: 60000 },
  },
  anthropic: {
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    maxRetries: 2,
    timeout: 45000,
    rateLimit: { requests: 30, window: 60000 },
  },
} as const;

// Initialize providers with enhanced configuration
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

// Enhanced provider interface with quality metrics
export interface AIGenerationMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number;
  provider: string;
  model: string;
  cached: boolean;
  quality: number; // 0-100 quality score
}

export interface AIProvider {
  name: string;
  generateComponent: (prompt: string, systemPrompt: string, options?: AIGenerationOptions) => Promise<AIGenerationResult>;
  generateStream: (prompt: string, systemPrompt: string, options?: AIGenerationOptions) => AsyncGenerator<AIStreamChunk, void, unknown>;
  isAvailable: () => Promise<boolean>;
  getHealth: () => Promise<ProviderHealth>;
  supportsVision?: boolean;
  supportedModels: readonly string[];
  client?: unknown;
}

export interface AIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  userId?: string;
  requestId?: string;
  cache?: boolean;
}

export interface AIGenerationResult {
  content: string;
  metrics: AIGenerationMetrics;
  cached?: boolean;
}

export interface AIStreamChunk {
  content: string;
  isFirst?: boolean;
  isLast?: boolean;
  metrics?: Partial<AIGenerationMetrics>;
}

export interface ProviderHealth {
  available: boolean;
  latency?: number;
  error?: string;
  quotaRemaining?: number;
  lastChecked: Date;
}

// Request cache for deduplication
class RequestCache {
  private cache = new Map<string, { result: AIGenerationResult; expires: number }>();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string): AIGenerationResult | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return { ...item.result, cached: true };
  }

  set(key: string, result: AIGenerationResult): void {
    this.cache.set(key, {
      result,
      expires: Date.now() + this.ttl,
    });
    
    // Cleanup old entries
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      entries.slice(0, 20).forEach(([k]) => this.cache.delete(k));
    }
  }

  generateKey(prompt: string, systemPrompt: string, options?: AIGenerationOptions): string {
    const data = JSON.stringify({ prompt, systemPrompt, ...options });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

const requestCache = new RequestCache();

// Enhanced OpenAI Provider with quality metrics
export const openAIProvider: AIProvider = {
  name: 'OpenAI',
  supportsVision: true,
  supportedModels: PROVIDER_CONFIG.openai.models,
  client: openai,
  
  isAvailable: async () => {
    if (!openai) return false;
    
    try {
      // Quick health check
      const start = Date.now();
      await openai.models.list();
      const latency = Date.now() - start;
      
      logger.info('OpenAI health check passed', { latency });
      return true;
    } catch (error) {
      logger.warn('OpenAI health check failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  },
  
  getHealth: async () => {
    const lastChecked = new Date();
    
    if (!openai) {
      return { available: false, error: 'API key not configured', lastChecked };
    }
    
    try {
      const start = Date.now();
      await openai.models.list();
      const latency = Date.now() - start;
      
      return { available: true, latency, lastChecked };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked 
      };
    }
  },
  
  generateComponent: async (prompt: string, systemPrompt: string, options?: AIGenerationOptions): Promise<AIGenerationResult> => {
    if (!openai) throw new Error('OpenAI not configured');
    
    const start = Date.now();
    const cacheKey = requestCache.generateKey(prompt, systemPrompt, options);
    
    // Check cache first
    if (options?.cache !== false) {
      const cached = requestCache.get(cacheKey);
      if (cached) {
        logger.info('OpenAI cache hit', { cacheKey, requestId: options?.requestId });
        return cached;
      }
    }
    
    try {
      const model = options?.model || 'gpt-4o';
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 1,
        frequency_penalty: options?.frequencyPenalty ?? 0,
        presence_penalty: options?.presencePenalty ?? 0,
        stop: options?.stopSequences,
        user: options?.userId,
      });
      
      const content = completion.choices[0]?.message?.content || '';
      const latency = Date.now() - start;
      
      // Calculate quality score based on response
      const quality = calculateQualityScore(content, prompt);
      
      const result: AIGenerationResult = {
        content,
        metrics: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
          latency,
          provider: 'OpenAI',
          model,
          cached: false,
          quality,
        },
      };
      
      // Cache successful results
      if (options?.cache !== false && content) {
        requestCache.set(cacheKey, result);
      }
      
      logger.info('OpenAI generation complete', { 
        requestId: options?.requestId,
        ...result.metrics 
      });
      
      return result;
    } catch (error) {
      logger.error('OpenAI generation failed', error as Error, {
        requestId: options?.requestId,
        prompt: prompt.substring(0, 100),
      });
      throw error;
    }
  },

  generateStream: async function* (prompt: string, systemPrompt: string, options?: AIGenerationOptions): AsyncGenerator<AIStreamChunk> {
    if (!openai) throw new Error('OpenAI not configured');
    
    const start = Date.now();
    const model = options?.model || 'gpt-4o';
    let isFirst = true;
    let totalContent = '';
    
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 1,
        frequency_penalty: options?.frequencyPenalty ?? 0,
        presence_penalty: options?.presencePenalty ?? 0,
        stop: options?.stopSequences,
        user: options?.userId,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          totalContent += content;
          yield {
            content,
            isFirst,
            isLast: false,
            metrics: isFirst ? {
              provider: 'OpenAI',
              model,
              cached: false,
            } : undefined,
          };
          isFirst = false;
        }
      }
      
      // Final chunk with complete metrics
      const latency = Date.now() - start;
      const quality = calculateQualityScore(totalContent, prompt);
      
      yield {
        content: '',
        isFirst: false,
        isLast: true,
        metrics: {
          latency,
          quality,
          totalTokens: Math.ceil(totalContent.length / 4), // Rough estimate
        },
      };
      
      logger.info('OpenAI stream complete', {
        requestId: options?.requestId,
        latency,
        contentLength: totalContent.length,
        quality,
      });
    } catch (error) {
      logger.error('OpenAI stream failed', error as Error, {
        requestId: options?.requestId,
      });
      throw error;
    }
  }
};

// Enhanced Anthropic Provider with full feature parity
export const anthropicProvider: AIProvider = {
  name: 'Anthropic',
  supportsVision: false,
  supportedModels: PROVIDER_CONFIG.anthropic.models,
  client: anthropic,
  
  isAvailable: async () => {
    if (!anthropic) return false;
    
    try {
      // Quick health check using a minimal request
      const start = Date.now();
      await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      const latency = Date.now() - start;
      
      logger.info('Anthropic health check passed', { latency });
      return true;
    } catch (error) {
      logger.warn('Anthropic health check failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  },
  
  getHealth: async () => {
    const lastChecked = new Date();
    
    if (!anthropic) {
      return { available: false, error: 'API key not configured', lastChecked };
    }
    
    try {
      const start = Date.now();
      await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'health check' }],
      });
      const latency = Date.now() - start;
      
      return { available: true, latency, lastChecked };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked 
      };
    }
  },
  
  generateComponent: async (prompt: string, systemPrompt: string, options?: AIGenerationOptions): Promise<AIGenerationResult> => {
    if (!anthropic) throw new Error('Anthropic not configured');
    
    const start = Date.now();
    const cacheKey = requestCache.generateKey(prompt, systemPrompt, options);
    
    // Check cache first
    if (options?.cache !== false) {
      const cached = requestCache.get(cacheKey);
      if (cached) {
        logger.info('Anthropic cache hit', { cacheKey, requestId: options?.requestId });
        return cached;
      }
    }
    
    try {
      const model = options?.model || 'claude-3-5-sonnet-20241022';
      const message = await anthropic.messages.create({
        model,
        max_tokens: options?.maxTokens ?? 4000,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
        metadata: options?.userId ? { user_id: options.userId } : undefined,
      });

      // Extract text from content blocks
      const content = message.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('');
      
      const latency = Date.now() - start;
      const quality = calculateQualityScore(content, prompt);
      
      const result: AIGenerationResult = {
        content,
        metrics: {
          promptTokens: message.usage?.input_tokens || 0,
          completionTokens: message.usage?.output_tokens || 0,
          totalTokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
          latency,
          provider: 'Anthropic',
          model,
          cached: false,
          quality,
        },
      };
      
      // Cache successful results
      if (options?.cache !== false && content) {
        requestCache.set(cacheKey, result);
      }
      
      logger.info('Anthropic generation complete', { 
        requestId: options?.requestId,
        ...result.metrics 
      });
      
      return result;
    } catch (error) {
      logger.error('Anthropic generation failed', error as Error, {
        requestId: options?.requestId,
        prompt: prompt.substring(0, 100),
      });
      throw error;
    }
  },

  generateStream: async function* (prompt: string, systemPrompt: string, options?: AIGenerationOptions): AsyncGenerator<AIStreamChunk> {
    if (!anthropic) throw new Error('Anthropic not configured');
    
    const start = Date.now();
    const model = options?.model || 'claude-3-5-sonnet-20241022';
    let isFirst = true;
    let totalContent = '';
    
    try {
      const stream = await anthropic.messages.create({
        model,
        max_tokens: options?.maxTokens ?? 4000,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
        metadata: options?.userId ? { user_id: options.userId } : undefined,
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const content = event.delta.text;
          totalContent += content;
          
          yield {
            content,
            isFirst,
            isLast: false,
            metrics: isFirst ? {
              provider: 'Anthropic',
              model,
              cached: false,
            } : undefined,
          };
          isFirst = false;
        }
      }
      
      // Final chunk with complete metrics
      const latency = Date.now() - start;
      const quality = calculateQualityScore(totalContent, prompt);
      
      yield {
        content: '',
        isFirst: false,
        isLast: true,
        metrics: {
          latency,
          quality,
          totalTokens: Math.ceil(totalContent.length / 3), // Rough estimate for Claude
        },
      };
      
      logger.info('Anthropic stream complete', {
        requestId: options?.requestId,
        latency,
        contentLength: totalContent.length,
        quality,
      });
    } catch (error) {
      logger.error('Anthropic stream failed', error as Error, {
        requestId: options?.requestId,
      });
      throw error;
    }
  }
};

// Quality scoring function
function calculateQualityScore(content: string, _prompt: string): number {
  let score = 50; // Base score
  
  // Check for code structure
  if (content.includes('export') || content.includes('function') || content.includes('=>')) score += 10;
  if (content.includes('useState') || content.includes('useEffect')) score += 10;
  if (content.includes('className') || content.includes('style')) score += 10;
  
  // Check for completeness
  if (content.length > 500) score += 10;
  if (content.includes('return') && content.includes('</')) score += 10;
  
  // Penalize errors or incomplete code
  if (content.includes('// TODO') || content.includes('...')) score -= 10;
  if (content.includes('undefined') || content.includes('null')) score -= 5;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Enhanced mock provider for development
export const mockProvider: AIProvider = {
  name: 'Mock',
  supportsVision: false,
  supportedModels: ['mock-v1'],
  
  isAvailable: async () => true,
  
  getHealth: async () => ({
    available: true,
    latency: 50,
    lastChecked: new Date(),
  }),
  
  generateComponent: async (prompt: string, systemPrompt: string, options?: AIGenerationOptions): Promise<AIGenerationResult> => {
    const start = Date.now();
    logger.info('Using mock provider for demonstration', { requestId: options?.requestId });
    
    let content = '';
    
    // Generate different components based on prompt keywords
    if (prompt.toLowerCase().includes('button')) {
      content = `() => {
  const [count, setCount] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <button 
      onClick={() => setCount(count + 1)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
      aria-label="Interactive counter button"
    >
      <span className="relative z-10">
        {count > 0 ? \`Clicked \${count} times\` : 'Click Me!'}
      </span>
      {isHovered && (
        <span className="absolute inset-0 bg-white opacity-20 rounded-xl animate-pulse" />
      )}
    </button>
  );
}`;
    } else if (prompt.toLowerCase().includes('card')) {
      content = `() => {
  const [isLiked, setIsLiked] = React.useState(false);
  
  return (
    <div className="max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105">
      <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500" />
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Premium Card Component
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This is a beautifully designed card component with hover effects and dark mode support.
        </p>
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Learn More
          </button>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Like this card"
          >
            <svg className={\`w-6 h-6 \${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}\`} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}`;
    } else if (prompt.toLowerCase().includes('form')) {
      content = `() => {
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('Form submitted successfully!');
    setIsSubmitting(false);
    setFormData({ name: '', email: '', message: '' });
  };
  
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}`;
    } else {
      // Generic component
      content = `() => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <div className={\`p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl shadow-2xl transform transition-all duration-1000 \${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}\`}>
      <h1 className="text-4xl font-bold text-white mb-4 animate-pulse">
        AI Generated Component
      </h1>
      <p className="text-white/90 text-lg mb-6">
        This component was generated based on your prompt. It includes animations, state management, and responsive design.
      </p>
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-6">
        <p className="text-white/90 text-sm font-mono">
          Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"
        </p>
      </div>
      <div className="mt-6 flex gap-4">
        <button className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
          Primary Action
        </button>
        <button className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors">
          Secondary Action
        </button>
      </div>
    </div>
  );
}`;
    }
    
    const latency = Date.now() - start;
    const quality = calculateQualityScore(content, prompt);
    
    return {
      content,
      metrics: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(content.length / 4),
        totalTokens: Math.ceil((prompt.length + content.length) / 4),
        latency,
        provider: 'Mock',
        model: 'mock-v1',
        cached: false,
        quality,
      },
    };
  },
  
  generateStream: async function* (prompt: string, systemPrompt: string, options?: AIGenerationOptions): AsyncGenerator<AIStreamChunk> {
    const result = await this.generateComponent(prompt, systemPrompt, options);
    const chunks = result.content.match(/.{1,50}/g) || [];
    let isFirst = true;
    
    for (const chunk of chunks) {
      yield {
        content: chunk,
        isFirst,
        isLast: false,
        metrics: isFirst ? {
          provider: 'Mock',
          model: 'mock-v1',
          cached: false,
        } : undefined,
      };
      isFirst = false;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    yield {
      content: '',
      isFirst: false,
      isLast: true,
      metrics: result.metrics,
    };
  }
};

// Provider selection with health checks and intelligent fallback
export async function getAvailableProvider(preferredProvider?: string): Promise<AIProvider> {
  const providers = [
    { provider: openAIProvider, priority: 1 },
    { provider: anthropicProvider, priority: 2 },
    { provider: mockProvider, priority: 99 },
  ];
  
  // Sort by priority
  providers.sort((a, b) => a.priority - b.priority);
  
  // Try preferred provider first if specified
  if (preferredProvider) {
    const preferred = providers.find(p => p.provider.name.toLowerCase() === preferredProvider.toLowerCase());
    if (preferred && await preferred.provider.isAvailable()) {
      logger.info(`Using preferred provider: ${preferred.provider.name}`);
      return preferred.provider;
    }
  }
  
  // Try each provider with health check
  for (const { provider } of providers) {
    try {
      const isAvailable = await provider.isAvailable();
      if (isAvailable) {
        const health = await provider.getHealth();
        if (health.available) {
          logger.info(`Selected provider: ${provider.name}`, health);
          return provider;
        }
      }
    } catch (error) {
      logger.warn(`Provider ${provider.name} health check failed`, { error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  // Fallback to mock provider
  logger.info('All AI providers unavailable, using mock provider');
  return mockProvider;
}

// Generate component with automatic fallback and retry logic
export async function generateComponentWithFallback(
  prompt: string, 
  systemPrompt: string,
  options?: AIGenerationOptions
): Promise<{ content: string; provider: string; metrics?: AIGenerationMetrics }> {
  const providers = [
    { provider: openAIProvider, priority: 1 },
    { provider: anthropicProvider, priority: 2 },
    { provider: mockProvider, priority: 99 },
  ];
  
  let lastError: Error | null = null;
  
  for (const { provider } of providers) {
    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) continue;
      
      logger.info(`Attempting generation with ${provider.name}`, { requestId: options?.requestId });
      const result = await provider.generateComponent(prompt, systemPrompt, options);
      
      return { 
        content: result.content, 
        provider: provider.name,
        metrics: result.metrics 
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`${provider.name} generation failed`, lastError, { requestId: options?.requestId });
      
      // Check if it's a rate limit error and we should wait
      if (lastError.message.includes('rate_limit') || lastError.message.includes('429')) {
        logger.info(`Rate limit hit for ${provider.name}, trying next provider`);
        continue;
      }
    }
  }
  
  // If all providers failed, throw the last error
  throw lastError || new Error('All AI providers failed');
}

// Generate stream with automatic fallback and enhanced error handling
export async function* generateStreamWithFallback(
  prompt: string,
  systemPrompt: string,
  options?: AIGenerationOptions
): AsyncGenerator<{ content: string; provider?: string; metrics?: Partial<AIGenerationMetrics> }, void, unknown> {
  const providers = [
    { provider: openAIProvider, priority: 1 },
    { provider: anthropicProvider, priority: 2 },
    { provider: mockProvider, priority: 99 },
  ];
  
  let lastError: Error | null = null;
  
  for (const { provider } of providers) {
    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) continue;
      
      logger.info(`Starting stream with ${provider.name}`, { requestId: options?.requestId });
      
      // Announce provider
      yield { content: '', provider: provider.name };
      
      for await (const chunk of provider.generateStream(prompt, systemPrompt, options)) {
        yield { 
          content: chunk.content,
          metrics: chunk.metrics 
        };
      }
      
      // Successfully completed
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`${provider.name} stream failed`, lastError, { requestId: options?.requestId });
      
      // Check if it's a rate limit error
      if (lastError.message.includes('rate_limit') || lastError.message.includes('429')) {
        logger.info(`Rate limit hit for ${provider.name}, trying next provider`);
        continue;
      }
    }
  }
  
  // If all providers failed, throw the last error
  throw lastError || new Error('All AI providers failed to stream');
}

// Export provider health monitoring
export async function getAllProvidersHealth(): Promise<Record<string, ProviderHealth>> {
  const providers = [
    { name: 'OpenAI', provider: openAIProvider },
    { name: 'Anthropic', provider: anthropicProvider },
    { name: 'Mock', provider: mockProvider },
  ];
  
  const health: Record<string, ProviderHealth> = {};
  
  await Promise.all(
    providers.map(async ({ name, provider }) => {
      try {
        health[name] = await provider.getHealth();
      } catch (error) {
        health[name] = {
          available: false,
          error: error instanceof Error ? error.message : 'Health check failed',
          lastChecked: new Date(),
        };
      }
    })
  );
  
  return health;
}