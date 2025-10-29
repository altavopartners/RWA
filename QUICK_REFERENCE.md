# 🎯 RWA Quick Reference Card

Print this page or keep it open! A quick guide to the most important information.

---

## 🚀 Getting Started (5 Minutes)

### Install Prerequisites

```bash
✅ Git
✅ Node.js v18+
✅ Docker & Docker Compose
✅ MetaMask browser extension
```

### Clone & Start

```bash
git clone https://github.com/altavopartners/RWA.git
cd RWA
docker-compose up --build
# Then open http://localhost:3000
```

---

## 🎮 Using the App

### 1️⃣ Sign Up

- Click "Connect Wallet" 🦊
- MetaMask appears → Click "Sign"
- Fill profile → Done!

### 2️⃣ Browse Products

- Go to Marketplace tab
- Click any product to see details
- See NFT certificate ✅

### 3️⃣ Add to Cart

- Click product
- Enter quantity
- Click "Add to Cart"

### 4️⃣ Checkout

- Go to Cart
- Review items
- Click "Proceed to Checkout"
- Confirm order

### 5️⃣ Bank Verification

- Banks get notification
- Each bank clicks "Approve"
- Money locked in escrow 🔒

### 6️⃣ Shipment

- Seller ships product
- Track in real-time 📦
- Get delivery notification

### 7️⃣ Complete Order

- Confirm received
- Payment released
- Order complete ✅

---

## 🔑 Key Concepts

| Term               | Means                             |
| ------------------ | --------------------------------- |
| **NFT**            | Digital certificate on blockchain |
| **HBAR**           | Hedera's digital currency         |
| **Escrow**         | Safe account holding payment      |
| **Smart Contract** | Automatic agreement code          |
| **MetaMask**       | Your digital wallet 🦊            |
| **Blockchain**     | Permanent record book ⛓️          |
| **Token ID**       | Unique NFT identifier             |
| **Serial Number**  | Individual product number         |

---

## 🛠️ Useful Commands

### Start Backend

```bash
cd server
npm run dev
# Runs on http://localhost:4000
```

### Start Frontend

```bash
cd client
npm run dev
# Runs on http://localhost:3000
```

### Database Management

```bash
# View database UI
npx prisma studio

# Create migration
npx prisma migrate dev --name feature_name

# Deploy migrations
npx prisma migrate deploy
```

### Docker Commands

```bash
# Start everything
docker-compose up

# Stop everything
docker-compose down

# Rebuild
docker-compose up --build

# View logs
docker-compose logs -f server
```

---

## 🐛 Quick Troubleshooting

| Problem                | Solution                            |
| ---------------------- | ----------------------------------- |
| App won't load         | Make sure Docker is running         |
| Database error         | Run `docker-compose up -d postgres` |
| MetaMask won't connect | Unlock MetaMask, refresh page       |
| Port 3000 in use       | Kill process or change port         |
| Build error            | Run `npm install` again             |
| NFT creation fails     | Check Hedera account & key          |

---

## 📁 Important Files

### Environment Setup

```
server/.env          # Backend config
client/.env.local    # Frontend config
```

### Backend

```
server/controllers/  # API handlers
server/services/     # Business logic
server/prisma/       # Database schema
server/config/       # Configuration
```

### Frontend

```
client/app/          # Pages & layout
client/components/   # React components
client/lib/          # Utilities
```

### Smart Contracts

```
hedera-escrow/       # Escrow contract
hedera-escrow/artifacts/  # Compiled contracts
```

---

## 🔐 Security Checklist

- ✅ Save your MetaMask recovery phrase
- ✅ Use strong password
- ✅ Never share private keys
- ✅ Keep JWT_SECRET secret
- ✅ Use .env file (never commit)
- ✅ Check transaction details before confirming
- ❌ Never use public WiFi for transactions
- ❌ Never screenshot wallet contents

---

## 🌐 Important URLs

| URL                                | Purpose                 |
| ---------------------------------- | ----------------------- |
| http://localhost:3000              | Frontend app            |
| http://localhost:4000              | Backend API             |
| http://localhost:4000/api/products | Product list            |
| http://localhost:4000/api/orders   | Order list              |
| https://testnet.dragonglass.me     | Hedera Testnet Explorer |

