# Quick Start Testing Guide

## Prerequisites Setup

### 1. Ensure Users Have Banks Assigned

Before testing, make sure your test users have banks assigned in the database:

```sql
-- Check current bank assignments
SELECT id, fullName, userType, bankId FROM "User" WHERE userType IN ('BUYER', 'PRODUCER');

-- Assign banks if missing
UPDATE "User" SET "bankId" = 'buyer-bank-id' WHERE id = 'buyer-user-id';
UPDATE "User" SET "bankId" = 'seller-bank-id' WHERE id = 'seller-user-id';
```

### 2. Create Test Banks (if needed)

```sql
INSERT INTO "Bank" (id, name, country) VALUES
  ('test-buyer-bank', 'Test Buyer Bank', 'USA'),
  ('test-seller-bank', 'Test Seller Bank', 'Morocco');
```

## Test Scenario: Complete Order Flow

### Step 1: Place Order as Buyer

1. Login as **Buyer** user
2. Navigate to `/marketplace`
3. Add products from a single producer to cart
4. Click "Confirm Order" in cart
5. **Expected**: Order created with status `BANK_REVIEW`

**Verify in Database**:

```sql
SELECT
  id, code, status,
  "buyerBankId", "sellerBankId",
  "buyerBankApproved", "sellerBankApproved"
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Expected Output**:

```
status: BANK_REVIEW
buyerBankId: <not null>
sellerBankId: <not null>
buyerBankApproved: false
sellerBankApproved: false
```

### Step 2: Buyer Bank Requests Documents

1. Login as **Bank Agent** for buyer's bank
2. Navigate to `/bank` (Bank Dashboard)
3. Find the new order
4. Click "Approve Order" → "Request Docs from Buyer"
5. **Expected**: Document request recorded

**Verify in Database**:

```sql
SELECT * FROM "BankReview"
WHERE "orderId" = 'order-id'
ORDER BY "createdAt" DESC;
```

### Step 3: Seller Bank Requests Documents

1. Login as **Bank Agent** for seller's bank
2. Navigate to `/bank`
3. Find the order
4. Click "Approve Order" → "Request Docs from Seller"
5. **Expected**: Document request recorded

### Step 4: Buyer Bank Approves

1. As **Buyer Bank Agent**
2. Click "Approve Order"
3. Select "Buyer Bank" from dropdown
4. Click "Approve Order"
5. **Expected**: `buyerBankApproved` = true, status still `BANK_REVIEW`

**Verify**:

```sql
SELECT "buyerBankApproved", "sellerBankApproved", status
FROM "Order"
WHERE id = 'order-id';
```

**Expected Output**:

```
buyerBankApproved: true
sellerBankApproved: false
status: BANK_REVIEW (unchanged)
```

### Step 5: Seller Bank Approves (Triggers 50% Release)

1. As **Seller Bank Agent**
2. Click "Approve Order"
3. Select "Seller Bank"
4. Click "Approve Order"
5. **Expected**:
   - Status changes to `IN_TRANSIT`
   - 50% payment released to seller

**Verify**:

```sql
-- Check order status
SELECT status, "buyerBankApproved", "sellerBankApproved"
FROM "Order"
WHERE id = 'order-id';

-- Check payment release
SELECT * FROM "PaymentRelease"
WHERE "orderId" = 'order-id';
```

**Expected Output**:

```
Order:
  status: IN_TRANSIT
  buyerBankApproved: true
  sellerBankApproved: true

PaymentRelease:
  type: PARTIAL50
  amount: <50% of order total>
  released: true
  releasedAt: <timestamp>
```

### Step 6: Add Shipment Tracking (Optional)

1. As **Bank Agent** or **Seller**
2. Navigate to order
3. Add tracking number
4. **Expected**: Tracking ID recorded

### Step 7: Buyer Confirms Delivery (Final Payment)

1. Login as **Buyer**
2. Navigate to order details
3. Click "Confirm Delivery"
4. **Expected**:
   - Status changes to `DELIVERED`
   - Remaining 50% released to seller

**Verify**:

```sql
-- Check order status
SELECT status FROM "Order" WHERE id = 'order-id';

-- Check payment releases
SELECT type, amount, released, "releasedAt"
FROM "PaymentRelease"
WHERE "orderId" = 'order-id'
ORDER BY "createdAt";
```

**Expected Output**:

```
Order:
  status: DELIVERED

PaymentReleases:
  1. type: PARTIAL50, amount: $500, released: true
  2. type: FULL100, amount: $500, released: true
```

## Test Checklist

- [ ] Order created with both bank IDs assigned
- [ ] Order starts in `BANK_REVIEW` status
- [ ] Buyer bank can request documents
- [ ] Seller bank can request documents
- [ ] Buyer bank approval recorded
- [ ] Seller bank approval recorded
- [ ] Status changes to `IN_TRANSIT` after both approvals
- [ ] First PaymentRelease created (PARTIAL50)
- [ ] Status changes to `DELIVERED` on buyer confirmation
- [ ] Second PaymentRelease created (FULL100)

## Common Issues & Solutions

### Issue: "Missing buyer/seller bank id"

**Solution**: Assign bankId to both buyer and seller users in database

### Issue: Order stuck in BANK_REVIEW

**Solution**: Both banks must approve. Check `buyerBankApproved` and `sellerBankApproved` flags

### Issue: Payment not released

**Solution**: Verify both bank approvals. Check PaymentRelease table for records

### Issue: "Multi-seller orders not supported"

**Solution**: Cart contains products from multiple producers. Clear cart and add products from single producer only

## Debug Queries

```sql
-- Full order details
SELECT
  o.id, o.code, o.status, o.total,
  o."buyerBankId", o."sellerBankId",
  o."buyerBankApproved", o."sellerBankApproved",
  u.fullName as buyer,
  bb.name as buyer_bank,
  sb.name as seller_bank
FROM "Order" o
JOIN "User" u ON o."userId" = u.id
LEFT JOIN "Bank" bb ON o."buyerBankId" = bb.id
LEFT JOIN "Bank" sb ON o."sellerBankId" = sb.id
WHERE o.id = 'order-id';

-- Bank reviews
SELECT * FROM "BankReview"
WHERE "orderId" = 'order-id'
ORDER BY "createdAt";

-- Payment releases
SELECT * FROM "PaymentRelease"
WHERE "orderId" = 'order-id'
ORDER BY "createdAt";

-- Order items with producer info
SELECT
  oi.*,
  p.name as product_name,
  p."producerWalletId",
  seller.fullName as seller_name
FROM "OrderedItem" oi
JOIN "Product" p ON oi."productId" = p.id
LEFT JOIN "User" seller ON p."producerWalletId" = seller."walletAddress"
WHERE oi."orderId" = 'order-id';
```

## Environment Variables to Check

```env
# .env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Running the Application

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

**Access Points**:

- Client: http://localhost:3000
- Marketplace: http://localhost:3000/marketplace
- Bank Dashboard: http://localhost:3000/bank
- API: http://localhost:4000

---

**Happy Testing! 🎉**
