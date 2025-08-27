// src/services/document.service.ts
// Encapsulates logic for handling user-uploaded documents.
// Includes saving file buffers to IPFS (via `IpfsUtils`), computing hashes, and managing document records in the database (`Document` table).
// Also handles retrieving document bytes from IPFS.
 
import { prisma } from "../utils/prisma";
import { uploadToIPFS, getBytesFromIPFS } from "../utils/ipfs";
import crypto from "crypto";

export async function saveDocumentForUser(userId: string, filename: string, buffer: Buffer, mimeType?: string) {
  // compute sha256 for integrity & optional on-chain anchoring
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

  // upload to IPFS (returns CID)
  const cid = await uploadToIPFS(buffer);

  // create DB record
  const doc = await prisma.document.create({
    data: {
      userId,
      filename,
      cid,
      url: `ipfs://${cid}`,
    },
  });

  return { doc, cid, sha256 };
}

/** Retrieve bytes of a document by CID */
export async function fetchDocumentBytes(cid: string) {
  const buf = await getBytesFromIPFS(cid);
  return buf;
}
