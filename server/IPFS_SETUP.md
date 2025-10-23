# IPFS Document Storage Setup

This project uses **Storacha (Web3.Storage)** for decentralized document storage on IPFS.

## Environment Configuration

Copy `.env.example` to `.env` in the `server/` directory and fill in your credentials:

```bash
cd server
cp .env.example .env
```

### Required Environment Variables

#### Storacha Configuration

- **`STORACHA_SEED_HEX`**: Your agent's seed in hexadecimal format
- **`EXPECTED_AGENT_DID`**: Your agent's DID (decentralized identifier) - format: `did:key:z6Mk...`
- **`W3_PROOF_BASE64`**: Base64-encoded UCAN delegation proof that grants your agent upload permissions
- **`W3_SPACE_DID`**: Your Storacha space DID (for reference/documentation)
- **`IPFS_GATEWAY_URL`**: Gateway URL for retrieving documents (default: `https://up.storacha.network`)

#### Example:

```env
STORACHA_SEED_HEX=f6f147f53afefa05cfc6be2ec5cc9bdd31736357dfb60087cf788c3cc11b2d9b
EXPECTED_AGENT_DID=did:key:z6Mkvo1JewWRDxx3byA2VJMc5PHpW4YZAebudSP5bKqFJHNx
W3_SPACE_DID=did:key:z6Mku9Umh1MhuE2QXrNUJsYAE13FZD5h9LiQRWudrvBLCahY
W3_PROOF_BASE64=mAYIEAKEPEa...
IPFS_GATEWAY_URL=https://up.storacha.network
```

## How It Works

### 1. Document Upload Flow

```
User uploads document → Server receives file →
  Uploads to IPFS via Storacha →
  Returns CID (Content Identifier) →
  Stores CID + metadata in database
```

### 2. Document Retrieval Flow

```
User requests document → Server fetches CID from database →
  Generates gateway URL (https://up.storacha.network/ipfs/{cid}) →
  Client downloads from IPFS
```

### 3. Document Validation Flow

```
Bank officer reviews document →
  Approves/Rejects with comments →
  Status updated in database →
  Document remains on IPFS (immutable)
```

## API Endpoints

### Upload Document

```http
POST /api/documents/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Form Data:
  - file: <file>
  - categoryKey: commercial | transport | insurance | origin_control | other
  - typeKey: commercial_invoice | packing_list | bill_of_lading | etc.
  - orderId: <order_id>

Response:
{
  "success": true,
  "document": {
    "id": "...",
    "filename": "invoice.pdf",
    "cid": "bafybeib...",
    "url": "https://up.storacha.network/ipfs/bafybeib...",
    "category": "commercial",
    "documentType": "commercial_invoice"
  }
}
```

### Download Document

```http
GET /api/documents/:cid/download

Response: Binary file stream
```

### Bank: Get All Documents

```http
GET /api/bank/documents
Authorization: Bearer <BANK_JWT_TOKEN>

Response:
{
  "success": true,
  "documents": [
    {
      "id": "...",
      "filename": "invoice.pdf",
      "cid": "bafybeib...",
      "url": "https://up.storacha.network/ipfs/bafybeib...",
      "status": "PENDING",
      "user": { "id": "...", "fullName": "..." },
      "order": { "id": "...", "code": "ORD-2025-000001" }
    }
  ]
}
```

### Bank: Validate Document

```http
PUT /api/bank/documents/:id/validate
Authorization: Bearer <BANK_JWT_TOKEN>
Content-Type: application/json

{
  "action": "approve" | "reject",
  "validatedBy": "Officer Name",
  "rejectionReason": "Optional reason if rejecting"
}

Response:
{
  "success": true,
  "document": { ... }
}
```

## Document Requirements

See [`DOCUMENT_REQUIREMENTS.md`](./DOCUMENT_REQUIREMENTS.md) for comprehensive documentation on:

- Required documents per trade category
- Document status workflow
- Compliance best practices
- Integration examples

## Testing

### 1. Start the server

```bash
cd server
npm install
npm run dev
```

### 2. Upload a test document

```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-invoice.pdf" \
  -F "categoryKey=commercial" \
  -F "typeKey=commercial_invoice" \
  -F "orderId=ORDER_ID"
```

### 3. Verify upload

- Check response for `cid` and `url`
- Visit the `url` in your browser to view the document
- Check bank dashboard at `/bank/documents` to see the document

## Troubleshooting

### "Unable to read agent DID from client"

- Verify `STORACHA_SEED_HEX` is correct
- Check that the seed generates the expected `EXPECTED_AGENT_DID`

### "UCAN audience DID mismatch"

- Ensure `W3_PROOF_BASE64` was created for the agent DID derived from your seed
- The proof's `aud` field must match `EXPECTED_AGENT_DID`

### "Space not found"

- Verify `W3_PROOF_BASE64` includes delegation for the correct space
- Check that the space exists in your Storacha account

### Gateway timeout / slow downloads

- Try alternative gateway: `https://w3s.link` instead of `https://up.storacha.network`
- Consider using a CDN or dedicated IPFS gateway for production

## Production Considerations

1. **Backup credentials**: Store `.env` securely (never commit to git)
2. **CDN**: Consider Cloudflare IPFS gateway for better performance
3. **Monitoring**: Log all IPFS operations for debugging
4. **Rate limiting**: Storacha free tier has upload limits
5. **Retention**: Documents on IPFS are immutable and permanent
6. **Privacy**: Consider encrypting sensitive documents before upload

## Support

For Storacha-specific issues:

- Documentation: https://storacha.network/docs
- GitHub: https://github.com/storacha/storacha
- Discord: https://discord.gg/storacha
