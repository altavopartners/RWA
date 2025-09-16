// src/services/document.service.ts (CJS/TS)
import { prisma } from "../utils/prisma";
import crypto from "crypto";

async function getW3() {
  // Import the TypeScript module directly
  return await import("../utils/w3.mts");
}

export async function saveDocumentForUser(
  userId: string,
  filename: string,
  buffer: Buffer,
  mimeType?: string
) {
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const { w3Upload, gatewayUrl } = await getW3();
  const cid = await w3Upload(buffer, filename, mimeType);
  const url = gatewayUrl(cid);

  const doc = await prisma.document.create({
    data: { userId, filename, cid, url },
  });

  return { doc, cid, url, sha256 };
}

export async function fetchDocumentBytes(cid: string) {
  const { w3FetchBytes } = await getW3();
  return await w3FetchBytes(cid);
}
