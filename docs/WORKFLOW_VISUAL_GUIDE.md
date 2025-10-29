# Complete Order & Bank Workflow - Visual Flow

## 🔄 End-to-End Process Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        1. ORDER PLACEMENT                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    Buyer adds products to cart
                                  │
                    Buyer clicks "Confirm Order"
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Create Order in DB      │
                    │  - Status: BANK_REVIEW   │
                    │  - buyerBankId: X        │
                    │  - sellerBankId: Y       │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Lock Payment in Escrow  │
                    │  (Hedera Smart Contract) │
                    └──────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
                ▼                                   ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│   BUYER BANK NOTIFIED     │       │  SELLER BANK NOTIFIED     │
│   Dashboard shows order   │       │  Dashboard shows order    │
└───────────────────────────┘       └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     2. BANK REVIEW PHASE                             │
└─────────────────────────────────────────────────────────────────────┘

        BUYER BANK                          SELLER BANK
             │                                    │
             ▼                                    ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │ Request Docs    │                 │ Request Docs    │
    │ from Buyer      │                 │ from Seller     │
    └─────────────────┘                 └─────────────────┘
             │                                    │
             ▼                                    ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │ Buyer uploads:  │                 │ Seller uploads: │
    │ - Invoice       │                 │ - Export Cert   │
    │ - Purchase Order│                 │ - Product Docs  │
    │ - ID/KYC        │                 │ - Business Lic  │
    └─────────────────┘                 └─────────────────┘
             │                                    │
             ▼                                    ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │ Review & Verify │                 │ Review & Verify │
    └─────────────────┘                 └─────────────────┘
             │                                    │
             ▼                                    ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │ ✅ APPROVE      │                 │ ✅ APPROVE      │
    │ (bankType:buyer)│                 │ (bankType:seller)│
    └─────────────────┘                 └─────────────────┘
             │                                    │
             └────────────────┬───────────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │ BOTH BANKS APPROVED?   │
                  └────────────────────────┘
                              │
                              ▼
                            YES
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     3. SHIPMENT TRIGGERED                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Status: IN_TRANSIT
                              │
                    ┌─────────────────────┐
                    │  Release 50% Escrow │
                    │  to Seller Account  │
                    └─────────────────────┘
                              │
                              ▼
                    Seller notified to ship
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Seller ships goods │
                    │  + Tracking Number  │
                    └─────────────────────┘
                              │
                              ▼
                    Buyer receives tracking

┌─────────────────────────────────────────────────────────────────────┐
│                     4. DELIVERY & FINAL PAYMENT                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                  Goods arrive to buyer
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Buyer inspects goods│
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ ✅ Buyer confirms   │
                    │    delivery         │
                    └─────────────────────┘
                              │
                              ▼
                    Status: DELIVERED
                              │
                    ┌─────────────────────┐
                    │ Release remaining   │
                    │ 50% to Seller       │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ ✅ ORDER COMPLETE   │
                    │    100% PAID        │
                    └─────────────────────┘
```

## 💰 Escrow Payment Timeline

```
Order Created    →    Both Banks    →    Delivery      →    Complete
    (t=0)            Approve (t=1)     Confirmed (t=2)
      │                    │                 │
      ▼                    ▼                 ▼
┌──────────┐      ┌──────────────┐   ┌──────────────┐
│  $1000   │  →   │  Seller: $500│→  │ Seller: $1000│
│  Locked  │      │  Locked: $500│   │   COMPLETE   │
└──────────┘      └──────────────┘   └──────────────┘
   100% Escrow       50% Released      100% Released
```

## 🏦 Bank Dashboard Views

### Buyer Bank Agent View

```
┌─────────────────────────────────────────────┐
│           BANK DASHBOARD - ORDERS           │
├─────────────────────────────────────────────┤
│ Order: ORD-2025-000123                      │
│ Status: 🟡 BANK_REVIEW                      │
│ Buyer: John Doe (your bank's client)       │
│ Seller: Altavo Farms                        │
│                                             │
│ Actions:                                    │
│  [📄 Request Docs from Buyer]              │
│  [✅ Approve as Buyer Bank]                │
│                                             │
│ Other Bank: Seller Bank (⏳ Pending)       │
└─────────────────────────────────────────────┘
```

### Seller Bank Agent View

```
┌─────────────────────────────────────────────┐
│           BANK DASHBOARD - ORDERS           │
├─────────────────────────────────────────────┤
│ Order: ORD-2025-000123                      │
│ Status: 🟡 BANK_REVIEW                      │
│ Buyer: John Doe                             │
│ Seller: Altavo Farms (your bank's client)  │
│                                             │
│ Actions:                                    │
│  [📄 Request Docs from Seller]             │
│  [✅ Approve as Seller Bank]               │
│                                             │
│ Other Bank: Buyer Bank (✅ Approved)       │
└─────────────────────────────────────────────┘
```

## 📊 Order Status Indicators

```
Status          Color    Escrow Status
─────────────────────────────────────────────────
BANK_REVIEW     🟡       100% locked (pending)
IN_TRANSIT      🔵       50% released to seller
DELIVERED       🟢       100% released (complete)
DISPUTED        🔴       100% frozen
CANCELLED       ⚫       Refunded to buyer
```

## 🔐 Security & Validation Rules

### Order Creation

```
✅ Buyer MUST have bankId assigned
✅ Seller MUST have bankId assigned
✅ Single seller per order (multi-seller blocked)
✅ Sufficient stock validation
✅ Escrow creation on Hedera
```

### Bank Approval

```
✅ Bank can only approve ONCE per order
✅ BOTH banks must approve to proceed
✅ All approvals logged in BankReview table
✅ Approval creates PaymentRelease record
```

### Payment Release

```
✅ First 50%: Triggered by dual-bank approval
✅ Final 50%: Triggered by delivery confirmation
✅ All releases immutable in PaymentRelease table
✅ Blockchain transactions recorded
```

## 🎯 User Actions by Role

### Buyer

- ✅ Browse marketplace
- ✅ Add products to cart
- ✅ Place order (payment → escrow)
- ✅ Upload documents when requested
- ✅ Track shipment
- ✅ Confirm delivery

### Seller (Producer)

- ✅ List products on marketplace
- ✅ Receive order notifications
- ✅ Upload documents when requested
- ✅ Ship goods with tracking
- ✅ Receive payments (50% → 100%)

### Buyer Bank Agent

- ✅ View orders for their clients (buyers)
- ✅ Request documents from buyer
- ✅ Review submitted documents
- ✅ Approve or reject order

### Seller Bank Agent

- ✅ View orders for their clients (sellers)
- ✅ Request documents from seller
- ✅ Review submitted documents
- ✅ Approve or reject order

## 🚀 API Endpoints Summary

```
Order Creation:
  GET  /api/orders/pass-order

Bank Operations:
  GET  /api/bank/orders
  GET  /api/bank/orders/workflow
  POST /api/bank/orders/:id/request-documents
  PUT  /api/bank/escrows/:id              (approve)
  PUT  /api/bank/orders/:id/shipment
  PUT  /api/bank/orders/:id/delivery

Document Management:
  GET  /api/bank/documents
  PUT  /api/bank/documents/:id
```

---

**Implementation Status**: ✅ Complete
**Last Updated**: October 22, 2025
