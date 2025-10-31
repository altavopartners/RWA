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

// Health check endpoint (no rate limit needed)
router.get("/health", async (_req, res) => {
  try {
    // Try a simple database query to verify connection
    const { prisma } = await import("../utils/prisma");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: "unavailable",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Public endpoints
router.post("/nonce", authRateLimit, generateNonceController);
router.post("/connect", authRateLimit, connectWalletController);
router.get("/identity/:walletAddress", getIdentityController);

// Protected endpoints
router.get("/profile", verifyJWT, getProfileController);
router.put("/profile", verifyJWT, updateProfileController); // merged update

export default router;
