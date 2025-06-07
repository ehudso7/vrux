import type { EnvironmentVariables } from './types';

/**
 * Environment variable validation
 */
const requiredEnvVars: Partial<EnvironmentVariables> = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

const optionalEnvVars: Partial<EnvironmentVariables> = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NODE_ENV: (process.env.NODE_ENV as EnvironmentVariables['NODE_ENV']) || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://vrux.dev' : 'http://localhost:3000'),
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  NETLIFY_TOKEN: process.env.NETLIFY_TOKEN,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  VIEWCOMFY_API_URL: process.env.VIEWCOMFY_API_URL || process.env.VIEWCOMFY_INFER_URL,
  VIEWCOMFY_CLIENT_ID: process.env.VIEWCOMFY_CLIENT_ID,
  VIEWCOMFY_CLIENT_SECRET: process.env.VIEWCOMFY_CLIENT_SECRET,
  TEST_URL: process.env.TEST_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
  MAX_GENERATION_TIME_MS: process.env.MAX_GENERATION_TIME_MS,
  MAX_TOKENS: process.env.MAX_TOKENS,
  NEXT_PUBLIC_ENABLE_VIEWCOMFY: process.env.NEXT_PUBLIC_ENABLE_VIEWCOMFY,
  NEXT_PUBLIC_ENABLE_CACHE: process.env.NEXT_PUBLIC_ENABLE_CACHE,
  NEXT_PUBLIC_ENABLE_QUALITY_CHECKS: process.env.NEXT_PUBLIC_ENABLE_QUALITY_CHECKS,
  VERCEL_API_URL: process.env.VERCEL_API_URL,
  NETLIFY_API_URL: process.env.NETLIFY_API_URL,
};

/**
 * Validate required environment variables
 */
export function validateEnv(): EnvironmentVariables {
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\n📝 Copy .env.example to .env.local and fill in the values');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  return {
    ...requiredEnvVars,
    ...optionalEnvVars,
  } as EnvironmentVariables;
}

// Export validated environment variables
export const env = validateEnv(); 