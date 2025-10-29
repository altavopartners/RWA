"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/session.routes.ts
// Defines REST API endpoints for authentication session management under `/api/auth`.
//
// These routes handle token refresh and user logout functionalities.
// Endpoints:
// - POST /auth/refresh      -> Refresh an expired access token using a valid refresh token.
// - POST /auth/logout       -> Invalidate the current user's session (logout).
// - POST /auth/logout-all   -> Invalidate all active sessions for the current user (logout from all devices).
const express_1 = require("express");
const session_controller_1 = require("../controllers/session.controller");
const router = (0, express_1.Router)();
router.post("/auth/refresh", session_controller_1.refreshSessionController);
router.post("/auth/logout", session_controller_1.logoutController);
router.post("/auth/logout-all", session_controller_1.logoutAllController);
exports.default = router;
//# sourceMappingURL=session.routes.js.map