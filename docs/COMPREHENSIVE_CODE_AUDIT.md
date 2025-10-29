# 🔍 Comprehensive Code Audit - Hex-Port RWA Platform

**Audit Date:** January 24, 2025  
**Project:** Hex-Port - Real World Asset Tokenization Platform  
**Scope:** Full-stack application (Client, Server, Database, Smart Contracts)

---

## 📋 Executive Summary

### Project Structure

```
├── client/          # Next.js 15 + React 19 frontend
├── server/          # Express + TypeScript backend
├── hedera-escrow/   # Hardhat smart contracts
└── docker-compose.yml
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Backend**: Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Blockchain**: Hedera Hashgraph (for escrow/NFTs)
- **Storage**: IPFS via Storacha (Web3.Storage)
- **Auth**: JWT + MetaMask wallet signatures

### Overall Health Score: 6.5/10

**Strengths:**

- ✅ Modern tech stack
- ✅ TypeScript coverage
- ✅ Prisma ORM with proper relations
- ✅ JWT authentication structure
- ✅ IPFS document storage

**Critical Issues:**

- 🔴 Security vulnerabilities (auth bypass, exposed secrets)
- 🔴 No input validation/sanitization
- 🔴 Missing error boundaries
- 🔴 Performance bottlenecks
- 🔴 No monitoring/logging infrastructure

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. **Authentication Bypass in Production**

**Location:** `server/services/auth.service.ts:91-93`

```typescript
// ONLY FOR TESTING: accept all signatures
let ok = true;
```

**Impact:** Complete authentication bypass - anyone can login as any wallet  
**Fix:**

```typescript
// Restore signature verification
if (walletType === "METAMASK") {
  ok = verifyMetaMaskSignature(walletAddress, signature, message);
} else if (walletType === "HASHPACK") {
  ok = verifyHashpackSignature(walletAddress, signature, message, publicKeyHex);
}
if (!ok) throw new Error("Invalid signature");
```

**Priority:** 🔥 IMMEDIATE

---

### 2. **Hardcoded Secrets in Code**

**Location:** `server/utils/w3.ts:12-20`

```typescript
const STORACHA_SEED_HEX =
  process.env.STORACHA_SEED_HEX ||
  "f6f147f53afefa05cfc6be2ec5cc9bdd31736357dfb60087cf788c3cc11b2d9b";
const PROOF_B64 = process.env.W3_PROOF_BASE64 || "mAYIEAKEPEaJlcm9v...";
```

**Impact:** Exposed IPFS credentials, anyone can upload/delete files  
**Fix:**

- Remove fallback values
- Store in `.env` only
- Rotate compromised credentials
- Use secret management (AWS Secrets Manager, HashiCorp Vault)
  **Priority:** 🔥 IMMEDIATE

---

### 3. **SQL Injection via Prisma Raw Queries**

**Location:** Multiple service files
**Issue:** Direct string interpolation in `prisma.$queryRaw` if used anywhere  
**Fix:** Always use parameterized queries:

```typescript
// ❌ BAD
prisma.$queryRaw`SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD
prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

**Priority:** 🔥 HIGH

---

### 4. **Missing Input Validation**

**Location:** All controllers
**Issue:** No validation middleware (express-validator, Zod, etc.)
**Example vulnerable endpoint:** `POST /api/auth/connect`

```typescript
// Current: accepts any payload shape
const { walletAddress, signature, message, nonce, walletType, publicKeyHex } =
  req.body;
```

**Fix:** Add validation middleware

```typescript
import { z } from "zod";

const connectWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1),
  message: z.string().min(1),
  nonce: z.string().uuid(),
  walletType: z.enum(["METAMASK", "HASHPACK"]),
  publicKeyHex: z.string().optional(),
});

// In controller
const validated = connectWalletSchema.parse(req.body);
```

**Priority:** 🔥 HIGH

---

### 5. **XSS Vulnerabilities in Document Display**

**Location:** `client/app/bank/documents/page.tsx:461`

```tsx
<div className="text-sm font-medium truncate" title={doc.filename}>
  {doc.filename}
