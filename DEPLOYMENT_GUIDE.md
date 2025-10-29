# 🚀 Deployment Guide - RWA Platform

## Table of Contents

1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)
7. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Requirements

### System Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v8.0.0 or higher
- **Docker:** (optional, for containerized deployment)
- **PostgreSQL:** v12 or higher
- **Git:** for version control

### Access Requirements

- [ ] Production database credentials
- [ ] Hedera testnet/mainnet account credentials
- [ ] AWS/Azure/your-cloud-provider credentials (if using cloud)
- [ ] Domain name configured
- [ ] SSL/TLS certificates ready
- [ ] API endpoint URLs updated

### Code Requirements

- [ ] All branches merged to main
- [ ] Version bumped in package.json
- [ ] Release notes prepared
- [ ] CHANGELOG updated
- [ ] All tests passing

---

## Environment Setup

### 1. Update Client Environment

**File:** `client/.env`

```env
# Development (for local testing)
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:4000

# Production (update before deployment)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 2. Update Server Environment

**File:** `server/.env`

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@host:5432/hexport

# JWT Security (⚠️ UPDATE WITH SECURE VALUE)
JWT_SECRET=your-super-secure-production-secret-key-here-min-32-chars

# Hedera Configuration
HEDERA_NETWORK=testnet  # or mainnet for production
HEDERA_ACCOUNT_ID=0.0.your-account-id
HEDERA_PRIVATE_KEY=your-private-key-in-env
HEDERA_OPERATOR_ID=0.0.your-operator-id
HEDERA_OPERATOR_KEY=your-operator-key

# IPFS/Storacha
IPFS_GATEWAY_URL=https://up.storacha.network
W3_SPACE_DID=did:key:your-space-did
W3_PRIVATE_KEY=your-w3-private-key
```

### 3. Database Setup

```bash
# 1. Ensure PostgreSQL is running
# 2. Create production database
psql -U postgres -c "CREATE DATABASE hexport_prod;"

# 3. Run migrations
cd server
npx prisma migrate deploy

# 4. (Optional) Seed with initial data
npx prisma db seed
```

---

## Build Process

### Option 1: Local Builds (for testing)

#### Build Server

```bash
cd server
npm install  # if not already done
npm run build

# Output: dist/ directory
```

#### Build Client

```bash
cd client
npm install  # if not already done
npm run build

# Output: .next/ directory
```

#### Test Locally

```bash
# Terminal 1: Start server
cd server
npm start

# Terminal 2: Start client
cd client
npm start
```

### Option 2: Docker Build (recommended for production)

#### Build Client Docker Image

```bash
cd client
docker build -t rwa-client:latest -t rwa-client:v1.0.0 .
```

#### Build Server Docker Image

```bash
cd server
docker build -t rwa-server:latest -t rwa-server:v1.0.0 .
```

#### Build with Docker Compose

```bash
docker-compose build
```

#### Push to Registry (if using container registry)

```bash
# Example with Docker Hub
docker tag rwa-client:latest yourusername/rwa-client:latest
docker push yourusername/rwa-client:latest

docker tag rwa-server:latest yourusername/rwa-server:latest
docker push yourusername/rwa-server:latest
```

---

## Deployment Options

### Option A: Heroku (Simple)

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login to Heroku
heroku login

# 3. Create apps
heroku create rwa-client
heroku create rwa-server

# 4. Set environment variables
heroku config:set NODE_ENV=production -a rwa-server
heroku config:set JWT_SECRET=your-secure-secret -a rwa-server
# ... set all required env vars

# 5. Deploy
git push heroku main

# 6. Run migrations
heroku run "npm run migrate" -a rwa-server

# 7. View logs
heroku logs --tail
```

### Option B: AWS (Advanced)

#### Using EC2

```bash
# 1. Launch EC2 instances (one for server, one for client)
# 2. Install Node.js on both
# 3. Clone repository
# 4. Install dependencies
# 5. Build applications
# 6. Start with PM2 or systemd

# Install PM2
npm install -g pm2

# Start server
pm2 start "npm start" --name "rwa-server" -cwd /path/to/server

# Start client
pm2 start "npm start" --name "rwa-client" -cwd /path/to/client

# Setup auto-start
pm2 startup
pm2 save
```

#### Using ECS + Docker

```bash
# 1. Push Docker images to ECR
# 2. Create ECS cluster
# 3. Define task definitions
# 4. Create services
# 5. Configure load balancer
# 6. Set up auto-scaling
```

### Option C: Docker Compose (Self-hosted)

```bash
# 1. Prepare production .env files
cp client/.env.example client/.env.production
cp server/.env.example server/.env.production

# 2. Update environment variables
nano client/.env.production
nano server/.env.production

# 3. Build and start
docker-compose -f docker-compose.yml up -d

# 4. View logs
docker-compose logs -f

