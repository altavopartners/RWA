# Judge Credentials & Testing Instructions

## 🎯 Quick Start for Hackathon Judges

**Estimated Setup Time: ~10 minutes**

This guide provides everything judges need to evaluate the RWA project, including test credentials, setup instructions, and verification steps.

---

## 📦 What You'll Receive

In the **DoraHacks submission notes**, you will find:

1. **Treasury Account Details**

   - Account ID: `0.0.6370373`
   - Private Key (ED25519, HEX format)
   - Supply Key (for NFT minting)

2. **Database Seed Data**

   - Pre-populated test users
   - Sample products
   - Test orders for flow verification

3. **Testnet Access**
   - All transactions on Hedera Testnet (free, not mainnet)
   - Real Hedera NFTs minted during testing
   - Verifiable via public block explorer

---

## 🚀 Setup Instructions (10 Minutes)

### Prerequisites Check (1 minute)

Ensure you have:

- [ ] Git installed
- [ ] Node.js v18+ (`node --version`)
- [ ] npm or bun (`npm --version`)
- [ ] PostgreSQL installed OR Docker available
- [ ] A code editor (VS Code recommended)

### Step 1: Clone Repository (2 minutes)

```bash
git clone https://github.com/altavopartners/RWA.git
cd RWA
```

**Verify:**

```bash
ls -la
# Should show: client/, server/, hedera-escrow/, docker-compose.yml, package.json
```

### Step 2: Install Dependencies (3 minutes)

```bash
# Install all workspace packages
npm install --workspaces

# Or install individually:
cd client && npm install && cd ..
cd server && npm install && cd ..
cd hedera-escrow && npm install && cd ..
```

**Verify:**

```bash
npm list | head -20
# Should show multiple packages listed
```

### Step 3: Configure Environment (2 minutes)

#### 3a. Create Backend Configuration

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in **test credentials from DoraHacks notes**:

```bash
# HEDERA TESTNET (from DoraHacks submission)
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.6370373
HEDERA_PRIVATE_KEY=[PROVIDED_IN_SUBMISSION_NOTES]
HEDERA_SUPPLY_KEY=[PROVIDED_IN_SUBMISSION_NOTES]

# DATABASE (local development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/rwa_db

# AUTHENTICATION (local dev only)
JWT_SECRET=judge-test-jwt-secret-do-not-use-production
JWT_EXPIRY=7d

# SERVER
PORT=4000
NODE_ENV=development
LOG_LEVEL=info

# FRONTEND
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_NETWORK=testnet
```

#### 3b. Setup Database

**Option A: Using Docker Compose (Recommended)**

```bash
cd ..
docker-compose up -d db
# Wait 10 seconds for PostgreSQL to start

cd server
npx prisma migrate dev
npx prisma db seed
cd ..
```

**Option B: Local PostgreSQL**

```bash
# Create database
createdb rwa_db

# Run migrations
cd server
npx prisma migrate dev
npx prisma db seed
cd ..
```

### Step 4: Start Application (2 minutes)

Open 2-3 terminal windows:

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Expected output:**

```
API listening on :4000
[NFT] Hedera client initialized
✅ Database connected
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

**Expected output:**

```
▲ Next.js 15.4.6
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Verify All Running:**

```bash
# Terminal 3 - Quick verification
curl http://localhost:4000/health
curl http://localhost:3000
```

---

## ✅ Testing Checklist (Verify Hedera Integration)

Once the application is running, follow these tests to verify all Hedera services work:

### Test 1: Application Load (1 minute)

- [ ] Open http://localhost:3000 in browser
- [ ] See login/signup page
- [ ] Check browser console: No errors
- [ ] Check backend logs: No error messages

### Test 2: User Authentication (2 minutes)

- [ ] Click "Sign Up" or "Guest Continue"
- [ ] Create test account OR skip with guest mode
- [ ] Successfully redirect to dashboard
- [ ] No errors in console

### Test 3: NFT Creation on Hedera (3 minutes) - **KEY TEST**

1. **Navigate to Producer Dashboard**

   - Click "Become a Producer" or "Producer Dashboard"
   - Should see "Add New Product" button

2. **Create a Test Product**

   - Click "Add New Product"
   - Fill in details:
     ```
     Product Name: Test Premium Coffee
     Description: Grade A Ethiopian Beans
     Category: Agriculture
     Quantity: 3
     Price (USD): $150
     ```
   - Click "Create Product" → Initiates NFT minting

