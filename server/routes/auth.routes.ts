// src/routes/auth.routes.ts
import { Router } from "express";
import { authRateLimit } from "../middleware/security";
import { verifyJWT } from "../middleware/auth";
import {
  generateNonceController,
  connectWalletController,
  getProfileController,
  updateProfileController, // <-- added merged update
  getIdentityController,
} from "../controllers/auth.controller";

const router = Router();

// Public endpoints
router.post("/nonce", authRateLimit, generateNonceController);
router.post("/connect", authRateLimit, connectWalletController);
router.get("/identity/:walletAddress", getIdentityController);

// Protected endpoints
router.get("/profile", verifyJWT, getProfileController);
router.put("/profile", verifyJWT, updateProfileController); // merged update

export default router;