</div>
```

**Issue:** Unsanitized user input rendered directly  
**Fix:** Use DOMPurify or escape HTML

```typescript
import DOMPurify from "isomorphic-dompurify";

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.filename) }} />;
```

**Priority:** 🔥 HIGH

---

### 6. **CORS Misconfiguration**

**Location:** `server/config/cors.ts:6-11`

```typescript
origin(origin, cb) {
  if (!origin) return cb(null, true); // ❌ Allows server-to-server/Postman
  return allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
}
```

**Issue:** Accepts requests with no Origin header (Postman, curl, malicious scripts)  
**Fix:**

```typescript
origin(origin, cb) {
  // In production, require Origin header
  if (process.env.NODE_ENV === 'production' && !origin) {
    return cb(new Error('Origin required'));
  }
  return allowedOrigins.includes(origin || '') ? cb(null, true) : cb(new Error('Not allowed by CORS'));
}
```

**Priority:** 🔥 HIGH

---

### 7. **Unencrypted Sensitive Data in Database**

**Location:** `server/prisma/schema.prisma`
**Issue:** Wallet addresses, emails, phone numbers stored in plaintext  
**Fix:**

- Encrypt PII fields at application level before storage
- Use Prisma middleware for automatic encryption/decryption

```typescript
// Example: encrypt email before save
prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "create") {
    if (params.args.data.email) {
      params.args.data.email = encrypt(params.args.data.email);
    }
  }
  return next(params);
});
```

**Priority:** 🔥 HIGH

---

### 8. **JWT Secret Not Configured**

**Location:** `server/utils/crypto.ts` (getJWTSecret function)
**Issue:** No check for missing JWT_SECRET in production  
**Fix:**

```typescript
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET must be set in production and be at least 32 characters"
      );
    }
    console.warn(
      "⚠️ Using default JWT secret for development. DO NOT USE IN PRODUCTION!"
    );
    return "dev-secret-change-in-production";
  }
  return secret;
}
```

**Priority:** 🔥 IMMEDIATE

---

## 🟠 HIGH PRIORITY ISSUES

### 9. **No Rate Limiting**

**Location:** All API endpoints
**Issue:** Vulnerable to brute force, DoS attacks  
**Fix:** Already imported but not used in `server/app.ts`

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
});

app.use("/api/", limiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

app.use("/api/auth/", authLimiter);
```

**Priority:** 🟠 HIGH

---

### 10. **Missing Database Indexes**

**Location:** `server/prisma/schema.prisma`
**Issue:** Queries will be slow as data grows  
**Current indexes:**

```prisma
@@index([userId]) // on Order, CartItem
@@index([productId])
@@index([status]) // on Order
```

**Missing indexes:**

```prisma
model User {
  @@index([email]) // For login/lookup
  @@index([walletAddress]) // Already has @unique
  @@index([userType, isVerified]) // For filtered queries
  @@index([bankId]) // For bank queries
}

model Document {
  @@index([userId, orderId]) // Compound for common queries
  @@index([status, createdAt]) // For bank document review
  @@index([cid]) // For IPFS lookups
}

model Order {
  @@index([code]) // For lookup by order code
  @@index([userId, status]) // Already partially covered
  @@index([buyerBankId])
  @@index([sellerBankId])
  @@index([createdAt]) // For sorting
}
```

**Priority:** 🟠 HIGH (before production)

---

### 11. **N+1 Query Problem**

**Location:** Multiple service files  
**Example:** `server/services/bank.service.ts:12-17`

```typescript
export async function getClients() {
  return prisma.user.findMany({
    where: { userType: { in: ["PRODUCER", "BUYER"] } },
    include: { orders: true }, // ❌ Loads all orders for each user
    orderBy: { updatedAt: "desc" },
  });
}
```

**Issue:** For 100 users with 10 orders each = 1 + 100 queries  
**Fix:** Use pagination and selective includes

```typescript
export async function getClients(page = 1, limit = 20) {
  return prisma.user.findMany({
    where: { userType: { in: ["PRODUCER", "BUYER"] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      userType: true,
      kycStatus: true,
      _count: { select: { orders: true } }, // Just count, don't load all
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}
```

**Priority:** 🟠 HIGH

---

### 12. **Memory Leak in React**

**Location:** `client/hooks/useAuth.tsx:68-74`

```typescript
const [user, setUser] = useState<User | null>(null);
const [walletAddress, setWalletAddress] = useState<string | null>(null);
// ...
const isMountedRef = useRef(true);
const safeSetState = (setter: () => void) => {
  if (isMountedRef.current) {
    setter();
  }
};
```

**Issue:** Better pattern exists with AbortController  
**Fix:**

```typescript
useEffect(() => {
  const controller = new AbortController();

  async function loadProfile() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data.data);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching profile:", err);
      }
    }
  }

  if (jwt) loadProfile();

  return () => controller.abort();
}, [jwt]);
```