# 5. Monitor
docker-compose ps
```

### Option D: DigitalOcean / Render / Railway (Managed)

These platforms typically offer:

- Git-based deployments
- Automatic builds on push
- Environment variable management
- Auto-scaling (some platforms)
- CDN integration

**General steps:**

1. Connect your Git repository
2. Configure environment variables
3. Set build and start commands
4. Deploy

---

## Verification Steps

### 1. Health Checks

```bash
# Check server health
curl http://your-server-url/health

# Check client loads
curl http://your-client-url

# Check database connection
# Add health endpoint that queries database
```

### 2. API Endpoints Verification

```bash
# Test authentication
curl -X POST http://your-server-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test marketplace
curl http://your-server-url/api/products

# Test blockchain integration
curl http://your-server-url/api/escrow/status
```

### 3. Database Verification

```bash
# SSH into database server
psql -U your_user -d hexport_prod -c "SELECT COUNT(*) FROM users;"

# Check migrations status
psql -U your_user -d hexport_prod -c "SELECT * FROM _prisma_migrations;"
```

### 4. Frontend Verification

Open your browser and test:

- [ ] Home page loads
- [ ] Navigation works
- [ ] Authentication flow
- [ ] Marketplace browsing
- [ ] Shopping cart functionality
- [ ] Checkout process
- [ ] User profile
- [ ] Document upload
- [ ] Blockchain features

---

## Troubleshooting

### Issue: Build Fails

**Solution:**

```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check ESLint
npm run lint
```

### Issue: Database Connection Error

**Solution:**

```bash
# Verify credentials
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
npx prisma migrate status

# Run migrations
npx prisma migrate deploy
```

### Issue: Environment Variables Not Loaded

**Solution:**

```bash
# Verify .env file exists and has correct permissions
ls -la .env

# Check if variables are set
echo $NODE_ENV
echo $JWT_SECRET

# For Docker, verify in Dockerfile:
# Ensure ENV or --build-arg is used correctly
docker run -e NODE_ENV=production rwa-server:latest
```

### Issue: Port Already in Use

**Solution:**

```bash
# Find process using port
lsof -i :4000  # Linux/Mac
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=5000 npm start
```

### Issue: Out of Memory

**Solution:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Check memory usage
node --v8-prof-processing
```

---

## Post-Deployment

### Immediate Actions (First Hour)

```bash
# 1. Monitor error logs
tail -f /var/log/rwa-server.log

# 2. Check system health
curl http://your-server-url/health

# 3. Verify database
psql -d hexport_prod -c "SELECT COUNT(*) FROM users;"

# 4. Test critical flows
# - User login
# - Product viewing
# - Cart functionality
# - Payment processing
```

### Continuous Monitoring

Set up monitoring for:

- [ ] Server error rate
- [ ] Response times
- [ ] Database query performance
- [ ] Memory usage
- [ ] Disk usage
- [ ] Blockchain transaction success rate

### Backup Strategy

```bash
# Database backup
pg_dump -U your_user hexport_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automate with cron
# 0 2 * * * pg_dump -U your_user hexport_prod > /backups/backup_$(date +\%Y\%m\%d).sql

# Verify backup
pg_restore -l backup_20240101_000000.sql
```

### Logging & Monitoring Setup

```bash
# Using Winston (already configured)
# Logs automatically saved to ./logs/

# Set up external monitoring
# - Sentry for error tracking
# - New Relic for performance
# - CloudWatch for AWS
# - Datadog for comprehensive monitoring
```

---

## Rollback Procedure

If issues occur after deployment:

```bash
# 1. Identify the issue
tail -f /var/log/rwa-server.log

# 2. Stop current deployment
docker-compose down
# or
systemctl stop rwa-server

# 3. Checkout previous version
git checkout <previous-stable-commit>

# 4. Rebuild
npm run build

# 5. Database rollback (if schema changed)
npx prisma migrate resolve --rolled-back <migration-name>

# 6. Restart
npm start

# 7. Verify
curl http://localhost:4000/health
```

---

## Success Indicators

After deployment, verify:

✅ **Server Status**

- Responds to health checks
- Accepts API requests
- Database queries work
- No error rate spike

✅ **Client Status**

- Pages load correctly
- No console errors
- API calls successful
- Responsive design works

✅ **User Experience**

- Login/logout works
- Navigation smooth
- Transactions process
- Documents upload
- Blockchain operations work

✅ **Performance**

- Page load time < 2s
- API response time < 500ms
- No memory leaks
- CPU usage stable

---

## Support Contacts

**For Issues:**

- **Development:** tech-team@yourdomain.com
- **DevOps:** devops@yourdomain.com
- **Security:** security@yourdomain.com
- **Emergency:** On-call engineer phone number

**Documentation:**

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

---

**Last Updated:** 2024
**Version:** 1.0.0

Good luck with your deployment! 🚀
