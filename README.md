# 🌍 RWA - Real World Assets Marketplace

> **Safe, transparent, and blockchain-secured international commerce platform for trading real-world assets.** 🚀

---

## 🏆 Hedera Africa Hackathon Submission

📋 **[HACKATHON SUBMISSION GUIDE](./README_SUBMISSION.md)** - All requirements met for judges  
👨‍⚖️ **[JUDGE CREDENTIALS & TESTING](./JUDGE_CREDENTIALS.md)** - 10-minute setup for evaluation  
🚀 **[HEDERA DEPLOYMENT IDs](./HEDERA_DEPLOYMENT.md)** - All testnet resources documented

**Setup Time**: ~10 minutes | **Network**: Hedera Testnet | **Status**: ✅ Ready for Submission

---

## 📖 Complete Manual Available!

👉 **[READ THE COMPLETE MANUAL HERE](./README_COMPLETE_MANUAL.md)** 📚

This guide explains everything in a simple, practical way - perfect for anyone new to the app!

---

## ⚡ Quick Start (5 minutes)

### ✅ Prerequisites

Make sure the following are installed:

- 🔧 Git
- 📦 Node.js (v18+ recommended)
- 🐳 Docker & Docker Compose
- 📁 npm or yarn

### 🚀 1. Clone the Repo

```bash
git clone https://github.com/altavopartners/RWA.git
cd RWA
```

### 🌱 2. Checkout the develop Branch

```bash
git checkout develop
```

### ⚙️ 3. Environment Setup

Create a `.env` file in the `server/` directory:

```env
# Database
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hexport
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hexport

# JWT Security
JWT_SECRET=your_super_secret_key_with_minimum_32_characters_here

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ID
HEDERA_PRIVATE_KEY=your_private_key_here
HEDERA_OPERATOR_ID=0.0.YOUR_ID
HEDERA_OPERATOR_KEY=your_operator_key_here
```

### 🐳 4. Start the App

#### Option A: Using Docker (Recommended)

```bash
docker-compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

#### Option B: Manual Setup

```bash
# Terminal 1: Start Database
docker-compose up -d postgres

# Terminal 2: Setup & Start Backend
cd server && npm install && npx prisma migrate deploy && npm run dev

# Terminal 3: Start Frontend
cd client && npm install && npm run dev
```

---

## 🎯 Main Features

| Feature             | Description                              |
| ------------------- | ---------------------------------------- |
| 🏪 Marketplace      | Browse products from producers worldwide |
| 🎫 NFT Certificates | Digital proof of authenticity            |
| 💳 Smart Escrow     | Safe 2-step payment verification         |
| 📦 Order Tracking   | Real-time shipment tracking              |
| 🔐 Secure Auth      | MetaMask wallet integration              |
| 📄 Documents        | Upload certifications & compliance       |
| ⛓️ Blockchain       | Permanent record on Hedera               |

---

## 🛠️ Common Commands

```bash
# Frontend
cd client && npm run dev          # Start dev server
npm run build                     # Build production

# Backend
cd server && npm run dev          # Start dev server
npx prisma studio                # Open database UI

# Docker
docker-compose up --build         # Start everything
docker-compose down               # Stop everything
```

---

## 📚 Documentation

- � [Complete User Manual](./README_COMPLETE_MANUAL.md)
- 🏗️ [NFT Flow Status](./NFT_FLOW_STATUS.md)

---

## 📝 License

MIT License - see LICENSE file for details

---

**Last Updated:** October 29, 2025 | **Status:** ✅ Production Ready
