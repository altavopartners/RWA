# Trade Document Requirements

## Overview

This system implements comprehensive trade documentation requirements based on international trading norms. All documents are stored on IPFS for immutability and transparency.

## Document Flow

### 1. Order Creation

- Buyer places order → Order status: `AWAITING_PAYMENT`
- Buyer pays escrow → Order status: `BANK_REVIEW`

### 2. Bank Review Phase

- **Both buyer's and seller's banks** review the order
- Banks can **request additional documents** from buyer or seller
- Required documents must be uploaded and validated before approval

### 3. Document Upload & Validation

- Users upload documents via DocumentCenter component
- Documents are stored on **IPFS** (using Web3.Storage)
- Each document receives a unique **CID** (Content Identifier)
- Documents are linked to specific orders
- Bank officers review and validate/reject documents

### 4. Bank Approval

- Once both banks approve → 50% payment released to seller
- Order status: `IN_TRANSIT`

### 5. Delivery & Final Release

- Buyer confirms delivery → Remaining 50% released
- Order status: `DELIVERED`

---

## Required Document Categories

### 1. Commercial Documents (Mandatory)

Documents that establish the commercial transaction:

- **Commercial Invoice** ⭐ **REQUIRED**
  - Type: `commercial_invoice`
  - Category: `commercial`
  - Details: Itemized invoice with prices, quantities, terms
- **Packing List**
  - Type: `packing_list`
  - Category: `commercial`
  - Details: Detailed list of package contents, weights, dimensions

### 2. Transport Documents (At least one required)

Proof of shipment and carrier responsibility:

- **Bill of Lading (B/L)** - Maritime
  - Type: `bill_of_lading`
  - Category: `transport`
  - Details: Contract between shipper and carrier for sea freight
- **Air Waybill (AWB)** - Air
  - Type: `air_waybill`
  - Category: `transport`
  - Details: Air cargo receipt and contract
- **CMR** - Road (Europe)
  - Type: `cmr`
  - Category: `transport`
  - Details: Convention des Marchandises par Route
- **FCR** - Forwarder's Cargo Receipt
  - Type: `fcr`
  - Category: `transport`
  - Details: Proof freight forwarder received goods

### 3. Insurance Documents (If applicable)

Required for insured shipments:

- **Insurance Policy/Certificate**
  - Type: `insurance_policy`
  - Category: `insurance`
  - Details: Coverage details, insured amount, terms

### 4. Origin & Control Documents (If applicable)

Required by customs or trade agreements:

- **Certificate of Origin**
  - Type: `certificate_of_origin`
  - Category: `origin_control`
  - Details: Proves country of manufacture
- **Inspection Certificate**
  - Type: `inspection_certificate`
  - Category: `origin_control`
  - Details: Third-party quality/quantity verification
- **Sanitary/Phytosanitary Certificate**
  - Type: `sanitary_certificate`
  - Category: `other`
  - Details: Required for food, plants, animals

---

## Document Status Workflow

```
PENDING → Bank reviews → VALIDATED ✓
                     ↘→ REJECTED ✗ (with reason)
```

### Status Definitions

- **PENDING**: Uploaded, awaiting bank review
- **VALIDATED**: Approved by bank officer
- **REJECTED**: Not accepted (reason provided)

---

## Technical Implementation

### Storage: IPFS via Web3.Storage

- All documents uploaded to IPFS for immutable storage
- Each document gets a unique CID (Content Identifier)
- CID format: `bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi` (example)
- Documents remain permanently accessible via CID

### Database Schema (Prisma)

```prisma
model Document {
  id       String  @id @default(cuid())
  userId   String
  user     User    @relation(fields: [userId], references: [id])
  orderId  String?
  order    Order?  @relation("OrderDocuments", fields: [orderId], references: [id])

  filename String
  cid      String  // IPFS Content Identifier
  url      String  // Gateway URL for download

  category       String?       // commercial, transport, insurance, origin_control, other
  documentType   DocumentType? // commercial_invoice, bill_of_lading, etc.
  status         DocumentStatus @default(PENDING)
  validatedBy    String?
  validatedAt    DateTime?
  rejectionReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Endpoints

**Upload Document**

```
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: (binary)
- categoryKey: string
- typeKey: string
- orderId: string
```

**Download Document**

```
GET /api/documents/:cid/download
```

**Bank Review Documents**

```
GET /api/bank/documents
→ Returns all documents with user, order info

PUT /api/bank/documents/:id
Body: { status: "approve" | "reject", validatedBy: string, rejectionReason?: string }
```

**Request Documents from User**

```
POST /api/bank/orders/:orderId/request-documents
Body: { bankId: string, requestTo: "buyer" | "seller", comments: string }
```

---

## User Experience

### For Buyers & Sellers

1. Navigate to Order Details
2. See "Documents & Upload" section
3. Select document category and type
4. Upload via drag-and-drop, file picker, or paste
5. Track document status (Pending/Validated/Rejected)
6. Download or view uploaded documents

### For Bank Officers

1. Navigate to Bank Dashboard → Documents
2. Filter by status, category, type
3. Click "Review Document" on pending items
4. View document via IPFS gateway
5. Approve or reject with comments
6. Track validation stats

---

## Supported File Types

- PDF (`.pdf`)
- Images: PNG, JPG, JPEG, WebP, HEIC, TIFF
- Documents: DOC, DOCX

**Max file size**: 10 MB per file

---

## Compliance & Best Practices

1. **Verify Authenticity**: Banks should cross-check documents with known templates
2. **Check Consistency**: Ensure invoice amounts match order totals
3. **Transport Alignment**: Confirm transport documents match declared shipping method
4. **Completeness**: All required documents must be present before approval
5. **Immutability**: IPFS storage ensures documents cannot be altered post-upload
6. **Audit Trail**: All validation actions are logged with timestamp and reviewer

---

## Integration Points

### Frontend Components

- `DocumentCenter.tsx` - Document upload and management UI
- `client/app/bank/documents/page.tsx` - Bank document validation dashboard

### Backend Services

- `document.service.ts` - IPFS upload/download via Web3.Storage
- `bank.service.ts` - Document validation workflow

### Utilities

- `server/utils/w3.ts` - Web3.Storage integration helpers

---

## Example Workflow

1. **Buyer places order** for coffee beans from Colombia
2. **Buyer pays** → Order enters `BANK_REVIEW`
3. **Seller's bank requests documents**:
   - Commercial Invoice
   - Packing List
   - Certificate of Origin (Colombia)
   - Inspection Certificate (coffee quality)
4. **Seller uploads** all documents to IPFS
5. **Both banks review** and validate documents
6. **Both banks approve** → 50% released, order ships
7. **Buyer confirms delivery** → Final 50% released

---

## Future Enhancements

- [ ] Automated OCR for invoice data extraction
- [ ] Smart contract integration for automatic release based on document validation
- [ ] Email notifications on document requests and validation
- [ ] Document expiry tracking (e.g., insurance policies)
- [ ] Multi-language document support
- [ ] Digital signature verification
- [ ] Blockchain anchoring of document CIDs for audit proof

---

## Support

For questions about document requirements or upload issues:

- Check order details for specific requirements
- Contact your assigned bank for guidance
- Refer to international trade documentation standards (ICC, WTO guidelines)
