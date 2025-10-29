"use strict";
// src/routes/did.routes.ts
// Defines REST API endpoints for Decentralized Identifier (DID) operations under `/api/did`.
//
// All routes are protected and require a valid JWT (verified by `verifyJWT` middleware).
// Endpoints:
// - POST /register  -> Create/Register a new DID for the authenticated user.
// - GET /           -> Retrieve the DID document/metadata for the authenticated user.
// - PUT /metadata   -> Update custom metadata associated with the user's DID.
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const did_controller_1 = require("../controllers/did.controller");
const router = (0, express_1.Router)();
router.post("/register", auth_1.verifyJWT, did_controller_1.registerDidController);
router.get("/", auth_1.verifyJWT, did_controller_1.getDidController);
router.put("/metadata", auth_1.verifyJWT, did_controller_1.updateDidMetadataController);
exports.default = router;
//# sourceMappingURL=did.routes.js.map