**Priority:** 🟠 MEDIUM

---

### 13. **Missing Error Boundaries**

**Location:** `client/app/layout.tsx`
**Issue:** Unhandled errors crash entire app  
**Fix:** Add error boundary

```tsx
// components/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Send to logging service (Sentry, LogRocket, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6">
            <h2>Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// In layout.tsx
<ErrorBoundary>
  <Providers>
    <NavClient />
    <main className="pt-16">{children}</main>
  </Providers>
</ErrorBoundary>;
```

**Priority:** 🟠 MEDIUM

---

### 14. **Excessive Console.log Statements**

**Location:** Throughout codebase (50+ instances)
**Issue:** Performance impact, exposed logic in production  
**Examples:**

- `server/controllers/auth.controller.ts:92-119` (4 console.logs)
- `client/components/OrderFlowDetail.tsx:219-266` (3 console.logs)
- `server/services/order.service.ts:260-268` (2 console.logs)

**Fix:** Replace with proper logging library

```typescript
// server/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console({ format: winston.format.simple() })]
      : []),
  ],
});

// Replace all console.log with logger.info
logger.info("User authenticated", { userId, ip });
logger.error("Payment failed", { orderId, error });
```

**Priority:** 🟠 MEDIUM

---

### 15. **File Upload Vulnerabilities**

**Location:** `server/controllers/document.controller.ts:10-13`

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
```

**Issues:**

- No file type validation (can upload .exe, .sh)
- No virus scanning
- No deduplication (can upload same file 1000x)
- No user quota

**Fix:**

```typescript
import fileType from "file-type";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_USER = 100;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: async (req, file, cb) => {
    try {
      // Check user's file count
      const { prisma } = await import("../utils/prisma");
      const userId = (req as AuthenticatedRequest).user?.id;
      const fileCount = await prisma.document.count({ where: { userId } });

      if (fileCount >= MAX_FILES_PER_USER) {
        return cb(new Error("File upload limit reached"));
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("Invalid file type"));
      }

      cb(null, true);
    } catch (err) {
      cb(err as Error);
    }
  },
});

// In upload controller, verify file signature
const fileBuffer = req.file.buffer;
const type = await fileType.fromBuffer(fileBuffer);

if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
  return res.status(400).json({ error: "File type mismatch" });
}

// Check for duplicate (by hash)
const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
const existing = await prisma.document.findFirst({
  where: { userId: req.user.id /* store hash in new field */ },
});

if (existing) {
  return res.json({ success: true, data: existing, isDuplicate: true });
}
```

**Priority:** 🟠 HIGH

---

## 🟡 MEDIUM PRIORITY ISSUES

### 16. **Missing Health Check Endpoint**

**Location:** `server/app.ts:31-33`

```typescript
app.get("/", (_req: Request, res: Response) =>
  res.send("Hex-Port backend is running")
);
```

**Issue:** No database/IPFS connectivity check  
**Fix:**

```typescript
app.get("/health", async (_req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "unknown",
    ipfs: "unknown",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "healthy";
  } catch (err) {
    checks.database = "unhealthy";
  }

  try {
    const { getW3Client } = await import("./utils/w3");
    await getW3Client();
    checks.ipfs = "healthy";
  } catch (err) {
    checks.ipfs = "unhealthy";
  }

  const isHealthy = checks.database === "healthy" && checks.ipfs === "healthy";
  res.status(isHealthy ? 200 : 503).json(checks);
});
```

**Priority:** 🟡 MEDIUM

---

### 17. **No Database Connection Pooling Config**

**Location:** `server/utils/prisma.ts`
**Issue:** Default pool size may not be optimal  
**Fix:**

```typescript
// In schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  // postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10
}

// Or in prisma client initialization
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Configure pool in DATABASE_URL
// DATABASE_URL="postgresql://user:pass@localhost:5432/hexport?connection_limit=20&pool_timeout=10"
```

**Priority:** 🟡 MEDIUM

---

### 18. **Frontend Bundle Size**

**Issue:** Large client-side bundle impacts performance  
**Analysis needed:**

```bash
cd client
npm run build
# Check .next/analyze output
```

**Common culprits:**

- Moment.js (if used) → use date-fns instead
- Lodash (if entire library imported) → import individual functions
- Unused Radix UI components

**Fix:**

```typescript
// ❌ BAD
import _ from "lodash";
import moment from "moment";

