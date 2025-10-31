// src/services/document.service.ts
import { prisma } from "../utils/prisma";
import { DocumentType } from "@prisma/client"; // <-- import enums from Prisma client
import crypto from "crypto";

// dynamic import keeps CJS paths happy during ts-node execution
async function getW3() {
  return await import("../../server/utils/w3"); // <- updated path
}

// Map/normalize whatever the UI sends to a valid DocumentType enum
function resolveDocumentType(input: unknown): DocumentType | undefined {
  if (input == null) return undefined;

  // If caller already passed an enum value string like "KYC_ID", accept it.
  if (typeof input === "string" && input in DocumentType) {
    return (DocumentType as Record<string, DocumentType>)[input];
  }

  // Normalize common keys/labels coming from the UI
  const key = String(input).trim().toLowerCase();

  switch (key) {
    case "kyc":
    case "kyc_id":
    case "id":
      return DocumentType.KYC_ID;

    case "business_license":
    case "business-licence":
    case "license":
    case "licence":
      return DocumentType.BUSINESS_LICENSE;

    case "organic":
    case "organic_cert":
      return DocumentType.ORGANIC_CERT;

    case "halal":
    case "halal_cert":
      return DocumentType.HALAL_CERT;

    case "other":
      return DocumentType.OTHER;

    // Your UI label: “Facture commerciale (Commercial Invoice)”
    // Not in the enum -> choose a policy. Here we map to OTHER.
    case "commercial-invoice":
    case "commercial_invoice":
    case "facture commerciale":
    case "invoice":
      return DocumentType.OTHER;

    default:
      // As a safe default, you can either return undefined (omit the field)
      // or force a fallback enum. Pick one policy. Here we fallback to OTHER.
      return DocumentType.OTHER;
  }
}

export async function saveDocumentForUser(
  userId: string,
  filename: string,
  buffer: Buffer,
  mimeType?: string,
  categoryKey?: unknown,
  typeKey?: unknown,
  orderId?: unknown
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

    // Normalize inputs for Prisma
    const documentType = resolveDocumentType(typeKey);
    const category = typeof categoryKey === "string" && categoryKey.trim() !== "" ? categoryKey : undefined;
    const orderIdClean = typeof orderId === "string" && orderId.trim() !== "" ? orderId : undefined;

    const doc = await prisma.document.create({
      data: {
        userId,
        filename,
        cid,
        url,
        // Only include optional fields if we have values
        ...(category ? { category } : {}),
        ...(documentType ? { documentType } : {}),
        ...(orderIdClean ? { orderId: orderIdClean } : {}),
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
