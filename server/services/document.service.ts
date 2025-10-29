// src/services/document.service.ts
import { prisma } from "../utils/prisma";
import crypto from "crypto";

// dynamic import keeps CJS paths happy during ts-node execution
async function getW3() {
  return await import("../../server/utils/w3"); // <- updated path
}

export async function saveDocumentForUser(
  userId: string,
  filename: string,
  buffer: Buffer,
  mimeType?: string,
  categoryKey?: any,
  typeKey?: any,
  orderId?: any
) {
  try {
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const { w3Upload, gatewayUrl } = await getW3();

    console.log("Starting W3 upload for file:", {
      filename,
      size: buffer?.length,
      mime: mimeType,
    });
    const cid = await w3Upload(buffer, filename, mimeType);
    console.log("W3 upload succeeded, CID:", cid);

    const url = await gatewayUrl(cid);

    const doc = await prisma.document.create({
      data: {
        userId,
        filename,
        cid,
        url,
        category: categoryKey,
        documentType: typeKey,
        orderId,
      },
    });

    return { doc, cid, url, sha256 };
  } catch (error: any) {
    console.error("Failed to save document:", error?.message || error);
    throw error;
  }
}

export async function fetchDocumentBytes(cid: string) {
  const { w3FetchBytes } = await getW3();
  return await w3FetchBytes(cid);
}
