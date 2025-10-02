// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import {
  generateWalletNonce,
  connectWalletService,
  updateUserProfile, // ← Use the new unified function
  getUserProfile,
  getIdentityByWallet,
} from "../services/auth.service";
import { AuthenticatedRequest } from "../types/auth";

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

/** PUT /api/auth/profile (unified profile update) */
export async function updateProfileController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log("🔴 Backend received:", req.body);

    // Extract only the fields we want to update (filter out undefined values)
    const updateData: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      location?: string;
      profileImage?: string;
      businessName?: string;
      businessDesc?: string;
    } = {};

    // Core identity fields
    if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.profileImage !== undefined) updateData.profileImage = req.body.profileImage;
    if (req.body.businessName !== undefined) updateData.businessName = req.body.businessName;
    if (req.body.businessDesc !== undefined) updateData.businessDesc = req.body.businessDesc;

    console.log("🟣 Backend updating with:", updateData);

    // Use the unified function
    const updatedProfile = await updateUserProfile(req.user.id, updateData);

    console.log("🟢 Backend result:", updatedProfile);

    return res.json({ success: true, data: updatedProfile });
  } catch (err: any) {
    console.error("❌ Profile update error:", err);
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
