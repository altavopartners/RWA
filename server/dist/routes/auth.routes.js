"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const security_1 = require("../middleware/security");
const auth_1 = require("../middleware/auth");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Public endpoints
router.post("/nonce", security_1.authRateLimit, auth_controller_1.generateNonceController);
router.post("/connect", security_1.authRateLimit, auth_controller_1.connectWalletController);
router.get("/identity/:walletAddress", auth_controller_1.getIdentityController);
// Protected endpoints
router.get("/profile", auth_1.verifyJWT, auth_controller_1.getProfileController);
router.put("/profile", auth_1.verifyJWT, auth_controller_1.updateProfileController); // merged update
exports.default = router;
//# sourceMappingURL=auth.routes.js.map