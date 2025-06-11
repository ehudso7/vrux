#!/usr/bin/env node

/**
 * Check deployment status and provide connection instructions
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🔍 VRUX Deployment Status Check');
console.log('================================\n');

// Check Git status
console.log('📦 Git Repository Status:');
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  const lastCommit = execSync('git log -1 --pretty=format:"%h - %s"', { encoding: 'utf8' });
  const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  
  console.log(`Branch: ${branch}`);
  console.log(`Last commit: ${lastCommit}`);
  console.log(`Remote: ${remote}`);
  console.log('✅ Git repository is configured correctly\n');
} catch (error) {
  console.error('❌ Git error:', error.message);
}

// Check for deployment configurations
console.log('📋 Deployment Configurations:');
const fs = require('fs');

if (fs.existsSync('vercel.json')) {
  console.log('✅ vercel.json found');
} else {
  console.log('❌ vercel.json missing');
}

if (fs.existsSync('render.yaml')) {
  console.log('✅ render.yaml found');
} else {
  console.log('❌ render.yaml missing');
}

console.log('\n🚀 Deployment Platform Setup Instructions:\n');

console.log('VERCEL:');
console.log('-------');
console.log('1. Go to https://vercel.com/new');
console.log('2. Import Git Repository');
console.log('3. Select: https://github.com/ehudso7/vrux');
console.log('4. Configure Project:');
console.log('   - Framework Preset: Next.js');
console.log('   - Root Directory: ./');
console.log('   - Build Command: npm run build');
console.log('   - Output Directory: .next');
console.log('5. Add Environment Variables from .env.example');
console.log('6. Deploy\n');

console.log('RENDER:');
console.log('-------');
console.log('1. Go to https://dashboard.render.com/new/web');
console.log('2. Connect GitHub account if not already connected');
console.log('3. Select repository: ehudso7/vrux');
console.log('4. Service will auto-configure from render.yaml');
console.log('5. Create Environment Group "vrux-env" with variables from .env.example');
console.log('6. Deploy\n');

console.log('🔗 Webhook Verification:');
console.log('------------------------');
console.log('After connecting the services, check GitHub webhooks:');
console.log('1. Go to: https://github.com/ehudso7/vrux/settings/hooks');
console.log('2. You should see webhooks from both Vercel and Render');
console.log('3. Each webhook should show recent deliveries on push events\n');

console.log('🌐 Expected URLs after deployment:');
console.log('Vercel: https://vrux.vercel.app or custom domain');
console.log('Render: https://vrux.onrender.com\n');

console.log('💡 Troubleshooting:');
console.log('- If deployments don\'t trigger, check webhook delivery status');
console.log('- Ensure main branch protection rules allow deployments');
console.log('- Verify all required environment variables are set');
console.log('- Check deployment logs on each platform for errors');