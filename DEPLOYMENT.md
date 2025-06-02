# VRUX Deployment Guide

This guide covers deploying VRUX to various platforms and environments.

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Git repository (for automated deployments)

## Environment Setup

1. **Copy environment variables:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure required variables:**
   - `OPENAI_API_KEY`: Your OpenAI API key (required)
   - `NODE_ENV`: Set to `production` for production deployments
   - `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins

## Deployment Options

### 1. Vercel (Recommended)

The easiest way to deploy VRUX:

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard:**
   - Go to Project Settings > Environment Variables
   - Add your `OPENAI_API_KEY` and other variables

### 2. Netlify

1. **Build command:**

   ```bash
   npm run build
   ```

2. **Publish directory:** `.next`

3. **Environment variables:** Set in Netlify dashboard

### 3. Docker

1. **Create Dockerfile:**

   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**

   ```bash
   docker build -t vrux .
   docker run -p 3000:3000 --env-file .env vrux
   ```

### 4. Traditional VPS (Ubuntu/Debian)

1. **Install dependencies:**

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   ```

2. **Clone and setup:**

   ```bash
   git clone https://github.com/yourusername/vrux.git
   cd vrux
   npm install
   npm run build
   ```

3. **Configure PM2:**

   ```bash
   # Create ecosystem file
   pm2 init
   ```

   Edit `ecosystem.config.js`:

   ```javascript
   module.exports = {
     apps: [{
       name: 'vrux',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

4. **Start application:**

   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### 5. AWS/GCP/Azure

Use their respective Node.js deployment guides or container services:

- AWS: Elastic Beanstalk, ECS, or App Runner
- GCP: App Engine or Cloud Run
- Azure: App Service or Container Instances

## Production Checklist

### Security

- [ ] Set strong, unique `OPENAI_API_KEY`
- [ ] Configure `CORS_ALLOWED_ORIGINS` for your domain
- [ ] Enable HTTPS (handled automatically on most platforms)
- [ ] Review and adjust CSP headers in `next.config.ts`
- [ ] Set up rate limiting parameters

### Performance

- [ ] Enable caching headers
- [ ] Set up CDN (Cloudflare, AWS CloudFront)
- [ ] Configure proper logging retention
- [ ] Set up monitoring (see Monitoring section)

### Monitoring

- [ ] Health check endpoint: `GET /api/health`
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry - see below)
- [ ] Review logs regularly at `/logs` directory

### Error Tracking with Sentry (Optional)

1. **Install Sentry:**

   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure:** Run setup wizard:

   ```bash
   npx @sentry/wizard -i nextjs
   ```

3. **Add DSN to environment:**

   ```env
   SENTRY_DSN=your_sentry_dsn_here
   ```

## Post-Deployment

1. **Verify deployment:**
   - Check health endpoint: `https://yourdomain.com/api/health`
   - Test UI generation functionality
   - Verify CORS is working correctly

2. **Monitor logs:**
   - Check application logs for errors
   - Monitor request patterns
   - Review performance metrics

3. **Set up backups:**
   - Regular backups of environment configuration
   - Document any custom configurations

## Troubleshooting

### Common Issues

1. **"AI service is not configured properly"**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key has sufficient credits

2. **CORS errors**
   - Update `CORS_ALLOWED_ORIGINS` in environment
   - Restart application after changes

3. **Rate limiting issues**
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
   - Consider implementing user authentication

4. **Memory issues**
   - Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
   - Enable swap on VPS deployments

### Getting Help

- Check logs in `/logs` directory (production)
- Review health check endpoint response
- Enable development mode temporarily for detailed errors
- Open an issue on GitHub with deployment details

## Updates and Maintenance

1. **Regular updates:**

   ```bash
   git pull origin main
   npm install
   npm run build
   # Restart application
   ```

2. **Zero-downtime deployments:**
   - Use PM2 reload: `pm2 reload vrux`
   - Or rolling deployments on cloud platforms

3. **Database migrations:**
   - Currently not required (stateless application)
   - Future versions may require migration scripts

Remember to always test in a staging environment before deploying to production!
