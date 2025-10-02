/*import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";
import { verifyJWT } from "../middlewares/auth";

const router = Router();*/

/**
 * @route POST /api/wallet/nonce
 * @desc Generate authentication nonce for wallet
 * @access Public
 */
//router.post("/nonce", walletController.generateNonce.bind(walletController));

/**
 * @route POST /api/wallet/authenticate
 * @desc Verify signature and authenticate user
 * @access Public
 */
//router.post("/authenticate", walletController.authenticate.bind(walletController));

/**
 * @route GET /api/wallet/session/:sessionId
 * @desc Validate session
 * @access Protected
 */
//router.get("/session/:sessionId", verifyJWT, walletController.validateSession.bind(walletController));

/**
 * @route DELETE /api/wallet/session/:sessionId
 * @desc Disconnect session
 * @access Protected
 */
//router.delete("/session/:sessionId", verifyJWT, walletController.disconnectSession.bind(walletController));

/**
 * @route GET /api/wallet/profile/:walletAddress
 * @desc Get user profile by wallet address
 * @access Protected
 */
//router.get("/profile/:walletAddress", verifyJWT, walletController.getUserProfile.bind(walletController));

/**
 * @route PUT /api/wallet/profile/:walletAddress
 * @desc Update user profile
 * @access Protected
 */
//router.put("/profile/:walletAddress", verifyJWT, walletController.updateUserProfile.bind(walletController));

/**
 * @route GET /api/wallet/documents/:walletAddress
 * @desc Get user documents
 * @access Protected
 */
//router.get("/documents/:walletAddress", verifyJWT, walletController.getUserDocuments.bind(walletController));

/**
 * @route GET /api/wallet/sessions/:walletAddress
 * @desc Get active sessions for user
 * @access Protected
 */
//router.get("/sessions/:walletAddress", verifyJWT, walletController.getActiveSessions.bind(walletController));

/**
 * @route POST /api/wallet/cleanup
 * @desc Cleanup expired sessions and nonces (admin)
 * @access Protected
 */
//router.post("/cleanup", verifyJWT, walletController.cleanupExpiredData.bind(walletController));

//export default router;
