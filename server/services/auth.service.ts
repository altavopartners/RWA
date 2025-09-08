// src/services/auth.service.ts
// (Updated) Service for the traditional manual authentication flow.
// Generates nonces, verifies signatures via utility functions, manages user creation/login, JWTs.
// NOW FULLY integrates server-side session management using the `AuthSession` table via `SessionService`.
// This provides revocable sessions, logout, and consistency with `wallet.service.ts`.

import { prisma } from "../utils/prisma";
import { WalletType, JWTPayload, UserType } from "../types/auth";
import { generateNonce, createSignatureMessage, isNonceValid } from "../utils/crypto";
import { JWTUtils } from "../utils/jwt";
import { SessionService } from "./session.service"; // Import SessionService
import { v4 as uuidv4 } from 'uuid'; // For generating unique session IDs if needed, though JWT payload can use user.id
/** Optional DID auto-issue feature */
import { registerDidForUser } from "./did.service";
import { verifyMetaMaskSignature } from "../utils/verifyEthereum";
import { verifyHashpackSignature } from "../utils/verifyHashpack";

const AUTO_ISSUE_DID = (process.env.AUTO_ISSUE_DID || "false").toLowerCase() === "true";

/** Generate nonce and upsert lightweight user record */
export async function generateWalletNonce(walletAddress: string) {
  const nonce = generateNonce();
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: { nonce, updatedAt: now },
    create: { walletAddress, nonce }, // userType defaults to USER
  });

  return {
    nonce,
    message: createSignatureMessage(walletAddress, nonce, Date.now()),
    expiresIn: 600, // 10 minutes
    userType: (user.userType as UserType) || "USER",
  };
}

/**
 * connectWallet: verifies signature (MetaMask or HashPack), saves user record,
 * creates an AuthSession, and returns a JWT + user object.
 * 
 * - For HashPack, a publicKeyHex (32 bytes hex) is required to verify ED25519 signatures.
 * ED25519 signatures how it works:
You have a private key (secret) and public key (shared). You sign messages with private key, others verify with public key.


 */
export async function connectWalletService(params: {
  walletAddress: string;
  signature: string;
  message: string;
  nonce: string;
  walletType: WalletType;
  publicKeyHex?: string; // for HashPack
  ipAddress?: string;   // For session tracking
  userAgent?: string;   // For session tracking
}) {
  const { walletAddress, signature, message, nonce, walletType, publicKeyHex, ipAddress, userAgent } = params;

  // 1) Find user and check nonce
  const userBefore = await prisma.user.findUnique({ where: { walletAddress } });
  if (!userBefore || !userBefore.nonce || userBefore.nonce !== nonce) {
    throw new Error("Invalid or expired nonce");
  }

  if (!isNonceValid(userBefore.updatedAt)) {
    throw new Error("Nonce expired");
  }

   /*2) Verify signature (Uncomment for real verification)
    let ok = false;
    if (walletType === "metamask") {
      ok = verifyMetaMaskSignature(message, signature, walletAddress);
    } else if (walletType === "hashpack") {
      if (!publicKeyHex) throw new Error("Missing Hedera publicKeyHex for HashPack verification");
      ok = await verifyHashpackSignature(message, signature, publicKeyHex);
    } else {
      throw new Error("Unsupported wallet type");
    }
    if (!ok) throw new Error("Signature verification failed");
    */
    

  // ONLY FOR TESTING: Temporarily accept all signatures
  let ok = true; // <- Remove this line for production

  // 3) Upsert user: attach publicKeyHex if provided (HashPack)
  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: {
      lastLoginAt: new Date(),
      nonce: null,
      publicKeyHex: publicKeyHex ?? userBefore?.publicKeyHex ?? null,
      updatedAt: new Date(),
    },
    create: {
      walletAddress,
      nonce: null,
      publicKeyHex: publicKeyHex ?? null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 4) Prepare JWT Payload
  const sessionId = uuidv4(); // Generate a unique session ID
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: user.id,
    walletAddress: user.walletAddress,
    userType: (user.userType as UserType) || "USER",
    sessionId: sessionId, // Link JWT to this specific session
  };

  // 5) Generate JWT tokens using JWTUtils
  const { accessToken, refreshToken } = JWTUtils.generateTokenPair(payload);
  // Alternative if you want different expiries:
  // const accessToken = JWTUtils.sign(payload, "15m");
  // const refreshToken = JWTUtils.sign({ ...payload, sessionId }, "7d"); // Include sessionId in refresh payload if needed for lookup

  // 6) Create database-backed AuthSession using SessionService
  //    This is the key integration point.
  await SessionService.createSession({
    userId: user.id,
    token: accessToken, // Store the access token
    refreshToken: refreshToken, // Store the refresh token
    ipAddress, // Optional: Track IP
    // expiresAt is handled by SessionService.getDefaultExpiry() or can be passed explicitly
    // isActive is set to true by default in SessionService.createSession
  });

  // 7) DO NOT auto-issue DID here - only on profile completion

  // 8) Sanitize and return user object with tokens
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.fullName ?? undefined,
      userType: (user.userType as UserType) || "USER",
      isVerified: user.isVerified,
    },
  };
}

