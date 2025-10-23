"use strict";
// src/services/auth.service.ts
// Service for authentication flow, wallet connection, JWTs, sessions, and unified profile updates.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWalletNonce = generateWalletNonce;
exports.connectWalletService = connectWalletService;
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.getIdentityByWallet = getIdentityByWallet;
const prisma_1 = require("../utils/prisma");
const crypto_1 = require("../utils/crypto");
const jwt_1 = require("../utils/jwt");
const session_service_1 = require("./session.service");
const uuid_1 = require("uuid");
const did_service_1 = require("./did.service");
const AUTO_ISSUE_DID = (process.env.AUTO_ISSUE_DID || "false").toLowerCase() === "true";
/** Generate nonce and upsert lightweight user record */
async function generateWalletNonce(walletAddress) {
    const nonce = (0, crypto_1.generateNonce)();
    const now = new Date();
    const user = await prisma_1.prisma.user.upsert({
        where: { walletAddress },
        update: { nonce, updatedAt: now },
        create: { walletAddress, nonce },
    });
    return {
        nonce,
        message: (0, crypto_1.createSignatureMessage)(walletAddress, nonce, Date.now()),
        expiresIn: 600,
        userType: user.userType || "USER",
    };
}
/** Connect wallet, verify signature, create JWT and AuthSession */
async function connectWalletService(params) {
    const { walletAddress, signature, message, nonce, walletType, publicKeyHex, ipAddress, userAgent, } = params;
    const userBefore = await prisma_1.prisma.user.findUnique({ where: { walletAddress } });
    if (!userBefore || !userBefore.nonce || userBefore.nonce !== nonce) {
        throw new Error("Invalid or expired nonce");
    }
    if (!(0, crypto_1.isNonceValid)(userBefore.updatedAt))
        throw new Error("Nonce expired");
    // ONLY FOR TESTING: accept all signatures
    let ok = true;
    const user = await prisma_1.prisma.user.upsert({
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
    const sessionId = (0, uuid_1.v4)();
    const payload = {
        userId: user.id,
        walletAddress: user.walletAddress,
        userType: user.userType || "USER",
        sessionId: sessionId,
    };
    const { accessToken, refreshToken } = jwt_1.JWTUtils.generateTokenPair(payload);
    await session_service_1.SessionService.createSession({
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
            userType: user.userType || "USER",
            isVerified: user.isVerified,
        },
    };
}
/** Get profile by userId */
async function getUserProfile(userId) {
    const user = await prisma_1.prisma.user.findUnique({
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
            //isVerified: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
        },
    });
    if (!user)
        throw new Error("User not found");
    return {
        ...user,
        username: user.fullName ?? undefined,
        userType: user.userType || "USER",
    };
}
/** Unified profile update function */
async function updateUserProfile(userId, data) {
    // Check if this is a core identity update (has required fields for verification)
    const isCoreIdentityUpdate = data.fullName && data.email && data.phoneNumber && data.location;
    // Email uniqueness check if email is being updated
    if (data.email) {
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                email: data.email,
                id: { not: userId }
            }
        });
        if (existingUser)
            throw new Error("Email already in use");
    }
    // Prepare update data
    const updateData = {
        ...data,
        updatedAt: new Date()
    };
    /*If this is a core identity update, mark as verified
    if (isCoreIdentityUpdate) {
      updateData.isVerified = true;
    }*/
    // Update user profile
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: updateData,
    });
    // Create DID for newly verified users (only after core identity completion)
    if (isCoreIdentityUpdate) {
        try {
            // Check if user already has DID (prevent duplicates)
            const existingDID = await prisma_1.prisma.dID.findUnique({ where: { userId } });
            if (!existingDID) {
                console.log(`[DID] Creating DID for verified user ${userId}`);
                await (0, did_service_1.registerDidForUser)(userId, {
                    triggeredBy: "profile_completion",
                    createdAt: new Date().toISOString()
                });
            }
        }
        catch (err) {
            console.warn(`[DID] Failed to auto-create for user ${userId}:`, err.message);
            // Don't throw - let user continue even if DID fails
        }
    }
    return updated;
}
/** Get user identity by wallet address */
async function getIdentityByWallet(walletAddress) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { walletAddress },
        select: {
            id: true,
            fullName: true,
            profileImage: true,
            phoneNumber: true,
            userType: true,
            //isVerified: true,
            dID: {
                select: { did: true, createdAt: true },
            },
            createdAt: true,
        },
    });
    if (!user)
        return { exists: false };
    return {
        exists: true,
        user: {
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            profileImage: user.profileImage,
            userType: user.userType,
            //isVerified: user.isVerified,
            did: user.dID?.did || null,
            memberSince: user.createdAt.toISOString(),
        },
    };
}
//# sourceMappingURL=auth.service.js.map