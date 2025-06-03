// Centralized configuration
export const config = {
  api: {
    openai: {
      key: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o',
      maxTokens: 2000,
    },
    anthropic: {
      key: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-opus-20240229',
      maxTokens: 2000,
    },
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: 'VRUX',
    description: 'AI-powered React component generator',
  },
  features: {
    enableViewComfy: process.env.NEXT_PUBLIC_ENABLE_VIEWCOMFY === 'true',
    enableCache: process.env.NEXT_PUBLIC_ENABLE_CACHE !== 'false',
    enableQualityChecks: process.env.NEXT_PUBLIC_ENABLE_QUALITY_CHECKS !== 'false',
  },
  limits: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
    },
    generation: {
      maxTime: parseInt(process.env.MAX_GENERATION_TIME_MS || '30000'),
      maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
    },
  },
};

// Validate critical configuration
export function validateConfig() {
  const errors: string[] = [];
  
  if (!config.api.openai.key && process.env.NODE_ENV === 'production') {
    errors.push('OPENAI_API_KEY is required in production');
  }
  
  if (!config.auth.sessionSecret || config.auth.sessionSecret === 'dev-secret-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      errors.push('SESSION_SECRET must be set to a secure value in production');
    }
  }
  
  return errors;
}