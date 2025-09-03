// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import {
  generateWalletNonce,
  connectWalletService,
  saveCoreIdentity,
  updateProgressiveProfile,
  getUserProfile,
  getIdentityByWallet,
} from "../services/auth.service";
import { AuthenticatedRequest } from "../types/auth";
import {
  CoreIdentitySchema,
  ProgressiveProfileSchema,
} from "../utils/validation";

/** POST /api/auth/nonce */
export async function generateNonceController(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress)
      return res
        .status(400)
        .json({ success: false, message: "walletAddress required" });

    const result = await generateWalletNonce(walletAddress);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/auth/connect */
export async function connectWalletController(req: Request, res: Response) {
  try {
    const {
      walletAddress,
      signature,
      message,
      nonce,
      walletType,
      publicKeyHex,
    } = req.body;
    if (!walletAddress || !signature || !message || !nonce || !walletType) {
      return res
        .status(400)
        .json({ success: false, message: "missing params" });
    }

    const { accessToken, refreshToken, user } = await connectWalletService({
      walletAddress,
      signature,
      message,
      nonce,
      walletType,
      publicKeyHex,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || undefined,
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** GET /api/auth/profile */
export async function getProfileController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const profile = await getUserProfile(req.user.id);
    return res.json({ success: true, data: profile });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** PUT /api/auth/profile (combined core + progressive update) */
export async function updateProfileController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Partial update: parse core fields if present
    let updatedCore = {};
    try {
      const coreData = CoreIdentitySchema.parse(req.body);
      updatedCore = await saveCoreIdentity(req.user.id, coreData);
    } catch (_) {
      // ignore validation errors if core fields not provided
    }

    // Partial update: parse progressive fields if present
    let updatedProgressive = {};
    try {
      const progressiveData = ProgressiveProfileSchema.parse(req.body);
      updatedProgressive = await updateProgressiveProfile(
        req.user.id,
        progressiveData
      );
    } catch (_) {
      // ignore validation errors if progressive fields not provided
    }

    const updatedProfile = { ...updatedCore, ...updatedProgressive };

    return res.json({ success: true, data: updatedProfile });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** GET /api/auth/identity/:walletAddress */
export async function getIdentityController(req: Request, res: Response) {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress)
      return res
        .status(400)
        .json({ success: false, message: "Wallet address is required" });

    const identity = await getIdentityByWallet(walletAddress);
    return res.json({ success: true, data: identity });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