---

## 📚 Documentation

| Document                                                 | What's Inside                     |
| -------------------------------------------------------- | --------------------------------- |
| [README_COMPLETE_MANUAL.md](./README_COMPLETE_MANUAL.md) | Full guide (everything explained) |
| [README.md](./README.md)                                 | Quick start guide                 |
| [NFT_FLOW_STATUS.md](./NFT_FLOW_STATUS.md)               | Technical NFT details             |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)       | Navigation guide                  |

---

## 🎯 Role-Specific Tasks

### 👨‍🌾 **Producer (Seller)**

1. Sign up as Producer 🌾
2. Create products ➕
3. Upload documents 📄
4. List on marketplace 🏪
5. Wait for orders 📦
6. Ship products 🚚
7. Receive payment 💰

### 👨‍💼 **Buyer (Purchaser)**

1. Sign up as Buyer 🏪
2. Browse marketplace 🛍️
3. Add to cart 🛒
4. Checkout 💳
5. Bank approves 🏦
6. Product ships 📦
7. Confirm delivery ✅

### 🏦 **Bank (Verifier)**

1. Setup bank account 🏛️
2. Get notifications 🔔
3. Review orders 📋
4. Approve payments ✅
5. Monitor escrow 💳
6. Release funds 💰

### 💻 **Developer**

1. Clone repo 🔗
2. Install deps 📦
3. Setup .env ⚙️
4. Run locally 🚀
5. Make changes 🛠️
6. Push to GitHub 📤

---

## 📞 Get Help

| Issue              | Solution                        |
| ------------------ | ------------------------------- |
| Bug found          | Create GitHub issue             |
| Installation help  | Check README_COMPLETE_MANUAL.md |
| Technical question | Email support@altavo.fr         |
| Feature request    | Discuss on GitHub               |
| Urgent issue       | Call team lead                  |

---

## ⏱️ Time Estimates

| Task                 | Time    |
| -------------------- | ------- |
| Read this card       | 5 min   |
| Install app          | 10 min  |
| Create account       | 5 min   |
| First purchase       | 15 min  |
| Full manual read     | 45 min  |
| Setup development    | 20 min  |
| Deploy to production | 2 hours |

---

## 🎓 Learning Resources

- 📖 [Hedera Docs](https://docs.hedera.com/)
- 🦊 [MetaMask Guide](https://docs.metamask.io/)
- ⛓️ [Blockchain Basics](https://blockchain.info/)
- 🎫 [NFT Learning](https://ethereum.org/en/nft/)
- 💡 [Escrow Explained](https://www.investopedia.com/terms/e/escrow.asp)

---

## 💾 Backup Checklist

- [ ] Save MetaMask recovery phrase
- [ ] Backup .env file (secure location)
- [ ] Save database credentials
- [ ] Export private keys (if needed)
- [ ] Save important documents
- [ ] Test restore process

---

## 🔄 Regular Maintenance

### Weekly

- [ ] Check logs for errors
- [ ] Backup database
- [ ] Update dependencies (check for security)

### Monthly

- [ ] Review orders & transactions
- [ ] Check escrow balances
- [ ] Verify smart contracts

### Quarterly

- [ ] Security audit
- [ ] Performance review
- [ ] Update documentation

---

## 🎉 Success Indicators

✅ App loads without errors  
✅ Can create account  
✅ Can browse products  
✅ Can create orders  
✅ Banks can approve  
✅ Payments release correctly  
✅ NFTs are minted  
✅ Documents upload successfully

---

## 📋 Deployment Checklist

- [ ] All tests passing
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Smart contracts deployed
- [ ] MetaMask configured
- [ ] Documentation updated
- [ ] Team trained
- [ ] Go live! 🚀

---

## 🌟 Quick Wins

**Today:**

- ✅ Install and run locally
- ✅ Create test account
- ✅ Browse a product

**Tomorrow:**

- ✅ Create first order
- ✅ Test bank approval
- ✅ Track shipment

**Next Week:**

- ✅ Setup for others
- ✅ Create full workflow
- ✅ Test edge cases

---

**Bookmark this page!** 🔖

Last Updated: October 29, 2025
