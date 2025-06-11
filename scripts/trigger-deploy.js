#!/usr/bin/env node

/**
 * Script to manually trigger deployments on Vercel and Render
 * Usage: node scripts/trigger-deploy.js [vercel|render|all]
 */

const https = require('https');

// Configuration - You'll need to add these to your environment
const config = {
  vercel: {
    deployHook: process.env.VERCEL_DEPLOY_HOOK, // Get from Vercel project settings
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID,
  },
  render: {
    deployHook: process.env.RENDER_DEPLOY_HOOK, // Get from Render service settings
    serviceId: process.env.RENDER_SERVICE_ID,
  }
};

function triggerVercelDeploy() {
  if (!config.vercel.deployHook) {
    console.error('❌ VERCEL_DEPLOY_HOOK not configured');
    console.log('Get it from: https://vercel.com/[your-team]/[your-project]/settings/git');
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    console.log('🚀 Triggering Vercel deployment...');
    
    const url = new URL(config.vercel.deployHook);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Vercel deployment triggered successfully');
          resolve(true);
        } else {
          console.error('❌ Vercel deployment failed:', res.statusCode, data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Vercel deployment error:', err.message);
      resolve(false);
    });

    req.write(JSON.stringify({
      ref: 'main',
      force: true
    }));
    req.end();
  });
}

function triggerRenderDeploy() {
  if (!config.render.deployHook) {
    console.error('❌ RENDER_DEPLOY_HOOK not configured');
    console.log('Get it from: https://dashboard.render.com/services/[service-id]/settings');
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    console.log('🚀 Triggering Render deployment...');
    
    const url = new URL(config.render.deployHook);
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Render deployment triggered successfully');
          resolve(true);
        } else {
          console.error('❌ Render deployment failed:', res.statusCode, data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Render deployment error:', err.message);
      resolve(false);
    });
  });
}

async function main() {
  const target = process.argv[2] || 'all';
  
  console.log('🔧 VRUX Deployment Trigger');
  console.log('========================\n');

  if (target === 'vercel' || target === 'all') {
    await triggerVercelDeploy();
  }

  if (target === 'render' || target === 'all') {
    await triggerRenderDeploy();
  }

  console.log('\n✨ Deployment trigger complete');
  
  if (!config.vercel.deployHook && !config.render.deployHook) {
    console.log('\n📝 To set up automatic deployments:');
    console.log('\nFor Vercel:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings > Git');
    console.log('4. Ensure GitHub integration is connected');
    console.log('5. Get deploy hook from Settings > Git > Deploy Hooks');
    console.log('\nFor Render:');
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. Create a new Web Service');
    console.log('3. Connect to GitHub repo: https://github.com/ehudso7/vrux');
    console.log('4. Select main branch');
    console.log('5. Get deploy hook from service Settings');
  }
}

main().catch(console.error);