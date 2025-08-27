// src/controllers/auth.controller.ts
// Controller layer for the traditional/manual user authentication flow.
//
// Handles incoming HTTP requests for:
// - Generating authentication nonces (/api/auth/nonce).
// - Verifying wallet signatures to log users in (/api/auth/connect).
// - Saving initial core identity information after login.
// - Updating progressive profile details.
// - Fetching the authenticated user's complete profile.
// - Fetching public identity information using a wallet address (no auth required).
//
// Delegates business logic to functions in `auth.service.ts`.
// Uses Zod schemas for request body validation where appropriate.
// Applies `verifyJWT` middleware (from routes) to protect profile-related endpoints.

import { Request, Response } from "express";
import {
  generateWalletNonce,
  connectWalletService,
  saveCoreIdentity,
  updateProgressiveProfile,
  getUserProfile,getIdentityByWallet,
} from "../services/auth.service";
import { AuthenticatedRequest } from "../types/auth";
import { CoreIdentitySchema, ProgressiveProfileSchema } from "../utils/validation";

/** POST /api/auth/nonce */
export async function generateNonceController(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ success: false, message: "walletAddress required" });
    const result = await generateWalletNonce(walletAddress);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/auth/connect */
export async function connectWalletController(req: Request, res: Response) {
  try {
    const { walletAddress, signature, message, nonce, walletType, publicKeyHex } = req.body;
    if (!walletAddress || !signature || !message || !nonce || !walletType) {
      return res.status(400).json({ success: false, message: "missing params" });
    }
    const result = await connectWalletService({ walletAddress, signature, message, nonce, walletType, publicKeyHex });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** POST /api/auth/core-identity */
export async function saveCoreIdentityController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const parsed = CoreIdentitySchema.parse(req.body);
    const updated = await saveCoreIdentity(req.user.id, parsed);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** PUT /api/auth/progressive */
export async function updateProgressiveController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const parsed = ProgressiveProfileSchema.parse(req.body);
    const updated = await updateProgressiveProfile(req.user.id, parsed);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** GET /api/auth/profile */
export async function getProfileController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const profile = await getUserProfile(req.user.id);
    return res.json({ success: true, data: profile });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
export async function getIdentityController(req: Request, res: Response) {
  try {
    // Extract wallet address from request parameters
    const { walletAddress } = req.params;
    
    // Validate that wallet address is provided
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address is required" });
    }

    // Fetch identity information using the wallet address
    const identity = await getIdentityByWallet(walletAddress);
    
    // Return successful response with identity data
    return res.json({ success: true, data: identity });
  } catch (err: any) {
    // Handle any errors that occur during the process
    return res.status(500).json({ success: false, message: err.message });
  }
}