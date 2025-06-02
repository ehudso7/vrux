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