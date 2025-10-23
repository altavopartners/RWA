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
exports.registerDidController = registerDidController;
exports.getDidController = getDidController;
exports.updateDidMetadataController = updateDidMetadataController;
const did_service_1 = require("../services/did.service");
async function registerDidController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Auth required" });
        const metadata = (req.body?.metadata ?? {});
        const record = await (0, did_service_1.registerDidForUser)(req.user.id, metadata);
        return res.json({ success: true, data: record });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
}
async function getDidController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Auth required" });
        const record = await (0, did_service_1.getUserDid)(req.user.id);
        return res.json({ success: true, data: record });
    }
    catch (err) {
        return res.status(404).json({ success: false, message: err.message });
    }
}
async function updateDidMetadataController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Auth required" });
        const metadata = (req.body?.metadata ?? {});
        const updated = await (0, did_service_1.updateUserDidMetadata)(req.user.id, metadata);
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
}
//# sourceMappingURL=did.controller.js.map