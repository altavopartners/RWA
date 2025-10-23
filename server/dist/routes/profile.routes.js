"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/profile.routes.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// GET full profile
router.get("/", auth_1.verifyJWT, auth_controller_1.getProfileController);
// PUT update profile (core + progressive fields in one request)
router.put("/", auth_1.verifyJWT, auth_controller_1.updateProfileController);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map