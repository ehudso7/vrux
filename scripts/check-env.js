#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
];

// Optional but recommended
const OPTIONAL_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_VERCEL_ANALYTICS_ID',
  'NEXT_PUBLIC_ENABLE_VIEWCOMFY',
  'NEXT_PUBLIC_ENABLE_CACHE',
  'NEXT_PUBLIC_ENABLE_QUALITY_CHECKS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'MAX_GENERATION_TIME_MS',
  'MAX_TOKENS',
  'LOG_LEVEL',
  'LOG_FILE_PATH',
  'SESSION_SECRET'
];

console.log('🔍 Checking environment variables...\n');

// Check if we're in Vercel/production environment
const isVercel = process.env.VERCEL || process.env.CI;
const isProduction = process.env.NODE_ENV === 'production';

if (!isVercel && !isProduction) {
  // Only check for .env.local in development
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.log('📝 Please create a .env.local file based on .env.example');
    console.log('   Run: cp .env.example .env.local');
    process.exit(1);
  }
  
  // Load environment variables from .env.local in development
  require('dotenv').config({ path: envPath });
}

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
REQUIRED_ENV_VARS.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    // Mask the value for security
    const masked = value.length > 14 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
      : '***';
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.error(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

console.log('\n📋 Optional Variables:');
OPTIONAL_ENV_VARS.forEach(varName => {
  if (process.env[varName]) {
    // Don't show full values for sensitive data
    const value = varName.includes('SECRET') || varName.includes('KEY') 
      ? '***' 
      : process.env[varName];
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  }
});

// Validate OpenAI API key format
if (process.env.OPENAI_API_KEY) {
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('\n❌ OPENAI_API_KEY format appears to be invalid');
    console.log('   OpenAI API keys should start with "sk-"');
    hasErrors = true;
  }
}

// Check for exposed keys
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.includes('xxx')) {
  console.error('\n❌ OPENAI_API_KEY appears to be a placeholder');
  console.log('   Please replace it with your actual API key');
  hasErrors = true;
}

if (hasErrors) {
  console.log('\n❌ Environment check failed! Please fix the issues above.');
  if (isVercel) {
    console.log('\n📝 In Vercel: Add environment variables in Settings → Environment Variables');
  }
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log(`🚀 Running in ${isProduction ? 'production' : 'development'} mode`);
}