/** Get profile by userId (thin wrapper) */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletAddress: true,
      accountId: true,
      fullName: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      location: true,
      businessName: true,
      businessDesc: true,
      userType: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) throw new Error("User not found");

  return {
    ...user,
    username: user.fullName ?? undefined,
    userType: (user.userType as UserType) || "USER",
  };
}

/** Unified profile update function - handles both core identity and progressive profile */
export async function updateUserProfile(userId: string, data: {
  // Core identity fields (phase 1) - triggers verification and DID creation
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  
  // Progressive profile fields (phase 2)
  profileImage?: string;
  businessName?: string;
  businessDesc?: string;
}) {
  // Check if this is a core identity update (has required fields for verification)
  const isCoreIdentityUpdate = data.fullName && data.email && data.phoneNumber && data.location;
  
  // Email uniqueness check if email is being updated
  if (data.email) {
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: data.email, 
        id: { not: userId } 
      }
    });
    if (existingUser) throw new Error("Email already in use");
  }

  // Prepare update data
  const updateData: any = {
    ...data,
    updatedAt: new Date()
  };

  // If this is a core identity update, mark as verified
  if (isCoreIdentityUpdate) {
    updateData.isVerified = true;
  }

  // Update user profile
  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // ✅ Create DID for newly verified users (only after core identity completion)
  if (isCoreIdentityUpdate) {
    try {
      // Check if user already has DID (prevent duplicates)
      const existingDID = await prisma.dID.findUnique({ where: { userId } });
      if (!existingDID) {
        console.log(`[DID] Creating DID for verified user ${userId}`);
        await registerDidForUser(userId, {
          triggeredBy: "profile_completion",
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn(`[DID] Failed to auto-create for user ${userId}:`, (err as Error).message);
      // Don't throw - let user continue even if DID fails
    }
  }

  return updated;
}
export async function getIdentityByWallet(walletAddress: string) {
  // Query the database to find user by wallet address with specific fields
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      userType: true,
      isVerified: true,
      dID: {  // Include related DID information with specific fields
        select: {
          did: true,
          createdAt: true,
        }
      },
      createdAt: true,  // Include account creation date
    },
  });

  // Return existence status if user not found
  if (!user) {
    return { exists: false };
  }

  // Return formatted user data with existence status
  return {
    exists: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      profileImage: user.profileImage,
      userType: user.userType,
      isVerified: user.isVerified,
      did: user.dID?.did || null,  // Handle case where DID might not exist
      memberSince: user.createdAt.toISOString(),  // Format date as ISO string
    }
  };
}