// ✅ GOOD
import debounce from "lodash/debounce";
import { format } from "date-fns";
```

**Next.js config optimization:**

```typescript
// next.config.ts
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },
  images: {
    domains: ["w3s.link", "up.storacha.network"],
    formats: ["image/avif", "image/webp"],
  },
};
```

**Priority:** 🟡 MEDIUM

---

### 19. **Missing API Response Caching**

**Location:** All GET endpoints
**Issue:** Same data fetched repeatedly (e.g., product list)  
**Fix:** Add Redis caching layer

```typescript
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// Cache middleware
const cacheMiddleware =
  (duration: number) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.method}:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Override res.json to cache response
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        redis.setEx(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (err) {
      next(); // Continue without cache on error
    }
  };

// Use on expensive queries
router.get("/products", cacheMiddleware(60), getProducts); // Cache for 60s
router.get("/orders/:id", verifyJWT, cacheMiddleware(10), getOrderById);
```

**Priority:** 🟡 MEDIUM

---

### 20. **Hardcoded Pagination Limits**

**Location:** `server/services/order.service.ts:219-220`

```typescript
const take = Math.min(Math.max(pageSize, 1), 100);
const skip = Math.max(page - 1, 0) * take;
```

**Issue:** Magic numbers scattered across code  
**Fix:** Centralize configuration

```typescript
// server/config/pagination.ts
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
};

// Use in service
import { PAGINATION } from "../config/pagination";

const take = Math.min(
  Math.max(pageSize, PAGINATION.MIN_PAGE_SIZE),
  PAGINATION.MAX_PAGE_SIZE
);
```

**Priority:** 🟡 LOW

---

## 🔵 ARCHITECTURAL IMPROVEMENTS

### 21. **Service Layer Missing Abstractions**

**Current:** Services directly use Prisma  
**Better:** Repository pattern for testability

```typescript
// repositories/UserRepository.ts
export class UserRepository {
  async findByWallet(address: string) {
    return prisma.user.findUnique({ where: { walletAddress: address } });
  }

  async create(data: UserCreateInput) {
    return prisma.user.create({ data });
  }

  // ... other database operations
}

// services/auth.service.ts
import { UserRepository } from "../repositories/UserRepository";

const userRepo = new UserRepository();
const user = await userRepo.findByWallet(walletAddress);
```

**Benefits:**

- Easy to mock for testing
- Swap database without changing services
- Centralize query logic

---

### 22. **Missing Event System**

**Issue:** Tight coupling between components  
**Example:** When order status changes, need to:

- Update database
- Send email notification
- Update blockchain
- Trigger webhook
- Log event

**Fix:** Implement event bus

```typescript
// events/EventBus.ts
import { EventEmitter } from "events";

export const eventBus = new EventEmitter();

// Event types
export enum OrderEvent {
  CREATED = "order:created",
  PAID = "order:paid",
  SHIPPED = "order:shipped",
  DELIVERED = "order:delivered",
  CANCELLED = "order:cancelled",
}

// In order service
import { eventBus, OrderEvent } from "../events/EventBus";

export async function updateOrderStatusService({ orderId, status }) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  // Emit event instead of directly calling other services
  eventBus.emit(OrderEvent.PAID, order);

  return order;
}

// Event handlers
eventBus.on(OrderEvent.PAID, async (order) => {
  await sendEmail(order.userId, "Payment received");
  await updateBlockchain(order.id);
  await triggerWebhook("order.paid", order);
});
```

---

### 23. **No API Versioning**

**Current:** `/api/products`  
**Problem:** Breaking changes affect all clients  
**Fix:**

```typescript
// routes/index.ts
import v1Routes from "./v1";
import v2Routes from "./v2";

router.use("/v1", v1Routes);
router.use("/v2", v2Routes);

// Default to latest
router.use("/", v2Routes);
```

---

### 24. **Missing Background Job Queue**

**Issue:** Long-running tasks block API responses  
**Examples:**

- NFT minting (blockchain transaction)
- IPFS upload for large files
- Email notifications
- Document verification

**Fix:** Use Bull (Redis-based queue)

```typescript
import Bull from "bull";

const nftQueue = new Bull("nft-minting", process.env.REDIS_URL);

// Producer (in controller)
await nftQueue.add(
  "mint",
  { productId, userId },
  {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  }
);

return res.json({ success: true, message: "NFT minting queued" });

// Consumer (worker.ts - separate process)
nftQueue.process("mint", async (job) => {
  const { productId, userId } = job.data;
  const result = await mintNFTService(productId, userId);
  return result;
});

nftQueue.on("completed", (job, result) => {
  logger.info("NFT minted", { jobId: job.id, result });
});

