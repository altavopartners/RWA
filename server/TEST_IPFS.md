# ✅ IPFS Documents Are Already Integrated!

## Current Status

Your system is **already fully configured** to fetch documents from IPFS. Here's the complete flow:

### 📥 Document Upload Flow (IPFS)

```
Client uploads file →
  POST /api/documents/upload →
  document.service.ts calls w3Upload() →
  File stored on IPFS via Storacha →
  Returns CID (Content Identifier) →
  Stores in database with IPFS gateway URL
```

### 📤 Document Retrieval Flow (IPFS)

```
Bank page loads →
  useBankData("documents") →
  GET /api/bank/documents →
  bank.service.ts fetches from database →
  Returns documents with IPFS URLs →
  Client displays with gateway links
```

### 🔍 Document Download Flow (IPFS)

```
User clicks "View" or "Download" →
  Opens URL: https://up.storacha.network/ipfs/{cid} →
  IPFS gateway retrieves file from network →
  File displayed/downloaded
```

## Code Verification

### ✅ Backend Integration (Already Done)

- **`server/services/document.service.ts`**: Uses `w3Upload()` to store on IPFS
- **`server/utils/w3.ts`**: Configured with your Storacha credentials
- **`server/services/bank.service.ts`**: `getDocuments()` fetches with CID and URL
- **`server/controllers/document.controller.ts`**: Upload/download endpoints

### ✅ Frontend Integration (Already Done)

- **`client/hooks/useBankData.ts`**: Fetches documents via `bankApi.getDocuments()`
- **`client/lib/api.ts`**: `bankApi.getDocuments()` calls backend
- **`client/app/bank/documents/page.tsx`**: Displays documents with IPFS data
- **`client/types/bank.ts`**: `BankDocument` type includes `cid` and `url` fields

## How to Test

### 1. Start the Server

```bash
cd server
# Make sure .env exists with your Storacha credentials
cp .env.example .env
npm run dev
```

### 2. Start the Client

```bash
cd client
npm run dev
```

### 3. Upload a Test Document

**Option A: Via DocumentCenter Component**

```typescript
// In your app, use the DocumentCenter component
import DocumentCenter from "@/components/DocumentCenter";

// In your page/component
<DocumentCenter />;
```

**Option B: Via cURL**

```bash
# Get your JWT token first (login)
TOKEN="your_jwt_token_here"

# Upload a document
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/test-document.pdf" \
  -F "categoryKey=commercial" \
  -F "typeKey=commercial_invoice" \
  -F "orderId=your_order_id"
```

Expected response:

```json
{
  "success": true,
  "data": {
    "doc": {
      "id": "...",
      "filename": "test-document.pdf",
      "cid": "bafybeib...",
      "url": "https://up.storacha.network/ipfs/bafybeib...",
      "category": "commercial",
      "documentType": "commercial_invoice"
    }
  }
}
```

### 4. View Documents in Bank Dashboard

Navigate to: `http://localhost:3000/bank/documents`

You should see:

- ✅ Document cards with CID displayed
- ✅ "View" button opens IPFS gateway URL
- ✅ "Download" button downloads from IPFS
- ✅ Document metadata (category, type, status)
- ✅ User information (who uploaded)
- ✅ Order code (if linked to order)

### 5. Verify IPFS Storage

Click "View" on any document → Should open:

```
https://up.storacha.network/ipfs/{cid}
```

If the file displays, **IPFS integration is working!** ✅

## Troubleshooting

### Documents Not Showing?

**Check 1: Are there documents in the database?**

```bash
# In your database client
SELECT id, filename, cid, url, status FROM "Document";
```

**Check 2: Is the backend returning documents?**

```bash
# Test the API directly
curl http://localhost:3001/api/bank/documents
```

**Check 3: Check browser console**

```javascript
// Open DevTools Console
// You should see fetch calls to /api/bank/documents
```

### Upload Failing?

**Check 1: Environment variables**

```bash
cd server
cat .env | grep STORACHA
# Should show your credentials
```

**Check 2: Server logs**

```bash
# In the server terminal, you should see:
# "agent DID (derived from seed): did:key:z6Mk..."
```

**Check 3: File size**

```bash
# Max file size is 10MB
# Check: server/controllers/document.controller.ts
# Line: limits: { fileSize: 10 * 1024 * 1024 }
```

### Gateway URL Not Working?

**Option 1: Try alternative gateway**
Edit `server/.env`:

```env
IPFS_GATEWAY_URL=https://w3s.link
```

**Option 2: Use direct IPFS gateway**

```env
IPFS_GATEWAY_URL=https://ipfs.io
```

**Option 3: Wait 30-60 seconds**

- First retrieval from IPFS can be slow
- CID needs to propagate across network

## Current Document Page Features

Your `client/app/bank/documents/page.tsx` already has:

✅ **Real IPFS Data**: Fetches documents with CID and gateway URL  
✅ **Filtering**: By status, category, document type  
✅ **Stats Cards**: Total, pending, validated, rejected counts  
✅ **Document Cards**: Display filename, CID, category, uploader info  
✅ **View Button**: Opens IPFS gateway URL in new tab  
✅ **Download Button**: Downloads file from IPFS  
✅ **Validation Dialog**: Approve/reject with comments  
✅ **Status Badges**: Visual indicators for document status

## Example Document Data Structure

When you fetch documents, each document looks like:

```typescript
{
  "id": "cm12345...",
  "filename": "commercial_invoice.pdf",
  "cid": "bafybeibxm2nsadl3fnxv...",
  "url": "https://up.storacha.network/ipfs/bafybeibxm2nsadl3fnxv...",
  "category": "commercial",
  "documentType": "commercial_invoice",
  "status": "PENDING",
  "user": {
    "id": "user123",
    "fullName": "John Doe",
    "email": "john@example.com",
    "userType": "BUYER"
  },
  "order": {
    "id": "order456",
    "code": "ORD-2025-000001"
  },
  "createdAt": "2025-01-15T10:30:00Z",
  "validatedBy": null,
  "validatedAt": null,
  "rejectionReason": null
}
```

## What Makes This IPFS-Backed?

1. **CID (Content Identifier)**: `bafybeibxm2nsadl3fnxv...`

   - Unique cryptographic hash of the file content
   - Immutable - same file = same CID
   - Used to retrieve file from IPFS network

2. **Gateway URL**: `https://up.storacha.network/ipfs/{cid}`

   - HTTP interface to IPFS network
   - Retrieves file using CID
   - Alternative gateways: w3s.link, ipfs.io, dweb.link

3. **Storacha Storage**: Files stored on decentralized IPFS network
   - Not stored on your server
   - Distributed across IPFS nodes
   - Permanent and immutable

## Next Steps

1. ✅ **System is ready** - Documents are already fetched from IPFS
2. 🔄 **Test upload** - Upload a document to verify IPFS integration
3. 👀 **View in dashboard** - Check `/bank/documents` page
4. 🎉 **Validate documents** - Approve/reject documents as bank officer

---

**Summary**: Your documents page is **already importing real docs from IPFS**! Just make sure:

- Server is running with `.env` configured
- Documents exist in the database (upload some test docs)
- Gateway URL is accessible (https://up.storacha.network)
