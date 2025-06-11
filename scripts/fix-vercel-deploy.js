#!/usr/bin/env node

/**
 * Script to diagnose and fix Vercel deployment issues
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Vercel Deployment Diagnostic Tool');
console.log('====================================\n');

// Check current git status
console.log('📊 Git Status:');
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  const ahead = execSync('git status -sb', { encoding: 'utf8' });
  
  console.log(`Current branch: ${branch}`);
  console.log(`Git status: ${status ? 'Uncommitted changes' : 'Clean'}`);
  console.log(`Branch status: ${ahead.split('\n')[0]}`);
} catch (error) {
  console.error('Git error:', error.message);
}

console.log('\n🔍 Vercel Configuration Check:');

// Check vercel.json
if (fs.existsSync('vercel.json')) {
  console.log('✅ vercel.json exists');
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  console.log('  Framework:', vercelConfig.framework || 'not specified');
  console.log('  Regions:', vercelConfig.regions || 'default');
} else {
  console.log('❌ vercel.json missing');
}

// Check for common issues
console.log('\n⚠️  Common Vercel Deployment Issues:');
console.log('1. Webhook might be paused or deleted');
console.log('2. Branch protection rules might be blocking');
console.log('3. Build might be failing silently');
console.log('4. Project might be paused due to usage limits');

console.log('\n🛠️  Solutions to Try:');
console.log('\n1. Check Vercel Dashboard:');
console.log('   - Go to: https://vercel.com/dashboard');
console.log('   - Select your project');
console.log('   - Check "Deployments" tab for any failed builds');
console.log('   - Check "Settings > Git" for webhook status');

console.log('\n2. Re-connect GitHub Integration:');
console.log('   - In Vercel project settings, go to "Git"');
console.log('   - Disconnect and reconnect GitHub repository');
console.log('   - Ensure webhook is created successfully');

console.log('\n3. Check Webhook in GitHub:');
console.log('   - Go to: https://github.com/ehudso7/vrux/settings/hooks');
console.log('   - Look for Vercel webhook');
console.log('   - Check "Recent Deliveries" for errors');
console.log('   - If missing, reconnect in Vercel');

console.log('\n4. Force a Deployment:');
console.log('   a) Through Vercel CLI:');
console.log('      npm i -g vercel');
console.log('      vercel --prod');
console.log('\n   b) Through Git (empty commit):');
console.log('      git commit --allow-empty -m "Trigger Vercel deployment"');
console.log('      git push origin main');
console.log('\n   c) Through Vercel Dashboard:');
console.log('      Use "Redeploy" button on last deployment');

console.log('\n5. Check Build Logs:');
console.log('   - In Vercel dashboard, click on failed deployment');
console.log('   - Check "Build Logs" for errors');
console.log('   - Common issues:');
console.log('     • Missing environment variables');
console.log('     • Build timeout (try reducing build size)');
console.log('     • Memory issues (already configured for 8GB)');

console.log('\n6. Verify Environment Variables:');
console.log('   Required variables in Vercel:');
const envExample = '.env.example';
if (fs.existsSync(envExample)) {
  const envVars = fs.readFileSync(envExample, 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0])
    .filter(Boolean);
  
  envVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

console.log('\n📝 Quick Fix Commands:');
console.log('\n# Force deployment with empty commit:');
console.log('git commit --allow-empty -m "Force Vercel deployment" && git push origin main');

console.log('\n# Check if webhook delivered:');
console.log('# Go to: https://github.com/ehudso7/vrux/settings/hooks');
console.log('# Click on Vercel webhook and check "Recent Deliveries"');

console.log('\n# Alternative: Use Vercel CLI');
console.log('npx vercel --prod');

console.log('\n✨ If the webhook is broken, the fastest fix is:');
console.log('1. Go to Vercel project settings > Git');
console.log('2. Disconnect GitHub repository');
console.log('3. Reconnect GitHub repository');
console.log('4. This will recreate the webhook');