import performanceMonitor from './performance';
import logger from './logger';

export interface GenerationMetrics {
  promptLength: number;
  responseLength: number;
  totalTime: number;
  modelTime: number;
  validationTime: number;
  tokensUsed: number;
  retries: number;
  cacheHit: boolean;
}

export class AIPerformanceOptimizer {
  private static cache = new Map<string, { code: string; timestamp: number }>();
  private static cacheTimeout = 300000; // 5 minutes
  private static maxCacheSize = 100;
  
  // Response caching for common prompts
  static getCachedResponse(prompt: string): string | null {
    const cacheKey = this.generateCacheKey(prompt);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheTimeout) {
        logger.info('Cache hit for prompt', { 
          cacheKey,
          age: `${(age / 1000).toFixed(1)}s` 
        });
        return cached.code;
      } else {
        // Remove expired entry
        this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }
  
  static setCachedResponse(prompt: string, code: string): void {
    const cacheKey = this.generateCacheKey(prompt);
    
    // Implement LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const oldest = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }
    
    this.cache.set(cacheKey, { code, timestamp: Date.now() });
  }
  
  private static generateCacheKey(prompt: string): string {
    // Simple hash function for cache key
    return prompt.toLowerCase().trim()
      .replace(/\s+/g, ' ')
      .substring(0, 200);
  }
  
  // Optimize prompts for better generation
  static optimizePrompt(prompt: string): string {
    let optimized = prompt.trim();
    
    // Add clarity keywords if missing
    const clarityKeywords = ['component', 'interface', 'ui', 'design', 'layout'];
    const hasClarity = clarityKeywords.some(keyword => 
      optimized.toLowerCase().includes(keyword)
    );
    
    if (!hasClarity) {
      optimized = `UI component for ${optimized}`;
    }
    
    // Add responsive hint if not present
    if (!optimized.toLowerCase().includes('responsive')) {
      optimized += ' (ensure responsive design)';
    }
    
    return optimized;
  }
  
  // Token estimation to prevent oversized requests
  static estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  // Batch similar requests
  static shouldBatchRequest(prompt: string, pendingPrompts: string[]): boolean {
    // Check if similar prompts are pending
    return pendingPrompts.some(pending => 
      this.calculateSimilarity(prompt, pending) > 0.8
    );
  }
  
  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

// Request queue for managing concurrent generations
export class GenerationQueue {
  private queue: Array<{
    id: string;
    prompt: string;
    priority: number;
    timestamp: number;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  
  private processing = 0;
  private maxConcurrent = 3;
  
  async add(prompt: string, priority: number = 0): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7);
      
      this.queue.push({
        id,
        prompt,
        priority,
        timestamp: Date.now(),
        resolve,
        reject
      });
      
      // Sort by priority then timestamp
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
      
      this.processNext();
    });
  }
  
  private async processNext() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const item = this.queue.shift();
    if (!item) return;
    
    this.processing++;
    
    try {
      // Process would happen here
      const result = await this.processGeneration(item);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.processing--;
      this.processNext();
    }
  }
  
  private async processGeneration(item: {
    id: string;
    prompt: string;
    priority: number;
    timestamp: number;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }): Promise<{ success: boolean }> {
    // Placeholder for actual generation logic
    performanceMonitor.startTimer(`generation-${item.id}`);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    performanceMonitor.endTimer(`generation-${item.id}`, {
      prompt: item.prompt,
      priority: item.priority
    });
    
    return { success: true };
  }
  
  getQueueStats() {
    return {
      queued: this.queue.length,
      processing: this.processing,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Performance recommendations
export function getPerformanceRecommendations(metrics: GenerationMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.promptLength > 500) {
    recommendations.push('Consider shortening the prompt for faster generation');
  }
  
  if (metrics.totalTime > 10000) {
    recommendations.push('Generation took longer than expected. Consider caching common requests');
  }
  
  if (metrics.tokensUsed > 1500) {
    recommendations.push('High token usage detected. Optimize prompts to reduce costs');
  }
  
  if (metrics.retries > 0) {
    recommendations.push('Request required retries. Check API health and rate limits');
  }
  
  if (!metrics.cacheHit && metrics.promptLength < 100) {
    recommendations.push('Enable caching for common short prompts');
  }
  
  return recommendations;
}