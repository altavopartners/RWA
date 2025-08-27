// src/routes/session.routes.ts
// Defines REST API endpoints for authentication session management under `/api/auth`.
//
// These routes handle token refresh and user logout functionalities.
// Endpoints:
// - POST /auth/refresh      -> Refresh an expired access token using a valid refresh token.
// - POST /auth/logout       -> Invalidate the current user's session (logout).
// - POST /auth/logout-all   -> Invalidate all active sessions for the current user (logout from all devices).
import { Router } from "express";
import { 
  refreshSessionController, 
  logoutController, 
  logoutAllController 
} from "../controllers/session.controller";

const router = Router();

router.post("/auth/refresh", refreshSessionController);
router.post("/auth/logout", logoutController);
router.post("/auth/logout-all", logoutAllController);
export default router;