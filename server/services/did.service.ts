// src/services/did.service.ts
// Encapsulates logic for creating and managing Hedera Decentralized Identifiers (DIDs) for users.
// Generates cryptographic key pairs, creates DID strings/documents according to HIP-312.
// Stores DID metadata and documents in the database (`DID` table).

import { Prisma } from '@prisma/client';
import { prisma } from "../utils/prisma";
import { PrivateKey, PublicKey } from "@hashgraph/sdk";
import bs58 from "bs58";
import crypto from "crypto";

//  REAL Hedera DID Generator (HIP-312 Compliant)
function generateDidFromPublicKey(publicKeyHex: string): string {
  try {
    const pubKeyBytes = Buffer.from(publicKeyHex, "hex");

    // Step 1: SHA-256 hash
    const sha256Hash = crypto.createHash("sha256").update(pubKeyBytes).digest();

    // Step 2: Create multihash (0x12 = SHA-256, 0x20 = 32 bytes)
    const multihash = new Uint8Array(34);
    multihash[0] = 0x12; // Code for SHA-256
    multihash[1] = 0x20; // Length = 32 bytes
    multihash.set(sha256Hash, 2);

    // Step 3: Base58btc encode using bs58
    const digest = bs58.encode(multihash);

    // Step 4: Return DID
    return `did:hedera:testnet:${digest}`;
  } catch (err) {
    throw new Error("Failed to generate DID from public key");
  }
}

// Build Standard DID Document (W3C DID Core)
function buildDidDocument(did: string, publicKeyHex: string) {
  return {
    id: did,
    controller: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: "Ed25519VerificationKey2018",
        controller: did,
        publicKeyHex,
      },
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
  };
}

// Register Real Hedera DID for User
export async function registerDidForUser(userId: string, metadata: Record<string, unknown> = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Generate ED25519 Key Pair
  const privateKey = PrivateKey.generateED25519();
  const publicKey = privateKey.publicKey;
  const publicKeyHex = publicKey.toStringRaw();

  // Generate REAL Hedera DID
  const did = generateDidFromPublicKey(publicKeyHex);

  // Build DID Document
  const doc = buildDidDocument(did, publicKeyHex);

  // Store in DB
  const finalMetadata = {
    ...metadata,
    document: doc,
    publicKeyHex,
    // ⚠️ DEV ONLY: include private key for demo (NEVER IN PROD)
    __privateKeyDevOnly: privateKey.toString(), // For demo: show how signing works
    createdAt: new Date().toISOString(),
  };

  const upserted = await prisma.dID.upsert({
    where: { userId },
    update: {
      did,
      metadata: finalMetadata,
      updatedAt: new Date(),
    },
    create: {
      userId,
      did,
      metadata: finalMetadata,
    },
  });

  return upserted;
}

// Get DID
export async function getUserDid(userId: string) {
  const record = await prisma.dID.findUnique({ where: { userId } });
  if (!record) throw new Error("DID not found");
  return record;
}

export async function updateUserDidMetadata(
  userId: string,
  metadata: Record<string, unknown>
) {
  const record = await prisma.dID.findUnique({ where: { userId } });
  if (!record) throw new Error('DID not found');

  // merge safely
  const existing = (typeof record.metadata === 'object' && record.metadata !== null
    ? record.metadata
    : {}) as Record<string, unknown>;

  const merged = { ...existing, ...metadata };

  const updated = await prisma.dID.update({
    where: { userId },
    data: {
      // 👇 cast to the exact type Prisma expects
      metadata: merged as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });

  return updated;
}
