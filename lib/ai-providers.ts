import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import logger from './logger';

// Initialize providers
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

export interface AIProvider {
  name: string;
  generateComponent: (prompt: string, systemPrompt: string) => Promise<string>;
  generateStream: (prompt: string, systemPrompt: string) => AsyncGenerator<string, void, unknown>;
  isAvailable: () => boolean;
  supportsVision?: boolean;
  client?: unknown;
}

// OpenAI Provider
export const openAIProvider: AIProvider = {
  name: 'OpenAI',
  supportsVision: true,
  client: openai,
  
  isAvailable: () => !!openai,
  
  generateComponent: async (prompt: string, systemPrompt: string) => {
    if (!openai) throw new Error('OpenAI not configured');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || '';
  },

  generateStream: async function* (prompt: string, systemPrompt: string) {
    if (!openai) throw new Error('OpenAI not configured');
    
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }
};

// Anthropic Provider
export const anthropicProvider: AIProvider = {
  name: 'Anthropic',
  supportsVision: false,
  client: anthropic,
  
  isAvailable: () => !!anthropic,
  
  generateComponent: async (prompt: string, systemPrompt: string) => {
    if (!anthropic) throw new Error('Anthropic not configured');
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // Extract text from content blocks
    const content = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    return content;
  },

  generateStream: async function* (prompt: string, systemPrompt: string) {
    if (!anthropic) throw new Error('Anthropic not configured');
    
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
};

// Get available provider with fallback
// Mock provider for testing when APIs are unavailable
export const mockProvider: AIProvider = {
  name: 'Mock',
  supportsVision: false,
  
  isAvailable: () => true,
  
  generateComponent: async (prompt: string) => {
    logger.info('Using mock provider for demonstration');
    // Return a simple component based on the prompt
    if (prompt.toLowerCase().includes('button')) {
      return `() => {
  const [count, setCount] = React.useState(0);
  
  return (
    <button 
      onClick={() => setCount(count + 1)}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {count > 0 ? \`Clicked \${count} times\` : 'Hello World'}
    </button>
  );
}`;
    }
    
    return `() => {
  return (
    <div className="p-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-2xl">
      <h1 className="text-3xl font-bold text-white mb-4">Generated Component</h1>
      <p className="text-white/90">This is a mock component. Both OpenAI and Anthropic APIs are unavailable.</p>
    </div>
  );
}`;
  },
  
  generateStream: async function* (prompt: string) {
    const content = await this.generateComponent(prompt, '');
    const chunks = content.match(/.{1,20}/g) || [];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
};

export async function getAvailableProvider(): Promise<AIProvider> {
  // Try OpenAI first if available
  if (openAIProvider.isAvailable()) {
    // Don't test here - let actual generation handle quota errors
    logger.info('OpenAI provider is available');
    return openAIProvider;
  }

  // Fallback to Anthropic
  if (anthropicProvider.isAvailable()) {
    logger.info('Using Anthropic provider (OpenAI not available)');
    return anthropicProvider;
  }

  // Use mock provider as last resort for demonstration
  logger.warn('No AI providers available, using mock provider');
  return mockProvider;
}

// Generate component with automatic fallback
export async function generateComponentWithFallback(
  prompt: string, 
  systemPrompt: string
): Promise<{ content: string; provider: string }> {
  const provider = await getAvailableProvider();
  
  try {
    logger.info(`Using ${provider.name} for generation`);
    const content = await provider.generateComponent(prompt, systemPrompt);
    return { content, provider: provider.name };
  } catch (error) {
    logger.error(`${provider.name} generation failed`, error instanceof Error ? error : new Error(String(error)));
    
    // If OpenAI failed, try Anthropic
    if (provider.name === 'OpenAI' && anthropicProvider.isAvailable()) {
      logger.info('Falling back to Anthropic');
      const content = await anthropicProvider.generateComponent(prompt, systemPrompt);
      return { content, provider: 'Anthropic' };
    }
    
    throw error;
  }
}

// Generate stream with automatic fallback
export async function* generateStreamWithFallback(
  prompt: string,
  systemPrompt: string
): AsyncGenerator<{ content: string; provider?: string }, void, unknown> {
  const provider = await getAvailableProvider();
  
  try {
    logger.info(`Using ${provider.name} for stream generation`);
    yield { content: '', provider: provider.name };
    
    for await (const chunk of provider.generateStream(prompt, systemPrompt)) {
      yield { content: chunk };
    }
  } catch (error) {
    logger.error(`${provider.name} stream generation failed`, error instanceof Error ? error : new Error(String(error)));
    
    // If OpenAI failed, try Anthropic
    if (provider.name === 'OpenAI' && anthropicProvider.isAvailable()) {
      logger.info('Falling back to Anthropic for stream');
      yield { content: '', provider: 'Anthropic' };
      
      for await (const chunk of anthropicProvider.generateStream(prompt, systemPrompt)) {
        yield { content: chunk };
      }
    } else {
      throw error;
    }
  }
}