3. **Verify NFT Creation in Backend Logs**

   Look for these logs in Terminal 1 (Server):

   ```
   [NFT] Starting NFT creation for product: Test Premium Coffee
   [NFT] ✓ Client initialized
   [NFT] Treasury account: 0.0.6370373
   [NFT] ✓ Supply key loaded
   [NFT] Creating token transaction...
   [NFT] ✓ Transaction frozen
   [NFT] Executing transaction...
   [NFT] ✅ Token created successfully: 0.0.7156750
   [NFT] Starting minting loop: 3 NFTs in batches of 10
   ✅ Minted batch [0-2] for token 0.0.7156750. Serials: 1,2,3
   [NFT] ✅ NFT creation complete! Token: 0.0.7156750, Serials: 1,2,3
   ```

   **✅ If you see these logs, Hedera HTS is working!**

4. **Verify NFT on Blockchain**

   - Copy Token ID from logs (e.g., `0.0.7156750`)
   - Navigate to: https://testnet.hashscan.io/token/0.0.7156750
   - See token details:
     - Type: Non-Fungible Token
     - Supply: 3 serials
     - Treasury: 0.0.6370373

   **✅ If NFT appears on blockchain, integration is confirmed!**

### Test 4: Marketplace Browse (2 minutes)

- [ ] Click "Marketplace" or "Browse Products"
- [ ] See product you just created listed
- [ ] See NFT icon/badge indicating it's tokenized
- [ ] No API errors in backend logs

### Test 5: Order Creation (3 minutes)

- [ ] Click on product from marketplace
- [ ] See product details (name, price, NFT info)
- [ ] Click "Add to Cart" or "Buy Now"
- [ ] Proceed to checkout

### Test 6: Verify HCS Event Logging

Look for these logs when creating order:

```
[HCS] Logging event to topic 0.0.28659765
[HCS] EVENT: ORDER_CREATED
[HCS] ✅ Message submitted to consensus service
```

**✅ If you see these logs, Hedera HCS is working!**

### Test 7: Payment Flow (3 minutes)

- [ ] Proceed to payment page
- [ ] Verify HBAR amount shown (converted from USD)
- [ ] See wallet connection option
- [ ] Backend logs show escrow logic initiated

---

## 🔍 Advanced Verification (Optional)

### Verify Transaction on Mirror Node API

```bash
# Check account balance
curl https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.6370373

# Query NFT token
curl https://testnet.mirrornode.hedera.com/api/v1/tokens/0.0.7156750

# View HCS topic messages
curl https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.28659765/messages

# Query specific transaction
curl "https://testnet.mirrornode.hedera.com/api/v1/transactions?account.id=0.0.6370373&limit=10"
```

### Verify Smart Contract

```bash
# Check if escrow contract was deployed
curl https://testnet.mirrornode.hedera.com/api/v1/contracts

# Query contract state
curl https://testnet.mirrornode.hedera.com/api/v1/contracts/0.0.[CONTRACT_ID]
```

---

## 🧪 Test Data Available

### Pre-Loaded Test Users

| Role     | Email             | Password | Purpose                |
| -------- | ----------------- | -------- | ---------------------- |
| Producer | producer@test.com | Test123! | Create & sell products |
| Buyer    | buyer@test.com    | Test123! | Purchase products      |
| Admin    | admin@test.com    | Test123! | Dashboard access       |

### Sample Products (Auto-Created)

| Product              | Quantity | Price | NFT Status |
| -------------------- | -------- | ----- | ---------- |
| Premium Coffee Beans | 10       | $150  | ✅ Minted  |
| Artisan Cocoa Powder | 5        | $50   | ✅ Minted  |
| Handmade Textiles    | 3        | $80   | ✅ Minted  |

---

## 🆘 Troubleshooting

### Problem: "Database connection refused"

**Solution:**

```bash
# Check PostgreSQL status
psql -U postgres -d rwa_db -c "SELECT 1"

# If using Docker, verify container is running
docker ps | grep db
```

### Problem: "INVALID_SIGNATURE" in NFT creation

**Solution:**

- This means the Hedera credentials are wrong
- Verify credentials in `server/.env` match DoraHacks submission notes
- Restart backend: `npm run dev`

### Problem: "Token not found on blockchain"

**Solution:**

- Wait 5-10 seconds for Hedera consensus
- Check token ID in backend logs
- Verify on explorer: https://testnet.hashscan.io/

### Problem: "Port 4000 or 3000 already in use"

**Solution:**

