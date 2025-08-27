// src/routes/auth.routes.ts
// Defines the REST API endpoints for the traditional/manual user authentication flow.
//
// Mounts routes under the `/api/auth` path.
// Endpoints:
// - POST /nonce         -> Generate a nonce for wallet signature (Public).
// - POST /connect       -> Verify signature and authenticate user (Public).
// - POST /core-identity -> Save initial user details (Protected).
// - PUT /progressive    -> Update additional profile fields (Protected).
// - GET /profile        -> Get the full profile of the logged-in user (Protected).
// - GET /identity/:walletAddress -> Get public user info by wallet address (Public).
//
// Applies rate limiting (`authRateLimit`) to authentication endpoints.
// Requires JWT authentication (`verifyJWT` middleware) for protected profile routes.

import { Router } from "express";
import { authRateLimit } from "../middleware/security";
import { verifyJWT } from "../middleware/auth";
import {
  generateNonceController,
  connectWalletController,
  saveCoreIdentityController,
  updateProgressiveController,
  getProfileController,getIdentityController,
} from "../controllers/auth.controller";

const router = Router();

router.post("/nonce", authRateLimit, generateNonceController);
router.post("/connect", authRateLimit, connectWalletController);

router.post("/core-identity", verifyJWT, saveCoreIdentityController);
router.put("/progressive", verifyJWT, updateProgressiveController);
router.get("/profile", verifyJWT, getProfileController);
// Define GET route to fetch identity information by wallet address
// Route: GET /identity/:walletAddress
// Uses getIdentityController to handle the request
router.get("/identity/:walletAddress", getIdentityController);

export default router;