nftQueue.on("failed", (job, err) => {
  logger.error("NFT minting failed", { jobId: job.id, error: err });
});
```

---

## 🧪 TESTING GAPS

### Current State: **No Tests Found** ❌

**Required:**

1. **Unit Tests** (80% coverage minimum)

   - Service functions
   - Utility functions (crypto, jwt, ipfs)
   - React hooks

2. **Integration Tests**

   - API endpoint flows
   - Database transactions
   - Authentication flows

3. **E2E Tests**
   - Critical user journeys (signup → purchase → delivery)

**Setup:**

```json
// server/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "supertest": "^6.3.0"
  }
}

// client/package.json
{
  "scripts": {
    "test": "jest",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

**Example test:**

```typescript
// server/__tests__/auth.service.test.ts
import {
  generateWalletNonce,
  connectWalletService,
} from "../services/auth.service";
import { prisma } from "../utils/prisma";

describe("Auth Service", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it("should generate nonce for new wallet", async () => {
    const wallet = "0x1234567890abcdef1234567890abcdef12345678";
    const result = await generateWalletNonce(wallet);

    expect(result.nonce).toBeDefined();
    expect(result.message).toContain(wallet);
  });

  it("should reject invalid signature", async () => {
    const wallet = "0x1234567890abcdef1234567890abcdef12345678";
    const { nonce } = await generateWalletNonce(wallet);

    await expect(
      connectWalletService({
        walletAddress: wallet,
        signature: "invalid",
        message: nonce,
        nonce,
        walletType: "METAMASK",
      })
    ).rejects.toThrow("Invalid signature");
  });
});
```

---

## 📊 PERFORMANCE OPTIMIZATION

### 25. **Database Query Optimization**

**Current slow queries:**

```typescript
// ❌ Loads all orders with all items and products
const orders = await prisma.order.findMany({
  include: { items: { include: { product: true } } },
});
```

**Optimized:**

```typescript
// ✅ Paginated with selective fields
const orders = await prisma.order.findMany({
  select: {
    id: true,
    code: true,
    status: true,
    total: true,
    createdAt: true,
    user: { select: { id: true, fullName: true } },
    items: {
      select: {
        quantity: true,
        product: { select: { name: true, pricePerUnit: true } },
      },
    },
  },
  where: whereClause,
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
});
```

---

### 26. **Frontend Performance**

**Issues:**

- No code splitting
- No lazy loading for heavy components
- No virtualization for long lists

**Fix:**

```tsx
// Use Next.js dynamic imports
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <Skeleton />,
  ssr: false, // Don't render on server
});

// Virtualize long lists
import { useVirtualizer } from "@tanstack/react-virtual";

function DocumentList({ documents }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <DocumentCard key={item.index} doc={documents[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🛡️ SECURITY CHECKLIST

- [ ] Enable signature verification (CRITICAL)
- [ ] Rotate hardcoded secrets (CRITICAL)
- [ ] Add input validation on all endpoints (HIGH)
- [ ] Implement rate limiting (HIGH)
- [ ] Add CSRF protection (HIGH)
- [ ] Sanitize all user inputs (HIGH)
- [ ] Encrypt sensitive database fields (HIGH)
- [ ] Add Content Security Policy headers (MEDIUM)
- [ ] Enable HTTPS only in production (MEDIUM)
- [ ] Add security headers (helmet.js) (MEDIUM)
- [ ] Implement API key rotation (MEDIUM)
- [ ] Add brute force protection on login (MEDIUM)
- [ ] Set up WAF (CloudFlare, AWS WAF) (LOW)
- [ ] Regular dependency audits (`npm audit`) (ONGOING)

---

## 📈 MONITORING & OBSERVABILITY

**Currently:** No monitoring ❌

**Required:**

1. **Application Performance Monitoring (APM)**

   - Sentry, DataDog, New Relic
   - Track errors, slow queries, API latency

2. **Logging**

   - Structured logging (Winston, Pino)
   - Log aggregation (ELK, Splunk, CloudWatch)

3. **Metrics**

   - Prometheus + Grafana
   - Track:
     - API response times
     - Order completion rates
     - Document validation times
     - IPFS upload/download latency
     - Database query performance
     - Active users

4. **Alerts**
   - High error rates
   - Slow queries (> 1s)
   - Failed payments
   - IPFS upload failures
   - Database connection issues

**Implementation:**

```typescript
// server/middleware/metrics.ts
import promClient from "prom-client";

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(
        req.method,
        req.route?.path || req.path,
        res.statusCode.toString()
      )
      .observe(duration);
  });

  next();
};

