import ivm from 'isolated-vm';
import logger from './logger';

export interface SandboxOptions {
  timeout: number;
  memoryLimit?: number;
  allowedModules?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    hasStateManagement: boolean;
    hasEventHandlers: boolean;
    usesExternalResources: boolean;
    componentCount: number;
  };
}

// Safe execution sandbox for validating generated code
export class CodeSandbox {
  private static defaultOptions: SandboxOptions = {
    timeout: 5000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    allowedModules: ['react', 'framer-motion']
  };
  
  static async validateComponent(code: string, options?: Partial<SandboxOptions>): Promise<ValidationResult> {
    const sandboxOptions = { ...this.defaultOptions, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        hasStateManagement: false,
        hasEventHandlers: false,
        usesExternalResources: false,
        componentCount: 0
      }
    };
    
    try {
      // Static analysis first
      this.performStaticAnalysis(code, result);
      
      // If static analysis passes, do limited runtime validation
      if (result.errors.length === 0) {
        await this.performRuntimeValidation(code, sandboxOptions, result);
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error('Code sandbox validation failed', error instanceof Error ? error : null);
    }
    
    result.isValid = result.errors.length === 0;
    return result;
  }
  
  private static performStaticAnalysis(code: string, result: ValidationResult): void {
    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: 'Code contains eval() which is not allowed' },
      { pattern: /Function\s*\(/, message: 'Code contains Function constructor which is not allowed' },
      { pattern: /import\s+.*\s+from\s+['"](?!react|framer-motion)/, message: 'Imports from unauthorized modules detected' },
      { pattern: /<script/, message: 'Script tags are not allowed in components' },
      { pattern: /document\.(cookie|write)/, message: 'Direct DOM manipulation is not allowed' },
      { pattern: /window\.(location|open)/, message: 'Window navigation/manipulation is not allowed' },
      { pattern: /\.innerHTML\s*=/, message: 'innerHTML assignments are not allowed' },
      { pattern: /fetch\s*\(|axios|XMLHttpRequest/, message: 'External API calls are not allowed in generated components' }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        result.errors.push(message);
      }
    }
    
    // Check for required patterns
    if (!/export\s+(default|{)/.test(code)) {
      result.errors.push('Component must have an export statement');
    }
    
    if (!/import\s+React/.test(code) && !/from\s+['"]react['"]/.test(code)) {
      result.warnings.push('Component should import React');
    }
    
    // Analyze component structure
    const componentMatches = code.match(/(?:function|const)\s+(\w+)\s*(?:=|\()/g);
    result.metadata.componentCount = componentMatches ? componentMatches.length : 0;
    
    result.metadata.hasStateManagement = /useState|useReducer|useContext/.test(code);
    result.metadata.hasEventHandlers = /on[A-Z]\w+\s*=/.test(code);
    result.metadata.usesExternalResources = /fetch|axios|http/.test(code);
  }
  
  private static async performRuntimeValidation(
    code: string, 
    options: SandboxOptions, 
    result: ValidationResult
  ): Promise<void> {
    // Create a safe isolated VM environment
    const isolate = new ivm.Isolate({ memoryLimit: options.memoryLimit || 128 });
    
    try {
      const context = await isolate.createContext();
      const jail = context.global;
      
      // Set up safe globals
      await jail.set('console', {
        log: () => {},
        error: new ivm.Reference((msg: string) => result.warnings.push(`Runtime warning: ${msg}`)),
        warn: new ivm.Reference((msg: string) => result.warnings.push(`Runtime warning: ${msg}`))
      });
      
      await jail.set('React', {
        createElement: new ivm.Reference(() => ({})),
        useState: new ivm.Reference(() => [{}, () => {}]),
        useEffect: new ivm.Reference(() => {}),
        useCallback: new ivm.Reference(() => () => {}),
        useMemo: new ivm.Reference(() => ({}))
      });
      
      await jail.set('exports', {});
      
      // Wrap code to catch export
      const wrappedCode = `
        ${code}
        if (typeof exports.default === 'undefined' && Object.keys(exports).length === 0) {
          throw new Error('No component exported');
        }
      `;
      
      const script = await isolate.compileScript(wrappedCode);
      await script.run(context, { timeout: options.timeout });
      
    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(`Runtime validation failed: ${error.message}`);
      }
    } finally {
      // Clean up resources
      isolate.dispose();
    }
  }
  
  // Additional security checks
  static detectSensitivePatterns(code: string): string[] {
    const sensitivePatterns = [
      { pattern: /api[_-]?key/i, type: 'API Key' },
      { pattern: /secret/i, type: 'Secret' },
      { pattern: /password/i, type: 'Password' },
      { pattern: /token/i, type: 'Token' },
      { pattern: /private[_-]?key/i, type: 'Private Key' },
      { pattern: /\b[A-Za-z0-9+/]{40,}\b/, type: 'Potential encoded secret' }
    ];
    
    const detectedPatterns: string[] = [];
    
    for (const { pattern, type } of sensitivePatterns) {
      if (pattern.test(code)) {
        detectedPatterns.push(type);
      }
    }
    
    return detectedPatterns;
  }
}

// Content Security Policy generator for preview
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React preview
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "base-uri 'self'"
  ].join('; ');
}