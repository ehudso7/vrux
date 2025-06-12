import { EventEmitter } from 'events';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

export interface StreamingOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onProgress?: (progress: number) => void;
  onPartialCode?: (code: string) => void;
  onPreview?: (preview: PreviewData) => void;
  cache?: boolean;
}

export interface PreviewData {
  html: string;
  css: string;
  jsx: string;
  isComplete: boolean;
  confidence: number;
}

export interface StreamChunk {
  type: 'token' | 'preview' | 'progress' | 'complete' | 'error';
  content?: string;
  preview?: PreviewData;
  progress?: number;
  error?: string;
}

export class AIStreamingEngine extends EventEmitter {
  private codeBuffer: string = '';
  private tokenCount: number = 0;
  private previewThrottleMs: number = 100;
  private lastPreviewTime: number = 0;
  private confidenceThreshold: number = 0.7;

  constructor() {
    super();
  }

  /**
   * Process streaming chunks and emit enhanced events
   */
  async *processStream(
    stream: AsyncIterable<ChatCompletionChunk>,
    options: StreamingOptions = {}
  ): AsyncGenerator<StreamChunk> {
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        
        if (content) {
          this.codeBuffer += content;
          this.tokenCount++;

          // Emit token event
          yield {
            type: 'token',
            content
          };

          // Calculate progress
          const estimatedProgress = Math.min(this.tokenCount / 500, 0.95);
          if (options.onProgress && this.tokenCount % 10 === 0) {
            options.onProgress(estimatedProgress);
            yield {
              type: 'progress',
              progress: estimatedProgress
            };
          }

          // Generate preview if enough content and throttle time passed
          if (this.shouldGeneratePreview()) {
            const preview = await this.generatePreview(this.codeBuffer);
            if (preview && preview.confidence >= this.confidenceThreshold) {
              if (options.onPreview) {
                options.onPreview(preview);
              }
              yield {
                type: 'preview',
                preview
              };
            }
          }

          // Call partial code callback
          if (options.onPartialCode) {
            options.onPartialCode(this.codeBuffer);
          }
        }

        // Check for completion
        if (chunk.choices[0]?.finish_reason) {
          const finalPreview = await this.generatePreview(this.codeBuffer, true);
          yield {
            type: 'complete',
            content: this.codeBuffer,
            preview: finalPreview
          };
          break;
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Stream processing failed'
      };
    }
  }

  /**
   * Determine if we should generate a preview
   */
  private shouldGeneratePreview(): boolean {
    const now = Date.now();
    const timeSinceLastPreview = now - this.lastPreviewTime;
    
    // Generate preview if:
    // 1. Enough time has passed
    // 2. We have enough content
    // 3. The code looks like it might be valid
    if (timeSinceLastPreview >= this.previewThrottleMs && 
        this.codeBuffer.length > 100 &&
        this.hasValidStructure(this.codeBuffer)) {
      this.lastPreviewTime = now;
      return true;
    }
    
    return false;
  }

  /**
   * Check if code has valid JSX structure
   */
  private hasValidStructure(code: string): boolean {
    // Basic checks for JSX validity
    const hasReturn = code.includes('return');
    const hasOpeningTag = /<\w+/.test(code);
    const hasClosingTag = /<\/\w+>/.test(code);
    
    return hasReturn && hasOpeningTag && hasClosingTag;
  }

  /**
   * Generate preview from partial or complete code
   */
  private async generatePreview(code: string, isComplete: boolean = false): Promise<PreviewData> {
    try {
      // Clean and prepare code
      const cleanedCode = this.cleanCode(code);
      
      // Extract JSX and estimate rendering
      const jsx = this.extractJSX(cleanedCode);
      const css = this.extractTailwindClasses(jsx);
      const html = this.generateHTML(jsx);
      
      // Calculate confidence based on code completeness
      const confidence = this.calculateConfidence(cleanedCode, isComplete);
      
      return {
        html,
        css,
        jsx: cleanedCode,
        isComplete,
        confidence
      };
    } catch (error) {
      // Return empty preview on error
      return {
        html: '',
        css: '',
        jsx: code,
        isComplete: false,
        confidence: 0
      };
    }
  }

  /**
   * Clean code for preview generation
   */
  private cleanCode(code: string): string {
    return code
      .replace(/^```(?:jsx?|javascript|tsx?|typescript)?\n?/gm, '')
      .replace(/```$/gm, '')
      .replace(/^import\s+.*$/gm, '')
      .replace(/^export\s+.*$/gm, '')
      .trim();
  }

  /**
   * Extract JSX content from code
   */
  private extractJSX(code: string): string {
    // Try to find the return statement
    const returnMatch = code.match(/return\s*\(([\s\S]*?)\);?$/m);
    if (returnMatch) {
      return returnMatch[1].trim();
    }
    
    // Try to find JSX directly
    const jsxMatch = code.match(/(<[\s\S]+>)/);
    if (jsxMatch) {
      return jsxMatch[1];
    }
    
    return '';
  }

  /**
   * Extract Tailwind classes for preview styling
   */
  private extractTailwindClasses(jsx: string): string {
    const classRegex = /className=["']([^"']+)["']/g;
    const classes = new Set<string>();
    
    let match;
    while ((match = classRegex.exec(jsx)) !== null) {
      match[1].split(' ').forEach(cls => classes.add(cls));
    }
    
    // Generate basic CSS for common Tailwind classes
    // In production, this would use the actual Tailwind CSS processor
    return Array.from(classes).map(cls => {
      // Map common Tailwind classes to CSS
      const cssMap: Record<string, string> = {
        'flex': 'display: flex;',
        'flex-col': 'flex-direction: column;',
        'items-center': 'align-items: center;',
        'justify-center': 'justify-content: center;',
        'p-4': 'padding: 1rem;',
        'mt-4': 'margin-top: 1rem;',
        'text-center': 'text-align: center;',
        'font-bold': 'font-weight: bold;',
        'text-xl': 'font-size: 1.25rem;',
        'bg-blue-500': 'background-color: #3b82f6;',
        'text-white': 'color: white;',
        'rounded': 'border-radius: 0.25rem;',
        'shadow': 'box-shadow: 0 1px 3px rgba(0,0,0,0.1);',
        // Add more mappings as needed
      };
      
      return cssMap[cls] ? `.${cls} { ${cssMap[cls]} }` : '';
    }).filter(Boolean).join('\n');
  }

  /**
   * Generate simplified HTML preview
   */
  private generateHTML(jsx: string): string {
    // Very basic JSX to HTML conversion for preview
    // In production, use a proper JSX parser
    let html = jsx
      .replace(/className=/g, 'class=')
      .replace(/\{[^}]+\}/g, '[dynamic]') // Replace dynamic content
      .replace(/onClick=\{[^}]+\}/g, '') // Remove event handlers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return html;
  }

  /**
   * Calculate confidence score for preview
   */
  private calculateConfidence(code: string, isComplete: boolean): number {
    if (isComplete) return 1;
    
    let score = 0;
    
    // Check for component structure
    if (code.includes('return')) score += 0.3;
    if (/<\w+/.test(code) && /<\/\w+>/.test(code)) score += 0.3; // Has tags
    if (/className=/.test(code)) score += 0.2; // Has styling
    if (/\{.*\}/.test(code)) score += 0.1; // Has dynamic content
    if (code.length > 200) score += 0.1; // Substantial content
    
    return Math.min(score, 0.99);
  }

  /**
   * Reset the engine for a new stream
   */
  reset(): void {
    this.codeBuffer = '';
    this.tokenCount = 0;
    this.lastPreviewTime = 0;
  }
}

// Export singleton instance
export const streamingEngine = new AIStreamingEngine();