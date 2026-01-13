# MedWard Deployment Guide

Complete guide for deploying MedWard in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Management](#database-management)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- Node.js 18+
- npm or yarn
- OpenAI API key
- Google Cloud account (for Vision API)

### Optional
- Docker & Docker Compose (for containerized deployment)
- Google Drive API credentials (for backup/sync)

---

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/medward.git
cd medward
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
OPENAI_API_KEY=sk-your-key-here
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### 3. Initialize Database

```bash
npm run db:init
```

### 4. Start Development Server

```bash
npm run dev
```

Access the app at `http://localhost:3000`

---

## Docker Deployment

### Quick Start

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f medward

# Stop
docker-compose down
```

### Custom Build

```bash
# Build image
docker build -t medward:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -v medward_data:/app/data \
  --env-file .env.local \
  --name medward \
  medward:latest
```

### Production with Docker

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  medward:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - medward_data:/app/data
      - medward_logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - medward

volumes:
  medward_data:
  medward_logs:
```

---

## Production Deployment

### Option 1: Vercel (Recommended for serverless)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

**Note**: Vercel's serverless functions have limitations with SQLite. Consider using a hosted database or alternative deployment.

### Option 2: AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/your-repo/medward.git
cd medward
npm install
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start npm --name "medward" -- start

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

### Option 3: DigitalOcean App Platform

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Option 4: Self-hosted VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/your-repo/medward.git
cd medward

# Configure environment
cp .env.example .env.local
nano .env.local  # Edit with your values

# Start with Docker Compose
docker-compose up -d

# Setup automatic updates (optional)
sudo crontab -e
# Add: 0 2 * * * cd /path/to/medward && git pull && docker-compose up -d --build
```

---

## Environment Variables

### Critical Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4 |
| `GOOGLE_CLOUD_CREDENTIALS` | ✅ | Google Cloud Vision credentials |
| `JWT_SECRET` | ✅ | Secret for JWT token signing (min 32 chars) |
| `ENCRYPTION_KEY` | ✅ | Key for data encryption (32 bytes hex) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL of application |
| `DATABASE_PATH` | `./data/medward.db` | Path to main database |
| `RATE_LIMIT_API` | `60` | API requests per minute per user |
| `ENABLE_GOOGLE_DRIVE_SYNC` | `true` | Enable Drive backup |

### Generate Secure Keys

```bash
# JWT Secret
openssl rand -hex 32

# Encryption Key
openssl rand -hex 32
```

---

## Database Management

### Initialize Database

```bash
npm run db:init
```

### Backup Database

```bash
# Manual backup
cp data/medward.db backups/medward_$(date +%Y%m%d).db

# Automated backup script
./scripts/backup.sh
```

### Restore Database

```bash
cp backups/medward_20240115.db data/medward.db
```

### Migrations

```bash
npm run db:migrate
```

---

## Security Checklist

### Before Deployment

- [ ] Change all default secrets (JWT_SECRET, ENCRYPTION_KEY)
- [ ] Enable HTTPS/TLS
- [ ] Set secure CORS origins
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Review HIPAA compliance requirements
- [ ] Setup backup strategy
- [ ] Configure firewall rules
- [ ] Enable automatic security updates

### Production Best Practices

```bash
# 1. Use strong secrets
JWT_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# 2. Restrict file permissions
chmod 600 .env.local
chmod 700 data/

# 3. Setup SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com

# 4. Configure fail2ban
sudo apt-get install fail2ban
```

### HIPAA Compliance

If handling real patient data:

1. **Encryption**: All data encrypted at rest and in transit
2. **Access Control**: Unique user authentication
3. **Audit Logging**: All access logged with timestamps
4. **Backup**: Regular encrypted backups
5. **BAA**: Business Associate Agreement with OpenAI and Google

---

## Troubleshooting

### Database Locked Error

```bash
# Check for other processes
lsof data/medward.db

# Fix WAL mode issues
sqlite3 data/medward.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

### OpenAI API Rate Limits

```javascript
// Adjust in .env.local
RATE_LIMIT_AI=10  # Reduce if hitting limits
```

### Google Cloud Vision Errors

```bash
# Test credentials
node -e "
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
});
console.log('Credentials valid');
"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Out of Memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

---

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

### View Logs

```bash
# Docker
docker-compose logs -f medward

# PM2
pm2 logs medward

# Systemd
journalctl -u medward -f
```

### Database Stats

```bash
sqlite3 data/medward.db "SELECT COUNT(*) FROM users;"
sqlite3 data/medward.db "SELECT COUNT(*) FROM reports;"
sqlite3 data/knowledge.db "SELECT COUNT(*) FROM knowledge;"
```

---

## Maintenance

### Update Application

```bash
git pull
npm install
npm run build
pm2 restart medward
```

### Clean Up Old Logs

```bash
find logs/ -name "*.log" -mtime +30 -delete
```

### Optimize Database

```bash
sqlite3 data/medward.db "VACUUM;"
sqlite3 data/knowledge.db "VACUUM;"
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/medward/issues
- Documentation: https://docs.medward.app
- Email: support@medward.app

---

*Last updated: 2024-01-15*