```bash
# Kill process using the port
# On macOS/Linux
lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# On Windows
netstat -ano | findstr :4000
taskkill /PID [PID_NUMBER] /F
```

### Problem: "npm install fails"

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock files
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 📋 Evaluation Criteria

### ✅ What judges will evaluate:

1. **Hedera Integration**

   - [ ] NFT creation works (HTS)
   - [ ] Event logging works (HCS)
   - [ ] Transactions visible on testnet
   - [ ] Mirror Node queries confirm finality

2. **Code Quality**

   - [ ] No console errors during usage
   - [ ] Clean code organization
   - [ ] Proper error handling
   - [ ] Meaningful log messages

3. **User Experience**

   - [ ] Intuitive UI/UX
   - [ ] Fast response times
   - [ ] Clear transaction feedback
   - [ ] Mobile responsive

4. **Documentation**

   - [ ] Clear setup instructions (this guide)
   - [ ] Architecture explained (README_SUBMISSION.md)
   - [ ] Hedera integration detailed (HEDERA_DEPLOYMENT.md)
   - [ ] Code comments present

5. **Innovation**
   - [ ] Solves real African producer problem
   - [ ] Practical tokenization workflow
   - [ ] Sustainable economic model
   - [ ] Scalable architecture

---

## 🔐 Security Notes for Judges

### Credentials Handling

- Test credentials are **Testnet only** (no real money)
- Safe to expose in logs/screenshots
- Never use these credentials in production
- Use mainnet keys only for production deployment

### Data Security

- All user data encrypted in transit (HTTPS)
- Private keys never logged or exposed
- Database credentials not hardcoded
- `.env` file excluded from Git

### Blockchain Verification

- All transactions visible on public blockchain
- No hidden or off-chain transactions
- Transaction finality verifiable via Mirror Node
- Immutable audit trail via HCS

---

## 📝 Next Steps After Testing

1. **Take Screenshots**

   - NFT creation logs showing successful minting
   - NFT on blockchain explorer
   - Product in marketplace
   - Order flow completion

2. **Test Edge Cases** (Optional)

   - Create multiple products simultaneously
   - Verify serials increment correctly
   - Test order cancellation
   - Verify payment escrow release

3. **Review Documentation**

   - README_SUBMISSION.md - Complete overview
   - HEDERA_DEPLOYMENT.md - Technical details
   - NFT_FLOW_STATUS.md - Feature matrix
   - Code comments in key files

4. **Ask Questions**
   - Check GitHub Issues section
   - Review project README for contact info

---

## 📞 Support During Evaluation

If you encounter issues:

1. **Check this troubleshooting guide** (above)
2. **Review logs carefully** - Often show exact error
3. **Verify credentials** - Ensure correct Account ID and keys
4. **Try clean install** - Sometimes solves dependency issues
5. **Contact via GitHub** - Create issue in repository

---

## ✨ Expected Experience Flow

```
1. Clone & Install (~5 min) → All dependencies working
2. Start Backend & Frontend (~2 min) → No errors on startup
3. Load http://localhost:3000 → Dashboard visible
4. Create Product (~2 min) → NFT logs appear
5. Check Blockchain (~1 min) → Token visible on explorer
6. Browse Marketplace (~1 min) → Product listed with NFT
7. Test Order (~1 min) → Event logged to HCS
TOTAL: ~10 minutes for full evaluation
```

---

## ✅ Success Criteria

You'll know everything works when:

- ✅ Backend logs show `API listening on :4000`
- ✅ Frontend shows `ready started server on 0.0.0.0:3000`
- ✅ NFT creation logs show `✅ Token created successfully`
- ✅ NFT appears on https://testnet.hashscan.io/
- ✅ Marketplace displays created product
- ✅ Order creation logs to HCS topic
- ✅ Zero JavaScript errors in console
- ✅ No database errors in backend logs

**If all these are green ✅, the project is working perfectly!**

---

## 📊 What You're Evaluating

This RWA platform demonstrates:

✅ **Real Problem**: African producers need trustless trading for commodities  
✅ **Hedera Solution**: HTS for NFTs, HCS for events, low fees for sustainability  
✅ **Production Ready**: Clean code, proper error handling, security practices  
✅ **Fully Functional**: All features working end-to-end on Hedera Testnet  
✅ **Well Documented**: Complete setup, architecture, and technical details

---

**Document Version**: 1.0  
**Created**: October 29, 2025  
**For**: Hedera Africa Hackathon Submission  
**Network**: Hedera Testnet (No real value)  
**Status**: ✅ Ready for Evaluation
