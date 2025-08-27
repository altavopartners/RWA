// src/services/wallet.service.ts
// Central service for comprehensive wallet-based user authentication and session management.
// Handles generating nonces, verifying signatures (HashPack, MetaMask) for manual auth.
// Manages AuthSession lifecycle (create, validate, disconnect, cleanup).
// Integrates with `HederaWalletConnect` SDK for future WalletConnect flow initiation/completion.
// Delegates profile and document *metadata* fetching to `ProfileService` and `DocumentService` respectively.
// Orchestrates JWT creation upon successful authentication.


 // --- WALLETCONNECT INTEGRATION PLACEHOLDER ---
  // TODO: Integrate @hashgraph/hedera-wallet-connect library here.
  // Steps:
  // 1. Install: npm install @hashgraph/hedera-wallet-connect
  // 2. Import the correct member from the namespace (e.g., DAppConnector).
  // 3. Implement getHederaWalletConnectClient() to initialize the client singleton.
  // 4. Implement initiateWalletConnectAuth() to generate WC URI/topic.
  // 5. Implement completeWalletConnectAuth() to process the signature received from the frontend.
  // This will enable the full WalletConnect authentication flow.

/*import { prisma } from "../utils/prisma";
import { JWTUtils } from "../utils/jwt";
import { AccountId } from "@hashgraph/sdk";
import { walletLogger } from "../utils/logger";
import {
  isValidHederaAddress,
  generateNonce,
  createSignatureMessage,
  isNonceValid
} from "../utils/crypto";
import { verifyHashpackSignature } from "../utils/verifyHashpack";
import { verifyMetaMaskSignature } from "../utils/verifyEthereum";

// Import your existing services
import { getProfile, updateProfile } from "./profile.service";
import { fetchDocumentBytes } from "./document.service";

// Environment configuration
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const SESSION_EXPIRY_MS = parseInt(process.env.SESSION_EXPIRY_MS || "900000", 10);
const NONCE_EXPIRY_MINUTES = parseInt(process.env.NONCE_EXPIRY_MINUTES || "10", 10);



// Custom error class for better error handling
class WalletConnectError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = "WalletConnectError";
  }
}

export class WalletService {
  
   //Extract account ID from Hedera address (handles both 0.0.12345 and 0.0.12345@hbar)
  private extractAccountId(address: string): string {
    return address.split('@')[0];
  }

 
   // Validate Hedera address format using Hedera SDK for additional validation
   
  private isValidHederaAddressFormat(accountId: string): boolean {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch {
      return false;
    }
  }

  // Comprehensive Hedera address validation using both your regex and SDK validation
   
  private validateHederaAddress(accountId: string): boolean {
    const normalizedAccountId = this.extractAccountId(accountId);
    return isValidHederaAddress(normalizedAccountId) &&
      this.isValidHederaAddressFormat(normalizedAccountId);
  }

  // Detect signature type based on signature format
   
  private detectSignatureType(signature: string): "hashpack" | "metamask" {
    // HashPack signatures are typically 128 hex chars (64 bytes)
    // MetaMask signatures are typically 132 hex chars with 0x prefix
    const cleanSignature = signature.startsWith('0x') ? signature.substring(2) : signature;
    
    if (signature.startsWith('0x') && cleanSignature.length === 130) {
      return "metamask";
    } else if (cleanSignature.length === 128) {
      return "hashpack";
    }
    
    // Default to hashpack for backward compatibility
    return "hashpack";
  }

  // Get user ID from wallet address
   
  private async getUserIdFromWalletAddress(walletAddress: string): Promise<string> {
    const normalizedAddress = this.extractAccountId(walletAddress);
    
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true }
    });

    if (!user) {
      throw new WalletConnectError("User not found");
    }

    return user.id;
  }

  // Generate and store a nonce for wallet authentication
   
  async generateAuthNonce(walletAddress: string) {
    try {
      walletLogger.info('Generating authentication nonce', { walletAddress });

      const normalizedAddress = this.extractAccountId(walletAddress);

      if (!this.validateHederaAddress(normalizedAddress)) {
        throw new WalletConnectError(`Invalid Hedera wallet address: ${walletAddress}`);
      }

      const nonce = generateNonce();
      const nonceIssuedAt = new Date();
      const nonceExpiry = new Date(nonceIssuedAt.getTime() + NONCE_EXPIRY_MINUTES * 60 * 1000);

      // Upsert user with new nonce
      const user = await prisma.user.upsert({
        where: { walletAddress: normalizedAddress },
        update: {
          nonce,
          nonceIssuedAt,
          updatedAt: new Date()
        },
        create: {
          walletAddress: normalizedAddress,
          accountId: normalizedAddress, // Set accountId same as walletAddress
          nonce,
          nonceIssuedAt,
          userType: 'PRODUCER',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const signatureMessage = createSignatureMessage(
        normalizedAddress,
        nonce,
        nonceIssuedAt.getTime()
      );

      walletLogger.info('Nonce generated successfully', {
        walletAddress: normalizedAddress,
        nonceIssuedAt: nonceIssuedAt.toISOString(),
        nonceExpiry: nonceExpiry.toISOString()
      });

      return {
        nonce,
        signatureMessage,
        issuedAt: nonceIssuedAt.toISOString(),
        expiresAt: nonceExpiry.toISOString()
      };
    } catch (error: any) {
      walletLogger.error('Failed to generate authentication nonce', {
        walletAddress,
        error: error.message
      });
      throw new WalletConnectError("Failed to generate nonce: " + error.message, error);
    }
  }

  
    //Verify signature and authenticate user
   
  async verifySignatureAndAuthenticate(
    walletAddress: string,
    signature: string,
    publicKey: string,
    sessionId: string,
    signatureType?: "hashpack" | "metamask",
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Auto-detect signature type if not provided
      const detectedType = signatureType || this.detectSignatureType(signature);
      
      walletLogger.info('Verifying signature and authenticating', {
        walletAddress,
        sessionId,
        signatureType: detectedType
      });

      const normalizedAddress = this.extractAccountId(walletAddress);

      if (!this.validateHederaAddress(normalizedAddress)) {
        throw new WalletConnectError(`Invalid Hedera wallet address: ${walletAddress}`);
      }

      // Get user with nonce
      const user = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (!user || !user.nonce || !user.nonceIssuedAt) {
        throw new WalletConnectError("No authentication request found for this wallet");
      }

      // Check if nonce is still valid using your crypto utility
      if (!isNonceValid(user.nonceIssuedAt, NONCE_EXPIRY_MINUTES)) {
        throw new WalletConnectError("Authentication request expired. Please generate a new nonce.");
      }

      // Create the signature message that was originally signed
      const signatureMessage = createSignatureMessage(
        normalizedAddress,
        user.nonce,
        user.nonceIssuedAt.getTime()
      );

      // Verify the signature based on signature type
      let isValidSignature = false;
      
      if (detectedType === "hashpack") {
        // Verify HashPack signature (Ed25519)
        isValidSignature = await verifyHashpackSignature(
          signatureMessage,
          signature,
          publicKey
        );
      } else if (detectedType === "metamask") {
        // Verify MetaMask signature (Ethereum)
        // For MetaMask, the publicKey parameter is typically the wallet address again
        isValidSignature = verifyMetaMaskSignature(
          signatureMessage,
          signature,
          normalizedAddress
        );
      } else {
        throw new WalletConnectError("Unsupported signature type");
      }

      if (!isValidSignature) {
        walletLogger.warn('Invalid signature provided', {
          walletAddress: normalizedAddress,
          signatureType: detectedType
        });
        throw new WalletConnectError("Invalid signature provided");
      }

      walletLogger.debug('Signature verified successfully', {
        walletAddress: normalizedAddress,
        signatureType: detectedType
      });

      // Update user with public key and clear nonce
      const updatedUser = await prisma.user.update({
        where: { walletAddress: normalizedAddress },
        data: {
          publicKeyHex: publicKey,
          nonce: null,
          nonceIssuedAt: null,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Generate JWT tokens
      const payload = {
        userId: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        userType: updatedUser.userType || 'PRODUCER',
        sessionId: sessionId,
        publicKey: publicKey
      };

      const accessToken = JWTUtils.sign(payload, ACCESS_TOKEN_EXPIRY);
      const refreshToken = JWTUtils.sign({
        userId: updatedUser.id,
        sessionId: sessionId,
        walletAddress: updatedUser.walletAddress,
        userType: updatedUser.userType
      }, REFRESH_TOKEN_EXPIRY);

      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

      // Create or update auth session with IP and user agent
      await prisma.authSession.upsert({
        where: { id: sessionId },
        update: {
          token: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAt,
          isActive: true,
          ipAddress,
          userAgent,
        },
        create: {
          id: sessionId,
          userId: updatedUser.id,
          token: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAt,
          isActive: true,
          ipAddress,
          userAgent,
          createdAt: new Date(),
        }
      });

      walletLogger.info('Authentication successful', {
        userId: updatedUser.id,
        walletAddress: normalizedAddress,
        sessionId
      });

      return {
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: updatedUser.id,
          walletAddress: updatedUser.walletAddress,
          accountId: updatedUser.accountId,
          userType: updatedUser.userType,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          location: updatedUser.location,
          profileImage: updatedUser.profileImage,
          businessName: updatedUser.businessName,
          businessDesc: updatedUser.businessDesc,
          isVerified: updatedUser.isVerified,
          publicKey: updatedUser.publicKeyHex
        }
      };
    } catch (error: any) {
      walletLogger.error('Signature verification and authentication failed', {
        walletAddress,
        error: error.message
      });

      if (error instanceof WalletConnectError) {
        throw error;
      }
      throw new WalletConnectError("Authentication failed: " + error.message, error);
    }
  }

  // Validate session and get user information
   
  async validateSession(sessionId: string) {
    try {
      walletLogger.debug('Validating session', { sessionId });

      const session = await prisma.authSession.findUnique({
        where: { 
          id: sessionId, 
          isActive: true, 
          expiresAt: { gt: new Date() } 
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new WalletConnectError("Invalid or expired session");
      }

      return {
        isValid: true,
        user: session.user,
        expiresAt: session.expiresAt
      };
    } catch (error: any) {
      walletLogger.error('Session validation failed', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  // Disconnect session with proper cleanup
   
  async disconnectSession(sessionId: string) {
    try {
      walletLogger.info('Disconnecting session', { sessionId });

      await prisma.authSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          expiresAt: new Date(),
          updatedAtSess: new Date()
        }
      });

      walletLogger.info('Session disconnected successfully', { sessionId });
      return { success: true };
    } catch (error: any) {
      walletLogger.error('Failed to disconnect session', {
        sessionId,
        error: error.message
      });
      throw new WalletConnectError("Failed to disconnect session: " + error.message, error);
    }
  }

  
   // Get active sessions for a user
   
  async getUserActiveSessions(walletAddress: string) {
    try {
      const normalizedAddress = this.extractAccountId(walletAddress);

      const user = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress },
        include: {
          authSessions: {
            where: {
              isActive: true,
              expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return user?.authSessions || [];
    } catch (error: any) {
      walletLogger.error('Failed to get user active sessions', {
        walletAddress,
        error: error.message
      });
      throw new WalletConnectError("Failed to get user sessions: " + error.message, error);
    }
  }

  
   // Clean up expired sessions and nonces
   
  async cleanupExpiredData() {
    try {
      walletLogger.info('Cleaning up expired sessions and nonces');

      // Cleanup expired sessions
      const sessionResult = await prisma.authSession.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: {
          isActive: false,
          updatedAtSess: new Date()
        }
      });

      // Cleanup expired nonces (using nonceIssuedAt)
      const nonceExpiryTime = new Date(Date.now() - NONCE_EXPIRY_MINUTES * 60 * 1000);
      const nonceResult = await prisma.user.updateMany({
        where: {
          nonceIssuedAt: { lt: nonceExpiryTime },
          nonce: { not: null }
        },
        data: {
          nonce: null,
          nonceIssuedAt: null,
          updatedAt: new Date()
        }
      });

      walletLogger.info('Expired data cleaned up', {
        expiredSessions: sessionResult.count,
        expiredNonces: nonceResult.count
      });

      return {
        expiredSessions: sessionResult.count,
        expiredNonces: nonceResult.count
      };
    } catch (error: any) {
      walletLogger.error('Failed to cleanup expired data', { error: error.message });
      throw new WalletConnectError("Failed to cleanup expired data: " + error.message, error);
    }
  }
// Get user by wallet address with full profile - USING EXISTING PROFILE SERVICE
   
  async getUserByWalletAddress(walletAddress: string) {
    try {
      const normalizedAddress = this.extractAccountId(walletAddress);
      
      // First get the user ID from wallet address
      const userId = await this.getUserIdFromWalletAddress(normalizedAddress);
      
      // Use the existing profile service to get user profile
      const user = await getProfile(userId);
      
      return user;
    } catch (error: any) {
      walletLogger.error('Failed to get user by wallet address', {
        walletAddress,
        error: error.message
      });
      throw new WalletConnectError("Failed to get user: " + error.message, error);
    }
  }

  // Update user profile information - USING EXISTING PROFILE SERVICE
   
  async updateUserProfile(walletAddress: string, profileData: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    location?: string;
    businessName?: string;
    businessDesc?: string;
    profileImage?: string;
  }) {
    try {
      const normalizedAddress = this.extractAccountId(walletAddress);
      
      // First get the user ID from wallet address
      const userId = await this.getUserIdFromWalletAddress(normalizedAddress);
      
      // Use the existing profile service to update profile
      const updatedUser = await updateProfile(userId, profileData);

      walletLogger.info('User profile updated successfully', {
        walletAddress: normalizedAddress
      });

      return updatedUser;
    } catch (error: any) {
      walletLogger.error('Failed to update user profile', {
        walletAddress,
        error: error.message
      });
      throw new WalletConnectError("Failed to update profile: " + error.message, error);
    }
  }

  
   // Get user documents - USING EXISTING DOCUMENT SERVICE
   //Note: This returns document metadata, not the actual bytes
   
  async getUserDocuments(walletAddress: string) {
    try {
      const normalizedAddress = this.extractAccountId(walletAddress);
      
      // First get the user ID from wallet address
      const userId = await this.getUserIdFromWalletAddress(normalizedAddress);
      
      // Get document metadata from database
      const documents = await prisma.document.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          cid: true,
          url: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return documents;
    } catch (error: any) {
      walletLogger.error('Failed to get user documents', {
        walletAddress,
        error: error.message
      });
      throw new WalletConnectError("Failed to get documents: " + error.message, error);
    }
  }

  // Get actual document bytes for a specific document
   
  async getDocumentBytes(cid: string) {
    try {
      // Use the existing document service to fetch bytes
      const buffer = await fetchDocumentBytes(cid);
      return buffer;
    } catch (error: any) {
      walletLogger.error('Failed to get document bytes', {
        cid,
        error: error.message
      });
      throw new WalletConnectError("Failed to get document bytes: " + error.message, error);
    }
  }
}

export const walletService = new WalletService();*/