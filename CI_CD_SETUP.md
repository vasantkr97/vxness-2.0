# CI/CD Setup Guide

This guide explains how to set up and use the CI/CD pipeline for Vxness 2.0.

## Overview

The pipeline consists of:
- **CI (Continuous Integration)**: Runs on every PR and push to `main`/`develop`
- **CD (Continuous Deployment)**: Deploys to DigitalOcean on push to `main`

## Pipeline Flow

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐
│ Pull Request│ ───▶ │   CI Check  │ ───▶ │ Merge to main    │
└─────────────┘      │ • Lint      │      └────────┬─────────┘
                     │ • Type-check│               │
                     │ • Build     │               ▼
                     └─────────────┘      ┌──────────────────┐
                                          │   CD Pipeline    │
                                          │ • Build Docker   │
                                          │ • Push to GHCR   │
                                          │ • Deploy to DO   │
                                          └──────────────────┘
```

## Required GitHub Secrets

Navigate to your repository → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

| Secret Name | Description |
|-------------|-------------|
| `DIGITALOCEAN_HOST` | Your DigitalOcean droplet IP address |
| `DIGITALOCEAN_USERNAME` | SSH username (usually `root`) |
| `DIGITALOCEAN_SSH_KEY` | Your private SSH key (entire contents) |
| `VITE_API_URL` | Production API URL (e.g., `https://api.yourdomain.com`) |
| `PRODUCTION_ENV` | Complete production .env file contents (see below) |

### PRODUCTION_ENV Contents

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-super-secure-password-here
POSTGRES_DB=vxness
JWT_SECRET=your-production-jwt-secret-here
REDIS_HOST=redis
REDIS_PORT=6379
```

> ⚠️ **Important**: Use strong, unique passwords for production!

## DigitalOcean Droplet Setup

### 1. Create a Droplet

- **Image**: Ubuntu 22.04 LTS
- **Size**: Minimum 2GB RAM / 1 vCPU (recommended: 4GB RAM / 2 vCPU)
- **Region**: Choose closest to your users
- **Authentication**: SSH Key

### 2. Initial Server Setup

SSH into your droplet and run:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt-get install docker-compose-plugin -y

# Create app directory
mkdir -p /opt/vxness
cd /opt/vxness

# Login to GitHub Container Registry
# Replace YOUR_GITHUB_USERNAME and YOUR_GITHUB_PAT
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 3. Create GitHub Personal Access Token (PAT)

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Generate new token with `read:packages` scope
3. Save this token and use it for docker login on your droplet

## First Deployment

After setting up secrets and the droplet, push to `main` to trigger deployment:

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

## Monitoring Deployments

### Check GitHub Actions
- Go to your repository → **Actions** tab
- View workflow runs and logs

### Check Server Status
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# View running containers
cd /opt/vxness
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f http-server
```

### Health Checks
```bash
# Check API health
curl http://YOUR_DROPLET_IP:3000/health

# Check web app
curl http://YOUR_DROPLET_IP
```

## Manual Deployment

If needed, you can manually trigger deployment:

1. Go to **Actions** → **CD** workflow
2. Click **Run workflow**
3. Select `main` branch
4. Click **Run workflow**

Or deploy directly on the server:

```bash
ssh root@YOUR_DROPLET_IP
cd /opt/vxness
docker compose pull
docker compose up -d
```

## Rollback

To rollback to a previous version:

```bash
ssh root@YOUR_DROPLET_IP
cd /opt/vxness

# Find previous image tag (SHA)
docker images ghcr.io/vasantkr97/vxness-http-server

# Update to specific version
export IMAGE_TAG=<previous-sha>
docker compose up -d
```

## Troubleshooting

### Build Failures
- Check the **Actions** tab for error logs
- Ensure all dependencies are properly installed
- Verify `bun.lock` is committed

### Deployment Failures
- Verify all GitHub secrets are set correctly
- Check droplet SSH access works manually
- Ensure droplet has enough disk space

### Service Not Starting
```bash
# Check container logs
docker compose logs <service-name>

# Check if ports are in use
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
```
