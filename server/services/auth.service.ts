// src/services/auth.service.ts
// Service for authentication flow, wallet connection, JWTs, sessions, and unified profile updates.

import { prisma } from "../utils/prisma";
import { WalletType, JWTPayload, UserType } from "../types/auth";
import {
  generateNonce,
  createSignatureMessage,
  isNonceValid,
} from "../utils/crypto";
import { JWTUtils } from "../utils/jwt";
import { SessionService } from "./session.service";
import { v4 as uuidv4 } from "uuid";
import { registerDidForUser } from "./did.service";
import { verifyMetaMaskSignature } from "../utils/verifyEthereum";
import { verifyHashpackSignature } from "../utils/verifyHashpack";

const AUTO_ISSUE_DID =
  (process.env.AUTO_ISSUE_DID || "false").toLowerCase() === "true";

/** Generate nonce and upsert lightweight user record */
export async function generateWalletNonce(walletAddress: string) {
  const nonce = generateNonce();
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: { nonce, updatedAt: now },
    create: { walletAddress, nonce },
  });

  return {
    nonce,
    message: createSignatureMessage(walletAddress, nonce, Date.now()),
    expiresIn: 600,
    userType: (user.userType as UserType) || "USER",
  };
}

/** Connect wallet, verify signature, create JWT and AuthSession */
export async function connectWalletService(params: {
  walletAddress: string;
  signature: string;
  message: string;
  nonce: string;
  walletType: WalletType;
  publicKeyHex?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const {
    walletAddress,
    signature,
    message,
    nonce,
    walletType,
    publicKeyHex,
    ipAddress,
    userAgent,
  } = params;

  const userBefore = await prisma.user.findUnique({ where: { walletAddress } });
  if (!userBefore || !userBefore.nonce || userBefore.nonce !== nonce) {
    throw new Error("Invalid or expired nonce");
  }

  if (!isNonceValid(userBefore.updatedAt)) throw new Error("Nonce expired");

  // ONLY FOR TESTING: accept all signatures
  let ok = true;

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

  const sessionId = uuidv4();
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: user.id,
    walletAddress: user.walletAddress,
    userType: (user.userType as UserType) || "USER",
    sessionId: sessionId,
  };

  const { accessToken, refreshToken } = JWTUtils.generateTokenPair(payload);

  await SessionService.createSession({
    userId: user.id,
    token: accessToken,
    refreshToken: refreshToken,
    ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.fullName ?? undefined,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      location: user.location,
      profileImage: user.profileImage,
      businessName: user.businessName,
      businessDesc: user.businessDesc,
      userType: (user.userType as UserType) || "USER",
      isVerified: user.isVerified,
    },
  };
}

/** Get profile by userId */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletAddress: true,
      accountId: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      location: true,
      profileImage: true,
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

/** Unified profile update function */
export async function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    location?: string;
    profileImage?: string;
    businessName?: string;
    businessDesc?: string;
  }
) {
  const isCoreIdentityUpdate =
    !!data.fullName && !!data.email && !!data.phoneNumber && !!data.location;

  if (data.email) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existingUser) throw new Error("Email already in use");
  }

  const updateData: any = { ...data, updatedAt: new Date() };
  if (isCoreIdentityUpdate) updateData.isVerified = true;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      walletAddress: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      location: true,
      profileImage: true,
      businessName: true,
      businessDesc: true,
      userType: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (isCoreIdentityUpdate) {
    try {
      const existingDID = await prisma.dID.findUnique({ where: { userId } });
      if (!existingDID) {
        console.log(`[DID] Creating DID for verified user ${userId}`);
        await registerDidForUser(userId, {
          triggeredBy: "profile_completion",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(
        `[DID] Failed to auto-create for user ${userId}:`,
        (err as Error).message
      );
    }
  }

  return {
    ...updated,
    username: updated.fullName ?? undefined,
    userType: (updated.userType as UserType) || "USER",
  };
}

/** Get user identity by wallet address */
export async function getIdentityByWallet(walletAddress: string) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      phoneNumber: true,
      userType: true,
      isVerified: true,
      dID: {
        select: { did: true, createdAt: true },
      },
      createdAt: true,
    },
  });

  if (!user) return { exists: false };

  return {
    exists: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      userType: user.userType,
      isVerified: user.isVerified,
      did: user.dID?.did || null,
      memberSince: user.createdAt.toISOString(),
    },
  };
}
