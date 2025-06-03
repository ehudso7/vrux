#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Skip all checks in Vercel/CI environments
if (process.env.VERCEL || process.env.CI || process.env.NODE_ENV === 'production') {
  console.log('✅ Running in production/CI environment - skipping local env checks');
  process.exit(0);
}

// Required environment variables for local development
const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
];

console.log('🔍 Checking environment variables for local development...\n');

// Check for .env.local in development only
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('📝 Please create a .env.local file based on .env.example');
  console.log('   Run: cp .env.example .env.local');
  process.exit(1);
}

// Load environment variables from .env.local
require('dotenv').config({ path: envPath });

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
REQUIRED_ENV_VARS.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.error(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

// Validate OpenAI API key format
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
  console.error('\n❌ OPENAI_API_KEY format appears to be invalid');
  console.log('   OpenAI API keys should start with "sk-"');
  hasErrors = true;
}

if (hasErrors) {
  console.log('\n❌ Environment check failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
}