# Docker Setup for VRUX

This guide will help you run VRUX in Docker for full testing and deployment.

## Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- At least 4GB of free disk space
- Port 3000 available

## Quick Start

### Option 1: Using the Helper Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x docker-run.sh

# Run the script
./docker-run.sh
```

The script will guide you through:
1. Creating an .env file if needed
2. Building the Docker image
3. Running VRUX in your chosen mode

### Option 2: Manual Docker Commands

#### For Production Mode:

```bash
# 1. Copy environment template
cp .env.docker .env

# 2. Edit .env and add your API keys (optional)
# nano .env

# 3. Build and run
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Stop when done
docker-compose down
```

#### For Development Mode (with hot reload):

```bash
# Run with hot reload enabled
docker-compose -f docker-compose.dev.yml up
```

## Configuration

### Environment Variables

Edit the `.env` file to configure:

```env
# AI Provider Keys (Optional - app works without them using mock provider)
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Note**: If no API keys are provided, VRUX will use the mock provider which demonstrates functionality without actual AI generation.

### Docker Compose Settings

The `docker-compose.yml` file includes:
- Health checks
- Resource limits (2GB memory, 2 CPUs)
- Automatic restart
- Log volume mounting

## Testing the Application

Once running, you can test VRUX:

1. **Open Browser**: Navigate to http://localhost:3000

2. **Test Features**:
   - Generate UI components (uses mock provider if no API keys)
   - Upload images for analysis
   - Use database designer
   - Test authentication builders
   - Try deployment features

3. **Check Health**: 
   ```bash
   curl http://localhost:3000/api/health
   ```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Ensure port 3000 is free
lsof -i :3000
```

### Build fails

```bash
# Clean and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### API keys not working

1. Ensure keys are correctly set in `.env`
2. Restart containers after changing environment variables:
   ```bash
   docker-compose restart
   ```

### Out of memory

Increase Docker Desktop memory allocation:
- Docker Desktop → Settings → Resources → Memory → Increase to 4GB+

## Production Deployment

For production deployment:

1. **Set Production Environment**:
   ```bash
   # In docker-compose.yml or .env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. **Configure CORS**:
   ```bash
   CORS_ALLOWED_ORIGINS=https://your-domain.com
   ```

3. **Use Docker Swarm or Kubernetes** for scaling

4. **Add Redis** for distributed rate limiting:
   - Uncomment Redis service in docker-compose.yml
   - Configure Redis connection in application

## Monitoring

### View Logs
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f vrux
```

### Check Resource Usage
```bash
docker stats
```

### Access Container Shell
```bash
docker-compose exec vrux sh
```

## Cleanup

### Stop and Remove Containers
```bash
docker-compose down
```

### Remove Everything (including images and volumes)
```bash
docker-compose down -v --rmi all
```

## Advanced Configuration

### Custom Network
```yaml
networks:
  vrux-network:
    driver: bridge
```

### External Database
```yaml
services:
  vrux:
    environment:
      DATABASE_URL: postgresql://user:pass@host:5432/db
```

### SSL/TLS
Use a reverse proxy like Nginx or Traefik for SSL termination.

## Security Notes

1. **Never commit .env files** with real API keys
2. **Use secrets management** in production (Docker Secrets, Kubernetes Secrets)
3. **Regularly update** base images for security patches
4. **Scan images** for vulnerabilities: `docker scan vrux-app`

## Support

If you encounter issues:
1. Check application logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure Docker has sufficient resources
4. Check the [Troubleshooting Guide](/docs/TROUBLESHOOTING_GUIDE.md)

---

**Ready to test VRUX!** 🚀 Run `./docker-run.sh` to get started.