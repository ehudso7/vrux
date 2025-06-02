import { z } from 'zod';

// Prompt validation schema
export const promptSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt must not exceed 2000 characters')
    .refine((val) => !containsMaliciousPatterns(val), {
      message: 'Prompt contains potentially harmful content'
    }),
  model: z.enum(['gpt-4o', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(4000).optional()
});

// Malicious pattern detection
function containsMaliciousPatterns(text: string): boolean {
  const maliciousPatterns = [
    /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi,
    /(javascript:)/gi,
    /(eval\s*\()/gi,
    /(document\.cookie)/gi,
    /(window\.location)/gi,
    /(innerHTML\s*=)/gi,
    /(__proto__|constructor|prototype)/gi,
    /(require\s*\(['"]child_process['"]\))/gi,
    /(process\.env)/gi,
    /(fs\.|require\(['"]fs['"]\))/gi
  ];

  return maliciousPatterns.some(pattern => pattern.test(text));
}

// Sanitize generated code
export function sanitizeGeneratedCode(code: string): string {
  // Remove any script tags
  code = code.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  
  // Remove event handlers that could execute code
  code = code.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  code = code.replace(/javascript:[^"'\s]*/gi, '#');
  
  // Ensure no direct DOM manipulation
  code = code.replace(/(document\.|window\.|eval\(|Function\()/gi, '');
  
  return code;
}

// Validate generated component code
export function validateGeneratedComponent(code: string): {
  isValid: boolean;
  errors: string[];
  sanitized: string;
} {
  const errors: string[] = [];
  
  // For react-live, we don't need imports or exports
  // Check if it's a valid function component
  if (!code.includes('return') && !code.includes('=>')) {
    errors.push('Component must return JSX');
  }
  
  // Check for malicious patterns
  if (containsMaliciousPatterns(code)) {
    errors.push('Code contains potentially harmful patterns');
  }
  
  // Check for valid JSX
  const jsxPattern = /<(\w+)([^>]*)>/;
  if (!jsxPattern.test(code)) {
    errors.push('No valid JSX elements found');
  }
  
  // Sanitize the code
  const sanitized = sanitizeGeneratedCode(code);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many generation requests. Please try again later.'
};

// Performance thresholds
export const performanceThresholds = {
  maxGenerationTime: 30000, // 30 seconds
  maxTokens: 2000,
  maxRetries: 3
};

// Security headers for API responses
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};