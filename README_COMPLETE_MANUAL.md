# 🌍 RWA (Real World Assets) - Complete User Manual

**Version:** 1.0  
**Last Updated:** October 29, 2025  
**Status:** ✅ Production Ready

---

## 📖 Table of Contents

1. [What is RWA? (Simple Explanation)](#what-is-rwa)
2. [Main Features](#main-features)
3. [How to Install RWA](#installation)
4. [How to Use RWA (Step-by-Step)](#usage)
5. [Technical Details Explained](#technical-details)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 What is RWA?

### The Simple Version (For Everyone!)

**RWA = Real World Assets**

Imagine you want to sell coffee beans 🫘 to someone in another country, but you don't trust each other:

❌ **Old Way (Risky):**

- You send the coffee → They send money (or don't!)
- They send money → You send coffee (or don't!)
- One person always goes first and risks losing!

✅ **RWA Way (Safe & Fair):**

- 🏦 Both banks hold the money in a safe box (escrow)
- 📱 Money is locked until both sides say "OK"
- 🎫 The coffee becomes a digital certificate (NFT)
- ✨ Once both agree, everything trades automatically
- 😊 Everyone is happy and protected!

### What Does RWA Actually Do?

RWA is an **online marketplace** where:

1. 🌾 **Producers** (coffee farmers, cocoa growers, etc.) sell their products
2. 🏪 **Buyers** (companies, retailers) purchase them
   3.🏦 **Banks** verify both sides are real and hold the money safely
3. 📜 **Smart Contracts** automatically execute when both sides agree
4. 🔗 **Blockchain** keeps permanent records of everything

---

## ⭐ Main Features

### 1. 🏪 Marketplace

- Browse and search for products from producers worldwide
- See detailed product information
- Check reviews and certifications
- Add products to your cart

### 2. 🛒 Shopping Cart

- Add/remove products
- See total price
- Proceed to checkout

### 3. 💳 Smart Payment System

- Two-step approval (buyer & seller banks both confirm)
- Money is safe in escrow (locked account)
- Automatic payment release when both agree
- No risk of money theft

### 4. 🎫 NFT Digital Certificates

- Each product gets a unique digital certificate (NFT)
- Proves the product is real and authentic
- Stored on blockchain (permanent record)
- Cannot be faked or copied

### 5. 📦 Order Tracking

- See where your shipment is
- Real-time status updates
- Estimated delivery date
- Complete delivery confirmation

### 6. 📄 Document Management

- Upload documents (certifications, invoices, etc.)
- Bank verification of documents
- Organized document storage
- Easy access to all files

### 7. 🔐 Secure Authentication

- Connect your wallet (MetaMask)
- Verify your identity
- Two-factor security
- Your private key stays private

---

## 📥 Installation

### Step 1: Install Prerequisites

#### 🖥️ **On Windows/Mac/Linux:**

**Install Node.js & npm** (The engine for the app)

1. Go to: https://nodejs.org/
2. Click "Download LTS" (green button)
3. Click the file and follow the installer
4. Confirm: Open PowerShell/Terminal and type:
   ```
   node --version
   npm --version
   ```
   ✅ If you see version numbers, you're good!

**Install Docker** (Container for database)

1. Go to: https://www.docker.com/products/docker-desktop
2. Click "Download for [Your OS]"
3. Install and restart your computer

**Install Git** (Version control)

1. Go to: https://git-scm.com/
2. Download and install
3. Confirm in terminal: `git --version`

**Install MetaMask** (Your digital wallet)

1. Go to: https://metamask.io/
2. Click "Install now"
3. Choose your browser
4. Create a wallet and save your secret phrase (⚠️ IMPORTANT!)

### Step 2: Clone the Project

```bash
# Open Terminal/PowerShell and go to your projects folder:
cd Desktop
mkdir Projects
cd Projects

# Clone the RWA project:
git clone https://github.com/altavopartners/RWA.git
cd RWA
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies:
cd server
npm install

# Install frontend dependencies (in new terminal):
cd client
npm install
```

### Step 4: Setup Database

```bash
# Go back to project root:
cd ..

# Start PostgreSQL database in Docker:
docker-compose up -d postgres

# Wait 10 seconds, then setup database:
cd server
npx prisma migrate deploy
```

### Step 5: Configure Environment

**In `server/.env` file, add:**

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hexport
JWT_SECRET=your_super_secret_key_with_minimum_32_characters_here
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=your_private_key_here
```

### Step 6: Start the App

**Terminal 1 - Start Backend:**

```bash
cd server
npm run dev
# Should see: "API listening on :4000" ✅
```

**Terminal 2 - Start Frontend:**

```bash
cd client
npm run dev
# Should see: "Local: http://localhost:3000" ✅
```

**Open your browser:**

- Go to: http://localhost:3000
- 🎉 RWA is running!

---

## 🎮 How to Use RWA (Step-by-Step)

### Scenario: Buying Coffee Beans ☕

#### Step 1: Create Your Account

1. Open http://localhost:3000
2. Click "Sign Up" or "Connect Wallet"
3. Connect MetaMask wallet 🦊
4. Choose your role:
   - 🌾 **Producer** (Seller) - If you grow/make products
   - 🏪 **Buyer** (Purchaser) - If you want to buy products
   - 🏦 **Bank Admin** - If you represent a bank
5. Fill in your profile:
   - Name ✍️
   - Email 📧
   - Phone 📱
   - Location 🗺️
6. Click "Create Account"

#### Step 2: Browse Products

1. Go to **Marketplace** tab
2. See all available products
3. Each product shows:
   - 📷 Picture
   - 📝 Description
   - 💰 Price per unit
   - 🌍 Country of origin
   - 🎫 NFT certificate ID
   - ⭐ Reviews/ratings

#### Step 3: Add to Cart

1. Click on a product you like
2. See full details:
   - 📊 Certifications
   - 📄 Product documents
   - 🏆 Seller information
   - 🔗 Blockchain verification
3. Enter quantity
4. Click "Add to Cart" 🛒

#### Step 4: Checkout

1. Go to **Cart** page
2. Review items:
   - Product name
   - Quantity
   - Price per unit
   - Total cost
3. Click "Proceed to Checkout"
4. Select shipping method
5. Confirm order 📦

#### Step 5: Smart Contract Verification

⚠️ **Important Security Step!**

1. Your bank receives a notification: "Payment Escrow Created"
2. Click the notification (or go to Bank Dashboard)
3. Review the order details:
   - Who: Buyer name, Seller name
   - What: Product details
   - How much: Total price in HBAR (Hedera's currency)
   - Where: Shipping address
4. Click "Approve Payment" ✅
5. Smart contract locks the money

#### Step 6: Wait for Seller's Bank Approval

1. Seller's bank gets same notification
2. They verify seller can ship product
3. They click "Approve"
4. Now BOTH banks have approved = safe trade! 🎉

#### Step 7: Money Released Automatically

```
Money Release Timeline:
- 50% released to seller immediately (they start shipping)
- Seller confirms shipment with tracking number
- Buyer confirms delivery
- Remaining 50% released
```

#### Step 8: Receive Product

1. Go to **Orders** → **Track Shipment**
2. See real-time tracking:
   - 📍 Current location
   - 🚚 Shipping company
   - 📅 Estimated delivery
   - ✅ Delivery confirmation
3. Receive package!
4. Confirm "Received" in app
5. Remaining payment released ✨

---

## 🔧 Technical Details Explained

### What is Hedera? 🌐

**Hedera = World's fastest blockchain**

Think of it like a **digital courthouse** where:

- 📋 All transactions are recorded
- ⚖️ Fair and transparent rules apply
- 🏛️ Run by trusted organizations (US Congress, Google, etc.)
- ⚡ Super fast (10,000 transactions/second!)
- 💰 Cheaper than Bitcoin/Ethereum

**Why we use Hedera:**

- ✅ Fast (you don't wait 10 minutes for confirmation)
- ✅ Cheap (costs cents, not dollars)
- ✅ Green (uses way less electricity than Bitcoin)
- ✅ Secure (proof by thousands of validators)

**What happens on Hedera:**

1. 🎫 NFTs are created (digital certificates)
2. 💳 Payments are tracked
3. 📝 Smart contracts execute automatically
4. 📜 Everything is recorded forever

---

### What is NFT? 🎫

**NFT = Non-Fungible Token (Digital Certificate)**

**Simple Explanation:**

- 🎫 A certificate that proves you own something unique
- 🏆 Like a trophy with a serial number
- ⛓️ Stored on blockchain (can't be faked)
- ✏️ You can't change it
- 🔒 Proves authenticity

**Real Example - Coffee Beans 🫘:**

```
Traditional Certificate:        NFT Certificate (Blockchain):
━━━━━━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━━━━━━━━━
📄 Paper document               🔗 Digital token
Can be photocopy                Can't be faked
Easy to lose                     Stored forever
Hard to verify                   Instantly verifiable
                                 Serial #: 1
                                 Token ID: 0.0.7156750
                                 On Hedera blockchain ⛓️
```

**What RWA does with NFTs:**

1. When you create product → NFT is minted 🎫
2. Each NFT has unique serial number
3. NFT proves product exists & is authentic
4. When you buy product → you get NFT proof
5. Can't dispute ownership (blockchain proof!)

**Example Product with NFTs:**

```
Premium Cocoa Beans ☕
├─ Name: Premium Cocoa Beans
├─ Quantity: 100 units
├─ Token ID: 0.0.7156750 (on Hedera)
├─ Serial Numbers: [1, 2, 3, ..., 100]
├─ Certificates: Can't be faked ✅
└─ Blockchain: Permanent record ✅
```

---

### What is MetaMask? 🦊

**MetaMask = Your digital wallet & identity**

**Think of it like:**

- 🏦 Bank account + Passport combined
- 🔐 Only you can access (private key)
- 💰 Stores your digital money/tokens
- 🔑 Proves it's really you
- 🌐 Connect to any blockchain app

**Your MetaMask has:**

1. **Wallet Address** (like your bank account number)

   - Looks like: `0xdbdaef88839e18fef4e9c148b865bcc89dd44482`
   - Public (everyone can see it)
   - Can receive money/NFTs

2. **Private Key** (like your banking PIN)

   - Only you know it ⚠️
   - NEVER share it!
   - Needed to approve transactions
   - Loses if leaked = lose all money!

3. **Secret Phrase** (12-24 words)
   - Backup of your wallet
   - Write it down on paper 📝
   - Store in safe place 🔐
   - Can restore wallet if lost

**How RWA uses MetaMask:**

1. Login: Click "Connect Wallet" → MetaMask pops up
2. Verification: MetaMask signs message (proves it's you)
3. Transactions: When buying → MetaMask confirms payment
4. Smart Contracts: MetaMask approves escrow contract

**⚠️ Security Rules:**

- ✅ DO write down your secret phrase
- ✅ DO keep your computer secure
- ❌ DON'T share your private key
- ❌ DON'T post screenshots of wallet
- ❌ DON'T use public WiFi for transactions

---

### What is IPFS? 📁

**IPFS = InterPlanetary File System (Cloud Storage)**

**Think of it like:**

- ☁️ Cloud storage (like Google Drive)
- 🌐 But spread across thousands of computers
- 🔐 Secured by encryption
- 🔗 Files identified by hash (fingerprint)
- 🚀 No single company controls it

**File Storage in RWA:**

```
Traditional Cloud:           IPFS Cloud:
━━━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━━━━━
📁 Google Drive              📁 Your computer
📁 One data center           📁 My computer
🚨 If center goes down       📁 Their computer
   = Data lost!              ✅ If one down
                                = Still safe!
```

**What we store on IPFS in RWA:**

1. 📄 Certifications (organic, halal, etc.)
2. 📸 Product images
3. 📋 Invoices and shipping docs
4. 📝 Bank verification documents
5. ✅ Order confirmations

**How it works:**

1. Upload file → Gets unique ID (hash)
   - Example: `QmXxxx...`
2. File stored on IPFS network
3. Can retrieve anytime with hash
4. Can't be changed or deleted
5. Permanent record ✅

---

### What is Smart Contract? 📜

**Smart Contract = Automatic agreement**

**Think of it like:**

- 🤖 Robot lawyer who never sleeps
- 📋 Follows rules exactly
- ⚡ Executes automatically
- 📝 Can't be changed once created
- 💰 Handles money automatically

**Example - Coffee Payment Smart Contract:**

```
IF (buyer sends money) THEN {
  Lock money in escrow account
  Notify: Buyer wants coffee
}

IF (seller sends coffee) THEN {
  Lock shipping tracking
  Notify: Seller shipping
}

IF (buyer confirms delivery AND seller confirms shipped) THEN {
  Release 50% to seller
  Release 50% to platform (fee)
  Mark order as COMPLETE
}

IF (dispute) THEN {
  Hold money
  Notify: Platform admin
  Wait for resolution
}
```

**Smart Contracts in RWA:**

1. **Escrow Contract** 💳

   - Holds payment safely
   - Only releases when both agree
   - Can't be hacked (code run on blockchain)

2. **Token Contract** 🎫

   - Creates NFTs
   - Tracks serial numbers
   - Proves ownership

3. **Order Contract** 📦
   - Tracks shipment
   - Logs confirmations
   - Records history

**Why they're safe:**

- ✅ Can't be changed after creation
- ✅ Everyone can read the code
- ✅ Runs exactly as written
- ✅ No human can override
- ✅ Transparent & fair

---

### What is Blockchain? ⛓️

**Blockchain = Permanent Record Book**

**Think of it like:**

- 📖 School's permanent record
- ✍️ Everyone can write in it
- 🔐 Can't erase anything
- ⛓️ Each page linked to previous
- 👨‍⚖️ Controlled by many people (not one company)

**Blockchain structure:**

```
Block 1: [Data] → Hash (fingerprint)
   ↓ (linked by hash)
Block 2: [Data] → Hash
   ↓ (linked by hash)
Block 3: [Data] → Hash
   ↓ (linked by hash)
Block 4: [Data] → Hash
   ↓ (linked by hash)
...forever growing
```

**Change Block 2?**

- Hash changes → breaks link to Block 3
- Everyone notices ❌
- Blockchain rejects change
- Original Block 2 remains ✅

**What RWA stores on blockchain:**

1. 🎫 NFT certificates for products
2. 💳 Payment transactions
3. 📦 Order confirmations
4. 📜 Smart contract execution
5. 🔗 Proof of ownership

**Why blockchain matters:**

- ✅ Can't fake records
- ✅ Transparent (everyone can verify)
- ✅ Permanent (never lost)
- ✅ Secure (cryptographically locked)

---

### How Everything Works Together 🔄

```
┌─ USER JOURNEY ─────────────────────────────────────┐
│                                                     │
│  1️⃣ Connect Wallet 🦊                              │
│     ↓                                               │
│     MetaMask: "Sign message to verify"             │
│     You: Click "Sign"                              │
│     ✓ Login successful                             │
│                                                     │
│  2️⃣ Browse & Select Product 🛍️                     │
│     ↓                                               │
│     Product already has:                           │
│     - NFT Certificate ✅                            │
│     - Serial Numbers ✅                             │
│     - IPFS documents ✅                             │
│                                                     │
│  3️⃣ Add to Cart & Checkout 🛒                      │
│     ↓                                               │
│     Smart Contract created:                        │
│     - Amount locked                                │
│     - Conditions set                               │
│     - Banks notified                               │
│                                                     │
│  4️⃣ Bank Verification 🏦                           │
│     ↓                                               │
│     Buyer Bank:                                    │
│     - Checks buyer funds ✓                         │
│     - Reviews documents ✓                          │
│     - Clicks "Approve" ✓                           │
│     ↓                                               │
│     Seller Bank:                                   │
│     - Checks seller credibility ✓                  │
│     - Reviews product ✓                            │
│     - Clicks "Approve" ✓                           │
│                                                     │
│  5️⃣ Automatic Payment Release ⚡                   │
│     ↓                                               │
│     Smart Contract executes:                       │
│     - 50% released to seller                       │
│     - Seller starts shipping                       │
│                                                     │
│  6️⃣ Shipment & Tracking 📦                         │
│     ↓                                               │
│     Shipping info stored on:                       │
│     - IPFS (documents)                             │
│     - Blockchain (proof)                           │
│                                                     │
│  7️⃣ Delivery & Completion ✅                       │
│     ↓                                               │
│     Buyer confirms receipt                         │
│     Smart Contract final execution:                │
│     - Remaining 50% released                       │
│     - NFT ownership transferred                    │
│     - Order marked COMPLETE                        │
│                                                     │
│  8️⃣ Everything Recorded Forever ♾️                 │
│     ↓                                               │
│     On Blockchain:                                 │
│     - Full transaction history                     │
│     - NFT ownership proof                          │
│     - Payment records                              │
│     - Proof of authenticity                        │
└─────────────────────────────────────────────────────┘
```

---

### The Technology Stack 🛠️

**Frontend (What you see):**

```
┌─ React/Next.js ──────────────┐
│ Your browser interface        │
│ - Buttons you click           │
│ - Forms you fill              │
│ - Pages you navigate          │
└──────────────────────────────┘
         ↓
┌─ TypeScript ─────────────────┐
│ Checks for errors             │
│ Makes code safer              │
│ Prevents bugs                 │
└──────────────────────────────┘
         ↓
┌─ Tailwind CSS ────────────────┐
│ Makes it look beautiful       │
│ Responsive design             │
│ Works on phone/tablet/desktop │
└──────────────────────────────┘
```

**Backend (Where data lives):**

```
┌─ Express.js ──────────────────┐
│ Server handling requests      │
│ Processes your orders         │
│ Talks to database             │
└──────────────────────────────┘
         ↓
┌─ PostgreSQL ──────────────────┐
│ Database storing:             │
│ - Users                       │
│ - Products                    │
│ - Orders                      │
│ - Payments                    │
└──────────────────────────────┘
         ↓
┌─ Prisma ORM ──────────────────┐
│ Safely access database        │
│ Prevents hacking              │
│ Manages data integrity        │
└──────────────────────────────┘
```

**Blockchain (Where trust lives):**

```
┌─ Hedera SDK ──────────────────┐
│ Connection to blockchain      │
│ Creating tokens               │
│ Executing smart contracts     │
└──────────────────────────────┘
         ↓
┌─ Hedera Testnet ──────────────┐
│ The blockchain network        │
│ Permanent record keeping      │
│ All transactions verified     │
└──────────────────────────────┘
```

**Storage (Where files live):**

```
┌─ IPFS/Storacha ───────────────┐
│ Decentralized storage         │
│ Documents stored safely       │
│ Accessible forever            │
└──────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Common Issues & Solutions

#### ❌ "Can't Connect to Database"

```
Error: Can't reach database server at localhost:5432

Solution:
1. Make sure Docker is running
2. Run: docker-compose up -d postgres
3. Wait 10 seconds
4. Try again
```

#### ❌ "MetaMask Not Responding"

```
Error: MetaMask extension not found

Solution:
1. Check MetaMask is installed (🦊 icon in browser)
2. Make sure it's unlocked (click icon, enter password)
3. Make sure you're on Hedera testnet (see network)
4. Try refreshing page
```

#### ❌ "NFT Creation Failed"

```
Error: INVALID_SIGNATURE

Solution:
1. Check Hedera account ID is correct
2. Check private key format is correct
3. Make sure account has enough HBAR (currency)
4. Contact support with error message
```

#### ❌ "Can't Upload Documents"

```
Error: failed space/blob/add invocation

Solution:
1. Check file size (max 50MB)
2. Check file format (PDF, images, etc.)
3. Check internet connection
4. Try again in a few seconds
```

#### ❌ "Page Won't Load"

```
Error: 404 Not Found

Solution:
1. Check frontend running: npm run dev in client folder
2. Check backend running: npm run dev in server folder
3. Check correct URL: http://localhost:3000
4. Clear browser cache (Ctrl+Shift+Delete)
```

#### ❌ "Can't Create Product"

```
Error: Product creation failed

Solution:
1. Check all fields are filled
2. Check product name is unique
3. Check quantity is a number
4. Check you're logged in
5. Check backend is running
```

---

## 📚 Additional Resources

### Learning Resources

- 🎓 [Hedera Academy](https://www.hedera.com/learning)
- 🦊 [MetaMask Docs](https://docs.metamask.io/)
- 📖 [Blockchain Basics](https://blockchain.info/)
- 🚀 [NFT Explained](https://ethereum.org/en/nft/)

### Support Channels

- 💬 Email: support@altavo.fr
- 🐛 GitHub Issues: Report bugs
- 📞 Phone: +33-XXXXXXXXX
- 💻 Chat: Our website chat support

### Security Best Practices

1. ✅ Write down your MetaMask secret phrase
2. ✅ Store it in a safe place
3. ✅ Never use public WiFi for transactions
4. ✅ Keep your browser updated
5. ✅ Use strong passwords
6. ✅ Enable 2FA when available
7. ❌ Never share private key
8. ❌ Never click suspicious links
9. ❌ Never give access to anyone

---

## 🎉 You're Ready!

Congratulations! 🎊 You now understand:

- ✅ What RWA is
- ✅ How to install it
- ✅ How to use all features
- ✅ How the technology works
- ✅ How to troubleshoot issues

### Next Steps:

1. 🚀 Start the app
2. 🦊 Connect your wallet
3. 🛍️ Browse products
4. 🛒 Create your first order
5. 💰 Experience safe trading
6. 🎊 Enjoy secure international commerce!

---

## 📋 Quick Reference

### Keyboard Shortcuts

| Shortcut | Action          |
| -------- | --------------- |
| `Ctrl+K` | Open search     |
| `Esc`    | Close modal     |
| `Cmd+,`  | Settings        |
| `F12`    | Developer tools |

### Important Concepts

| Term               | Means                           |
| ------------------ | ------------------------------- |
| **HBAR**           | Hedera's digital currency       |
| **Token ID**       | Unique ID for NFT on blockchain |
| **Serial Number**  | Individual NFT identifier       |
| **Escrow**         | Safe money holding account      |
| **Smart Contract** | Automatic agreement code        |
| **Hash**           | Fingerprint of data             |

### Help Commands

```bash
# Get help
npm run help

# Run tests
npm run test

# Build for production
npm run build

# Check status
npm run status
```

---

**Made with ❤️ by Altavo Partners**

**Last Updated:** October 29, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready

---

_For detailed technical information, see TECHNICAL_DOCUMENTATION.md_
