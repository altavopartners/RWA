# 🚀 Quick Start Guide - Hex-Port Platform

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- MetaMask browser extension
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd RWA

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

#### Server Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate a secure secret (min 32 characters)
- `STORACHA_SEED_HEX` - Your Storacha seed hex
- `W3_PROOF_BASE64` - Your Web3.Storage proof

#### Client Environment

```bash
cd client
cp .env.example .env.local
```

Edit `client/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:4000`

### 3. Database Setup

```bash
cd server

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### 4. Start Development Servers

#### Option A: Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up
```

Access:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- PostgreSQL: localhost:5432

#### Option B: Manual Start

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

**Terminal 3 - Database (if not using Docker):**

```bash
# Start PostgreSQL service
# Windows: Open Services and start PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

## 🧪 Testing Your Setup

### 1. Check Backend Health

```bash
curl http://localhost:4000/
# Should return: "Hex-Port backend is running"
```

### 2. Connect Wallet

- Open http://localhost:3000
- Click "Connect Wallet"
- Approve MetaMask connection
- Sign the authentication message

### 3. Browse Products

- Navigate to Marketplace
- View available products
- Add items to cart

## 📚 Common Commands

### Database Management

```bash
cd server

# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Development

```bash
# Server
cd server
npm run dev          # Start with nodemon (hot reload)
npm run build        # Build TypeScript

# Client
cd client
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # Lint code
```

## 🐛 Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
# Windows: Services → PostgreSQL
# macOS/Linux:
sudo systemctl status postgresql  # or
brew services list

# Test connection
psql -U postgres -d hexport
```

### Port Already in Use

```bash
# Kill process on port 4000 (backend)
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000 (frontend)
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Out of Sync

```bash
cd server
npx prisma generate
npm run dev
```

### MetaMask Connection Issues

1. Open MetaMask
2. Go to Settings → Advanced
3. Click "Clear activity tab data"
4. Refresh the page
5. Try connecting again

### IPFS Upload Failures

Check your Storacha credentials in `.env`:

```bash
# Verify these are set correctly:
STORACHA_SEED_HEX=...
EXPECTED_AGENT_DID=...
W3_PROOF_BASE64=...
```

## 🔐 Security Notes for Development

⚠️ **Never commit these files:**

- `.env`
- `.env.local`
- `node_modules/`
- Private keys

⚠️ **Default test wallets** (DO NOT use in production):

- Seeds contain test data with mock wallet addresses
- Reset and create new users for production

## 📖 Next Steps

1. Read the [API Documentation](./API_DOCUMENTATION.md) (if exists)
2. Review [Database Schema](./server/prisma/schema.prisma)
3. Check [Project Structure](./PROJECT_STRUCTURE.md) (if exists)
4. See [Testing Guide](./TESTING_GUIDE.md)

## 🆘 Need Help?

- Check existing [GitHub Issues](../../issues)
- Review [Comprehensive Code Audit](./COMPREHENSIVE_CODE_AUDIT.md)
- Contact the development team

## 🎯 Key Features to Test

1. **Authentication Flow**

   - Wallet connection
   - Profile updates
   - Session persistence

2. **Shopping Flow**

   - Browse products
   - Add to cart
   - Checkout process
   - Order tracking

3. **Bank Features** (if you have bank role)

   - Document validation
   - Order approvals
   - KYC reviews

4. **Producer Features**
   - Add products
   - View orders
   - Upload documents

---

**Happy Coding! 🚀**