// Expose /metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

---

## 🚀 DEPLOYMENT & DEVOPS

### Issues:

1. **No CI/CD Pipeline**
2. **No environment-specific configs**
3. **No database migration strategy**
4. **No rollback plan**

### Required:

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Check types
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Security audit
        run: npm audit --audit-level=high

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy script here
          npm run build
          npm run deploy
```

---

## 📝 DOCUMENTATION GAPS

**Missing:**

1. API documentation (Swagger/OpenAPI)
2. Database schema ERD diagram
3. Architecture decision records (ADRs)
4. Deployment guide
5. Troubleshooting guide
6. Onboarding docs for new developers

**Generate API docs:**

```typescript
// server/app.ts
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hex-Port API",
      version: "1.0.0",
      description: "Real World Asset Tokenization Platform API",
    },
    servers: [{ url: process.env.API_URL || "http://localhost:4000" }],
  },
  apis: ["./routes/*.ts"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// In route files
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/products", getProducts);
```

---

## 🎯 ACTION PLAN (Priority Order)

### Week 1: Critical Security Fixes

1. [ ] Enable signature verification in auth
2. [ ] Remove hardcoded secrets
3. [ ] Add input validation (Zod schemas)
4. [ ] Implement rate limiting
5. [ ] Add CORS fix for production
6. [ ] Generate and rotate JWT secret

### Week 2: Database & Performance

7. [ ] Add missing database indexes
8. [ ] Optimize N+1 queries
9. [ ] Add pagination to all list endpoints
10. [ ] Implement database connection pooling
11. [ ] Add query result caching (Redis)

### Week 3: Error Handling & Logging

12. [ ] Replace console.log with Winston
13. [ ] Add error boundaries in React
14. [ ] Implement structured error responses
15. [ ] Set up Sentry for error tracking
16. [ ] Add health check endpoints

### Week 4: Testing Foundation

17. [ ] Set up Jest for unit tests
18. [ ] Write tests for auth flow
19. [ ] Write tests for order flow
20. [ ] Add Playwright for E2E tests
21. [ ] Set up test coverage reporting

### Week 5: Monitoring & DevOps

22. [ ] Set up GitHub Actions CI/CD
23. [ ] Add Prometheus metrics
24. [ ] Configure Grafana dashboards
25. [ ] Implement log aggregation
26. [ ] Set up alerting rules

### Week 6: Documentation

27. [ ] Generate OpenAPI/Swagger docs
28. [ ] Create ERD diagram
29. [ ] Write deployment guide
30. [ ] Document environment variables
31. [ ] Create troubleshooting guide

---

## 📊 METRICS TO TRACK

### Before Improvements:

- Security: **2/10** ⚠️
- Performance: **4/10** ⚠️
- Code Quality: **5/10** ⚠️
- Testing: **0/10** ❌
- Monitoring: **0/10** ❌
- Documentation: **3/10** ⚠️

### Target After Improvements:

- Security: **9/10** ✅
- Performance: **8/10** ✅
- Code Quality: **8/10** ✅
- Testing: **8/10** ✅
- Monitoring: **9/10** ✅
- Documentation: **8/10** ✅

---

## 🔗 USEFUL RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Production Checklist](https://nextjs.org/docs/deployment)

---

## 💡 QUICK WINS (Can implement today)

1. **Add .env.example files** with all required variables
2. **Enable TypeScript strict mode** in tsconfig.json
3. **Add pre-commit hooks** (Husky + lint-staged)
4. **Remove all console.log** in production build
5. **Add HTTP security headers** (helmet.js)
6. **Enable CORS only for production domain**
7. **Add loading states** to all async operations
8. **Implement optimistic UI updates** in cart

---

## 🏁 CONCLUSION

This application has a solid foundation but requires immediate attention to security vulnerabilities before any production deployment. The architecture is generally sound, but lacks critical production-ready features like monitoring, testing, and proper error handling.

**Priority Focus Areas:**

1. 🔴 Security (Weeks 1-2)
2. 🟠 Performance (Weeks 2-3)
3. 🟡 Testing (Week 4)
4. 🔵 Monitoring (Week 5)
5. 🟢 Documentation (Week 6)

**Estimated effort:** 6-8 weeks with 1-2 developers

---

**Audit Completed By:** GitHub Copilot  
**Date:** January 24, 2025  
**Next Review:** After implementing critical fixes
