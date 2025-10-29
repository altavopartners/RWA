// server/routes/bank-auth.routes.ts
import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  meController,
} from "../controllers/bank-auth.controller";

const router = Router();

/**
 * POST /api/bank-auth/register
 * Register a new bank user
 */
router.post("/register", registerController);

/**
 * POST /api/bank-auth/login
 * Login existing bank user
 */
router.post("/login", loginController);

/**
 * GET /api/bank-auth/logout
 * Logout current bank user
 */
router.get("/logout", logoutController);

/**
 * GET /api/bank-auth/me
 * Get current authenticated bank user
 */
router.get("/me", meController);

export default router;
