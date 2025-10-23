"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/bank-auth.routes.ts
const express_1 = require("express");
const bank_auth_controller_1 = require("../controllers/bank-auth.controller");
const router = (0, express_1.Router)();
/**
 * POST /api/bank-auth/register
 * Register a new bank user
 */
router.post("/register", bank_auth_controller_1.registerController);
/**
 * POST /api/bank-auth/login
 * Login existing bank user
 */
router.post("/login", bank_auth_controller_1.loginController);
/**
 * GET /api/bank-auth/logout
 * Logout current bank user
 */
router.get("/logout", bank_auth_controller_1.logoutController);
/**
 * GET /api/bank-auth/me
 * Get current authenticated bank user
 */
router.get("/me", bank_auth_controller_1.meController);
exports.default = router;
//# sourceMappingURL=bank-auth.routes.js.map