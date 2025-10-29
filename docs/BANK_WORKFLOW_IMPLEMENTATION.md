# Bank Workflow Implementation Summary

## Overview

Complete implementation of the dual-bank escrow approval workflow for the RWA marketplace platform.

## Workflow Steps

### 1. Order Creation (Buyer Action)

**When**: User clicks "Confirm Order" in cart
**What happens**:

- ✅ Order created with status: `BANK_REVIEW`
- ✅ Payment locked in Hedera escrow
- ✅ `buyerBankId` assigned (from buyer's User.bankId)
- ✅ `sellerBankId` assigned (from producer's User.bankId)
- ✅ Both banks receive notification (order appears in their dashboard)

**Implementation**: `server/services/order.service.ts` - `passOrderService()`

### 2. Bank Review Phase

**Status**: `BANK_REVIEW`

**Bank Agent Actions**:

- View order details in Bank Dashboard (`/bank/page`)
- Request documents from buyer (invoices, purchase orders, etc.)
- Request documents from seller (export licenses, certificates, etc.)
- Review submitted documents
- Approve order when satisfied

**Implementation**:

- Document request: `POST /api/bank/orders/:id/request-documents`
- Bank approval: `PUT /api/bank/escrows/:id` with `{ bankId, bankType, comments }`

### 3. Dual-Bank Approval

**Required**: BOTH buyer bank AND seller bank must approve

**What happens when both approve**:

- ✅ Order status changes to `IN_TRANSIT`
- ✅ 50% of escrow released to seller
- ✅ PaymentRelease record created (type: "PARTIAL50")

**Implementation**: `server/services/bank.service.ts` - `approveOrderByBankService()`

### 4. Shipment Phase

**Status**: `IN_TRANSIT`

**Seller Actions**:

- Ship the goods
- Add tracking information

**Bank/System Actions**:

- Monitor shipment
- Update order with tracking ID

**Implementation**: `PUT /api/bank/orders/:id/shipment`

### 5. Delivery Confirmation (Buyer Action)

**When**: Buyer receives goods and confirms delivery

**What happens**:

- ✅ Order status changes to `DELIVERED`
- ✅ Remaining 50% of escrow released to seller
- ✅ PaymentRelease record created (type: "FULL100")
- ✅ Transaction complete

**Implementation**: `PUT /api/bank/orders/:id/delivery`

## Key Features Implemented

### Backend (Server)

1. **Order Service Enhancements**

   - Auto-assign buyer/seller banks on order creation
   - Support single-seller orders (multi-seller validation included)
   - Start orders at `BANK_REVIEW` status instead of `AWAITING_PAYMENT`

2. **Bank Service**

   - `approveOrderByBankService()` - Records bank approval, triggers 50% release when both approve
   - `requestDocumentsFromBank()` - Creates BankReview record for document requests
   - `confirmDelivery()` - Releases final 50% and marks order as DELIVERED

3. **New Endpoints**
   - `POST /api/bank/orders/:id/request-documents` - Request docs from buyer/seller

### Frontend (Client)

1. **Bank Dashboard (`/bank/page`)**

   - Shows all orders with buyer/seller bank status
   - Bank selection dropdown (Buyer Bank / Seller Bank)
   - Document request buttons (From Buyer / From Seller)
   - Approval workflow with progress tracking
   - Escrow status indicators

2. **API Integration**
   - `bankApi.updateEscrow()` - Bank approval
   - `bankApi.requestDocuments()` - Document requests
   - `bankApi.confirmDelivery()` - Final payment release

## Database Schema

### Order Model

```prisma
model Order {
  buyerBankId         String?
  buyerBank           Bank?    @relation("BuyerBankOrders")
  buyerBankApproved   Boolean  @default(false)

  sellerBankId        String?
  sellerBank          Bank?    @relation("SellerBankOrders")
  sellerBankApproved  Boolean  @default(false)

  status              OrderStatus
  paymentReleases     PaymentRelease[]
  bankReviews         BankReview[]
}
```

### BankReview Model

```prisma
model BankReview {
  orderId   String
  bankId    String
  action    String  // "request_docs", "approve", "reject"
  comments  String?
}
```

### PaymentRelease Model

```prisma
model PaymentRelease {
  orderId     String
  type        String  // "PARTIAL50" or "FULL100"
  amount      Decimal
  released    Boolean
  releasedAt  DateTime?
}
```

## Order Status Flow

```
AWAITING_PAYMENT (old) → BANK_REVIEW (new start)
    ↓
BANK_REVIEW (both banks reviewing + requesting docs)
    ↓
IN_TRANSIT (both banks approved → 50% released)
    ↓
DELIVERED (buyer confirms → 100% released)
```

## User Roles & Permissions

### Buyer

- Place orders
- Submit documents when requested
- Confirm delivery

### Seller (Producer)

- Receive order notifications
- Submit documents when requested
- Ship goods with tracking

### Bank Agent (Buyer's Bank)

- View orders where `buyerBankId` matches their bank
- Request documents from buyer
- Approve order as buyer bank

### Bank Agent (Seller's Bank)

- View orders where `sellerBankId` matches their bank
- Request documents from seller
- Approve order as seller bank

## Security & Validation

1. **Order Creation**

   - Validates buyer has assigned bank
   - Validates seller (producer) exists and has assigned bank
   - Prevents multi-seller orders (future enhancement)
   - Validates stock availability

2. **Bank Approval**

   - Prevents duplicate approval from same bank
   - Requires both banks to approve before status change
   - Records all approvals in BankReview table

3. **Payment Release**
   - 50% only released when BOTH banks approve
   - Remaining 50% only released on delivery confirmation
   - All releases tracked in PaymentRelease table

## Error Handling

- Missing buyer/seller bank → Order creation fails with clear message
- Multi-seller cart → User prompted to order from one producer at a time
- Duplicate bank approval → Returns error message
- Missing documents → Bank can request before approving

## Testing Checklist

- [ ] Create order with buyer/seller banks assigned
- [ ] Bank requests documents from buyer
- [ ] Bank requests documents from seller
- [ ] First bank approves (should stay in BANK_REVIEW)
- [ ] Second bank approves (should move to IN_TRANSIT + 50% released)
- [ ] Add shipment tracking
- [ ] Buyer confirms delivery (should move to DELIVERED + remaining 50% released)
- [ ] Check PaymentRelease records created correctly

## Next Steps / Enhancements

1. **Multi-Seller Support**

   - Split orders by seller
   - Separate escrow for each seller
   - Independent bank approval per seller

2. **Notification System**

   - Email/SMS when documents requested
   - Push notifications for bank approvals
   - Shipment tracking updates

3. **Document Management**

   - Upload interface for buyers/sellers
   - Document validation UI for banks
   - IPFS/Hedera file storage integration

4. **Dispute Resolution**
   - Dispute filing interface
   - Bank arbitration workflow
   - Escrow freeze/refund logic

## Files Modified

### Server

- `server/services/order.service.ts` - Order creation with bank assignment
- `server/services/bank.service.ts` - Bank approval and escrow logic
- `server/controllers/bank.controller.ts` - Document request controller
- `server/routes/bank.routes.ts` - New route for document requests

### Client

- `client/app/bank/page.tsx` - Enhanced UI with document requests
- `client/lib/api.ts` - New API methods
- `client/types/bank.ts` - Updated type definitions
- `client/hooks/useBankData.ts` - Fetch orders with bank IDs

---

**Status**: ✅ Implemented and ready for testing
**Date**: October 22, 2025
